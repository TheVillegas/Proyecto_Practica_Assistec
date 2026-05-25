# ============================================================
# BUILD STAGE: Compilar Angular con pnpm
# ============================================================
FROM node:20-alpine AS build

# Instalar pnpm global
RUN npm install -g pnpm

WORKDIR /app

# Copiar solo lo necesario para instalar dependencias (caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar el resto del código y compilar
COPY . .
RUN pnpm exec ng build --configuration production

# ============================================================
# SERVE STAGE: Servir con nginx
# ============================================================
FROM nginx:alpine

COPY --from=build /app/www /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
