#!/usr/bin/env python3
"""
Простой HTTP сервер для обработки запросов поиска АКПП по VIN.
Декодирование VIN — Parts-Catalogs REST API:
  GET {OEM_API_BASE_URL}/v1/car/info?q=VIN
  Заголовок: Authorization: {OEM_API_KEY}
Определение АКПП по данным — через OpenAI в формате:
OEM-код АКПП — (производитель трансмиссии + модель/семейство).
"""

import os
import re
import json
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

OEM_API_KEY = os.getenv("OEM_API_KEY", "")
OEM_API_BASE_URL = os.getenv("OEM_API_BASE_URL", "https://api.parts-catalogs.com").rstrip("/")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-2026-03-05")


def _pc_param(parameters, key: str) -> str:
    for p in parameters or []:
        if p.get("key") == key:
            v = p.get("value")
            return "" if v is None else str(v)
    return ""


def _transmission_option_hints(item: dict) -> str:
    hits = []
    for o in item.get("optionCodes") or []:
        desc = o.get("description") or ""
        if re.search(r"trans|gear|tiptronic|cvt|automatic|variator|mechatronic", desc, re.I):
            hits.append(f"{o.get('code')}: {desc}")
    return "; ".join(hits[:8])


def _infer_gear_type(item: dict) -> str:
    params = item.get("parameters") or []
    p = lambda k: _pc_param(params, k)
    trans_val = (p("transmission") or "").upper()
    trans_type = (p("trans_type") or "").upper()
    opts = " ".join(
        f"{o.get('code', '')} {o.get('description') or ''}".upper()
        for o in (item.get("optionCodes") or [])
    )
    if "VARIATOR" in trans_type or "CVT" in trans_type or "CVT" in trans_val:
        return "CVT"
    if (
        "AUTOMATIC" in trans_val
        or "AUTO" in trans_val
        or "AUTOMATIC TRANSMISSION" in opts
        or "TIPTRONIC" in opts
        or re.search(r"AUTOMATIC\s+\d", opts)
    ):
        return "AT"
    if "MANUAL" in trans_val or "MANUAL" in trans_type:
        return "MT"
    if re.match(r"^[A-Z0-9]{3}$", trans_val.strip()) and (
        "AUTOMATIC" in opts or "TIPTRONIC" in opts
    ):
        return "AT"
    return ""


def parts_catalog_car_to_report(item: dict) -> dict:
    params = item.get("parameters") or []
    p = lambda k: _pc_param(params, k)
    prod = p("prod_period")
    model_month = ""
    pm = re.search(r"(\d{4})/(\d{2})", prod)
    if pm:
        model_month = f"{pm.group(2)}.{pm.group(1)}"
    start_year = finish_year = ""
    pr = re.search(r"(\d{4})/\d{2}\s*-\s*(\d{4})/\d{2}", prod)
    if pr:
        start_year, finish_year = pr.group(1), pr.group(2)

    mod_parts = [
        p(k) for k in ("grade_code", "engine_code", "grade", "spec_engine", "sales_type") if p(k)
    ]
    modification = ", ".join(mod_parts) if mod_parts else (p("car_name") or "")

    body_name = p("body_type")
    if not body_name or body_name == "Not specified":
        body_name = p("body") or ""

    basic_lines = [item.get("description") or ""]
    if p("prod_period"):
        basic_lines.append(f"Период производства (каталог): {p('prod_period')}")
    if item.get("title"):
        basic_lines.append(f"Комплектация (title): {item.get('title')}")

    return {
        "brand": item.get("brand") or "",
        "model": item.get("modelName") or item.get("modelId") or "",
        "modelYear": p("year"),
        "modification": modification,
        "gear": {"type": _infer_gear_type(item), "speeds": ""},
        "drive": p("drive") or p("drivetrain") or "",
        "fuelType": p("fuelType") or "",
        "engineVolume": p("engine") or "",
        "engineSeries": p("engine_code") or p("spec_engine") or "",
        "enginePower": "",
        "basicParams": "\n".join([x for x in basic_lines if x]),
        "bodyName": body_name,
        "modelMonth": model_month,
        "startYear": start_year,
        "finishYear": finish_year,
        "catalogTransmissionCode": p("transmission"),
        "transmissionOptionsSummary": _transmission_option_hints(item),
    }


def fetch_parts_catalog_cars(vin: str) -> list:
    q = urllib.parse.quote(vin.strip().upper(), safe="")
    url = f"{OEM_API_BASE_URL}/v1/car/info?q={q}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": OEM_API_KEY,
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            data = json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", errors="replace")
            data = json.loads(body)
            msg = data.get("message") or data.get("error") or body[:200]
        except Exception:
            msg = str(e)
        raise RuntimeError(f"Parts-Catalogs HTTP {e.code}: {msg}") from e

    if not isinstance(data, list):
        raise RuntimeError(f"Parts-Catalogs: неожиданный ответ {str(data)[:200]}")
    return data


