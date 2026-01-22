#!/bin/bash

# Скрипт для исправления секретов и отправки на GitHub

set -e

echo "🔐 Исправление секретов и отправка на GitHub"
echo ""

# Проверка
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    exit 1
fi

echo "✅ Файлы исправлены:"
echo "   - vin_backend.py: секреты заменены на переменные окружения"
echo "   - .github/workflows/deploy.yml: токен заменен на secrets.GITHUB_TOKEN"
echo ""

# Добавляем исправленные файлы
echo "📦 Добавление исправленных файлов..."
git add vin_backend.py .github/workflows/deploy.yml .gitignore

# Проверяем статус
echo ""
echo "📋 Статус изменений:"
git status --short

echo ""
read -p "Создать коммит и отправить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
fi

# Создаем коммит
echo ""
echo "💾 Создание коммита..."
git commit -m "fix: удалены секреты из кода, заменены на переменные окружения

- OpenAI API Key заменен на переменную окружения в vin_backend.py
- GitHub Token заменен на secrets.GITHUB_TOKEN в deploy.yml
- Обновлен .gitignore для исключения файлов с секретами"

echo "✅ Коммит создан"
echo ""

# Пробуем отправить
echo "🚀 Отправка на GitHub..."
if git push origin 2026-01-22-dv4h; then
    echo ""
    echo "✅ Успешно отправлено на GitHub!"
    echo ""
    echo "📝 Следующие шаги:"
    echo "   1. Откройте https://railway.app"
    echo "   2. Создайте новый проект из GitHub репозитория"
    echo "   3. Добавьте переменные окружения в Railway:"
    echo "      - OPENAI_API_KEY"
    echo "      - PARTS_API_KEY"
else
    echo ""
    echo "⚠️  GitHub все еще блокирует push (секреты в старых коммитах)"
    echo ""
    echo "📝 Решения:"
    echo ""
    echo "Вариант 1: Создать новую чистую ветку"
    echo "   git checkout -b main-clean"
    echo "   git push -u origin main-clean"
    echo ""
    echo "Вариант 2: Временно разрешить секреты"
    echo "   Откройте ссылки из ошибки выше и нажмите 'Allow secret'"
    echo ""
    echo "Подробнее: QUICK_FIX_SECRETS.md"
fi
