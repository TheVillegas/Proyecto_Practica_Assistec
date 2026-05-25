# AssisTec — Plataforma de Gestión de Laboratorio

Sistema de registro y gestión de análisis microbiológicos de alimentos (RAM y TPA) para el laboratorio AssisTec de la PUCV.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 20 + Ionic 8 + Tailwind |
| Backend | Node.js + Express 5 + Prisma 6 (`AssisTec API/`) |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker Compose (3 servicios) |

---

## Arranque rápido

Requisito: **Docker Desktop**.

```bash
# 1. Clonar y entrar
git clone https://github.com/TheVillegas/Proyecto_Practica_Assistec.git
cd Proyecto_Practica_Assistec

# 2. Copiar variables de entorno
cp "AssisTec API/.env_example" "AssisTec API/.env"

# 3. Levantar todo
docker compose up -d
```

Listo. Los 3 servicios arrancan automáticamente:

| Servicio | URL |
|----------|-----|
| **Frontend** | [http://localhost:8000](http://localhost:8000) |
| **Backend API** | [http://localhost:3001](http://localhost:3001) |
| **Base de datos** | `localhost:5432` |

El backend sincroniza Prisma y carga los seeds al arrancar. No se necesita instalar nada en la máquina local.

---

## Desarrollo con hot reload

```bash
# Base de datos sola (Docker)
docker compose up -d BD_AsisTec

# Backend (terminal 1)
cd "AssisTec API"
pnpm install
pnpm exec prisma db push
node run-seeds.js
pnpm run dev

# Frontend (terminal 2)
cd Frontend
pnpm install
pnpm start
```

El frontend en desarrollo corre en `http://localhost:4200` con hot reload.

---

## Convenciones del proyecto

- **Ramas**: `feature/*`, `fix/*`, `chore/*` — siempre desde `main`
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **PR obligatorio**: nadie pushea directo a `main`. Todo entra via Pull Request con CI verde y aprobación del admin.

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para el detalle completo.

---

## CI / Code Review Automático

| Workflow | Qué hace |
|----------|----------|
| **CI Backend** | Tests + Prisma en cada push/PR |
| **CI Frontend** | Lint + Tests en cada push/PR |
| **AI Code Review** | [Gentleman Guardian Angel](https://github.com/Gentleman-Programming/gentleman-guardian-angel) revisa cada PR contra `AGENTS.md` |

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Cómo contribuir: ramas, commits, PRs, tests |
| [`AGENTS.md`](AGENTS.md) | Reglas de code review automático |

---

## Estructura del repositorio

```
Proyecto_Practica_Assistec/
├── AssisTec API/    # Backend activo (Prisma + Node.js)
├── Frontend/        # Angular + Ionic
├── BD/              # Scripts de base de datos
├── Backend/         # LEGACY — no usar para desarrollo nuevo
├── .github/         # Workflows de CI y templates
├── docker-compose.yml
├── CONTRIBUTING.md
├── AGENTS.md
└── README.md
```
