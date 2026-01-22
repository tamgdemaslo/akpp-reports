#!/bin/bash

# Скрипт для выгрузки проекта на GitHub и подготовки к деплою на Railway

set -e  # Остановка при ошибке

echo "🚀 Начинаем деплой проекта на GitHub и Railway"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Убедитесь что вы в корне проекта."
    exit 1
fi

echo -e "${YELLOW}📋 Шаг 1: Проверка статуса Git${NC}"
git status --short | head -10
echo ""

# Спрашиваем подтверждение
read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 1
fi

echo -e "${YELLOW}📦 Шаг 2: Добавление всех изменений${NC}"
git add .
echo "✅ Файлы добавлены"
echo ""

echo -e "${YELLOW}💾 Шаг 3: Создание коммита${NC}"
git commit -m "feat: добавлено поле 'Узловые схемы и важные точки', подготовка к деплою на Railway

- Добавлено поле diagrams в редактор АКПП
- Добавлена возможность редактирования из интерфейса
- Подготовлены файлы для деплоя на Railway (railway.json, инструкции)
- Обновлен package.json с repository URL
- Обновлен .gitignore
- Исправлены производители (Jatco, Toyota/Aisin, Ford/Mazda)
- Исправлено отображение AG4 в селекторе"
echo "✅ Коммит создан"
echo ""

# Получаем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}🚀 Шаг 4: Отправка на GitHub (ветка: $CURRENT_BRANCH)${NC}"
read -p "Отправить на GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin "$CURRENT_BRANCH"
    echo -e "${GREEN}✅ Проект отправлен на GitHub!${NC}"
else
    echo "⏭️  Пропущено. Вы можете отправить позже командой:"
    echo "   git push origin $CURRENT_BRANCH"
fi

echo ""
echo -e "${GREEN}✅ Подготовка завершена!${NC}"
echo ""
echo "📝 Следующие шаги для деплоя на Railway:"
echo "   1. Откройте https://railway.app"
echo "   2. Войдите через GitHub"
echo "   3. Нажмите 'New Project' → 'Deploy from GitHub repo'"
echo "   4. Выберите ваш репозиторий"
echo "   5. Railway автоматически задеплоит проект!"
echo ""
echo "📚 Подробная инструкция: DEPLOY_GITHUB_RAILWAY.md"
echo "⚡ Быстрый старт: QUICK_START.md"