def fetch_vin_raw_response(vin: str) -> dict:
    cars = fetch_parts_catalog_cars(vin)
    if not cars:
        raise RuntimeError("По VIN не найдено автомобилей в каталоге Parts-Catalogs")
    reports = [parts_catalog_car_to_report(c) for c in cars]
    v = vin.strip().upper()
    return {
        "found": True,
        "countReports": len(reports),
        "reports": reports,
        "vin": {"income": v, "normal": v},
    }


def build_vin_data_for_frontend(raw_response: dict) -> dict:
    reports = raw_response.get("reports") or []
    r = _pick_best_report(reports) or (reports[0] if reports else {}) or {}
    vin_info = raw_response.get("vin") or {}
    vin_str = (
        vin_info.get("income")
        or vin_info.get("normal")
        or vin_info.get("vin")
        or ""
    )

    def fp_part(v):
        if v is None or v == "":
            return ""
        if isinstance(v, (dict, list)):
            return json.dumps(v, ensure_ascii=False)
        return str(v)

    fp = ""
    if reports:
        fp = ";".join(
            [
                x
                for x in [
                    r.get("brand") or "",
                    r.get("model") or "",
                    r.get("modification") or "",
                    fp_part(r.get("engineVolume")),
                    fp_part(r.get("enginePower")),
                    r.get("fuelType") or "",
                    f"{r.get('startYear') or ''}-{r.get('finishYear') or ''}",
                    r.get("catalogTransmissionCode") or "",
                ]
                if x
            ]
        )

    return {
        "make": r.get("brand") or "",
        "model": r.get("model") or "",
        "year": str(r.get("modelYear") or r.get("startYear") or ""),
        "modification": r.get("modification") or "",
        "gear": r.get("gear") or "",
        "drive": r.get("drive") or "",
        "fuelType": r.get("fuelType") or "",
        "engineVolume": r.get("engineVolume") or "",
        "vin": vin_str,
        "found": bool(raw_response.get("found")),
        "countReports": int(raw_response.get("countReports") or len(reports)),
        "fingerprint": fp,
    }


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

    catalog_tx = r.get("catalogTransmissionCode") or ""
    tx_opts = r.get("transmissionOptionsSummary") or ""

    brand = r.get("brand") or ""
    model = r.get("model") or ""
    body_name = r.get("bodyName") or r.get("body") or ""
    model_year = r.get("modelYear") or ""
    modification = r.get("modification") or ""
    engine_series = r.get("engineSeries") or ""
    drive = r.get("drive") or ""
    basic_params = r.get("basicParams") or ""
    vin_info = raw_response.get("vin") or {}
    vin_str = (
        vin_info.get("income")
        or vin_info.get("normal")
        or vin_info.get("vin")
        or vin_info.get("vinNumber")
        or ""
    )
    model_month = (
        r.get("modelMonth")
        or r.get("startMonth")
        or r.get("finishMonth")
        or vin_info.get("modelMonth")
        or vin_info.get("startMonth")
        or vin_info.get("finishMonth")
        or ""
    )

    lines = [
        f"Марка: {brand}",
        f"Модель: {model}",
        f"Кузов: {body_name}",
        f"Год: {model_year}",
    ]
    if vin_str:
        lines.append(f"VIN: {vin_str}")
    if model_month:
        lines.append(f"Месяц выпуска: {model_month}")
    lines.extend(
        [
            f"Модификация: {modification}",
            f"Тип КПП: {gear_type}",
            f"Число передач: {gear_speeds}",
        ]
    )
    if catalog_tx:
        lines.append(f"Код трансмиссии (каталог Parts-Catalogs): {catalog_tx}")
    if tx_opts:
        lines.append(f"Опции по трансмиссии (каталог): {tx_opts}")
    lines.extend(
        [
            f"Двигатель (серия): {engine_series}",
            f"Привод: {drive}",
            f"Кратко: {basic_params}",
        ]
    )
    return "\n".join(lines)


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
        "Если во входных данных есть VIN и/или месяц производства, используй их для уточнения ревизии и точного OEM-кода.\n"
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
        temperature=0,
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
                print(f'[DEBUG] Запрос VIN: {vin}, lang: {lang}')
                if not OEM_API_KEY:
                    self.send_error_response(500, 'OEM_API_KEY не задан (переменная окружения)')
                    return
                try:
                    raw_response = fetch_vin_raw_response(vin)
                    print(
                        f'[DEBUG] Parts-Catalogs: найдено вариантов={len(raw_response.get("reports") or [])}'
                    )
                except Exception as vin_error:
                    print(f'[ERROR] Ошибка Parts-Catalogs: {vin_error}')
                    import traceback
                    traceback.print_exc()
                    self.send_error_response(500, f'Ошибка Parts-Catalogs API: {str(vin_error)}')
                    return

                print(f'[DEBUG] Вызов OpenAI (формат OEM — (maker code))...')
                try:
                    result = _call_openai_for_gearbox_codes(raw_response)
                except Exception as openai_error:
                    print(f'[ERROR] Ошибка при вызове OpenAI: {openai_error}')
                    import traceback
                    traceback.print_exc()
                    self.send_error_response(500, f'Ошибка при вызове OpenAI: {str(openai_error)}')
                    return

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
