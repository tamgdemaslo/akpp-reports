#!/usr/bin/env python3
"""
Простой HTTP сервер для обработки запросов поиска АКПП по VIN.
Получение данных по VIN — из проекта «декордер 2.0» (API api-cloud.ru).
Определение АКПП по данным — через OpenAI в формате:
OEM-код АКПП — (производитель трансмиссии + модель/семейство).

Старая логика (gearbox_resolver + KEY=VALUE) удалена.
"""

import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

# Данные по VIN — из «декордер 2.0» (api-cloud.ru)
sys.path.insert(0, '/Users/ilaeliseenko/Desktop/декордер 2.0')
from vin_client import fetch_vin_data as fetch_vin_from_api_cloud, build_vin_data_for_frontend

# API: токен api-cloud.ru (декордер 2.0), ключ OpenAI
VINDECODER_TOKEN = os.getenv("VINDECODER_TOKEN", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-2026-03-05")


def _pick_best_report(reports):
    """
    Выбираем наиболее подходящий отчёт:
    - в первую очередь автомат/робот/вариатор
    - если ничего не нашли — первый по списку
    """
    if not reports:
        return None
    auto_keywords = {"AUT", "AT", "CVT", "DCT", "AMT", "ROBOT"}
    for r in reports:
        gear = r.get("gear") or {}
        gear_type = ""
        if isinstance(gear, dict):
            gear_type = str(gear.get("type") or "").upper()
        else:
            gear_type = str(gear).upper()
        if any(k in gear_type for k in auto_keywords):
            return r
    return reports[0]


def _build_openai_text_from_vin_report(raw_response: dict) -> str:
    reports = raw_response.get("reports") or []
    if not reports:
        return "Данные VIN: (нет отчётов reports)"
    r = _pick_best_report(reports) or {}

    gear = r.get("gear") or {}
    if isinstance(gear, dict):
        gear_type = gear.get("type") or ""
        gear_speeds = gear.get("speeds") or ""
    else:
        gear_type = ""
        gear_speeds = ""

    brand = r.get("brand") or ""
    model = r.get("model") or ""
    body_name = r.get("bodyName") or r.get("body") or ""
    model_year = r.get("modelYear") or ""
    modification = r.get("modification") or ""
    engine_series = r.get("engineSeries") or ""
    drive = r.get("drive") or ""
    basic_params = r.get("basicParams") or ""

    return (
        f"Марка: {brand}\n"
        f"Модель: {model}\n"
        f"Кузов: {body_name}\n"
        f"Год: {model_year}\n"
        f"Модификация: {modification}\n"
        f"Тип КПП: {gear_type}\n"
        f"Число передач: {gear_speeds}\n"
        f"Двигатель (серия): {engine_series}\n"
        f"Привод: {drive}\n"
        f"Кратко: {basic_params}"
    )


def _call_openai_for_gearbox_codes(raw_response: dict) -> dict:
    """
    Возвращает:
      - raw_answer: исходный текст модели
      - oem_gearbox_code: OEM/каталожный код коробки у производителя авто (если найден)
      - gearbox_maker_code: строка внутри скобок (например "ZF 8HP50PH")
    """
    try:
        from openai import OpenAI
    except Exception as e:
        raise RuntimeError("Не установлен пакет openai. Установите: pip install openai") from e

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY не задан (переменная окружения).")

    client = OpenAI(api_key=OPENAI_API_KEY)
    text = _build_openai_text_from_vin_report(raw_response)

    system_prompt = (
        "Ты эксперт по автомобильным трансмиссиям. По данным об автомобиле определи наиболее вероятную модель "
        "автоматической коробки передач (АКПП).\n\n"
        "Всегда выводи в первую очередь OEM/каталожный код коробки производителя авто "
        "(BMW: формат GA..., VAG: 0D9/0GC/DQ..., MB: 722.9/725.0, и т.п.).\n"
        "Во второй части (в скобках) укажи коробку по производителю трансмиссии (ZF/Aisin/Getrag и т.д.) и, "
        "если применимо, гибридную версию (PH).\n"
        "Не ограничивайся только семейством (например, «8HP50») — предпочитай точный OEM-код; если точный OEM-код "
        "нельзя вывести из данных, перечисли возможные OEM-коды и напиши, каких данных не хватает "
        "(VIN/месяц выпуска/код КПП из ETK/наклейки/part number).\n"
        "Формат ответа строго одной строкой:\n"
        "OEM-код АКПП — (производитель, модель/семейство)\n"
        "Пример: GA8P75HZ — (ZF 8HP50PH)."
    )

    user_prompt = f"Данные автомобиля:\n{text}\n\nОпредели модель АКПП."
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    raw_answer = (resp.choices[0].message.content or "").strip()
    # Парсим "OEM — (XXX)"
    oem_code = ""
    maker_code = ""
    first_line = raw_answer.splitlines()[0].strip() if raw_answer else ""

    # Разные варианты тире
    for dash in ["—", "-", "–"]:
        if dash in first_line and "(" in first_line and ")" in first_line:
            left, right = first_line.split(dash, 1)
            oem_code = left.strip()
            # всё, что в первых скобках
            r = right.strip()
            start = r.find("(")
            end = r.find(")", start + 1)
            if start != -1 and end != -1:
                maker_code = r[start + 1 : end].strip()
            break

    # fallback: ищем первые скобки в тексте
    if not maker_code and "(" in raw_answer and ")" in raw_answer:
        start = raw_answer.find("(")
        end = raw_answer.find(")", start + 1)
        maker_code = raw_answer[start + 1 : end].strip()

    # fallback: OEM код — первая "похожая" часть до скобок
    if not oem_code:
        if "—" in first_line:
            oem_code = first_line.split("—", 1)[0].strip()
        elif "-" in first_line:
            oem_code = first_line.split("-", 1)[0].strip()
        else:
            # до первой скобки
            if "(" in first_line:
                oem_code = first_line.split("(", 1)[0].strip()

    return {
        "raw_answer": raw_answer,
        "oem_gearbox_code": oem_code,
        "gearbox_maker_code": maker_code,
    }


class VINHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Обработка CORS preflight запросов."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Обработка GET запросов."""
        if self.path.startswith('/vin-search?'):
            # Парсим параметры из URL
            parsed_path = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed_path.query)
            vin = params.get('vin', [None])[0]
            lang = params.get('lang', ['ru'])[0]

            if not vin:
                self.send_error_response(400, 'VIN не указан')
                return

            try:
                # Получаем данные VIN через «декордер 2.0» (api-cloud.ru)
                print(f'[DEBUG] Запрос VIN: {vin}, lang: {lang}')
                try:
                    transformed, raw_response = fetch_vin_from_api_cloud(
                        vin, lang, token=VINDECODER_TOKEN, use_header=False
                    )
                    print(f'[DEBUG] VIN данные получены: found={raw_response.get("found")}, reports={len(raw_response.get("reports") or [])}')
                except Exception as vin_error:
                    err_msg = str(vin_error)
                    if "503" in err_msg or "602" in err_msg or "token" in err_msg.lower():
                        try:
                            transformed, raw_response = fetch_vin_from_api_cloud(
                                vin, lang, token=VINDECODER_TOKEN, use_header=True
                            )
                            print(f'[DEBUG] VIN данные получены (токен в заголовке): found={raw_response.get("found")}')
                        except Exception as retry_err:
                            print(f'[ERROR] Ошибка при получении VIN (повтор с заголовком): {retry_err}')
                            import traceback
                            traceback.print_exc()
                            self.send_error_response(500, f'Ошибка при декодировании VIN: {str(retry_err)}')
                            return
                    else:
                        print(f'[ERROR] Ошибка при получении VIN данных: {vin_error}')
                        import traceback
                        traceback.print_exc()
                        self.send_error_response(500, f'Ошибка при декодировании VIN: {err_msg}')
                        return
                
                # Новая версия определения АКПП по VIN:
                # Получаем OEM-код + код производителя трансмиссии через OpenAI (одна строка)
                print(f'[DEBUG] Вызов OpenAI (новый формат OEM — (maker code))...')
                try:
                    result = _call_openai_for_gearbox_codes(raw_response)
                except Exception as openai_error:
                    print(f'[ERROR] Ошибка при вызове OpenAI: {openai_error}')
                    import traceback
                    traceback.print_exc()
                    self.send_error_response(500, f'Ошибка при вызове OpenAI: {str(openai_error)}')
                    return
                
                # vin_data для фронта: make, model, year, fingerprint (из ответа api-cloud.ru)
                result['vin_data'] = build_vin_data_for_frontend(raw_response)
                
                print(f'[DEBUG] Результат успешно сформирован')
                self.send_json_response(200, result)
                
            except Exception as e:
                print(f'[ERROR] Неожиданная ошибка: {e}')
                import traceback
                traceback.print_exc()
                self.send_error_response(500, f'Ошибка: {str(e)}')
        else:
            self.send_error_response(404, 'Неизвестный путь')

    def send_json_response(self, status_code, data):
        """Отправляет JSON ответ."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_error_response(self, status_code, message):
        """Отправляет ошибку."""
        self.send_json_response(status_code, {'error': message})

    def log_message(self, format, *args):
        """Отключаем логирование."""
        pass


def run_server(port=8001):
    """Запускает HTTP сервер."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, VINHandler)
    print(f'VIN Backend сервер запущен на порту {port}')
    print(f'URL: http://localhost:{port}/vin-search?vin=WBA5E7101FG155636')
    httpd.serve_forever()


if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port)
