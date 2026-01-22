#!/usr/bin/env python3
"""
Простой HTTP сервер с CORS прокси для Rossko API
Запуск: python3 server.py
"""

import http.server
import socketserver
import os
import sys
from functools import partial
import urllib.request
import urllib.parse
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # Проверяем, является ли это прокси запросом к Rossko API
        if parsed_path.path == '/proxy/rossko':
            self.handle_rossko_proxy()
        else:
            # Стандартная обработка POST запросов
            super().do_POST()
    
    def handle_rossko_proxy(self):
        try:
            # Читаем данные POST запроса
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            print(f"🔄 Прокси запрос к Rossko API: {len(post_data)} байт")
            
            # Создаем запрос к Rossko API
            rossko_url = 'http://api.rossko.ru/service/v2.1/GetSearch'
            req = urllib.request.Request(rossko_url, data=post_data)
            
            # Копируем необходимые заголовки
            req.add_header('Content-Type', self.headers.get('Content-Type', 'text/xml; charset=utf-8'))
            if 'SOAPAction' in self.headers:
                req.add_header('SOAPAction', self.headers['SOAPAction'])
            
            # Выполняем запрос
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = response.read()
                
                print(f"✅ Получен ответ от Rossko API: {len(response_data)} байт")
                
                # Отправляем ответ клиенту
                self.send_response(200)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'text/xml'))
                self.end_headers()
                self.wfile.write(response_data)
                
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP ошибка прокси: {e.code} {e.reason}")
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(f"HTTP Error: {e.code} {e.reason}".encode())
            
        except Exception as e:
            print(f"❌ Ошибка прокси: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Proxy error: {str(e)}".encode())

PORT = 8080

def run_server():
    # Переходим в директорию со скриптом
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Создаем сервер
    handler = partial(CORSHTTPRequestHandler)
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print(f"🚀 Сервер с CORS прокси запущен на http://localhost:{PORT}")
            print(f"📁 Корневая directory: {os.getcwd()}")
            print(f"🔄 Прокси для Rossko API: http://localhost:{PORT}/proxy/rossko")
            print("🔗 Откройте в браузере: http://localhost:8080/akpp_generator_unified.html")
            print("⏹️ Для остановки сервера нажмите Ctrl+C")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Порт {PORT} уже занят. Попробуйте:")
            print(f"   lsof -ti:{PORT} | xargs kill -9")
            print("   или используйте другой порт, изменив значение PORT в скрипте")
        else:
            print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    run_server()
