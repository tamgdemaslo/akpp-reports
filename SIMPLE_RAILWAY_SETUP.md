# 🚂 Простая настройка Railway

## Что нужно

1. **Dockerfile** - уже создан ✅
2. **package.json** - уже настроен ✅
3. **server.js** - использует `process.env.PORT` ✅

## Настройка в Railway

### Шаг 1: Переключить на Dockerfile

1. Откройте проект в Railway
2. **Settings → Service**
3. Найдите **"Builder"** или **"Build & Deploy"**
4. Выберите **"Dockerfile"** (или "Docker")
5. **Build Command** - оставьте ПУСТЫМ
6. **Start Command** - оставьте ПУСТЫМ
7. Сохраните

### Шаг 2: Пересобрать

1. **Deployments → Redeploy**
2. Railway использует Dockerfile
3. Должно работать!

## Если нет опции Dockerfile

Отправьте изменения на GitHub:

```bash
git add Dockerfile .dockerignore package.json
git commit -m "fix: простая конфигурация для Railway"
git push origin main-production
```

Railway автоматически обнаружит Dockerfile.

## Проверка

После успешного деплоя:
- `https://your-project.up.railway.app/` - главная страница
- `https://your-project.up.railway.app/status` - статус сервера

## Что делает Dockerfile

1. Использует Node.js 18
2. Устанавливает зависимости
3. Копирует файлы
4. Запускает `npm start` → `node server.js`

Всё просто! 🎉
