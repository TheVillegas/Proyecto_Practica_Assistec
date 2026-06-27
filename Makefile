# ╔══════════════════════════════════════════════════════════════════╗
# ║  AssisTec Lab - Makefile                                        ║
# ║  Comandos de desarrollo para el proyecto                        ║
# ╚══════════════════════════════════════════════════════════════════╝

.PHONY: help dev build stop restart logs migrate seed studio test test-backend test-frontend dev-test dev-test-reset clean

# ══════════════════════════════════════════════════════════════════
# HELP
# ══════════════════════════════════════════════════════════════════

help: ## Mostrar esta ayuda
	@echo ""
	@echo "AssisTec Lab - Comandos disponibles:"
	@echo "===================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ══════════════════════════════════════════════════════════════════
# DESARROLLO
# ══════════════════════════════════════════════════════════════════

dev: ## Levantar entorno completo + migraciones + seed
	@echo "🚀 Iniciando entorno de desarrollo..."
	docker compose up --build -d
	@echo "⏳ Esperando a que PostgreSQL esté listo..."
	@sleep 8
	$(MAKE) db-push
	@echo ""
	@echo "✅ Entorno listo!"
	@echo "   Backend:  http://localhost:3001"
	@echo "   Frontend: http://localhost:8000"
	@echo "   Database: localhost:5432"
	@echo ""

build: ## Construir contenedores sin iniciar
	docker compose build

up: ## Levantar contenedores (sin rebuild)
	docker compose up -d

stop: ## Detener todos los contenedores
	docker compose down

restart: ## Reiniciar todos los contenedores
	docker compose restart

down: ## Detener y eliminar volúmenes
	docker compose down

# ══════════════════════════════════════════════════════════════════
# BASE DE DATOS
# ══════════════════════════════════════════════════════════════════

migrate: ## Aplicar migraciones de Prisma
	@echo "📦 Aplicando migraciones..."
	docker compose exec backend_asistec npx prisma migrate dev
	@echo "✅ Migraciones aplicadas"

migrate-deploy: ## Aplicar migraciones en modo deploy (producción)
	@echo "📦 Aplicando migraciones (deploy)..."
	docker compose exec backend_asistec npx prisma migrate deploy
	@echo "✅ Migraciones aplicadas"

migrate-reset: ## Resetear base de datos (ELIMINA TODOS LOS DATOS)
	@echo "⚠️  Esto eliminará TODOS los datos de la base de datos"
	@read -p "¿Estás seguro? (s/N): " confirm && [ "$$confirm" = "s" ] || exit 1
	docker compose exec backend_asistec npx prisma migrate reset --force

db-push: ## Sincronizar schema Prisma con la DB (shadow DB safe)
	@echo "📦 Sincronizando schema con la base de datos..."
	docker compose exec backend_asistec npx prisma db push
	@echo "✅ Schema sincronizado"

seed: ## Ejecutar seed de la base de datos
	@echo "🌱 Ejecutando seed..."
	docker compose exec backend_asistec npx prisma db seed

studio: ## Abrir Prisma Studio (UI de base de datos)
	@echo "🔬 Abriendo Prisma Studio..."
	@echo "   URL: http://localhost:5555"
	docker compose exec backend_asistec npx prisma studio

# ══════════════════════════════════════════════════════════════════
# TESTING
# ══════════════════════════════════════════════════════════════════

test: test-backend test-frontend ## Ejecutar todos los tests

test-backend: ## Ejecutar tests del backend (Jest)
	@echo "🧪 Ejecutando tests del backend..."
	docker compose exec backend_asistec pnpm test

test-import-duplicado: ## Test: importación de duplicado S. aureus (9 tests)
	@echo "🧪 Test: Importación de Duplicado S. aureus"
	docker compose exec backend_asistec npx jest --testPathPatterns='import-duplicado.test.js' --verbose --no-coverage

test-frontend: ## Ejecutar tests del frontend (Karma)
	@echo "🧪 Ejecutando tests del frontend..."
	docker compose exec frontend_asistec pnpm test -- --watch=false --browsers=ChromeHeadless

# ══════════════════════════════════════════════════════════════════
# LOGS
# ══════════════════════════════════════════════════════════════════

logs: ## Ver logs de todos los contenedores
	docker compose logs -f

logs-backend: ## Ver logs del backend
	docker compose logs -f backend_asistec

logs-frontend: ## Ver logs del frontend
	docker compose logs -f frontend_asistec

logs-db: ## Ver logs de la base de datos
	docker compose logs -f BD_AsisTec

# ══════════════════════════════════════════════════════════════════
# UTILIDADES
# ══════════════════════════════════════════════════════════════════

ps: ## Ver estado de contenedores
	docker compose ps

sh-backend: ## Abrir shell en el backend
	docker compose exec backend_asistec sh

sh-db: ## Abrir shell en PostgreSQL
	docker compose exec BD_AsisTec psql -U postgres -d asistectest

generate: ## Regenerar cliente Prisma
	docker compose exec backend_asistec npx prisma generate

format: ## Formatear código del backend
	docker compose exec backend_asistec pnpm eslint . --fix

# ══════════════════════════════════════════════════════════════════
# DEV TEST
# ══════════════════════════════════════════════════════════════════

dev-test: ## Iniciar servidores + cargar datos de prueba (1 comando)
	@echo "🧪 Preparando entorno de prueba completo..."
	@echo ""
	@echo "🚀 Paso 1/4 — Iniciando contenedores..."
	@docker compose up --build -d; \
	 echo "   ⏳ Esperando que la base de datos esté lista..." && \
	 sleep 8
	@echo ""
	@echo "📦 Paso 2/4 — Sincronizando schema..."
	@docker compose exec backend_asistec npx prisma db push --accept-data-loss
	@echo ""
	@echo "🌱 Paso 3/4 — Seeds base (catálogos, usuarios)..."
	@docker compose exec backend_asistec node run-seeds.js
	@echo ""
	@echo "🧪 Paso 4/4 — Cargando datos de prueba (cliente + solicitud #3)..."
	@docker compose exec -T BD_AsisTec psql -v ON_ERROR_STOP=1 -U postgres -d asistectest < "AssisTec API/prisma/migrations/20260625_dev_test_seed_data/migration.sql"
	@echo ""
	@echo "✅ Entorno listo!"
	@echo "   📋 Solicitud #3 (2026/ALI-003) — 3 muestras, 6 análisis"
	@echo "   🧪 Analista: 0-0 — http://localhost:8000"
	@echo "   🔗 Backend API: http://localhost:3001"

dev-test-reset: ## Borrar volumen de DB y recrear entorno de prueba desde cero
	@echo "🧨 Borrando base de datos de desarrollo..."
	@docker compose down -v
	@$(MAKE) dev-test

# ══════════════════════════════════════════════════════════════════
# LIMPIEZA
# ══════════════════════════════════════════════════════════════════

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "🧹 Limpiando..."
	docker compose down -v --rmi all
	@echo "✅ Limpieza completada"

prune: ## Limpiar imágenes Docker huérfanas
	docker image prune -f
