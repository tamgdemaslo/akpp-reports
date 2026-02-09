#!/usr/bin/env node

// Объединенный сервер для Render: статика + прокси
const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const VINDECODER_TOKEN = process.env.VINDECODER_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2-2025-12-11';

// Включаем CORS
app.use(cors());
// Парсинг XML-тела для Rossko SOAP (text/xml и application/xml)
app.use(express.text({ type: ['text/xml', 'application/xml'], limit: '1mb' }));
app.use(express.json());

// Функция обновления индекса
function updateGearboxIndex() {
    const gearboxDir = path.join(__dirname, 'gearbox_files');
    const indexFile = path.join(gearboxDir, 'gearbox_index.js');
    
    try {
        const files = fs.readdirSync(gearboxDir)
            .filter(file => file.endsWith('.js'))
            .filter(file => file !== 'gearbox_index.js')
            .filter(file => file !== 'all_gearbox_bundle.js')
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
        const body = (typeof req.body === 'string' ? req.body : '') || '';
        if (!body || body.length < 100) {
            console.warn('⚠️ Пустое или слишком короткое тело запроса к Rossko');
        }
        const response = await fetch('http://api.rossko.ru/service/v2.1/GetSearch', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://api.rossko.ru/GetSearch'
            },
            body: body
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
        const body = (typeof req.body === 'string' ? req.body : '') || '';
        const response = await fetch('http://api.rossko.ru/service/v2.1/GetCheckoutDetails', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://api.rossko.ru/GetCheckoutDetails'
            },
            body: body
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

// ===== VIN search (новая версия) =====
// Возвращает: oem_gearbox_code, gearbox_maker_code, raw_answer, vin_data
app.get('/vin-search', async (req, res) => {
    const vin = String(req.query.vin || '').trim().toUpperCase();
    const lang = String(req.query.lang || 'ru').trim();

    if (!vin) return res.status(400).json({ error: 'VIN не указан' });
    if (vin.length < 11) return res.status(400).json({ error: 'VIN слишком короткий' });

    if (!VINDECODER_TOKEN) return res.status(500).json({ error: 'VINDECODER_TOKEN не задан на сервере' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY не задан на сервере' });

    const vinDecoderUrl = 'https://api-cloud.ru/api/vindecoder.php';
    async function fetchVin(useHeader) {
        const params = new URLSearchParams({ type: 'vin', vin });
        if (!useHeader) params.set('token', VINDECODER_TOKEN);
        const url = `${vinDecoderUrl}?${params.toString()}`;
        const headers = useHeader ? { Token: VINDECODER_TOKEN } : {};
        const r = await fetch(url, { headers });
        const data = await r.json();
        return data;
    }

    let raw = null;
    try {
        raw = await fetchVin(false);
        if (raw && raw.error) {
            // типичные ошибки токена — пробуем заголовок
            const err = String(raw.error || '');
            const msg = String(raw.message || '');
            if (err === '503' || err === '602' || /token/i.test(msg)) {
                raw = await fetchVin(true);
            }
        }
    } catch (e) {
        return res.status(500).json({ error: `Ошибка при декодировании VIN: ${e.message}` });
    }

    if (!raw || raw.error) {
        return res.status(500).json({ error: `Ошибка VIN API: ${raw?.error || 'UNKNOWN'} ${raw?.message || ''}`.trim() });
    }

    // Выбираем отчёт: приоритет — автомат/робот/вариатор (AUT/AT/CVT/DCT), не первый попавшийся (часто МКПП)
    function pickBestReport(reports) {
        if (!Array.isArray(reports) || reports.length === 0) return null;
        const autoKeywords = ['AUT', 'AT', 'CVT', 'DCT', 'AMT', 'ROBOT'];
        for (const r of reports) {
            const gear = r && r.gear;
            const type = (gear && typeof gear === 'object' ? gear.type : gear) ? String(gear.type || gear).toUpperCase() : '';
            if (autoKeywords.some(k => type.includes(k))) return r;
        }
        return reports[0];
    }

    const reports = Array.isArray(raw.reports) ? raw.reports : [];
    const r0 = pickBestReport(reports) || reports[0] || {};
    const vinInfo = raw.vin || {};
    const vin_data = {
        make: r0.brand || '',
        model: r0.model || '',
        year: r0.modelYear ? String(r0.modelYear) : (r0.startYear ? String(r0.startYear) : ''),
        modification: r0.modification || '',
        gear: r0.gear || '',
        drive: r0.drive || '',
        fuelType: r0.fuelType || '',
        engineVolume: r0.engineVolume || '',
        vin: vinInfo.income || vinInfo.normal || vin,
        found: Boolean(raw.found),
        countReports: Number(raw.countReports || 0),
        fingerprint: reports.length ? `${r0.brand || ''};${r0.model || ''};${r0.modification || ''};${r0.engineVolume || ''};${r0.enginePower || ''};${r0.fuelType || ''};${r0.startYear || ''}-${r0.finishYear || ''}` : ''
    };

    // Формируем текст для промпта (как в "декордер 2.0/vin_akpp_openai.py")
    const gear = r0.gear || {};
    const gearType = (gear && typeof gear === 'object') ? (gear.type || '') : '';
    const gearSpeeds = (gear && typeof gear === 'object') ? (gear.speeds || '') : '';
    const promptText = [
        `Марка: ${r0.brand || ''}`,
        `Модель: ${r0.model || ''}`,
        `Кузов: ${r0.bodyName || r0.body || ''}`,
        `Год: ${r0.modelYear || ''}`,
        `Модификация: ${r0.modification || ''}`,
        `Тип КПП: ${gearType}`,
        `Число передач: ${gearSpeeds}`,
        `Двигатель (серия): ${r0.engineSeries || ''}`,
        `Привод: ${r0.drive || ''}`,
        `Кратко: ${r0.basicParams || ''}`
    ].join('\n');

    const systemPrompt =
        "Ты эксперт по автомобильным трансмиссиям. По данным об автомобиле определи наиболее вероятную модель автоматической коробки передач (АКПП).\n\n" +
        "Всегда выводи в первую очередь OEM/каталожный код коробки производителя авто (BMW: формат GA..., VAG: 0D9/0GC/DQ..., MB: 722.9/725.0, и т.п.).\n" +
        "Во второй части (в скобках) укажи коробку по производителю трансмиссии(ZF/Aisin/Getrag и т.д.) и, если применимо, гибридную версию (PH).\n" +
        "Не ограничивайся только семейством (например, «8HP50») — предпочитай точный OEM-код; если точный OEM-код нельзя вывести из данных, перечисли возможные OEM-коды и напиши, каких данных не хватает (VIN/месяц выпуска/код КПП из ETK/наклейки/part number).\n" +
        "Формат ответа строго одной строкой:\n" +
        "OEM-код АКПП — (производитель, модель/семейство)\n" +
        "Пример: GA8P75HZ — (ZF 8HP50PH).";

    let raw_answer = '';
    try {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        const resp = await client.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Данные автомобиля:\n${promptText}\n\nОпредели модель АКПП.` }
            ],
            temperature: 0.2
        });
        raw_answer = String(resp.choices?.[0]?.message?.content || '').trim();
    } catch (e) {
        return res.status(500).json({ error: `Ошибка при вызове OpenAI: ${e.message}` });
    }

    // Парсим "OEM — (maker code)"
    const firstLine = (raw_answer.split('\n')[0] || '').trim();
    let oem_gearbox_code = '';
    let gearbox_maker_code = '';
    for (const dash of ['—', '-', '–']) {
        if (firstLine.includes(dash) && firstLine.includes('(') && firstLine.includes(')')) {
            const [left, right] = firstLine.split(dash, 2);
            oem_gearbox_code = String(left || '').trim();
            const r = String(right || '').trim();
            const start = r.indexOf('(');
            const end = r.indexOf(')', start + 1);
            if (start !== -1 && end !== -1) gearbox_maker_code = r.slice(start + 1, end).trim();
            break;
        }
    }
    if (!gearbox_maker_code && raw_answer.includes('(') && raw_answer.includes(')')) {
        const start = raw_answer.indexOf('(');
        const end = raw_answer.indexOf(')', start + 1);
        if (start !== -1 && end !== -1) gearbox_maker_code = raw_answer.slice(start + 1, end).trim();
    }
    if (!oem_gearbox_code) {
        if (firstLine.includes('—')) oem_gearbox_code = firstLine.split('—', 1)[0].trim();
        else if (firstLine.includes('-')) oem_gearbox_code = firstLine.split('-', 1)[0].trim();
        else if (firstLine.includes('(')) oem_gearbox_code = firstLine.split('(', 1)[0].trim();
    }

    return res.json({
        vin,
        lang,
        raw_answer,
        oem_gearbox_code,
        gearbox_maker_code,
        vin_data
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

