# 🚀 Деплой проекта на GitHub и Railway

## Шаг 1: Подготовка к выгрузке на GitHub

### 1.1. Проверка текущего состояния

```bash
# Проверить статус
git status

# Посмотреть все изменения
git diff
```

### 1.2. Добавление всех изменений

```bash
# Добавить все файлы (кроме игнорируемых)
git add .

# Или добавить конкретные файлы
git add akpp_generator_unified.html
git add gearbox_files/
git add server.js
git add package.json
git add railway.json
```

### 1.3. Создание коммита

```bash
# Создать коммит с описанием изменений
git commit -m "feat: добавлено поле 'Узловые схемы и важные точки', подготовка к деплою на Railway"
```

### 1.4. Проверка remote репозитория

```bash
# Проверить существующие remote
git remote -v

# Если remote нет, добавить:
git remote add origin https://github.com/tamgdemaslo/akpp-generator.git

# Или если нужно изменить URL:
git remote set-url origin https://github.com/tamgdemaslo/akpp-generator.git
```

### 1.5. Выгрузка на GitHub

```bash
# Если это первый push:
git push -u origin main

# Или если ветка называется по-другому:
git push -u origin 2026-01-22-dv4h

# Для последующих обновлений:
git push origin main
```

## Шаг 2: Деплой на Railway

### 2.1. Создание аккаунта и проекта

1. Перейдите на https://railway.app
2. Войдите через GitHub (используйте тот же аккаунт, что и для репозитория)
3. Нажмите **"New Project"**
4. Выберите **"Deploy from GitHub repo"**
5. Выберите репозиторий `akpp-generator`

### 2.2. Автоматическая настройка

Railway автоматически:
- ✅ Определит Node.js проект по `package.json`
- ✅ Установит зависимости (`npm install`)
- ✅ Запустит `npm start` (который запускает `server.js`)
- ✅ Назначит порт через переменную окружения `PORT`

### 2.3. Проверка деплоя

После деплоя Railway предоставит URL вида:
```
https://your-project-name.up.railway.app
```

Проверьте:
- Главная страница: `https://your-project-name.up.railway.app/`
- Статус сервера: `https://your-project-name.up.railway.app/status`

### 2.4. Настройка переменных окружения (опционально)

Если нужны дополнительные переменные:

1. В проекте Railway перейдите в **Variables**
2. Добавьте переменные:
   - `NODE_ENV=production` (для production режима)
   - Другие переменные по необходимости

## Шаг 3: Обновление проекта

### 3.1. Локальные изменения

```bash
# Внести изменения в код
# ...

# Добавить изменения
git add .

# Создать коммит
git commit -m "Описание изменений"

# Отправить на GitHub
git push origin main
```

### 3.2. Автоматический деплой

Railway автоматически:
- ✅ Обнаружит новый коммит
- ✅ Пересоберет проект
- ✅ Задеплоит новую версию
- ✅ Перезапустит сервер

## Структура проекта для Railway

```
akpp-generator/
├── package.json          # Зависимости и скрипты
├── server.js             # Express сервер
├── railway.json          # Конфигурация Railway (опционально)
├── .gitignore           # Игнорируемые файлы
├── akpp_generator_unified.html  # Главная страница
├── gearbox_files/       # Файлы данных АКПП
└── images/              # Изображения
```

## Важные файлы

### `package.json`
- `start` script запускает `server.js`
- Зависимости: express, cors, node-fetch
- Node.js версия: >=16.0.0

### `server.js`
- Использует `process.env.PORT` (Railway устанавливает автоматически)
- Отдает статические файлы
- Прокси для Rossko API
- Обновляет индекс gearbox_files при запуске

### `railway.json`
- Конфигурация для Railway (опционально)
- Указывает builder и start command

## Мониторинг и логи

### Просмотр логов

1. В проекте Railway перейдите в **Deployments**
2. Выберите последний деплой
3. Нажмите **View Logs**

### Метрики

Railway предоставляет:
- Использование CPU и памяти
- Сетевой трафик
- Время ответа

## Проблемы и решения

### Проблема: Порт не определен

**Решение:** Railway автоматически устанавливает `PORT`. Убедитесь что `server.js` использует:
```javascript
const PORT = process.env.PORT || 3000;
```

### Проблема: Зависимости не установлены

**Решение:** Проверьте `package.json` содержит все зависимости:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-fetch": "^2.7.0"
  }
}
```

### Проблема: Статические файлы не отдаются

**Решение:** Убедитесь что `server.js` содержит:
```javascript
app.use(express.static(__dirname));
```

### Проблема: Сервер не запускается

**Решение:**
1. Проверьте логи в Railway
2. Убедитесь что `package.json` имеет правильный `start` script
3. Проверьте что все зависимости установлены

## Домены

### Бесплатный домен Railway

Railway предоставляет бесплатный домен вида:
```
https://your-project-name.up.railway.app
```

### Кастомный домен

1. Перейдите в **Settings** → **Domains**
2. Нажмите **Add Domain**
3. Введите ваш домен
4. Настройте DNS записи согласно инструкциям Railway

## Безопасность

### Переменные окружения

Не храните секреты в коде! Используйте переменные окружения Railway:
1. Перейдите в **Variables**
2. Добавьте переменные (они будут доступны как `process.env.VARIABLE_NAME`)

### CORS

CORS уже настроен в `server.js`:
```javascript
app.use(cors());
```

## Резервное копирование

Railway автоматически создает резервные копии при каждом деплое. Для ручного бэкапа:
1. Экспортируйте данные из Railway
2. Или используйте GitHub как основной источник истины

## Стоимость

Railway предоставляет:
- **Бесплатный план:** $5 кредитов в месяц
- **Pro план:** $20/месяц с большим количеством ресурсов

Для этого проекта бесплатного плана должно быть достаточно.

## Поддержка

- Railway документация: https://docs.railway.app
- GitHub Issues: для проблем с кодом
- Railway Support: для проблем с платформой

---

**Готово!** Ваш проект теперь доступен на Railway! 🎉
