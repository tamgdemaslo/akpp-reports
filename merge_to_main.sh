#!/bin/bash

# Скрипт для слияния main-production в main

set -e

echo "🔄 Слияние main-production в main"
echo ""

# Проверка текущей ветки
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Текущая ветка: $CURRENT_BRANCH"
echo ""

# Переключиться на main
echo "🌿 Переключение на main..."
git checkout main

# Обновить main с удаленного репозитория
echo "📥 Обновление main с GitHub..."
git pull origin main

# Смержить main-production в main
echo "🔀 Слияние main-production в main..."
git merge main-production --no-edit

# Отправить на GitHub
echo ""
echo "🚀 Отправка на GitHub..."
git push origin main

echo ""
echo "✅ Готово! main-production смержен в main"
echo ""
echo "📝 Теперь в Railway можно использовать ветку 'main' для деплоя"
