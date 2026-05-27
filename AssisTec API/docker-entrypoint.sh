#!/bin/sh

set -e

echo "Sincronizando Base de Datos con Prisma..."
sleep 40 


pnpm exec prisma db push --skip-generate

echo "Ejecutando Seeds de Prisma..."
node run-seeds.js

echo "Ejecutando migraciones de formularios (S. Aureus, Coliformes, Salmonella)..."
for f in prisma/migrations/form/*.sql; do
  echo "  → $f"
  psql "$DATABASE_URL" -f "$f" -1 -q
done
echo "✓ Tablas de formularios creadas/actualizadas correctamente"

echo "Iniciando AssisTec API..."
node app.js
