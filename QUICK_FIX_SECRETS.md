# ⚡ Быстрое исправление секретов

## Проблема
GitHub заблокировал push из-за секретов в истории коммитов.

## Решение (2 минуты)

### Шаг 1: Исправленные файлы уже готовы ✅

- ✅ `vin_backend.py` - секреты заменены на переменные окружения
- ✅ `.github/workflows/deploy.yml` - токен заменен на `${{ secrets.GITHUB_TOKEN }}`

### Шаг 2: Создать коммит с исправлениями

```bash
# Добавить исправленные файлы
git add vin_backend.py .github/workflows/deploy.yml .gitignore

# Создать коммит
git commit -m "fix: удалены секреты, заменены на переменные окружения"

# Отправить
git push origin 2026-01-22-dv4h
```

### Шаг 3: Если GitHub все еще блокирует

Секреты остались в старых коммитах. Варианты:

#### Вариант A: Разрешить временно (не рекомендуется)
Откройте ссылки из ошибки и нажмите "Allow secret"

#### Вариант B: Создать новую чистую ветку (рекомендуется)

```bash
# Создать новую ветку
git checkout -b main-clean

# Добавить только исправленные файлы
git add vin_backend.py .github/workflows/deploy.yml .gitignore
git commit -m "fix: удалены секреты из кода"

# Отправить новую ветку
git push -u origin main-clean

# В Railway выбрать ветку main-clean для деплоя
```

## Автоматический скрипт

Или просто запустите:
```bash
./remove_secrets_from_history.sh
```

## Переменные окружения для Railway

После деплоя добавьте в Railway → Variables:
- `OPENAI_API_KEY` = ваш ключ OpenAI
- `PARTS_API_KEY` = ваш ключ Parts API
