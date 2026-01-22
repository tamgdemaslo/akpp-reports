# ⚡ Быстрый старт: Деплой на GitHub и Railway

## 🎯 Цель
Выгрузить проект на GitHub и задеплоить на Railway за 5 минут.

## 📋 Шаг 1: Подготовка файлов

```bash
# Перейти в директорию проекта
cd '/Users/ilaeliseenko/Desktop/ТГМ софт/akpp-generator'

# Проверить статус
git status
```

## 📦 Шаг 2: Добавление всех изменений

```bash
# Добавить все файлы
git add .

# Проверить что добавлено
git status
```

## 💾 Шаг 3: Создание коммита

```bash
git commit -m "feat: добавлено поле 'Узловые схемы и важные точки', подготовка к деплою на Railway

- Добавлено поле diagrams в редактор АКПП
- Добавлена возможность редактирования из интерфейса
- Подготовлены файлы для деплоя на Railway
- Обновлен package.json с repository URL
- Добавлены конфигурационные файлы для Railway"
```

## 🚀 Шаг 4: Выгрузка на GitHub

```bash
# Отправить на GitHub (текущая ветка: 2026-01-22-dv4h)
git push origin 2026-01-22-dv4h

# Или если хотите в main:
git checkout -b main
git push -u origin main
```

## 🚂 Шаг 5: Деплой на Railway

1. **Откройте https://railway.app**
2. **Войдите через GitHub**
3. **Нажмите "New Project"**
4. **Выберите "Deploy from GitHub repo"**
5. **Выберите репозиторий** (akpp-reports или создайте новый akpp-generator)
6. **Railway автоматически задеплоит проект!**

## ✅ Проверка

После деплоя проверьте:
- Главная страница: `https://your-project.up.railway.app/`
- Статус: `https://your-project.up.railway.app/status`

## 📝 Примечания

- Railway автоматически определит Node.js проект
- Порт устанавливается автоматически через `process.env.PORT`
- Все зависимости установятся из `package.json`
- При каждом push в GitHub Railway автоматически передеплоит проект

## 🔧 Если что-то пошло не так

Смотрите подробную инструкцию в `DEPLOY_GITHUB_RAILWAY.md`
