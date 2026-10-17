FROM node:20-alpine

WORKDIR /app

# Salin manifest dependensi terlebih dahulu untuk optimasi layer cache
COPY package*.json ./

# Install dependensi frontend
RUN npm install

# Salin seluruh source code aplikasi frontend
COPY . .

# Expose port 8080 sesuai konfigurasi docker-compose.yml
EXPOSE 8080

# Jalankan Vite development server di port 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
