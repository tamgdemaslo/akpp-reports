const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

// CORS заголовки
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, SOAPAction',
    'Access-Control-Max-Age': '86400'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Обработка CORS preflight запросов
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }
    
    // Обработка запросов к Rossko API
    if (req.url.startsWith('/proxy/rossko')) {
        const targetUrl = 'http://api.rossko.ru/service/v2.0/GetSearch';
        
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            console.log('SOAP Request Body:', body);
            
            const options = {
                method: req.method,
                headers: {
                    'Content-Type': req.headers['content-type'] || 'text/xml; charset=utf-8',
                    'SOAPAction': req.headers['soapaction'] || 'http://api.rossko.ru/GetSearch',
                    'Content-Length': Buffer.byteLength(body)
                }
            };
            
            const proxyReq = http.request(targetUrl, options, (proxyRes) => {
                let responseBody = '';
                
                proxyRes.on('data', chunk => {
                    responseBody += chunk.toString();
                });
                
                proxyRes.on('end', () => {
                    console.log('SOAP Response Status:', proxyRes.statusCode);
                    console.log('SOAP Response Body:', responseBody);
                    
                    // Устанавливаем CORS заголовки для ответа
                    const responseHeaders = {
                        ...corsHeaders,
                        'Content-Type': proxyRes.headers['content-type'] || 'text/xml'
                    };
                    
                    res.writeHead(proxyRes.statusCode, responseHeaders);
                    res.end(responseBody);
                });
            });
            
            proxyReq.on('error', (err) => {
                console.error('Proxy request error:', err);
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
            });
            
            if (body) {
                proxyReq.write(body);
            }
            proxyReq.end();
        });
        
    } else {
        // Обслуживание статических файлов
        const fs = require('fs');
        const path = require('path');
        
        let filePath = req.url === '/' ? '/akpp_generator_unified.html' : req.url;
        filePath = path.join(__dirname, filePath);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, corsHeaders);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filePath);
            let contentType = 'text/html';
            
            switch(ext) {
                case '.js': contentType = 'application/javascript'; break;
                case '.css': contentType = 'text/css'; break;
                case '.json': contentType = 'application/json'; break;
            }
            
            res.writeHead(200, {
                ...corsHeaders,
                'Content-Type': contentType
            });
            res.end(data);
        });
    }
});

server.listen(PORT, () => {
    console.log(`CORS-прокси сервер запущен на порту ${PORT}`);
    console.log(`Приложение доступно по адресу: http://localhost:${PORT}`);
    console.log(`Прокси для Rossko API: http://localhost:${PORT}/proxy/rossko`);
    
    // Автоматически открываем браузер
    const { exec } = require('child_process');
    exec(`open http://localhost:${PORT}`, (err) => {
        if (err) {
            console.log('Не удалось автоматически открыть браузер. Перейдите по ссылке вручную.');
        }
    });
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('\nЗавершение работы CORS-прокси сервера...');
    server.close(() => {
        console.log('Сервер остановлен.');
        process.exit(0);
    });
});
