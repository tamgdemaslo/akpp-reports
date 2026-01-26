# 🔧 Исправление проблемы с snapshot в Railway

## Проблема
Railway не может найти Dockerfile, хотя он есть на GitHub. Ошибка:
```
couldn't locate the dockerfile at path Dockerfile in code archive
```

## Причина
Railway использует старый snapshot (23 kB) который не содержит Dockerfile.

## ✅ Решение

### Вариант 1: Пересобрать проект в Railway

1. **В Railway перейдите в Deployments**
2. **Нажмите "Redeploy"** или **"Deploy"**
3. Railway должен загрузить новый snapshot с Dockerfile

### Вариант 2: Сделать новый коммит

Создайте новый коммит (даже пустой) чтобы Railway обновил snapshot:

```bash
# Создать пустой коммит
git commit --allow-empty -m "trigger: обновление snapshot для Railway"

# Отправить
git push origin main-production
```

### Вариант 3: Проверить что Dockerfile в правильной ветке

Убедитесь что вы деплоите правильную ветку:
- В Railway проверьте что выбрана ветка **`main-production`**
- Dockerfile должен быть в этой ветке

## Проверка

После пересборки в логах Railway должно быть:
- ✅ `FROM node:18-alpine`
- ✅ `npm install` выполняется
- ✅ `npm start` запускает сервер
- ❌ НЕ должно быть "couldn't locate the dockerfile"

## Если не помогает

1. В Railway: **Settings → Service**
2. Убедитесь что **"Dockerfile Path"** = `Dockerfile`
3. Убедитесь что **Builder** = `Dockerfile`
4. Попробуйте указать полный путь: `./Dockerfile`
