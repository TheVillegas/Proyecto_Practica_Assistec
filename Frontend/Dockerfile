FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g @ionic/cli

COPY . .

EXPOSE 8100

CMD ["ionic", "serve", "--external", "--host=0.0.0.0", "--port=8100", "--no-open"]
