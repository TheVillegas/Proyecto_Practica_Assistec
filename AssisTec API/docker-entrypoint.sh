#!/bin/sh

set -e

echo "Aplicando migraciones de Prisma..."
sleep 5

pnpm exec prisma migrate deploy

echo "Ejecutando Seeds de Prisma..."
node run-seeds.js

if [ "$LOAD_TEST_SEED" = "true" ]; then
    echo "Cargando datos de prueba (dev-test-seed.sql)..."
    psql "$DATABASE_URL" -f ./prisma/dev-test-seed.sql
fi

echo "Iniciando AssisTec API..."
node app.js
