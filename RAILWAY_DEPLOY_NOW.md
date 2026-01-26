# 🚂 Деплой на Railway - Пошаговая инструкция

## ✅ Шаг 1: Проект на GitHub готов!

Ветка `main-production` успешно отправлена на GitHub:
- ✅ Без секретов в истории
- ✅ Все файлы на месте
- ✅ Готово к деплою

## 🚀 Шаг 2: Деплой на Railway

### 2.1. Создание проекта

1. **Откройте https://railway.app**
2. **Войдите через GitHub** (используйте тот же аккаунт)
3. **Нажмите "New Project"**
4. **Выберите "Deploy from GitHub repo"**
5. **Выберите репозиторий:** `tamgdemaslo/akpp-reports`
6. **Выберите ветку:** `main-production`

### 2.2. Railway автоматически:

- ✅ Определит Node.js проект по `package.json`
- ✅ Установит зависимости (`npm install`)
- ✅ Запустит `npm start` (который запускает `server.js`)
- ✅ Назначит порт через переменную `PORT`

### 2.3. Проверка деплоя

После деплоя Railway предоставит URL вида:
```
https://your-project-name.up.railway.app
```

Проверьте:
- **Главная страница:** `https://your-project-name.up.railway.app/`
- **Статус сервера:** `https://your-project-name.up.railway.app/status`

## 🔐 Шаг 3: Переменные окружения

Если ваш проект использует `vin_backend.py` или другие сервисы, добавьте переменные:

1. В проекте Railway перейдите в **Variables**
2. Добавьте переменные:
   - `OPENAI_API_KEY` = ваш ключ OpenAI (если используется)
   - `PARTS_API_KEY` = ваш ключ Parts API (если используется)
   - `NODE_ENV` = `production` (опционально)

## 📝 Шаг 4: Настройка домена (опционально)

1. Перейдите в **Settings** → **Domains**
2. Railway предоставит бесплатный домен вида:
   ```
   https://your-project-name.up.railway.app
   ```
3. Для кастомного домена:
   - Нажмите **Add Domain**
   - Введите ваш домен
   - Настройте DNS записи согласно инструкциям

## 🔄 Обновление проекта

После изменений в коде:

```bash
# 1. Внести изменения
git add .
git commit -m "Описание изменений"

# 2. Отправить на GitHub
git push origin main-production

# 3. Railway автоматически пересоберет и задеплоит!
```

## 📊 Мониторинг

Railway предоставляет:
- **Логи в реальном времени** - в разделе Deployments
- **Метрики использования** - CPU, память, сеть
- **Автоматические перезапуски** при ошибках

## 🎉 Готово!

Ваш проект теперь доступен онлайн на Railway!

---

**Ссылки:**
- GitHub репозиторий: https://github.com/tamgdemaslo/akpp-reports
- Ветка: `main-production`
- Railway: https://railway.app
