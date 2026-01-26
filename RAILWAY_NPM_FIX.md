# 🔧 Исправление ошибки "npm: not found" в Railway

## Проблема
```
sh: 1: npm: not found
Build Failed: process "sh -c npm install" did not complete successfully
```

Railway не может найти npm, потому что Node.js не установлен в окружении сборки.

## ✅ Решение

### Вариант 1: Использовать Dockerfile (рекомендуется)

Dockerfile уже создан и правильно настроен. Railway должен автоматически его использовать.

**Если Railway не использует Dockerfile автоматически:**

1. В Railway перейдите в **Settings** → **Service**
2. В разделе **Build Command** оставьте пустым (Dockerfile сам управляет сборкой)
3. В разделе **Start Command** оставьте пустым (Dockerfile сам управляет запуском)
4. Убедитесь что **Builder** установлен на "Dockerfile"

### Вариант 2: Исправить nixpacks.toml

Файл `nixpacks.toml` обновлен. Отправьте изменения:

```bash
git add nixpacks.toml
git commit -m "fix: исправлена конфигурация nixpacks для Node.js"
git push origin main-production
```

### Вариант 3: Настройка через веб-интерфейс

1. В Railway перейдите в **Settings** → **Service**
2. В разделе **Build Command** укажите:
   ```
   npm install
   ```
3. В разделе **Start Command** укажите:
   ```
   npm start
   ```
4. В разделе **Nixpacks** или **Builder** выберите:
   - "Dockerfile" (если есть)
   - Или убедитесь что Node.js указан в настройках

## Проверка

После применения одного из решений Railway должен:
1. ✅ Установить Node.js
2. ✅ Найти npm
3. ✅ Выполнить `npm install`
4. ✅ Запустить `npm start`

## Рекомендация

**Используйте Dockerfile** - это самое надежное решение:
- ✅ Явно указывает Node.js версию
- ✅ Контролирует весь процесс сборки
- ✅ Работает стабильно на Railway

Если Dockerfile не работает, попробуйте Вариант 3 (настройка через веб-интерфейс).
