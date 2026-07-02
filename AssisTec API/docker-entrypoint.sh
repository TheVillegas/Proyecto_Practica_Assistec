#!/bin/sh

set -e

echo "Aplicando migraciones de Prisma..."
sleep 5

pnpm exec prisma migrate deploy

echo "Ejecutando Seeds de Prisma..."
node run-seeds.js

echo "Iniciando AssisTec API..."
node app.js
