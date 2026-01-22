#!/bin/bash

# Скрипт для развертывания AKPP Generator на tilde.team
# Использование: ./deploy-to-tilde.sh ваше_имя_пользователя

if [ $# -eq 0 ]; then
    echo "Использование: $0 <username>"
    echo "Пример: $0 ilaeliseenko"
    exit 1
fi

USERNAME=$1
HOST="tilde.team"
REMOTE_DIR="~/public_html/akpp-generator"

echo "🚀 Начинаем развертывание на $USERNAME@$HOST..."

# Создаем директорию на сервере
echo "📁 Создаем директорию..."
ssh $USERNAME@$HOST "mkdir -p $REMOTE_DIR"

# Копируем файлы
echo "📤 Загружаем файлы..."
scp -r tilda-version/* $USERNAME@$HOST:$REMOTE_DIR/

# Устанавливаем права доступа
echo "🔒 Устанавливаем права доступа..."
ssh $USERNAME@$HOST "chmod 755 ~/public_html/akpp-generator && chmod -R 644 ~/public_html/akpp-generator/* && chmod 755 ~/public_html/akpp-generator/gearbox_files"

echo "✅ Развертывание завершено!"
echo "🌐 Ваш сайт доступен по адресу: https://$USERNAME.$HOST/akpp-generator/"
echo ""
echo "📝 Дополнительные команды:"
echo "   SSH подключение: ssh $USERNAME@$HOST"
echo "   Просмотр файлов: ssh $USERNAME@$HOST 'ls -la ~/public_html/akpp-generator/'"
