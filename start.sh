#!/bin/bash

echo "🔄 Обновляем список всех АКПП..."
node auto_update_index.js

echo ""
echo "🚀 Запускаем сервер..."
echo "📱 Открой http://localhost:8080 в браузере"
echo ""
echo "✨ МАКСИМАЛЬНО ПРОСТО:"
echo "   1. Создай новый .js файл в папке gearbox_files/"
echo "   2. Обнови страницу в браузере"
echo "   3. Твоя АКПП уже на сайте!"
echo ""

node serve.js
