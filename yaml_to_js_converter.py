#!/usr/bin/env python3
"""
Утилита для конвертации YAML файлов в JavaScript файлы для проекта АКПП генератора
"""

import yaml
import json
import sys
import os

def convert_yaml_to_js(yaml_file, js_file, var_name):
    """
    Конвертирует YAML файл в JavaScript файл
    
    Args:
        yaml_file: путь к YAML файлу
        js_file: путь к выходному JS файлу
        var_name: имя переменной в JS файле
    """
    
    # Читаем YAML файл
    try:
        with open(yaml_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except FileNotFoundError:
        print(f"Ошибка: Файл {yaml_file} не найден")
        return False
    except yaml.YAMLError as e:
        print(f"Ошибка при чтении YAML: {e}")
        return False
    
    # Если файл содержит секцию gearboxes, извлекаем только её
    if 'gearboxes' in data:
        data = data['gearboxes']
    
    # Конвертируем в JSON строку
    json_str = json.dumps(data, ensure_ascii=False, indent=4)
    
    # Создаем JavaScript содержимое
    js_content = f"""// Автоматически сгенерированный файл из {yaml_file}
const {var_name} = {json_str};
"""
    
    # Записываем JavaScript файл
    try:
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Успешно конвертирован {yaml_file} -> {js_file}")
        return True
    except Exception as e:
        print(f"Ошибка при записи файла: {e}")
        return False

def main():
    """Основная функция"""
    
    base_dir = "/Users/ilaeliseenko/Desktop/akpp-generator"
    yaml_dir = "/Users/ilaeliseenko/Desktop/акпп бот"
    
    # Конвертации для выполнения
    conversions = [
        {
            "yaml_file": f"{yaml_dir}/instructions_data.yaml",
            "js_file": f"{base_dir}/instructions_data.js",
            "var_name": "instructionsData"
        },
        {
            "yaml_file": f"{yaml_dir}/full_gearbox_data.yaml", 
            "js_file": f"{base_dir}/report_data.js",
            "var_name": "reportData"
        }
    ]
    
    print("🔄 Начинаем конвертацию YAML файлов в JavaScript...")
    print("=" * 60)
    
    success_count = 0
    
    for conversion in conversions:
        success = convert_yaml_to_js(
            conversion["yaml_file"],
            conversion["js_file"],
            conversion["var_name"]
        )
        if success:
            success_count += 1
    
    print("=" * 60)
    print(f"✅ Завершено. Успешно конвертировано: {success_count}/{len(conversions)} файлов")
    
    if success_count == len(conversions):
        print("\n🎉 Все файлы успешно конвертированы!")
        print("Теперь вы можете использовать обновленные JavaScript файлы в вашем проекте.")
    else:
        print("\n⚠️ Некоторые файлы не были конвертированы. Проверьте ошибки выше.")

if __name__ == "__main__":
    main()
