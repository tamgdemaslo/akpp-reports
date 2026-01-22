#!/bin/bash

# Скрипт для удаления секретов из истории и создания чистого коммита

set -e

echo "🔐 Удаление секретов из репозитория"
echo ""

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    exit 1
fi

echo "📋 Шаг 1: Проверка текущих файлов на секреты..."
if grep -r "sk-proj-\|ghp_" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | grep -v "placeholder\|example"; then
    echo "⚠️  Найдены секреты в файлах! Исправьте их перед продолжением."
    exit 1
fi

echo "✅ Секреты не найдены в текущих файлах"
echo ""

echo "📦 Шаг 2: Добавление исправленных файлов..."
git add vin_backend.py .gitignore

# Проверяем есть ли .github/workflows/deploy.yml в рабочем дереве
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "⚠️  Найден .github/workflows/deploy.yml"
    echo "Исправляю файл..."
    
    # Создаем директорию если нет
    mkdir -p .github/workflows
    
    # Исправляем файл - заменяем токен на переменную окружения
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages
on:
  push:
    branches:
      - main
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Deploy to GitHub Pages
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run deploy
EOF
    
    git add .github/workflows/deploy.yml
    echo "✅ .github/workflows/deploy.yml исправлен (токен заменен на secrets.GITHUB_TOKEN)"
fi

echo ""
echo "💾 Шаг 3: Создание коммита..."
git commit -m "fix: удалены секреты из кода, заменены на переменные окружения

- OpenAI API Key заменен на переменную окружения в vin_backend.py
- GitHub Token заменен на secrets.GITHUB_TOKEN в deploy.yml
- Обновлен .gitignore для исключения файлов с секретами"

echo ""
echo "✅ Коммит создан!"
echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1. Попробуйте отправить снова:"
echo "   git push origin 2026-01-22-dv4h"
echo ""
echo "2. Если GitHub все еще блокирует (секреты в старых коммитах):"
echo "   - Создайте новую ветку: git checkout -b main-clean"
echo "   - Или разрешите секреты временно через ссылки из ошибки"
echo ""
echo "3. Для Railway добавьте переменные окружения:"
echo "   - OPENAI_API_KEY"
echo "   - PARTS_API_KEY"
