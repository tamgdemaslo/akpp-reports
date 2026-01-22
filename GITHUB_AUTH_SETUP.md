# 🔐 Настройка аутентификации GitHub

## Проблема
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed
```

Это означает, что токен в URL устарел или был отозван.

## Решение 1: Использовать SSH (рекомендуется)

### Шаг 1: Проверить наличие SSH ключа

```bash
ls -la ~/.ssh/id_rsa.pub
```

Если файла нет, создайте ключ:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### Шаг 2: Добавить SSH ключ на GitHub

1. Скопируйте публичный ключ:
```bash
cat ~/.ssh/id_rsa.pub
```

2. Откройте https://github.com/settings/keys
3. Нажмите "New SSH key"
4. Вставьте ключ и сохраните

### Шаг 3: Изменить remote URL на SSH

```bash
# Удалить старый remote
git remote remove origin

# Добавить новый с SSH
git remote add origin git@github.com:tamgdemaslo/akpp-reports.git

# Или если репозиторий называется akpp-generator:
git remote add origin git@github.com:tamgdemaslo/akpp-generator.git

# Проверить
git remote -v
```

### Шаг 4: Отправить код

```bash
git push -u origin 2026-01-22-dv4h
```

## Решение 2: Использовать Personal Access Token (PAT)

### Шаг 1: Создать новый токен на GitHub

1. Откройте https://github.com/settings/tokens
2. Нажмите "Generate new token" → "Generate new token (classic)"
3. Название: `akpp-generator-deploy`
4. Выберите права:
   - ✅ `repo` (полный доступ к репозиториям)
5. Нажмите "Generate token"
6. **ВАЖНО:** Скопируйте токен сразу (он больше не будет показан!)

### Шаг 2: Обновить remote URL

```bash
# Удалить старый remote
git remote remove origin

# Добавить новый с токеном (замените YOUR_TOKEN на ваш токен)
git remote add origin https://YOUR_TOKEN@github.com/tamgdemaslo/akpp-reports.git

# Или использовать Git Credential Helper (безопаснее)
git remote add origin https://github.com/tamgdemaslo/akpp-reports.git
```

### Шаг 3: Настроить Git Credential Helper

```bash
# Сохранить токен в macOS Keychain
git config --global credential.helper osxkeychain

# При следующем push Git попросит ввести:
# Username: ваш_username_github
# Password: ваш_PAT_токен
```

### Шаг 4: Отправить код

```bash
git push -u origin 2026-01-22-dv4h
```

## Решение 3: Использовать GitHub CLI (gh)

### Установка GitHub CLI

```bash
# macOS
brew install gh

# Войти
gh auth login
```

### Использование

```bash
# GitHub CLI автоматически настроит аутентификацию
git push origin 2026-01-22-dv4h
```

## Проверка аутентификации

```bash
# Проверить remote
git remote -v

# Тест подключения (для SSH)
ssh -T git@github.com

# Тест подключения (для HTTPS)
git ls-remote origin
```

## Рекомендация

**Используйте SSH** - это самый безопасный и удобный способ:
- Не нужно обновлять токены
- Более безопасно
- Работает автоматически после настройки

## Быстрая настройка SSH

```bash
# 1. Создать ключ (если нет)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Нажмите Enter для всех вопросов

# 2. Добавить ключ в ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. Скопировать ключ
cat ~/.ssh/id_ed25519.pub | pbcopy

# 4. Добавить на GitHub: https://github.com/settings/keys

# 5. Изменить remote
git remote set-url origin git@github.com:tamgdemaslo/akpp-reports.git

# 6. Проверить
ssh -T git@github.com

# 7. Отправить
git push origin 2026-01-22-dv4h
```
