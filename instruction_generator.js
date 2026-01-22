// Функция для преобразования данных из YAML в формат инструкции
function generateInstructionHTML(gearboxKey, gearboxData) {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Инструкция по замене масла в АКПП</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="common-styles.css">
    <style>
        /* Specific styles for instruction template */
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .header .summary {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            font-size: 1.1em;
            font-weight: 500;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #3498db;
        }
        
        .section h2 {
            color: #2c3e50;
            font-size: 1.8em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section h2::before {
            content: "🔧";
            font-size: 1.2em;
        }
        
        .section.tools h2::before { content: "🛠️"; }
        .section.parts h2::before { content: "🔩"; }
        .section.procedure h2::before { content: "📋"; }
        .section.warnings h2::before { content: "⚠️"; }
        .section.notes h2::before { content: "💡"; }
        
        .section ul {
            list-style: none;
            padding: 0;
        }
        
        .section ul li {
            background: white;
            margin: 8px 0;
            padding: 12px 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .section ul li::before {
            content: "✓";
            color: #27ae60;
            font-weight: bold;
            position: absolute;
            left: -12px;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .section ol {
            counter-reset: step-counter;
            list-style: none;
            padding: 0;
        }
        
        .section ol li {
            background: white;
            margin: 12px 0;
            padding: 15px 20px 15px 60px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: relative;
            counter-increment: step-counter;
        }
        
        .section ol li::before {
            content: counter(step-counter);
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: #3498db;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .section.warnings {
            border-left-color: #e74c3c;
            background: #ffeaa7;
        }
        
        .section.warnings ul li::before {
            content: "⚠";
            color: #e74c3c;
            background: #ffeaa7;
        }
        
        .section.notes {
            border-left-color: #f39c12;
            background: #fff3cd;
        }
        
        .section.notes ul li::before {
            content: "💡";
            color: #f39c12;
            background: #fff3cd;
        }
        
        .back-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .back-button:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .content {
                padding: 20px;
            }
            
            .section {
                padding: 20px;
            }
            
            .section ol li {
                padding-left: 50px;
            }
            
            .section ol li::before {
                width: 25px;
                height: 25px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <button class="back-button" onclick="window.close()">← Назад</button>
    
    <div class="container">
        <div class="header">
            <h1>Инструкция по замене масла в АКПП</h1>
            <div class="subtitle">Производитель: ${gearboxData.manufacturer}</div>
            <div class="subtitle">Модель коробки: ${gearboxData.gearbox}</div>
            <div class="summary">${gearboxData.summary}</div>
        </div>
        
        <div class="content">
            ${generateToolsSection(gearboxData)}
            ${generatePartsSection(gearboxData)}
            ${generateProcedureSection(gearboxData)}
            ${generateWarningsSection(gearboxData)}
            ${generateNotesSection(gearboxData)}
        </div>
    </div>
</body>
</html>
    `;
}

// Функция для генерации секции инструментов
function generateToolsSection(gearboxData) {
    if (!gearboxData.tools || !Array.isArray(gearboxData.tools)) {
        return '';
    }
    
    const toolsList = gearboxData.tools
        .map(tool => `<li>${tool}</li>`)
        .join('');
    
    return `
    <div class="section tools">
        <h2>Инструменты</h2>
        <ul>
            ${toolsList}
        </ul>
    </div>
    `;
}

// Функция для генерации секции запчастей
function generatePartsSection(gearboxData) {
    if (!gearboxData.parts_list || !Array.isArray(gearboxData.parts_list)) {
        return '';
    }
    
    const partsList = gearboxData.parts_list
        .map(part => `<li>${part}</li>`)
        .join('');
    
    return `
    <div class="section parts">
        <h2>Запчасти</h2>
        <ul>
            ${partsList}
        </ul>
    </div>
    `;
}

// Функция для генерации секции процедуры
function generateProcedureSection(gearboxData) {
    if (!gearboxData.procedure) {
        return '';
    }
    
    // Разбиваем процедуру на шаги (по переносам строк и нумерации)
    const procedureSteps = gearboxData.procedure
        .split(/\d+\.\s/)
        .filter(step => step.trim())
        .map(step => step.trim())
        .map(step => `<li>${step}</li>`)
        .join('');
    
    return `
    <div class="section procedure">
        <h2>Процедура</h2>
        <ol>
            ${procedureSteps}
        </ol>
    </div>
    `;
}

// Функция для генерации секции ошибок
function generateWarningsSection(gearboxData) {
    if (!gearboxData.mistakes || !Array.isArray(gearboxData.mistakes)) {
        return '';
    }
    
    const warningsList = gearboxData.mistakes
        .map(mistake => `<li>${mistake}</li>`)
        .join('');
    
    return `
    <div class="section warnings">
        <h2>Ошибки</h2>
        <ul class="warning">
            ${warningsList}
        </ul>
    </div>
    `;
}

// Функция для генерации секции особенностей
function generateNotesSection(gearboxData) {
    if (!gearboxData.nuances) {
        return '';
    }
    
    let notesList = '';
    
    if (Array.isArray(gearboxData.nuances)) {
        notesList = gearboxData.nuances
            .map(nuance => `<li>${nuance}</li>`)
            .join('');
    } else if (typeof gearboxData.nuances === 'string') {
        // Разбиваем строку на пункты по маркерам
        const nuancesArray = gearboxData.nuances
            .split(/•|\n-|\n\s*-/)
            .filter(item => item.trim())
            .map(item => item.trim());
        
        notesList = nuancesArray
            .map(nuance => `<li>${nuance}</li>`)
            .join('');
    }
    
    return `
    <div class="section notes">
        <h2>Особенности</h2>
        <ul class="note">
            ${notesList}
        </ul>
    </div>
    `;
}

// Функция для открытия инструкции в новом окне
function openInstruction(gearboxKey) {
    // Получаем данные из YAML (предполагаем, что они загружены в глобальную переменную)
    const gearboxData = window.gearboxData ? window.gearboxData[gearboxKey] : null;
    
    if (!gearboxData) {
        alert('Данные для выбранной АКПП не найдены');
        return;
    }
    
    const instructionHTML = generateInstructionHTML(gearboxKey, gearboxData);
    
    // Открываем в новом окне
    const instructionWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    instructionWindow.document.write(instructionHTML);
    instructionWindow.document.close();
}

// Экспорт функций для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateInstructionHTML,
        openInstruction
    };
}
