#!/bin/sh

set -e

echo "Sincronizando Base de Datos con Prisma..."
sleep 40 


pnpm exec prisma db push --skip-generate

echo "Ejecutando Seeds de Prisma..."
node run-seeds.js

echo "Iniciando AssisTec API..."
node app.js
