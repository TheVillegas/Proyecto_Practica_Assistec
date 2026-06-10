# ╔══════════════════════════════════════════════════════════════════╗
# ║  AssisTec Lab - Makefile                                        ║
# ║  Comandos de desarrollo para el proyecto                        ║
# ╚══════════════════════════════════════════════════════════════════╝

.PHONY: help dev build stop restart logs migrate seed studio test test-backend test-frontend clean

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
	$(MAKE) migrate
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
	docker compose down -v

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
# LIMPIEZA
# ══════════════════════════════════════════════════════════════════

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "🧹 Limpiando..."
	docker compose down -v --rmi all
	@echo "✅ Limpieza completada"

prune: ## Limpiar imágenes Docker huérfanas
	docker image prune -f
