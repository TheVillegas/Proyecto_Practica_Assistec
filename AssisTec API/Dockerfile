FROM node:20-alpine

# Instalar dependencias necesarias para Prisma en Alpine + pnpm global + psql para migraciones
RUN apk add --no-cache openssl dos2unix postgresql-client && npm install -g pnpm

WORKDIR /app

# Copiar solo lo necesario para instalar dependencias (caching)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Generar Prisma Client
RUN pnpm exec prisma generate

# Copiar el resto del código
COPY . .

# Dar permisos de ejecución al entrypoint
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Exponer el puerto
EXPOSE 3001

# Iniciar la aplicación mediante el entrypoint
CMD ["./docker-entrypoint.sh"]
