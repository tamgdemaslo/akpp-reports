# 🔀 Слияние main-production в main

## Проблема
В ветке `main` на GitHub только HTML отчеты, а весь проект в `main-production`.

## Решение: Смержить main-production в main

### Вариант 1: Автоматический скрипт

```bash
./merge_to_main.sh
```

### Вариант 2: Вручную

```bash
# 1. Переключиться на main
git checkout main

# 2. Обновить main
git pull origin main

# 3. Смержить main-production
git merge main-production --no-edit

# 4. Отправить на GitHub
git push origin main
```

## После слияния

1. **В Railway измените ветку на `main`**:
   - Settings → Service
   - Измените Branch с `main-production` на `main`

2. **Пересоберите проект**

Теперь Railway будет использовать ветку `main` с полным проектом и Dockerfile.
