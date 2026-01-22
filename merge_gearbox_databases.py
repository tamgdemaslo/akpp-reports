#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для объединения новой БД (akppgo_all_data.json) с существующей БД
Создает файл с расширенной информацией для интерфейса
"""

import json
import os
from pathlib import Path
import re

# Пути к файлам
BASE_DIR = Path(__file__).resolve().parent
NEW_DB_PATH = Path("/Users/ilaeliseenko/Desktop/декордер/akppgo_all_data.json")
GEARBOX_FILES_DIR = BASE_DIR / "gearbox_files"
OUTPUT_FILE = BASE_DIR / "akppgo_extended_data.js"

def normalize_transmission_name(transmission):
    """Нормализует название трансмиссии для создания ключа"""
    # Убираем лишние символы, скобки, приводим к верхнему регистру
    key = transmission.upper()
    # Заменяем пробелы и спецсимволы на подчеркивания
    key = re.sub(r'[^A-Z0-9_]+', '_', key)
    # Убираем множественные подчеркивания
    key = re.sub(r'_+', '_', key)
    # Убираем подчеркивания в начале и конце
    key = key.strip('_')
    return key

def get_existing_gearbox_keys():
    """Получает список ключей из существующих файлов gearbox_files"""
    existing_keys = set()
    if GEARBOX_FILES_DIR.exists():
        for js_file in GEARBOX_FILES_DIR.glob("*.js"):
            if js_file.name in ['gearbox_index.js', 'mistakes.js', 'nuances.js', 'parts_list.js', 'tools.js']:
                continue
            key = js_file.stem
            existing_keys.add(key)
    return existing_keys

def create_extended_database():
    """Создает расширенную БД с объединенными данными"""
    
    # Загружаем новую БД
    if not NEW_DB_PATH.exists():
        print(f"❌ Файл {NEW_DB_PATH} не найден!")
        return False
    
    with open(NEW_DB_PATH, 'r', encoding='utf-8') as f:
        new_db = json.load(f)
    
    print(f"✅ Загружено {len(new_db)} записей из новой БД")
    
    # Получаем список существующих ключей
    existing_keys = get_existing_gearbox_keys()
    print(f"✅ Найдено {len(existing_keys)} существующих АКПП с подробной информацией")
    
    # Создаем структуру данных
    extended_data = {}
    
    for item in new_db:
        transmission = item.get('transmission', '')
        manufacturer = item.get('manufacturer', 'Неизвестно')
        url = item.get('url', '')
        cars = item.get('cars', [])
        
        if not transmission:
            continue
        
        # Создаем ключ из названия трансмиссии
        # Пробуем несколько вариантов нормализации
        key_variants = [
            normalize_transmission_name(transmission),
            transmission.replace(' ', '_').replace(',', '_').replace('/', '_').replace('(', '').replace(')', '').upper(),
            transmission.replace(' ', '').replace(',', '_').upper()
        ]
        
        # Используем первый вариант как основной ключ
        main_key = key_variants[0]
        
        # Проверяем, есть ли подробная информация в существующей БД
        has_detailed_info = False
        for existing_key in existing_keys:
            if (existing_key.lower() in transmission.lower() or 
                transmission.lower() in existing_key.lower()):
                has_detailed_info = True
                break
            # Проверяем по частям названия
            transmission_parts = re.split(r'[,\s\(\)]+', transmission.upper())
            for part in transmission_parts:
                if part and len(part) > 2 and part in existing_key.upper():
                    has_detailed_info = True
                    break
            if has_detailed_info:
                break
        
        
        # Создаем запись
        extended_data[main_key] = {
            "transmission": transmission,
            "manufacturer": manufacturer,
            "url": url,
            "cars": cars,
            "has_detailed_info": has_detailed_info,
            "key": main_key
        }
    
    # Создаем JS файл
    js_content = "// Автоматически сгенерированный файл с расширенными данными АКПП\n"
    js_content += "// Содержит информацию из akppgo_all_data.json + флаги наличия подробной информации\n"
    js_content += "window.akppgoExtendedData = "
    js_content += json.dumps(extended_data, ensure_ascii=False, indent=2)
    js_content += ";\n"
    
    # Записываем файл
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Файл {OUTPUT_FILE.name} успешно создан!")
        print(f"📊 Всего АКПП: {len(extended_data)}")
        print(f"📝 С подробной информацией: {sum(1 for item in extended_data.values() if item['has_detailed_info'])}")
        print(f"📝 Без подробной информации: {sum(1 for item in extended_data.values() if not item['has_detailed_info'])}")
        return True
    except Exception as e:
        print(f"❌ Ошибка при создании файла: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Объединение баз данных АКПП...")
    print("=" * 60)
    create_extended_database()

