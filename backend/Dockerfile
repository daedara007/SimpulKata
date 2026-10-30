FROM node:24-alpine

# Install build tools untuk modul binary native (bcrypt) serta ffmpeg untuk konversi audio
RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app

# Salin manifest dependensi terlebih dahulu agar dapat memanfaatkan Docker layer caching
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh source code backend
COPY . .

# Buat folder penyimpanan uploads jika belum ada
RUN mkdir -p storage/uploads

# Expose port aplikasi
EXPOSE 3000

# Jalankan server Fastify
CMD ["node", "src/server.js"]
