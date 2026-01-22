#!/bin/bash

# Скрипт для исправления аутентификации GitHub

set -e

echo "🔐 Исправление аутентификации GitHub"
echo ""

# Проверка SSH ключа
if [ ! -f ~/.ssh/id_ed25519.pub ]; then
    echo "❌ SSH ключ не найден. Создаю новый..."
    ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH ключ создан"
fi

# Показываем публичный ключ
echo "📋 Ваш публичный SSH ключ:"
echo "---"
cat ~/.ssh/id_ed25519.pub
echo "---"
echo ""

# Проверяем добавлен ли ключ на GitHub
echo "🔍 Проверка подключения к GitHub..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH ключ уже добавлен на GitHub!"
else
    echo "⚠️  SSH ключ не добавлен на GitHub или не работает"
    echo ""
    echo "📝 Инструкция:"
    echo "1. Скопируйте ключ выше (весь вывод от 'ssh-ed25519' до конца)"
    echo "2. Откройте https://github.com/settings/keys"
    echo "3. Нажмите 'New SSH key'"
    echo "4. Вставьте ключ и сохраните"
    echo ""
    read -p "Нажмите Enter после добавления ключа на GitHub..."
fi

# Удаляем старый remote с токеном
echo ""
echo "🔄 Обновление remote URL..."
git remote remove origin 2>/dev/null || true

# Добавляем новый remote с SSH
echo "📡 Добавление SSH remote..."
git remote add origin git@github.com:tamgdemaslo/akpp-reports.git

# Проверяем
echo ""
echo "✅ Remote обновлен:"
git remote -v

echo ""
echo "🧪 Тестирование подключения..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH подключение работает!"
    echo ""
    echo "🚀 Теперь можно отправить код:"
    echo "   git push -u origin 2026-01-22-dv4h"
else
    echo "⚠️  SSH подключение не работает. Убедитесь что ключ добавлен на GitHub."
fi
