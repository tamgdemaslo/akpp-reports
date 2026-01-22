#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Загружаем данные из report_data.js
const reportDataContent = fs.readFileSync('report_data.js', 'utf8');
const reportDataMatch = reportDataContent.match(/const reportData = ({[\s\S]*?});/);
if (!reportDataMatch) {
    console.error('Не удалось найти reportData в report_data.js');
    process.exit(1);
}

const reportData = eval('(' + reportDataMatch[1] + ')');

// Загружаем существующие данные из gearbox_data.js
const gearboxDataContent = fs.readFileSync('gearbox_data.js', 'utf8');
const gearboxDataMatch = gearboxDataContent.match(/window\.gearboxData = ({[\s\S]*?});/);
if (!gearboxDataMatch) {
    console.error('Не удалось найти gearboxData в gearbox_data.js');
    process.exit(1);
}

const existingGearboxData = eval('(' + gearboxDataMatch[1] + ')');

// Находим недостающие ключи
const reportKeys = Object.keys(reportData);
const existingKeys = Object.keys(existingGearboxData);
const missingKeys = reportKeys.filter(key => !existingKeys.includes(key));

console.log('Найдено моделей в report_data.js:', reportKeys.length);
console.log('Существующих моделей в gearbox_data.js:', existingKeys.length);
console.log('Недостающих моделей:', missingKeys.length);
console.log('Недостающие модели:', missingKeys);

// Функция для создания шаблонной инструкции
function generateGearboxDataFromReport(key, reportData) {
    const data = reportData[key];
    
    // Генерируем базовую процедуру на основе типа коробки
    let baseProcedure = "";
    
    if (data.gearbox.includes("CVT") || data.gearbox.includes("JF0") || data.gearbox.includes("RE0F")) {
        baseProcedure = `1. Прогрейте вариатор до рабочей температуры ${data.fill_range_celsius} °C.
2. Установите автомобиль горизонтально, селектор в «P», двигатель работает.
3. Снимите защиту картера, подставьте ёмкость для отработки.
4. Открутите сливную пробку – сольётся основная часть жидкости (${data.drain_volume} л).
5. Отверните болты поддона ${data.pan_torque_nm} Н·м, аккуратно снимите поддон.
6. Замените фильтр CVT, очистите магниты поддона.
7. Установите новую прокладку поддона, затяните болты ${data.pan_torque_nm} Н·м.
8. Вверните новую сливную пробку с шайбой ${data.drain_torque_nm} Н·м.
9. Залейте свежую жидкость ${data.fluid_type} через заливное отверстие.
10. Запустите двигатель, переведите селектор по всем положениям.
11. При температуре ${data.fill_range_celsius} °C проверьте уровень по контрольной пробке.
12. Долейте жидкость до появления слабой струи из контрольного отверстия.
13. Установите защиту, совершите тест-драйв 10 км.`;
    } else if (data.gearbox.includes("DSG") || data.gearbox.includes("DQ")) {
        baseProcedure = `1. Прогрейте DSG до рабочей температуры ${data.work_temp_celsius} °C.
2. Установите автомобиль горизонтально, селектор в «P», двигатель выключен.
3. Снимите защиту картера и нижнюю крышку коробки.
4. Слейте трансмиссионное масло и гидравлическую жидкость.
5. Замените фильтры и прокладки согласно регламенту.
6. Залейте свежие жидкости: ${data.fluid_type}.
7. Выполните адаптацию сцеплений через диагностический сканер.
8. Проверьте уровень жидкостей при рабочей температуре.
9. Совершите тест-драйв и проверьте работу коробки.`;
    } else {
        baseProcedure = `1. Прогрейте АКПП до рабочей температуры ${data.work_temp_celsius} °C.
2. Установите автомобиль горизонтально, селектор в «P», двигатель работает.
3. Снимите защиту картера, подставьте ёмкость для отработки.
4. Открутите сливную пробку – сольётся основная часть жидкости (${data.drain_volume} л).
5. Отверните болты поддона ${data.pan_torque_nm} Н·м, аккуратно снимите поддон.
6. Замените фильтр АКПП, очистите магниты поддона.
7. Установите новую прокладку поддона, затяните болты ${data.pan_torque_nm} Н·м.
8. Вверните новую сливную пробку с шайбой ${data.drain_torque_nm} Н·м.
9. Залейте свежую жидкость ${data.fluid_type} через заливное отверстие.
10. Запустите двигатель, переведите селектор по всем положениям.
11. При температуре ${data.fill_range_celsius} °C проверьте уровень.
12. Долейте жидкость до нужного уровня.
13. Установите защиту, совершите тест-драйв 10 км.`;
    }
    
    // Генерируем инструменты
    const tools = [
        `Головка ${data.pan_torque_nm} мм (болты поддона)`,
        `Головка ${data.drain_torque_nm} мм (сливная пробка)`,
        `Динамометрический ключ 5–60 Н·м`,
        `Сканер для контроля температуры жидкости`,
        `Шприц/помпа для заливки жидкости`,
        `Ёмкость ≥ ${Math.ceil(data.drain_volume + 2)} л для отработки`
    ];
    
    // Генерируем запчасти
    const parts_list = [
        `Фильтр ${data.parts.filter_standard}`,
        `Прокладка поддона ${data.parts.pan_gasket || data.parts.gasket || 'стандартная'}`,
        `Сливная пробка ${data.parts.drain_plug || 'стандартная'}`,
        `Жидкость ${data.fluid_type} ${Math.ceil(data.drain_volume + 1)}–${Math.ceil(data.drain_volume + 2)} л`
    ];
    
    // Генерируем частые ошибки
    const mistakes = [
        `Проверка уровня вне диапазона ${data.fill_range_celsius} °C приводит к неточности.`,
        `Использование не оригинальной жидкости ${data.fluid_type} может вызвать проблемы.`,
        `Перетяжка болтов поддона > ${data.pan_torque_nm + 2} Н·м может повредить корпус.`,
        `Неправильная установка фильтра приводит к засорению системы.`
    ];
    
    // Генерируем нюансы
    const nuances = `Коробка ${data.gearbox} требует использования только оригинальной жидкости ${data.fluid_type}.
Рекомендуемый интервал замены: каждые 60 000–80 000 км или 4 года.
При большом пробеге рекомендуется промывка системы.
Обязательно меняйте фильтр при каждой замене жидкости.
Проверяйте состояние уплотнений и прокладок.`;
    
    return {
        manufacturer: data.manufacturer,
        gearbox: data.gearbox,
        summary: data.summary,
        fluid: data.fluid,
        fill_range: data.fill_range_celsius + " °C",
        drain_volume: data.drain_volume + " л",
        dry_capacity: "Не указано",
        service_interval: "каждые 60 000–80 000 км или 4 года",
        tools,
        parts_list,
        procedure: baseProcedure,
        mistakes,
        nuances
    };
}

