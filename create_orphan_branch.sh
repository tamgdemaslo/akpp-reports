#!/bin/bash

# Создание полностью новой ветки без истории (orphan branch)

set -e

echo "🌿 Создание новой ветки БЕЗ истории (orphan branch)"
echo ""

# Проверка
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    exit 1
fi

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Текущая ветка: $CURRENT_BRANCH"
echo ""

read -p "Создать новую ветку main-production БЕЗ истории? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
fi

# Создаем orphan ветку (без истории)
echo ""
echo "🌿 Создание orphan ветки..."
git checkout --orphan main-production

# Удаляем все файлы из индекса
echo "🧹 Очистка индекса..."
git rm -rf . --cached 2>/dev/null || true

# Добавляем все файлы заново
echo "📦 Добавление всех файлов..."
git add .

# Проверяем секреты
echo ""
echo "🔍 Проверка на секреты..."
if grep -r "sk-proj-\|ghp_" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | grep -v "placeholder\|example"; then
    echo "⚠️  ВНИМАНИЕ: Найдены секреты в файлах!"
    echo "Исправьте их перед коммитом."
    exit 1
fi

echo "✅ Секреты не найдены"
echo ""

# Создаем первый коммит
echo "💾 Создание первого коммита..."
git commit -m "feat: полная версия проекта

- Генератор отчетов АКПП
- База данных коробок передач
- Редактор АКПП
- Поддержка узловых схем и важных точек
- Готово к деплою на Railway
- Все секреты используют переменные окружения"

echo ""
echo "✅ Новая ветка создана БЕЗ истории!"
echo ""
echo "🚀 Отправка на GitHub..."
if git push -u origin main-production; then
    echo ""
    echo "✅ Успешно отправлено на GitHub!"
    echo ""
    echo "📝 Следующие шаги:"
    echo "   1. Откройте https://railway.app"
    echo "   2. Создайте проект из GitHub репозитория"
    echo "   3. Выберите ветку 'main-production'"
    echo "   4. Добавьте переменные окружения:"
    echo "      - OPENAI_API_KEY"
    echo "      - PARTS_API_KEY"
else
    echo ""
    echo "⚠️  Ошибка при отправке"
    echo "Попробуйте: git push -u origin main-production --force"
fi
