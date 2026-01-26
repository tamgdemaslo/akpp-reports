FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["npm", "start"]
