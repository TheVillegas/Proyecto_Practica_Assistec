# AssisTec — Plataforma de Gestion de Laboratorio

Sistema de registro y gestion de analisis microbiologicos de alimentos (RAM y TPA) para laboratorios universitarios.

---

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | Angular 20 + Ionic |
| Backend | Node.js + Express 5 + Prisma 6 (`AssisTec API/`) |
| Base de datos | PostgreSQL 16 (Docker) |

---

## Arranque rapido

Prerequisitos: Docker Desktop, Node.js v18+.

```bash
# 1. BD + Backend (todo junto con Docker)
docker compose up -d        # http://localhost:3001

# 2. Frontend (otra terminal)
cd Frontend && npm install && npm start   # http://localhost:4200
```

Docker levanta PostgreSQL, sincroniza el schema con Prisma, carga los seeds y arranca el backend automaticamente.

Para el detalle completo (variables de entorno, usuarios de prueba, modo desarrollo sin Docker), ver la guia de configuracion.

---

## Documentacion

| Documento | Contenido |
|---|---|
| [`docs/environment-setup.md`](docs/environment-setup.md) | Como levantar el entorno, variables de entorno, problemas comunes |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura del sistema, flujos, decisiones de diseno |
| [`docs/database.md`](docs/database.md) | Esquema de base de datos, tablas, ciclo de vida de una muestra |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Ramas, commits, PRs, flujo de trabajo del equipo |

---

## Estado del CI

Los workflows de GitHub Actions corren automaticamente en cada push o PR que toque `AssisTec API/` o `Frontend/`.

---

## Estructura del repositorio

```
Proyecto_Practica_Assistec/
├── AssisTec API/    # Backend activo (Prisma + Node.js)
├── Frontend/        # Angular + Ionic
├── BD/              # Scripts de base de datos
├── Backend/         # LEGACY — ver Backend/README_LEGACY.md
├── docs/            # Documentacion tecnica
├── .github/         # Workflows de CI y templates de PR/issues
└── docker-compose.yml
```

> `Backend/` es el backend original (deprecated). No usar para desarrollo nuevo.
> Ver `Backend/README_LEGACY.md` para el detalle.
