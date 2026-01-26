# 🔧 Исправление проблемы с Railway

## Проблема
Railway не может определить тип проекта (Railpack не находит Node.js).

## Решение

### Вариант 1: Настройка через веб-интерфейс Railway (рекомендуется)

1. Откройте ваш проект в Railway
2. Перейдите в **Settings** → **Service**
3. В разделе **Build Command** укажите:
   ```
   npm install
   ```
4. В разделе **Start Command** укажите:
   ```
   npm start
   ```
5. В разделе **Nixpacks Builder** выберите:
   - Или оставьте по умолчанию
   - Или выберите "Nixpacks" (старый билдер)

### Вариант 2: Использовать nixpacks.toml

Файл `nixpacks.toml` уже создан. Нужно отправить его на GitHub:

```bash
git add nixpacks.toml railway.json
git commit -m "fix: добавлена конфигурация для Railway"
git push origin main-production
```

Railway автоматически пересоберет проект.

### Вариант 3: Проверить что package.json в корне

Убедитесь что `package.json` находится в корне проекта (не в подпапке).

## Проверка

После применения исправлений Railway должен:
1. ✅ Определить Node.js проект
2. ✅ Установить зависимости (`npm install`)
3. ✅ Запустить сервер (`npm start`)

## Логи

Если проблема сохраняется, проверьте логи в Railway:
- Перейдите в **Deployments**
- Выберите последний деплой
- Посмотрите логи сборки

## Альтернатива: Использовать Dockerfile

Если ничего не помогает, можно создать Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Но обычно `nixpacks.toml` или настройки через веб-интерфейс должны помочь.