// Создаем новые записи для недостающих ключей
const newGearboxData = { ...existingGearboxData };

missingKeys.forEach(key => {
    console.log(`Создаем запись для ${key}...`);
    newGearboxData[key] = generateGearboxDataFromReport(key, reportData);
});

// Генерируем новый файл
function formatGearboxData(data) {
    let result = '// Автоматически сгенерированный файл из gearbox_data.yaml\n';
    result += 'window.gearboxData = {\n';
    
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
        const item = data[key];
        result += `    "${key}": {\n`;
        result += `        "manufacturer": "${item.manufacturer}",\n`;
        result += `        "gearbox": "${item.gearbox}",\n`;
        result += `        "summary": "${item.summary}",\n`;
        result += `        "fluid": "${item.fluid}",\n`;
        result += `        "fill_range": "${item.fill_range}",\n`;
        result += `        "drain_volume": "${item.drain_volume}",\n`;
        result += `        "dry_capacity": "${item.dry_capacity}",\n`;
        result += `        "service_interval": "${item.service_interval}",\n`;
        
        // Массив инструментов
        result += `        "tools": [\n`;
        item.tools.forEach((tool, toolIndex) => {
            result += `            "${tool.replace(/"/g, '\\"')}"${toolIndex < item.tools.length - 1 ? ',' : ''}\n`;
        });
        result += `        ],\n`;
        
        // Массив запчастей
        result += `        "parts_list": [\n`;
        item.parts_list.forEach((part, partIndex) => {
            result += `            "${part.replace(/"/g, '\\"')}"${partIndex < item.parts_list.length - 1 ? ',' : ''}\n`;
        });
        result += `        ],\n`;
        
        // Процедура
        result += `        "procedure": "${item.procedure.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",\n`;
        
        // Массив ошибок
        result += `        "mistakes": [\n`;
        item.mistakes.forEach((mistake, mistakeIndex) => {
            result += `            "${mistake.replace(/"/g, '\\"')}"${mistakeIndex < item.mistakes.length - 1 ? ',' : ''}\n`;
        });
        result += `        ],\n`;
        
        // Нюансы
        result += `        "nuances": "${item.nuances.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
        
        result += `    }${index < keys.length - 1 ? ',' : ''}\n`;
    });
    
    result += '};';
    return result;
}

// Записываем новый файл
const newContent = formatGearboxData(newGearboxData);
fs.writeFileSync('gearbox_data.js', newContent);

console.log('Файл gearbox_data.js успешно обновлен!');
console.log(`Добавлено записей: ${missingKeys.length}`);
console.log(`Общее количество записей: ${Object.keys(newGearboxData).length}`);
