#!/usr/bin/env python3
"""
Скрипт для преобразования JSON файлов коробок передач в JS формат
"""

import os
import json
import re

def convert_json_to_js(json_file_path):
    """Преобразует JSON файл в JS формат"""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Разделяем JSON от комментариев источников
        lines = content.split('\n')
        json_lines = []
        sources_lines = []
        sources_started = False
        
        for line in lines:
            if line.strip().startswith('=== SOURCES'):
                sources_started = True
            
            if sources_started:
                sources_lines.append(line)
            else:
                json_lines.append(line)
        
        # Парсим JSON
        json_content = '\n'.join(json_lines).strip()
        data = json.loads(json_content)
        
        # Создаем JS файл
        js_file_path = json_file_path.replace('.json', '.js')
        
        # Получаем имя переменной из имени файла
        filename = os.path.basename(json_file_path).replace('.json', '')
        var_name = filename.replace('-', '_').replace(' ', '_')
        
        # Убеждаемся, что имя переменной не начинается с цифры
        if var_name[0].isdigit():
            var_name = 'gearbox_' + var_name
        
        with open(js_file_path, 'w', encoding='utf-8') as f:
            f.write(f"// Автоматически сгенерированный файл из {os.path.basename(json_file_path)}\n")
            f.write("// Инициализируем глобальный объект если его нет\n")
            f.write("window.allGearboxData = window.allGearboxData || {};\n\n")
            
            # Записываем данные напрямую в window.allGearboxData
            f.write("// Добавляем данные о коробках передач\n")
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            f.write(f"Object.assign(window.allGearboxData, {json_str});\n\n")
            
            # Сохраняем также в константе для совместимости
            f.write(f"// Константа для совместимости\n")
            f.write(f"const {var_name}_data = {json_str};\n\n")
            
            # Добавляем экспорт для использования в других файлах
            f.write(f"// Экспорт для использования в других файлах\n")
            f.write(f"if (typeof module !== 'undefined' && module.exports) {{\n")
            f.write(f"  module.exports = {var_name}_data;\n")
            f.write(f"}}\n\n")
            
            # Добавляем комментарии с источниками, если они есть
            if sources_lines:
                f.write('/*\n')
                f.write('\n'.join(sources_lines))
                f.write('\n*/')
        
        print(f"✅ Преобразован: {json_file_path} -> {js_file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при преобразовании {json_file_path}: {e}")
        return False

def main():
    # Ищем все JSON файлы в директории gearbox_files
    gearbox_dir = "gearbox_files"
    root_dir = "."
    
    converted_count = 0
    total_count = 0
    
    # Обрабатываем файлы в gearbox_files
    if os.path.exists(gearbox_dir):
        for filename in os.listdir(gearbox_dir):
            if filename.endswith('.json'):
                json_path = os.path.join(gearbox_dir, filename)
                total_count += 1
                if convert_json_to_js(json_path):
                    converted_count += 1
    
    # Обрабатываем JSON файлы в корневой директории
    for filename in os.listdir(root_dir):
        if filename.endswith('.json') and not filename.startswith('package'):
            json_path = os.path.join(root_dir, filename)
            total_count += 1
            if convert_json_to_js(json_path):
                converted_count += 1
    
    print(f"\n📊 Результат:")
    print(f"   Всего JSON файлов: {total_count}")
    print(f"   Успешно преобразовано: {converted_count}")
    print(f"   Ошибок: {total_count - converted_count}")

if __name__ == "__main__":
    main()
