# 🔐 Исправление секретов в репозитории

GitHub заблокировал push из-за обнаруженных секретов в истории коммитов.

## Обнаруженные секреты:

1. **OpenAI API Key** в `vin_backend.py:19` (коммит d36668e)
2. **GitHub Personal Access Token** в `.github/workflows/deploy.yml:23` (коммит 5b94d88)

## Решение

### Шаг 1: Исправление vin_backend.py ✅

Файл уже исправлен - секреты заменены на переменные окружения:
```python
PARTS_API_KEY = os.getenv("PARTS_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
```

### Шаг 2: Удаление секретов из истории

Нужно удалить секреты из истории коммитов. Есть два варианта:

#### Вариант A: Создать новый коммит без секретов (проще)

```bash
# 1. Добавить исправленные файлы
git add vin_backend.py .gitignore

# 2. Создать новый коммит
git commit -m "fix: удалены секреты, заменены на переменные окружения"

# 3. Попробовать push снова
git push origin 2026-01-22-dv4h
```

Если GitHub все еще блокирует (секреты в старых коммитах), используйте Вариант B.

#### Вариант B: Удалить секреты из истории (более сложно)

```bash
# 1. Использовать git filter-branch или BFG Repo-Cleaner
# 2. Или создать новую ветку без проблемных коммитов
git checkout -b main-clean
git cherry-pick <commit-before-secrets>
# ... и т.д.
```

### Шаг 3: Разрешить секреты на GitHub (временное решение)

Если нужно срочно задеплоить, можно временно разрешить секреты:

1. Откройте ссылки из ошибки:
   - OpenAI: https://github.com/tamgdemaslo/akpp-reports/security/secret-scanning/unblock-secret/38cmBiVyGIM3ODajdIlN5axBsg9
   - GitHub Token: https://github.com/tamgdemaslo/akpp-reports/security/secret-scanning/unblock-secret/38cmBk5syTTmhtjYsOD4vWdDDq6

2. Нажмите "Allow secret" (но это не рекомендуется!)

### Шаг 4: Правильное решение - использовать переменные окружения

Для `vin_backend.py`:
```python
# Вместо хардкода:
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
```

Для Railway:
1. Перейдите в проект Railway → Variables
2. Добавьте:
   - `OPENAI_API_KEY=ваш_ключ`
   - `PARTS_API_KEY=ваш_ключ`

## Рекомендация

**Лучше всего:** Создать новую чистую ветку без секретов:

```bash
# 1. Создать новую ветку от последнего коммита без секретов
git checkout -b main-clean

# 2. Добавить только исправленные файлы
git add vin_backend.py .gitignore
git commit -m "fix: удалены секреты из кода"

# 3. Отправить новую ветку
git push -u origin main-clean

# 4. В Railway выбрать ветку main-clean для деплоя
```

## Проверка перед push

```bash
# Проверить что секреты удалены
grep -r "sk-proj-" . --exclude-dir=node_modules
grep -r "ghp_" . --exclude-dir=node_modules

# Если ничего не найдено - можно пушить
```
