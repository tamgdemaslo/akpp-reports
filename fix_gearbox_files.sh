#!/bin/bash

# Скрипт для исправления файлов АКПП в папке gearbox_files
# Изменяет window.gearboxData на window.allGearboxData и исправляет структуру

GEARBOX_DIR="/Users/ilaeliseenko/Desktop/akpp-generator/gearbox_files"

echo "Исправляем файлы АКПП в папке $GEARBOX_DIR"

for file in "$GEARBOX_DIR"/*.js; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        
        # Пропускаем индексный файл и файлы tools, parts_list и т.д.
        if [[ "$filename" == "gearbox_index.js" || "$filename" == "tools.js" || "$filename" == "parts_list.js" || "$filename" == "mistakes.js" || "$filename" == "nuances.js" ]]; then
            echo "Пропускаем $filename"
            continue
        fi
        
        echo "Исправляем $filename"
        
        # Заменяем window.gearboxData на window.allGearboxData
        sed -i.bak 's/window\.gearboxData = {/window.allGearboxData = window.allGearboxData || {};\nObject.assign(window.allGearboxData, {/' "$file"
        
        # Исправляем закрывающие скобки в конце файла
        sed -i.bak 's/^};$/});/' "$file"
        
        # Удаляем backup файлы
        rm -f "${file}.bak"
        
        echo "✓ Исправлен $filename"
    fi
done

echo "Готово! Все файлы АКПП исправлены."
