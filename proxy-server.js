const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 5001;

// Включаем CORS для всех запросов
app.use(cors());
app.use(express.text({ type: 'text/xml' }));

// Прокси для основного API поиска Rossko
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

// Прокси для GetCheckoutDetails (получение address_id)
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
        message: 'Прокси-сервер для Rossko API работает',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`🚀 Прокси-сервер запущен на http://localhost:${port}`);
    console.log(`📋 Статус: http://localhost:${port}/status`);
    console.log('🔗 Доступные эндпоинты:');
    console.log('   - POST /proxy/rossko (поиск запчастей)');
    console.log('   - POST /proxy/rossko-checkout (получение address_id)');
});

module.exports = app;
