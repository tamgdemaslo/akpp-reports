#!/bin/bash

cd '/Users/ilaeliseenko/Desktop/ТГМ софт/akpp-generator'

echo "📦 Добавление Dockerfile и .dockerignore..."
git add Dockerfile .dockerignore

echo ""
echo "📋 Статус:"
git status --short | head -10

echo ""
echo "💾 Создание коммита..."
git commit -m "fix: добавлен Dockerfile для Railway"

echo ""
echo "🚀 Отправка на GitHub..."
git push origin main-production

echo ""
echo "✅ Готово!"
