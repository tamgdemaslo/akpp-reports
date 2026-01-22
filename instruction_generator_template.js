// Улучшенный генератор инструкций с использованием шаблона
function generateInstructionFromTemplate(gearboxKey, gearboxData) {
    // Читаем базовый шаблон
    const templateHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Инструкция по замене масла в АКПП - {{gearbox}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="common-styles.css">
    <style>
        /* Specific styles for instruction template */
        .container {
            max-width: 1000px;
            background: var(--surface);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
        }
        
        .content {
            padding: 40px;
        }
        
        .gearbox-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid var(--border);
        }
        
        .instruction-content {
            background: var(--surface);
            border-radius: var(--radius);
            padding: 32px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
        }
        
        .instruction-content h2 {
            color: var(--primary);
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid var(--primary);
        }
        
        .instruction-steps {
            font-size: 16px;
            line-height: 1.8;
            color: var(--text);
        }
        
        .summary-card {
            background: linear-gradient(135deg, #e8f4f8 0%, #d1ecf1 100%);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 24px;
            border-left: 5px solid var(--primary);
            box-shadow: var(--shadow);
        }
        
        .summary-card h3 {
            color: var(--primary);
            font-size: 18px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .summary-text {
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1.6;
            font-weight: 500;
        }
        
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            color: white;
            padding: 12px 24px;
            border-radius: var(--radius);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-bottom: 24px;
            border: none;
            cursor: pointer;
        }
        
        .back-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .step-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
            padding: 16px;
            background: var(--surface-hover);
            border-radius: var(--radius);
            border-left: 4px solid var(--primary);
        }
        
        .step-number {
            background: var(--primary);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-content strong {
            color: var(--primary);
            font-weight: 600;
        }
        
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: var(--radius);
            padding: 16px;
            margin: 16px 0;
        }
        
        .code-block pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            color: #495057;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 24px;
            }
            
            .instruction-content {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <div class="logo-text">Там где масло.</div>
            </div>
            <h1>Инструкция по замене масла АКПП</h1>
            <p>{{gearbox}}</p>
        </div>
        
        <div class="content">
            <button class="back-button" onclick="window.close()">
                ← Закрыть окно
            </button>
            
            <div class="gearbox-info">
                <!-- Краткая сводка -->
                <div class="summary-card">
                    <h3>📊 Краткая сводка</h3>
                    <p class="summary-text">{{summary}}</p>
                </div>
                
                <!-- Основная информация -->
                <div class="info-grid">
                    <div class="info-item">
                        <h4>Производитель</h4>
                        <p>{{manufacturer}}</p>
                    </div>
                    <div class="info-item">
                        <h4>Объем слива</h4>
                        <p>{{drain_volume}}</p>
                    </div>
                    <div class="info-item">
                        <h4>Тип жидкости</h4>
                        <p>{{fluid}}</p>
                    </div>
                    <div class="info-item">
                        <h4>Полная емкость</h4>
                        <p>{{dry_capacity}}</p>
                    </div>
                    <div class="info-item">
                        <h4>Диапазон температур</h4>
                        <p>{{fill_range}}</p>
                    </div>
                    <div class="info-item">
                        <h4>Интервал замены</h4>
                        <p>{{service_interval}}</p>
                    </div>
                </div>
                
                <!-- Инструменты -->
                <div class="section-card tools">
                    <h3>🔧 Необходимые инструменты</h3>
                    <ul class="list-styled tools">
                        {{tools_list}}
                    </ul>
                </div>
                
                <!-- Запчасти -->
                <div class="section-card parts">
                    <h3>🔩 Необходимые запчасти</h3>
                    <ul class="list-styled parts">
                        {{parts_list}}
                    </ul>
                </div>
            </div>
            
            <div class="warning">
                <h4>⚠️ Важно!</h4>
                <p>Данная инструкция носит справочный характер. Обязательно соблюдайте правила техники безопасности и используйте оригинальные запчасти и жидкости.</p>
            </div>
            
            <div class="instruction-content">
                <h2>Пошаговая инструкция</h2>
                <div class="instruction-steps">
                    {{procedure_steps}}
                </div>
                
                <!-- Частые ошибки -->
                <div class="section-card warning">
                    <h3>⚠️ Частые ошибки</h3>
                    <ul class="list-styled warning">
                        {{mistakes_list}}
                    </ul>
                </div>
                
                <!-- Нюансы работы -->
                <div class="section-card info">
                    <h3>💡 Нюансы работы</h3>
                    <div class="code-block">
                        <pre>{{nuances}}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    // Подставляем данные в шаблон
    let filledTemplate = templateHTML;
    
    // Базовые переменные
    filledTemplate = filledTemplate.replace(/{{gearbox}}/g, gearboxData.gearbox || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{manufacturer}}/g, gearboxData.manufacturer || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{summary}}/g, gearboxData.summary || 'Краткая сводка не доступна');
    filledTemplate = filledTemplate.replace(/{{drain_volume}}/g, gearboxData.drain_volume || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{fluid}}/g, gearboxData.fluid || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{dry_capacity}}/g, gearboxData.dry_capacity || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{fill_range}}/g, gearboxData.fill_range || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{service_interval}}/g, gearboxData.service_interval || 'Не указано');
    filledTemplate = filledTemplate.replace(/{{nuances}}/g, gearboxData.nuances || 'Нюансы не указаны');
    
    // Генерируем список инструментов
    let toolsList = '';
    if (gearboxData.tools && Array.isArray(gearboxData.tools)) {
        toolsList = gearboxData.tools.map(tool => `<li>${tool}</li>`).join('');
    } else {
        toolsList = '<li>Информация об инструментах не доступна</li>';
    }
    filledTemplate = filledTemplate.replace(/{{tools_list}}/g, toolsList);
    
    // Генерируем список запчастей
    let partsList = '';
    if (gearboxData.parts_list && Array.isArray(gearboxData.parts_list)) {
        partsList = gearboxData.parts_list.map(part => `<li>${part}</li>`).join('');
    } else {
        partsList = '<li>Информация о запчастях не доступна</li>';
    }
    filledTemplate = filledTemplate.replace(/{{parts_list}}/g, partsList);
    
    // Генерируем пошаговую инструкцию
    let procedureSteps = '';
    if (gearboxData.procedure) {
        const steps = gearboxData.procedure.split(/\n\n|\n(?=\d+\.)/);
        procedureSteps = steps.map((step, index) => {
            const cleanStep = step.replace(/^\d+\.\s*/, '').trim();
            if (cleanStep) {
                return `
                    <div class="step-item">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-content">${cleanStep}</div>
                    </div>
                `;
            }
            return '';
        }).join('');
    } else {
        procedureSteps = '<div class="step-item"><div class="step-number">?</div><div class="step-content">Процедура не доступна</div></div>';
    }
    filledTemplate = filledTemplate.replace(/{{procedure_steps}}/g, procedureSteps);
    
    // Генерируем список ошибок
    let mistakesList = '';
    if (gearboxData.mistakes && Array.isArray(gearboxData.mistakes)) {
        mistakesList = gearboxData.mistakes.map(mistake => `<li>${mistake}</li>`).join('');
    } else {
        mistakesList = '<li>Информация о частых ошибках не доступна</li>';
    }
    filledTemplate = filledTemplate.replace(/{{mistakes_list}}/g, mistakesList);
    
    return filledTemplate;
}

// Новая функция для открытия инструкции с использованием шаблона
function openInstructionWithTemplate(gearboxKey) {
    // Получаем данные из allGearboxData
    const gearboxData = window.allGearboxData ? window.allGearboxData[gearboxKey] : null;
    
    if (!gearboxData) {
        alert('Данные для выбранной АКПП не найдены в базе инструкций');
        return;
    }
    
    const instructionHTML = generateInstructionFromTemplate(gearboxKey, gearboxData);
    
    // Открываем в новом окне
    const instructionWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    instructionWindow.document.write(instructionHTML);
    instructionWindow.document.close();
}

// Экспорт функций для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateInstructionFromTemplate,
        openInstructionWithTemplate
    };
}
