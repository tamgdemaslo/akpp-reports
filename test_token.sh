#!/bin/bash

# Тест токена GitHub
TOKEN="ghp_PlbJpvM4BXj3h7xPRWDKN7Pz8IsvMz2Y5OX"

echo "🧪 Тестирую токен GitHub..."
echo ""

# Тест 1: Проверка длины
TOKEN_LENGTH=${#TOKEN}
echo "Длина токена: $TOKEN_LENGTH символов"
if [ $TOKEN_LENGTH -lt 40 ]; then
    echo "❌ Токен слишком короткий (должен быть ~40+ символов)"
else
    echo "✅ Длина токена нормальная"
fi

# Тест 2: Проверка формата
if [[ "$TOKEN" =~ ^ghp_ ]]; then
    echo "✅ Формат токена правильный (начинается с ghp_)"
else
    echo "❌ Неправильный формат токена"
fi

# Тест 3: Проверка через API
echo ""
echo "Проверяю токен через GitHub API..."
RESPONSE=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user)

if echo "$RESPONSE" | grep -q '"login"'; then
    USERNAME=$(echo "$RESPONSE" | grep '"login"' | head -1 | cut -d'"' -f4)
    echo "✅ Токен работает! Пользователь: $USERNAME"
else
    echo "❌ Токен не работает или истёк"
    echo "Ответ API:"
    echo "$RESPONSE" | head -5
fi

# Тест 4: Проверка прав на репозиторий
echo ""
echo "Проверяю права на репозиторий..."
REPO_RESPONSE=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/repos/tamgdemaslo/akpp-reports)

if echo "$REPO_RESPONSE" | grep -q '"full_name"'; then
    echo "✅ Доступ к репозиторию есть"
else
    echo "❌ Нет доступа к репозиторию или репозиторий не найден"
fi
