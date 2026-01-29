#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Функция обновления индекса
function updateGearboxIndex() {
    const gearboxDir = './gearbox_files';
    const indexFile = path.join(gearboxDir, 'gearbox_index.js');
    
    try {
        const files = fs.readdirSync(gearboxDir)
            .filter(file => file.endsWith('.js'))
            .filter(file => file !== 'gearbox_index.js')
            .filter(file => file !== 'all_gearbox_bundle.js')
            .sort();
        
        const content = `// Автоматически сгенерированный индекс файлов АКПП
window.gearboxIndex = [
${files.map(file => `    "${file}"`).join(',\n')}
];
`;
        
        fs.writeFileSync(indexFile, content, 'utf8');
        console.log(`✅ Обновлен gearbox_index.js с ${files.length} файлами`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка при обновлении индекса:', error);
        return false;
    }
}

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Обновляем индекс только для HTML запросов
    if (req.url === '/' || req.url.endsWith('.html')) {
        updateGearboxIndex();
    }
    
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;
    
    // Если запрос к корню, показываем главную страницу
    if (pathname === './') {
        pathname = './akpp_generator_unified.html';
    }
    
    // Проверяем существование файла
    fs.access(pathname, fs.constants.R_OK, (err) => {
        if (err) {
            res.statusCode = 404;
            res.end(`Файл ${pathname} не найден`);
            return;
        }
        
        // Определяем MIME type
        const ext = path.parse(pathname).ext;
        const mimeType = mimeTypes[ext] || 'text/plain';
        
        // Читаем и отправляем файл
        fs.readFile(pathname, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(`Ошибка сервера: ${err.code}`);
            } else {
                res.setHeader('Content-Type', mimeType);
                res.end(data);
            }
        });
    });
});

// Обновляем индекс при запуске
console.log('🔄 Обновляем индекс файлов АКПП...');
updateGearboxIndex();

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Все файлы из gearbox_files/ автоматически подключаются`);
    console.log(`✨ Просто добавь новый .js файл в папку - он сразу появится на сайте!`);
});
