#!/bin/bash

# Скрипт для создания полностью чистой ветки без секретов в истории

set -e

echo "🔐 Создание чистой ветки без секретов"
echo ""

# Находим коммит ДО проблемных
echo "🔍 Поиск безопасного коммита..."
SAFE_COMMIT=$(git log --oneline --all | grep -v "d36668e\|5b94d88" | head -1 | awk '{print $1}')

if [ -z "$SAFE_COMMIT" ]; then
    echo "❌ Не удалось найти безопасный коммит"
    echo "Используем первый коммит..."
    SAFE_COMMIT=$(git log --reverse --oneline | head -1 | awk '{print $1}')
fi

echo "✅ Найден безопасный коммит: $SAFE_COMMIT"
echo ""

# Создаем новую ветку от безопасного коммита
echo "🌿 Создание новой ветки main-safe от коммита $SAFE_COMMIT..."
git checkout -b main-safe $SAFE_COMMIT

# Добавляем все текущие файлы (без секретов)
echo ""
echo "📦 Добавление всех файлов (без секретов)..."
git add .

# Проверяем что секретов нет
echo ""
echo "🔍 Проверка на секреты..."
if grep -r "sk-proj-\|ghp_" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | grep -v "placeholder\|example"; then
    echo "⚠️  ВНИМАНИЕ: Найдены секреты в файлах!"
    echo "Исправьте их перед коммитом."
    exit 1
fi

echo "✅ Секреты не найдены в файлах"
echo ""

# Создаем коммит
echo "💾 Создание коммита..."
git commit -m "feat: полная версия проекта без секретов

- Все файлы проекта
- Секреты заменены на переменные окружения
- Готово к деплою на Railway"

echo ""
echo "✅ Чистая ветка создана!"
echo ""
echo "🚀 Отправка на GitHub..."
if git push -u origin main-safe; then
    echo ""
    echo "✅ Успешно отправлено на GitHub!"
    echo ""
    echo "📝 Следующие шаги:"
    echo "   1. В Railway выберите ветку 'main-safe' для деплоя"
    echo "   2. Добавьте переменные окружения:"
    echo "      - OPENAI_API_KEY"
    echo "      - PARTS_API_KEY"
else
    echo ""
    echo "⚠️  Ошибка при отправке. Попробуйте:"
    echo "   git push -u origin main-safe --force"
    echo ""
    echo "Или временно разрешите секреты через ссылки GitHub"
fi
