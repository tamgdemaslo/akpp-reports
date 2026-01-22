# Инструкция по деплою AKPP Generator

## Варианты деплоя

### 1. Статический хостинг (самый простой)

Для обычного хостинга без Node.js (например, обычный shared hosting):

```bash
./deploy.sh static
```

Это создаст папку `deploy-static` с готовыми файлами. Загрузите содержимое на ваш хостинг через FTP/SFTP.

**Ограничение:** Прокси-сервер для Rossko API не будет работать. Нужно будет настроить CORS на стороне API или использовать другой прокси.

---

### 2. VPS с Node.js (рекомендуется)

Для полноценной работы с прокси-сервером нужен VPS с Node.js.

#### Шаг 1: Подготовка сервера

```bash
# На сервере установите Node.js и PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### Шаг 2: Деплой

```bash
# С вашего компьютера
./deploy.sh vps ваш_username ваш_сервер.com ваш_домен.com
```

Это:
- Загрузит все файлы на сервер
- Установит зависимости
- Настроит PM2 для автозапуска
- Запустит оба сервера (основной на порту 3000, прокси на 5001)

#### Шаг 3: Настройка Nginx

```bash
# Создайте конфигурацию Nginx
./deploy.sh nginx ваш_домен.com
```

Затем на сервере:

```bash
# Скопируйте конфигурацию
sudo cp nginx-config.conf /etc/nginx/sites-available/ваш_домен.com
sudo ln -s /etc/nginx/sites-available/ваш_домен.com /etc/nginx/sites-enabled/

# Проверьте и перезагрузите
sudo nginx -t
sudo systemctl reload nginx
```

#### Шаг 4: Настройка домена

1. В панели управления вашего домена добавьте A-запись:
   - Имя: `@` (или `www`)
   - Значение: IP вашего VPS

2. Подождите распространения DNS (обычно 5-30 минут)

3. Проверьте: `ping ваш_домен.com` должен показывать IP вашего VPS

#### Шаг 5: SSL сертификат (HTTPS)

```bash
# На сервере установите Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d ваш_домен.com -d www.ваш_домен.com
```

---

### 3. Быстрый деплой на tilde.team

Если у вас есть аккаунт на tilde.team:

```bash
chmod +x deploy-to-tilde.sh
./deploy-to-tilde.sh ваше_имя_пользователя
```

Сайт будет доступен по адресу: `https://ваше_имя.tilde.team/akpp-generator/`

---

## Проверка работы

После деплоя проверьте:

1. **Основной сайт:**
   - `http://ваш_домен.com` (или `https://` после настройки SSL)

2. **Прокси-сервер:**
   - `http://ваш_домен.com/proxy/rossko` (должен вернуть ошибку метода, но не 404)
   - `http://ваш_домен.com/proxy/status` (должен показать статус)

3. **Логи PM2 (на VPS):**
   ```bash
   pm2 logs akpp-generator
   pm2 logs akpp-proxy
   ```

---

## Обновление проекта

### Для статического хостинга:
```bash
./deploy.sh static
# Затем загрузите обновленные файлы через FTP
```

### Для VPS:
```bash
# Загрузите обновленные файлы
scp -r gearbox_files/* ваш_username@сервер:~/akpp-generator/gearbox_files/
scp akpp_generator_unified.html ваш_username@сервер:~/akpp-generator/

# Перезапустите серверы
ssh ваш_username@сервер "cd ~/akpp-generator && pm2 restart all"
```

---

## Устранение проблем

### Сервер не запускается
```bash
# Проверьте логи
pm2 logs

# Проверьте, что порты свободны
netstat -tulpn | grep -E '3000|5001'
```

### Nginx не работает
```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log
```

### Прокси не работает
- Убедитесь, что прокси-сервер запущен: `pm2 list`
- Проверьте, что в `akpp_generator_unified.html` правильный URL прокси (должен быть относительный `/proxy/rossko`)

---

## Структура файлов на сервере

```
~/akpp-generator/
├── akpp_generator_unified.html  # Главный файл
├── gearbox_files/               # Все файлы АКПП
├── serve.js                     # Основной сервер
├── proxy-server.js              # Прокси для Rossko
├── package.json                 # Зависимости
└── ecosystem.config.js          # Конфигурация PM2
```

---

## Безопасность

1. **Не храните секреты в коде** - используйте переменные окружения
2. **Настройте firewall:**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```
3. **Регулярно обновляйте систему:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

