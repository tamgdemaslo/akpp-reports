#!/bin/bash

cd "$(dirname "$0")"

echo "🔧 Исправление коммита: удаление .github_token..."

# Отменить последний коммит, но сохранить изменения
git reset --soft HEAD~1

# Удалить .github_token из индекса
git reset HEAD .github_token 2>/dev/null || true

# Убедиться, что .github_token в .gitignore
if ! grep -q "^\.github_token$" .gitignore; then
    echo ".github_token" >> .gitignore
fi

# Добавить все изменения кроме .github_token
git add -A
git reset HEAD .github_token

echo ""
echo "📋 Статус после исправления:"
git status --short

echo ""
echo "💾 Создание нового коммита без токена..."
git commit -m "fix: создан AKPP_725_0.js с ключом AKPP_MERCEDES_725_0 для единообразия"

echo ""
echo "🚀 Отправка в GitHub..."
git push origin main-production

echo ""
echo "✅ Готово!"
