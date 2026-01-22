#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Путь к папке с файлами АКПП
const gearboxDir = './gearbox_files';
const indexFile = path.join(gearboxDir, 'gearbox_index.js');

// Получаем все .js файлы кроме gearbox_index.js и служебных
function updateGearboxIndex() {
    try {
        const files = fs.readdirSync(gearboxDir)
            .filter(file => file.endsWith('.js'))
            .filter(file => file !== 'gearbox_index.js')
            .sort();
        
        const content = `// Автоматически сгенерированный индекс файлов АКПП
window.gearboxIndex = [
${files.map(file => `    "${file}"`).join(',\n')}
];
`;
        
        fs.writeFileSync(indexFile, content, 'utf8');
        console.log(`Обновлен gearbox_index.js с ${files.length} файлами`);
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении индекса:', error);
        return false;
    }
}

// Запускаем обновление
updateGearboxIndex();
