# 🚀 Инструкция по деплою

## Быстрый деплой (автоматический скрипт)

```bash
./deploy_to_github_railway.sh
```

Скрипт автоматически:
1. ✅ Проверит статус Git
2. ✅ Добавит все изменения
3. ✅ Создаст коммит
4. ✅ Отправит на GitHub

## Ручной деплой

### 1. Подготовка

```bash
# Добавить все файлы
git add .

# Создать коммит
git commit -m "feat: подготовка к деплою на Railway"
```

### 2. Выгрузка на GitHub

```bash
# Отправить на GitHub
git push origin 2026-01-22-dv4h

# Или в main ветку
git checkout -b main
git push -u origin main
```

### 3. Деплой на Railway

1. Откройте https://railway.app
2. Войдите через GitHub
3. Нажмите **"New Project"**
4. Выберите **"Deploy from GitHub repo"**
5. Выберите репозиторий
6. Railway автоматически задеплоит!

## Документация

- **QUICK_START.md** - Быстрый старт (5 минут)
- **DEPLOY_GITHUB_RAILWAY.md** - Подробная инструкция
- **RAILWAY_DEPLOY.md** - Специфика Railway

## Структура проекта

```
akpp-generator/
├── server.js              # Express сервер (запускается на Railway)
├── package.json           # Зависимости и скрипты
├── railway.json          # Конфигурация Railway
├── akpp_generator_unified.html  # Главная страница
└── gearbox_files/        # Данные АКПП
```

## Важно

- Railway автоматически определяет Node.js проект
- Порт устанавливается через `process.env.PORT`
- При каждом push в GitHub Railway автоматически передеплоит
