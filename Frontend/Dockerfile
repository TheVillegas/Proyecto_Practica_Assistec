# Build Stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g @ionic/cli

COPY . .

# Build for production
RUN ionic build --prod

# Serve Stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
# Ionic builds to ./www by default
COPY --from=build /app/www /usr/share/nginx/html

# Agregar configuración personalizada para Single Page App (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
