#!/usr/bin/env python3
import re

def fix_html_entities(content):
    """Исправляет HTML-entities в содержимом"""
    # Исправляем HTML-entities
    content = content.replace('&lt;', '<')
    content = content.replace('&gt;', '>')
    content = content.replace('&amp;', '&')
    content = content.replace('&times;', '×')
    content = content.replace('&quot;', '"')
    content = content.replace('&apos;', "'")
    content = content.replace('&nbsp;', ' ')
    
    # Исправляем неправильные HTML-entities в строках типа &#x003c; (которые отображаются как \u003c)
    content = re.sub(r'\\u003c', '<', content)
    content = re.sub(r'\\u003e', '>', content)
    content = re.sub(r'\\u0026', '&', content)
    
    return content

# Читаем файл
with open('akpp_generator_unified.html', 'r', encoding='utf-8') as file:
    content = file.read()

# Исправляем HTML-entities
fixed_content = fix_html_entities(content)

# Записываем обратно
with open('akpp_generator_unified.html', 'w', encoding='utf-8') as file:
    file.write(fixed_content)

print("HTML-entities исправлены!")
