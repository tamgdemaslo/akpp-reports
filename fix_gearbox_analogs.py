#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для исправления ключей АКПП: извлечение аналогов из скобок в отдельное поле
"""

import re
import json
from pathlib import Path

GEARBOX_FILES_DIR = Path(__file__).resolve().parent / "gearbox_files"

# Описания, которые НЕ являются аналогами (их нужно оставить в скобках или удалить)
NOT_ANALOGS = [
    'BMW', 'FWD', 'AWD', 'RWD', 'Audi/VW', 'VAG', 'VW', 'Audi',
    'AG4', 'FF', 'Gen I', 'Gen II', 'Gen I/II', 'denomination',
    'обозначение', 'derivative'
]

def extract_analogs_from_text(text):
    """Извлекает аналоги из текста в скобках"""
    # Удаляем скобки и извлекаем содержимое
    matches = re.findall(r'\(([^)]+)\)', text)
    if not matches:
        return [], text
    
    analogs_candidates = []
    cleaned_text = text
    
    for match in matches:
        # Проверяем, не является ли это описанием
        is_description = any(desc.lower() in match.lower() for desc in NOT_ANALOGS)
        
        if not is_description:
            # Разделяем по запятым и слешам
            parts = re.split(r'[,\s/]+', match)
            parts = [p.strip() for p in parts if p.strip() and len(p.strip()) > 1]
            analogs_candidates.extend(parts)
            
            # Удаляем скобки из текста
            cleaned_text = cleaned_text.replace(f'({match})', '').strip()
        else:
            # Если это описание, удаляем скобки, но не добавляем в аналоги
            cleaned_text = cleaned_text.replace(f'({match})', '').strip()
    
    # Также ищем аналоги через слеш в основном тексте (например: "U660E / U760E")
    main_parts = re.split(r'\s+/\s+', cleaned_text)
    if len(main_parts) > 1 and all(len(p) < 20 for p in main_parts):
        # Похоже на аналоги через слеш
        base_name = main_parts[0].strip()
        additional_analogs = [p.strip() for p in main_parts[1:] if p.strip()]
        if additional_analogs:
            analogs_candidates.extend(additional_analogs)
            cleaned_text = base_name
    
    # Очищаем аналоги от лишнего
    analogs = []
    for analog in analogs_candidates:
        analog = analog.strip()
        # Убираем лишние символы
        analog = re.sub(r'^[-\s]+|[-\s]+$', '', analog)
        if analog and len(analog) > 1 and analog not in analogs:
            analogs.append(analog)
    
    # Очищаем текст от лишних пробелов и символов
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    cleaned_text = re.sub(r'\s*/\s*', ' ', cleaned_text).strip()
    
    return analogs, cleaned_text

def fix_gearbox_file(file_path):
    """Исправляет один файл АКПП"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Ищем все вхождения "gearbox": "название"
        pattern = r'"gearbox":\s*"([^"]+)"'
        changes_made = False
        total_analogs = []
        
        def replace_gearbox(match):
            nonlocal changes_made
            gearbox_name = match.group(1)
            analogs, clean_name = extract_analogs_from_text(gearbox_name)
            
            # Если нет аналогов или название не изменилось, возвращаем как есть
            if not analogs or clean_name == gearbox_name:
                return match.group(0)
            
            # Проверяем, есть ли уже поле analogs после этого поля
            full_match = match.group(0)
            changes_made = True
            total_analogs.extend(analogs)
            
            # Формируем новую строку
            result = f'"gearbox": "{clean_name}"'
            if analogs:
                analogs_str = json.dumps(analogs, ensure_ascii=False)
                result += f',\n    "analogs": {analogs_str}'
            
            return result
        
        new_content = re.sub(pattern, replace_gearbox, content)
        
        # Сохраняем только если что-то изменилось
        if changes_made and new_content != original_content:
            file_path.write_text(new_content, encoding='utf-8')
            return True, total_analogs
        
        return False, []
    
    except Exception as e:
        print(f"❌ Ошибка при обработке {file_path.name}: {e}")
        import traceback
        traceback.print_exc()
        return False, []

def main():
    """Основная функция"""
    print("🔄 Исправление ключей АКПП: извлечение аналогов...")
    print("=" * 60)
    
    fixed_count = 0
    total_analogs = 0
    
    # Обрабатываем все JS файлы (кроме служебных)
    for js_file in sorted(GEARBOX_FILES_DIR.glob("*.js")):
        if js_file.name in ['gearbox_index.js', 'mistakes.js', 'nuances.js', 'parts_list.js', 'tools.js']:
            continue
        
        was_fixed, analogs = fix_gearbox_file(js_file)
        if was_fixed:
            fixed_count += 1
            total_analogs += len(analogs) if isinstance(analogs, list) else 0
            print(f"✅ {js_file.name}: добавлено {len(analogs) if isinstance(analogs, list) else 0} аналогов")
    
    print("=" * 60)
    print(f"✅ Исправлено файлов: {fixed_count}")
    print(f"📊 Всего добавлено аналогов: {total_analogs}")

if __name__ == "__main__":
    main()

