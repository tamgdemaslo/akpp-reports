#!/bin/bash

# Универсальный скрипт деплоя AKPP Generator
# Использование: ./deploy.sh [тип_хостинга] [параметры]

set -e

DEPLOY_TYPE=${1:-"static"}
USERNAME=${2:-""}
HOST=${3:-""}
DOMAIN=${4:-""}

echo "🚀 Деплой AKPP Generator"
echo "Тип: $DEPLOY_TYPE"
echo ""

case $DEPLOY_TYPE in
    "static")
        echo "📦 Подготовка статической версии для хостинга..."
        
        # Создаем директорию для деплоя
        DEPLOY_DIR="deploy-static"
        rm -rf $DEPLOY_DIR
        mkdir -p $DEPLOY_DIR
        
        # Копируем необходимые файлы
        echo "📋 Копируем файлы..."
        cp akpp_generator_unified.html $DEPLOY_DIR/index.html
        cp -r gearbox_files $DEPLOY_DIR/
        
        # Создаем .htaccess для правильной маршрутизации
        cat > $DEPLOY_DIR/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Перенаправление на index.html для всех запросов
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L,QSA]

# Правильные MIME типы
AddType application/javascript .js
AddType text/css .css
AddType text/html .html
EOF
        
        echo "✅ Статическая версия готова в папке: $DEPLOY_DIR"
        echo ""
        echo "📤 Для загрузки на сервер используйте:"
        echo "   - FTP/SFTP: загрузите содержимое папки $DEPLOY_DIR"
        echo "   - SSH: scp -r $DEPLOY_DIR/* user@host:/path/to/website/"
        ;;
        
    "vps")
        if [ -z "$USERNAME" ] || [ -z "$HOST" ]; then
            echo "❌ Ошибка: для VPS нужны username и host"
            echo "Использование: ./deploy.sh vps username host [domain]"
            exit 1
        fi
        
        REMOTE_DIR="~/akpp-generator"
        
        echo "📤 Загружаем на VPS: $USERNAME@$HOST..."
        
        # Создаем директорию на сервере
        ssh $USERNAME@$HOST "mkdir -p $REMOTE_DIR"
        
        # Копируем файлы
        scp -r akpp_generator_unified.html gearbox_files/ package.json serve.js proxy-server.js $USERNAME@$HOST:$REMOTE_DIR/
        
        # Устанавливаем зависимости и настраиваем PM2
        ssh $USERNAME@$HOST << EOF
cd $REMOTE_DIR
npm install --production
npm install -g pm2

# Создаем конфигурацию PM2
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'akpp-generator',
      script: './serve.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'akpp-proxy',
      script: './proxy-server.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
PM2EOF

# Запускаем через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF
        
        echo "✅ Деплой на VPS завершен!"
        echo "🌐 Серверы запущены через PM2"
        if [ -n "$DOMAIN" ]; then
            echo "📝 Настройте Nginx для домена: $DOMAIN"
        fi
        ;;
        
    "nginx")
        if [ -z "$DOMAIN" ]; then
            echo "❌ Ошибка: нужен домен"
            echo "Использование: ./deploy.sh nginx domain.com"
            exit 1
        fi
        
        echo "📝 Создаем конфигурацию Nginx для $DOMAIN..."
        
        cat > nginx-config.conf << EOF
# Конфигурация Nginx для AKPP Generator
# Разместите в /etc/nginx/sites-available/$DOMAIN

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Редирект на HTTPS (раскомментируйте после настройки SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Для статической версии
    root /var/www/$DOMAIN;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Прокси для API (если используете Node.js сервер)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Прокси для Rossko API
    location /proxy/ {
        proxy_pass http://localhost:5001/proxy/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    # Кеширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTPS конфигурация (после получения SSL сертификата)
# server {
#     listen 443 ssl http2;
#     server_name $DOMAIN www.$DOMAIN;
#     
#     ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
#     
#     # ... остальная конфигурация как выше
# }
EOF
        
        echo "✅ Конфигурация Nginx создана: nginx-config.conf"
        echo "📝 Инструкции:"
        echo "   1. Скопируйте nginx-config.conf в /etc/nginx/sites-available/$DOMAIN"
        echo "   2. Создайте симлинк: ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
        echo "   3. Проверьте конфигурацию: nginx -t"
        echo "   4. Перезагрузите Nginx: systemctl reload nginx"
        echo "   5. Для SSL: certbot --nginx -d $DOMAIN"
        ;;
        
    *)
        echo "❌ Неизвестный тип деплоя: $DEPLOY_TYPE"
        echo ""
        echo "Доступные типы:"
        echo "  static  - статическая версия для обычного хостинга"
        echo "  vps     - деплой на VPS с Node.js (требует: username host [domain])"
        echo "  nginx   - создание конфигурации Nginx (требует: domain)"
        exit 1
        ;;
esac

echo ""
echo "✨ Готово!"

