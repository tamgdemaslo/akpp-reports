#!/usr/bin/env python3
"""
Простой HTTP сервер для обработки запросов поиска АКПП по VIN.
Получение данных по VIN — из проекта «декордер 2.0» (API api-cloud.ru).
Определение АКПП по данным — gearbox_resolver из проекта «декордер» (OpenAI + БД).
"""

import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

# Данные по VIN — из «декордер 2.0» (api-cloud.ru)
sys.path.insert(0, '/Users/ilaeliseenko/Desktop/декордер 2.0')
from vin_client import fetch_vin_data as fetch_vin_from_api_cloud, build_vin_data_for_frontend

# Определение АКПП (OpenAI + БД) — из «декордер»
sys.path.insert(0, '/Users/ilaeliseenko/Desktop/декордер')
from gearbox_resolver import build_prompt, call_openai, load_gearbox_database

# API: токен api-cloud.ru (декордер 2.0), ключ OpenAI (декордер)
VINDECODER_TOKEN = os.getenv("VINDECODER_TOKEN", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEARBOX_DB_PATH = os.getenv("GEARBOX_DB_PATH", "/Users/ilaeliseenko/Desktop/декордер/gearbox_database_merged.json")


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
                
                # Загружаем БД кодов АКПП (декордер)
                print(f'[DEBUG] Загрузка БД из: {GEARBOX_DB_PATH}')
                try:
                    gearbox_db = load_gearbox_database(GEARBOX_DB_PATH)
                    print(f'[DEBUG] БД загружена: {len(gearbox_db) if gearbox_db else 0} производителей')
                except Exception as db_error:
                    print(f'[ERROR] Ошибка при загрузке БД: {db_error}')
                    import traceback
                    traceback.print_exc()
                    gearbox_db = None
                
                # Формируем промт для OpenAI по преобразованным данным
                print(f'[DEBUG] Формирование промта...')
                try:
                    prompt = build_prompt(transformed, None, gearbox_db)
                    print(f'[DEBUG] Промт сформирован: {len(prompt)} символов')
                except Exception as prompt_error:
                    print(f'[ERROR] Ошибка при формировании промта: {prompt_error}')
                    import traceback
                    traceback.print_exc()
                    self.send_error_response(500, f'Ошибка при формировании промта: {str(prompt_error)}')
                    return
                
                # Вызов OpenAI для определения кода АКПП
                print(f'[DEBUG] Вызов OpenAI...')
                try:
                    result_text = call_openai(prompt, OPENAI_API_KEY)
                    print(f'[DEBUG] Ответ OpenAI получен: {len(result_text)} символов')
                except Exception as openai_error:
                    print(f'[ERROR] Ошибка при вызове OpenAI: {openai_error}')
                    import traceback
                    traceback.print_exc()
                    self.send_error_response(500, f'Ошибка при вызове OpenAI: {str(openai_error)}')
                    return
                
                # Парсим ответ OpenAI (KEY=VALUE)
                result = {}
                for line in result_text.strip().split('\n'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        result[key.strip()] = value.strip()
                
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
