#!/usr/bin/env node

// Объединенный сервер для Render: статика + прокси
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS
app.use(cors());
app.use(express.text({ type: 'text/xml' }));
app.use(express.json());

// Функция обновления индекса
function updateGearboxIndex() {
    const gearboxDir = path.join(__dirname, 'gearbox_files');
    const indexFile = path.join(gearboxDir, 'gearbox_index.js');
    
    try {
        const files = fs.readdirSync(gearboxDir)
            .filter(file => file.endsWith('.js'))
            .filter(file => file !== 'gearbox_index.js')
            .filter(file => file !== 'mistakes.js')
            .filter(file => file !== 'nuances.js')
            .filter(file => file !== 'parts_list.js')
            .filter(file => file !== 'tools.js')
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

// Обновляем индекс при запуске
updateGearboxIndex();

// Прокси для Rossko API
app.post('/proxy/rossko', async (req, res) => {
    console.log('📡 Получен запрос на поиск запчастей');
    
    try {
        const response = await fetch('http://api.rossko.ru/service/v2.1/GetSearch', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://api.rossko.ru/GetSearch'
            },
            body: req.body
        });
        
        const responseText = await response.text();
        console.log('✅ Ответ от Rossko API получен, длина:', responseText.length);
        
        res.set('Content-Type', 'text/xml; charset=utf-8');
        res.send(responseText);
    } catch (error) {
        console.error('❌ Ошибка при запросе к Rossko API:', error);
        res.status(500).json({ error: error.message });
    }
});

// Прокси для GetCheckoutDetails
app.post('/proxy/rossko-checkout', async (req, res) => {
    console.log('📡 Получен запрос GetCheckoutDetails');
    
    try {
        const response = await fetch('http://api.rossko.ru/service/v2.1/GetCheckoutDetails', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://api.rossko.ru/GetCheckoutDetails'
            },
            body: req.body
        });
        
        const responseText = await response.text();
        console.log('✅ Ответ GetCheckoutDetails получен, длина:', responseText.length);
        
        res.set('Content-Type', 'text/xml; charset=utf-8');
        res.send(responseText);
    } catch (error) {
        console.error('❌ Ошибка при запросе GetCheckoutDetails:', error);
        res.status(500).json({ error: error.message });
    }
});

// Статус сервера
app.get('/status', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AKPP Generator сервер работает',
        timestamp: new Date().toISOString()
    });
});

// Статические файлы
app.use(express.static(__dirname));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'akpp_generator_unified.html'));
});

// Обновление индекса по запросу (для удобства)
app.post('/api/update-index', (req, res) => {
    const success = updateGearboxIndex();
    res.json({ success, message: success ? 'Индекс обновлен' : 'Ошибка обновления' });
});

app.listen(PORT, () => {
    console.log(`🚀 AKPP Generator сервер запущен на порту ${PORT}`);
    console.log(`📋 Статус: http://localhost:${PORT}/status`);
    console.log(`🌐 Главная страница: http://localhost:${PORT}/`);
});

