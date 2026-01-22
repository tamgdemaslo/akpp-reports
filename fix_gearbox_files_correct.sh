#!/bin/bash

# Скрипт для исправления файлов АКПП в папке gearbox_files
# Исправляет синтаксические ошибки после предыдущего скрипта

GEARBOX_DIR="/Users/ilaeliseenko/Desktop/akpp-generator/gearbox_files"

echo "Исправляем синтаксические ошибки в файлах АКПП в папке $GEARBOX_DIR"

for file in "$GEARBOX_DIR"/*.js; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        
        # Пропускаем индексный файл и файлы tools, parts_list и т.д.
        if [[ "$filename" == "gearbox_index.js" || "$filename" == "tools.js" || "$filename" == "parts_list.js" || "$filename" == "mistakes.js" || "$filename" == "nuances.js" ]]; then
            echo "Пропускаем $filename"
            continue
        fi
        
        echo "Исправляем $filename"
        
        # Убираем лишнюю закрывающую скобку перед });
        # Ищем паттерн "}\n};" и заменяем на "});", также "}\n});" на "};"
        sed -i.bak '/^}$/N;s/}\n});/});/' "$file"
        
        # Удаляем backup файлы
        rm -f "${file}.bak"
        
        echo "✓ Исправлен $filename"
    fi
done

echo "Готово! Все файлы АКПП исправлены."
