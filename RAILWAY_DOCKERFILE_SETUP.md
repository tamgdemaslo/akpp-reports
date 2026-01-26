# 🐳 Настройка Railway для использования Dockerfile

## Проблема
Railway использует Railpack, который не может найти npm. Нужно переключиться на Dockerfile.

## ✅ Решение: Использовать Dockerfile

### Шаг 1: В веб-интерфейсе Railway

1. **Откройте ваш проект в Railway**
2. **Перейдите в Settings → Service**
3. **Найдите раздел "Build & Deploy"** или **"Builder"**
4. **Измените Builder на "Dockerfile"** (или "Docker")
5. **Оставьте Build Command ПУСТЫМ** (Dockerfile сам управляет сборкой)
6. **Оставьте Start Command ПУСТЫМ** (Dockerfile сам управляет запуском)
7. **Сохраните изменения**

### Шаг 2: Пересобрать проект

1. **Перейдите в Deployments**
2. **Нажмите "Redeploy"** или **"Deploy"**
3. Railway автоматически использует Dockerfile

### Шаг 3: Проверка

После успешного деплоя проверьте:
- Главная страница: `https://your-project.up.railway.app/`
- Статус: `https://your-project.up.railway.app/status`

## Альтернатива: Если нет опции Dockerfile

Если в настройках нет опции "Dockerfile", попробуйте:

1. **Удалите или переименуйте `nixpacks.toml`** (чтобы Railway не использовал Railpack)
2. **Railway должен автоматически обнаружить Dockerfile**

Или отправьте изменения:

```bash
# Удалить nixpacks.toml (опционально)
git rm nixpacks.toml

# Добавить Dockerfile и .dockerignore
git add Dockerfile .dockerignore

# Отправить
git commit -m "fix: переключение на Dockerfile для Railway"
git push origin main-production
```

## Что делает Dockerfile

1. ✅ Использует образ `node:18-alpine` (Node.js 18)
2. ✅ Устанавливает зависимости через `npm install`
3. ✅ Копирует все файлы проекта
4. ✅ Запускает `npm start` (который запускает `server.js`)

## Проверка логов

После пересборки проверьте логи:
- Должно быть: `npm install` выполняется успешно
- Должно быть: `npm start` запускает сервер
- Не должно быть: `npm: not found`

## Если проблема сохраняется

1. Проверьте что Dockerfile находится в корне проекта
2. Проверьте логи сборки в Railway
3. Убедитесь что Builder установлен на "Dockerfile"
