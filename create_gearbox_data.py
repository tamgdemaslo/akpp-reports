#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для создания полного файла gearbox_data.js из YAML файла
"""

import yaml
import json
import os

def load_yaml_file(file_path):
    """Загрузка YAML файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except FileNotFoundError:
        print(f"❌ Файл {file_path} не найден")
        return None
    except yaml.YAMLError as e:
        print(f"❌ Ошибка при чтении YAML файла: {e}")
        return None

def create_gearbox_data_js(yaml_data, output_file):
    """Создание JavaScript файла с данными коробок для инструкций"""
    
    js_content = '''// Автоматически сгенерированный файл из gearbox_data.yaml
// Данные коробок передач для генерации инструкций
window.gearboxData = '''
    
    # Добавляем данные в формате JSON
    js_content += json.dumps(yaml_data, ensure_ascii=False, indent=4)
    js_content += ';'
    
    # Записываем в файл
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write(js_content)
        print(f"✅ Файл {output_file} успешно создан")
        return True
    except Exception as e:
        print(f"❌ Ошибка при создании файла: {e}")
        return False

def main():
    """Основная функция"""
    print("🔄 Создание файла gearbox_data.js...")
    print("=" * 60)
    
    # Пути к файлам
    yaml_file = "/Users/ilaeliseenko/Desktop/akpp-generator/gearbox_data.yaml"
    output_file = "/Users/ilaeliseenko/Desktop/akpp-generator/gearbox_data.js"
    
    # Загружаем YAML файл
    yaml_data = load_yaml_file(yaml_file)
    
    if yaml_data is None:
        print("❌ Не удалось загрузить YAML файл")
        return
    
    # Проверяем структуру данных
    if 'gearboxes' not in yaml_data:
        print("❌ В YAML файле отсутствует секция 'gearboxes'")
        return
    
    # Создаем JavaScript файл
    success = create_gearbox_data_js(yaml_data['gearboxes'], output_file)
    
    if success:
        print("=" * 60)
        print("✅ Файл gearbox_data.js успешно создан!")
        print(f"📁 Количество коробок: {len(yaml_data['gearboxes'])}")
        print("🎉 Теперь вы можете использовать инструкции в вашем проекте!")
    else:
        print("❌ Ошибка при создании файла")

if __name__ == "__main__":
    main()
