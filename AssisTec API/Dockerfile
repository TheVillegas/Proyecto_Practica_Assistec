FROM node:20-alpine

# Instalar dependencias necesarias para Prisma en Alpine
RUN apk add --no-cache openssl dos2unix

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Regenerar Prisma Client para Linux (evita binarios de Windows cacheados)
RUN npx prisma generate

# Dar permisos de ejecución al entrypoint
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3001

# Iniciar la aplicación mediante el entrypoint
CMD ["./docker-entrypoint.sh"]
