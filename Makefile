# ╔══════════════════════════════════════════════════════════════════╗
# ║  AssisTec Lab - Makefile                                        ║
# ║  Comandos de desarrollo para el proyecto                        ║
# ╚══════════════════════════════════════════════════════════════════╝

.PHONY: help dev build stop restart logs migrate migrate-deploy migrate-reset migrate-resolve-baseline seed studio test test-backend test-frontend dev-test clean prune

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

dev: ## Levantar entorno completo + migraciones + seed (entrypoint las aplica)
	@echo "🚀 Iniciando entorno de desarrollo..."
	@docker compose up --build -d
	@echo "⏳ Esperando migraciones del entrypoint (sleep 5 + migrate deploy + seeds)... "
	@sleep 20
	@echo ""
	@echo "✅ Entorno listo!"
	@echo "   Backend:  http://localhost:3001"
	@echo "   Frontend: http://localhost:8000 (ng serve en local)"
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

migrate: ## Aplicar migraciones de Prisma (modo dev — crea nuevas migraciones)
	@echo "📦 Aplicando migraciones..."
	docker compose exec backend_asistec npx prisma migrate dev
	@echo "✅ Migraciones aplicadas"

migrate-deploy: ## Aplicar migraciones existentes (sin crear nuevas)
	@echo "📦 Aplicando migraciones (deploy)..."
	docker compose exec backend_asistec npx prisma migrate deploy
	@echo "✅ Migraciones aplicadas"

migrate-reset: ## Resetear base de datos (ELIMINA TODOS LOS DATOS)
	@echo "⚠️  Esto eliminará TODOS los datos de la base de datos"
	@read -p "¿Estás seguro? (s/N): " confirm && [ "$$confirm" = "s" ] || exit 1
	docker compose exec backend_asistec npx prisma migrate reset --force

migrate-resolve-baseline: ## Marcar baseline como aplicada en BD existente (db push + migraciones previas)
	@echo "🔧 Marcando baseline 0_baseline_20260521000000 como aplicada..."
	docker compose exec backend_asistec npx prisma migrate resolve --applied 0_baseline_20260521000000
	@echo "✅ Baseline marcada. Ejecuta 'make migrate-deploy' para aplicar nuevas migraciones."

db-push: ## [DEPRECATED] Sincronizar schema con DB directamente — usar 'make migrate' o 'make migrate-deploy'
	@echo "⚠️  DEPRECATED: 'make db-push' está deprecado. No uses db push en flujos de trabajo."
	@echo "   Usa 'make migrate' para crear migraciones o 'make migrate-deploy' para aplicarlas."
	@echo "   Más información: docs/database-migrations-guide.md"
	@echo ""
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

dev-test: ## Limpiar + iniciar servidores + datos de prueba (1 comando)
	@echo "🧪 Preparando entorno de prueba completo..."
	@echo ""
	@echo "🧹 Paso 1/3 — Limpiando contenedores y volúmenes anteriores..."
	@docker compose down -v 2>/dev/null || true
	@echo ""
	@echo "🚀 Paso 2/3 — Iniciando contenedores limpios con seed de prueba..."
	@LOAD_TEST_SEED=true docker compose up --build -d
	@echo "   ⏳ Esperando migraciones y seeds del entrypoint..."
	@sleep 30
	@echo ""
	@echo "🧪 Paso 3/3 — Verificando que el backend respondió..."
	@docker compose logs --tail=20 backend_asistec
	@echo ""
	@echo "✅ Entorno listo!"
	@echo "   📋 Solicitud #3 (2026/ALI-003) — 3 muestras, 6 análisis"
	@echo "   🧪 Analista: 0-0 — http://localhost:8000 (ng serve en local)"
	@echo "   🔗 Backend API: http://localhost:3001"

# ══════════════════════════════════════════════════════════════════
# LIMPIEZA
# ══════════════════════════════════════════════════════════════════

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "🧹 Limpiando..."
	docker compose down -v --rmi all
	@echo "✅ Limpieza completada"

prune: ## Limpiar imágenes Docker huérfanas
	docker image prune -f
