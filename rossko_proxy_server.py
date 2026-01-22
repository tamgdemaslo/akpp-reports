#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flask прокси-сервер для работы с Rossko SOAP API v2.1
Обеспечивает CORS поддержку и проксирование POST запросов
"""

from flask import Flask, request, Response
from flask_cors import CORS
import requests
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# URL для Rossko SOAP API v2.1
ROSSKO_API_URL = 'http://api.rossko.ru/service/v2.1/GetSearch'
ROSSKO_CHECKOUT_API_URL = 'http://api.rossko.ru/service/v2.1/GetCheckoutDetails'

@app.route('/proxy/rossko', methods=['POST'])
def proxy_rossko():
    """
    Проксирует SOAP запросы к Rossko API v2.1
    """
    try:
        # Логируем входящий запрос
        logger.info(f"Получен запрос: {request.method} {request.path}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        # Получаем данные запроса
        request_data = request.get_data()
        logger.info(f"Request body length: {len(request_data)} bytes")
        
        # Подготавливаем заголовки для SOAP запроса
        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://api.rossko.ru/GetSearch',
            'User-Agent': 'AKPP-Generator/1.0',
            'Accept': 'text/xml, application/soap+xml'
        }
        
        # Логируем отправляемый запрос
        logger.info(f"Проксируем на: {ROSSKO_API_URL}")
        logger.info(f"SOAP Request: {request_data.decode('utf-8')[:500]}...")
        
        # Отправляем запрос к Rossko API
        response = requests.post(
            ROSSKO_API_URL,
            data=request_data,
            headers=headers,
            timeout=30
        )
        
        # Логируем ответ
        logger.info(f"Ответ от Rossko: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        logger.info(f"Response body length: {len(response.content)} bytes")
        
        # Создаем ответ с правильными заголовками CORS
        proxy_response = Response(
            response.content,
            status=response.status_code,
            headers={
                'Content-Type': 'text/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
            }
        )
        
        return proxy_response
        
    except requests.exceptions.Timeout:
        logger.error("Timeout при запросе к Rossko API")
        return Response(
            '<?xml version="1.0" encoding="utf-8"?><error>Timeout</error>',
            status=504,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка при запросе к Rossko API: {e}")
        return Response(
            f'<?xml version="1.0" encoding="utf-8"?><error>{str(e)}</error>',
            status=502,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return Response(
            f'<?xml version="1.0" encoding="utf-8"?><error>Internal server error: {str(e)}</error>',
            status=500,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )

@app.route('/proxy/rossko-checkout', methods=['POST'])
def proxy_rossko_checkout():
    """
    Проксирует SOAP запросы GetCheckoutDetails к Rossko API v2.1
    """
    try:
        # Логируем входящий запрос
        logger.info(f"Получен GetCheckoutDetails запрос: {request.method} {request.path}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        # Получаем данные запроса
        request_data = request.get_data()
        logger.info(f"GetCheckoutDetails Request body length: {len(request_data)} bytes")
        
        # Подготавливаем заголовки для SOAP запроса
        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://api.rossko.ru/GetCheckoutDetails',
            'User-Agent': 'AKPP-Generator/1.0',
            'Accept': 'text/xml, application/soap+xml'
        }
        
        # Логируем отправляемый запрос
        logger.info(f"Проксируем GetCheckoutDetails на: {ROSSKO_CHECKOUT_API_URL}")
        logger.info(f"GetCheckoutDetails SOAP Request: {request_data.decode('utf-8')[:300]}...")
        
        # Отправляем запрос к Rossko API
        response = requests.post(
            ROSSKO_CHECKOUT_API_URL,
            data=request_data,
            headers=headers,
            timeout=30
        )
        
        # Логируем ответ
        logger.info(f"Ответ от GetCheckoutDetails: {response.status_code}")
        logger.info(f"GetCheckoutDetails Response headers: {dict(response.headers)}")
        logger.info(f"GetCheckoutDetails Response body length: {len(response.content)} bytes")
        logger.info(f"GetCheckoutDetails Response preview: {response.content.decode('utf-8')[:500]}...")
        
        # Создаем ответ с правильными заголовками CORS
        proxy_response = Response(
            response.content,
            status=response.status_code,
            headers={
                'Content-Type': 'text/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
            }
        )
        
        return proxy_response
        
    except requests.exceptions.Timeout:
        logger.error("Timeout при GetCheckoutDetails запросе к Rossko API")
        return Response(
            '<?xml version="1.0" encoding="utf-8"?><error>GetCheckoutDetails Timeout</error>',
            status=504,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка при GetCheckoutDetails запросе к Rossko API: {e}")
        return Response(
            f'<?xml version="1.0" encoding="utf-8"?><error>GetCheckoutDetails error: {str(e)}</error>',
            status=502,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )
    except Exception as e:
        logger.error(f"Неожиданная GetCheckoutDetails ошибка: {e}")
        return Response(
            f'<?xml version="1.0" encoding="utf-8"?><error>GetCheckoutDetails internal server error: {str(e)}</error>',
            status=500,
            headers={'Content-Type': 'text/xml; charset=utf-8'}
        )

@app.route('/proxy/rossko', methods=['OPTIONS'])
def proxy_rossko_options():
    """
    Обработка preflight запросов для CORS
    """
    return Response(
        '',
        status=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
            'Access-Control-Max-Age': '3600'
        }
    )

@app.route('/proxy/rossko-checkout', methods=['OPTIONS'])
def proxy_rossko_checkout_options():
    """
    Обработка preflight запросов для CORS (для GetCheckoutDetails)
    """
    return Response(
        '',
        status=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
            'Access-Control-Max-Age': '3600'
        }
    )

@app.route('/health', methods=['GET'])
def health_check():
    """
    Проверка состояния сервера
    """
    return {
        'status': 'OK',
        'service': 'Rossko SOAP Proxy',
        'version': '2.1',
        'timestamp': '2025-01-21T22:44:00Z'
    }

@app.route('/', methods=['GET'])
def index():
    """
    Главная страница прокси
    """
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rossko SOAP API v2.1 Proxy</title>
        <meta charset="utf-8">
    </head>
    <body>
        <h1>🔧 Rossko SOAP API v2.1 Proxy Server</h1>
        <p><strong>Статус:</strong> ✅ Работает</p>
        <p><strong>Версия API:</strong> v2.1</p>
        <p><strong>Поддерживаемые методы:</strong> GetSearch</p>
        
        <h2>Эндпоинты:</h2>
        <ul>
            <li><code>POST /proxy/rossko</code> - Проксирование SOAP запросов</li>
            <li><code>GET /health</code> - Проверка состояния</li>
        </ul>
        
        <h2>Тестирование:</h2>
        <p>Откройте <code>akpp_generator_unified.html</code> и выполните поиск по OEM коду.</p>
        
        <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
            <strong>Примечание:</strong> Этот прокси-сервер решает проблемы с CORS при работе с Rossko SOAP API из браузера.
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    logger.info("🚀 Запускаем Rossko SOAP API v2.1 Proxy Server...")
    logger.info(f"🌐 Проксируем запросы на: {ROSSKO_API_URL}")
    logger.info("📡 CORS включен для всех доменов")
    logger.info("🔍 Логирование запросов включено")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        use_reloader=False  # Отключаем автоперезагрузку для стабильности
    )
