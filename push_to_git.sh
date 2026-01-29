#!/bin/bash

cd "$(dirname "$0")"

echo "🔍 Проверка статуса Git..."
git status

echo ""
echo "📦 Добавление всех изменений..."
git add -A

echo ""
echo "📋 Статус после добавления:"
git status --short

echo ""
echo "💾 Создание коммита..."
git commit -m "fix: создан AKPP_725_0.js с ключом AKPP_MERCEDES_725_0 для единообразия"

echo ""
echo "🚀 Отправка в GitHub..."
git push origin main-production

echo ""
echo "✅ Готово! Проверьте статус:"
git status
