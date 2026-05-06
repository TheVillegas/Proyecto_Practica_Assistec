#!/bin/sh

echo "Sincronizando Base de Datos con Prisma..."
sleep 40 


npx prisma db push --accept-data-loss

echo "Ejecutando Seeds de Prisma..."
node run-seeds.js

echo "Iniciando AssisTec API..."
node app.js
