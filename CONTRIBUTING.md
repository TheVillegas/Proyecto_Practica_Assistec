# Guía de Contribución — AssisTec Lab

Esta guía cubre cómo contribuir al proyecto correctamente.

---

## ⚠️ Regla de Oro

**No se hace push directo a `main`.**  
`main` está protegido: solo se puede mergear via Pull Request con CI verde y aprobación del admin.

Si necesitás ayuda o algo no funciona, hablá con el admin del repositorio.

---

## Índice

1. [Entorno local](#entorno-local)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Convenciones de ramas](#convenciones-de-ramas)
4. [Convenciones de commits](#convenciones-de-commits)
5. [Flujo de trabajo](#flujo-de-trabajo)
6. [Pull Requests](#pull-requests)
7. [Tests](#tests)
8. [CI / CD](#ci--cd)

---

## Entorno local

### Requisitos
- Docker Desktop
- Node.js 20+
- pnpm (instalar: `npm install -g pnpm`)

### Levantar todo con Docker (recomendado)

```bash
# Parado en la raíz del proyecto
docker compose up -d
```

Esto levanta los 3 servicios:

| Servicio | Puerto | URL |
|----------|--------|-----|
| Base de Datos (PostgreSQL 16) | 5432 | `localhost:5432` |
| Backend (Node.js + Prisma) | 3001 | `http://localhost:3001` |
| Frontend (Angular + nginx) | 8000 | `http://localhost:8000` |

El backend sincroniza Prisma y corre los seeds automáticamente al arrancar.

### Desarrollo local (sin Docker, hot reload)

```bash
# 1. Base de datos
docker compose up -d BD_AsisTec

# 2. Backend (terminal 1)
cd "AssisTec API"
pnpm install
pnpm exec prisma db push
node run-seeds.js
pnpm run dev          # http://localhost:3001

# 3. Frontend (terminal 2)
cd Frontend
pnpm install
pnpm start            # http://localhost:4200
```

---

## Estructura del proyecto

```
Proyecto_Practica_Assistec/
├── AssisTec API/    # Backend ACTIVO (Node.js + Express 5 + Prisma)
├── Frontend/        # Angular 20 + Ionic
├── BD/
│   ├── init/        # Schema inicial de PostgreSQL
│   ├── seeds/       # Datos iniciales
│   └── migrations/  # Cambios incrementales al schema
├── Backend/         # LEGACY — no usar para desarrollo nuevo
├── docker-compose.yml
├── README.md
└── CONTRIBUTING.md  # Este archivo
```

---

## Convenciones de ramas

Todas las ramas parten desde `main`.

| Tipo | Formato | Cuándo usarlo |
|------|---------|---------------|
| Feature nueva | `feature/nombre-descriptivo` | Agregar funcionalidad |
| Bug fix | `fix/nombre-descriptivo` | Corregir un error |
| Mantenimiento | `chore/nombre-descriptivo` | Dependencias, config, CI |
| Documentación | `docs/nombre-descriptivo` | Solo cambios en docs |

Ejemplos:
```
feature/formulario-e-coli
fix/cors-origin-vacio
chore/actualizar-prisma
docs/guia-despliegue
```

**Nunca trabajar directamente en `main`.**

---

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

Formato: `tipo: descripción en imperativo`

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `chore:` | Mantenimiento (deps, config) |
| `docs:` | Solo documentación |
| `test:` | Solo tests |
| `refactor:` | Refactorización sin cambio de comportamiento |

Ejemplos:
```
feat: agregar formulario de salmonella
fix: corregir validacion de rut en solicitud
chore: actualizar prisma a 6.19.3
test: agregar tests para solicitud service
```

**Reglas:**
- Descripción en minúscula, sin punto al final
- Sin emojis
- Sin atribuciones de IA

---

## Flujo de trabajo

```
main
  │
  ├── feature/mi-feature   ← crear rama desde main
  │     │
  │     │ (desarrollar, commitear, probar)
  │     │
  │     └── Pull Request → main
  │           │
  │           │ (CI pasa automáticamente)
  │           │ (admin revisa y aprueba)
  │           │
  │           merge a main  ← solo via PR, nadie pushea directo
```

1. Crear una rama desde `main` con la convención de nombres indicada.
2. Desarrollar y commitear siguiendo Conventional Commits.
3. Antes de abrir el PR, ejecutar los tests localmente.
4. Abrir el PR desde GitHub con una descripción clara de los cambios y su motivo.
5. El CI se ejecuta automáticamente. Si falla, corregir antes de solicitar revisión.
6. El admin revisa y aprueba (aprobación requerida para merge).
7. El admin hace el merge a `main`.

---

## Pull Requests

- Usar el template que aparece automáticamente al abrir el PR.
- Descripción obligatoria: qué cambia y por qué.
- El admin revisa y aprueba antes del merge.
- CI debe pasar antes del merge (tests + lints + code review automático).
- Para cambios en backend: incluir la ruta de la API afectada.
- Para cambios en frontend: incluir screenshot si hay cambio visual.

### Code Review Automático

Al abrir un PR, **Gentleman Guardian Angel** revisa automáticamente el código contra las reglas del `AGENTS.md`. Si encuentra violaciones, las marca en el PR. Revisar y corregir antes de solicitar revisión del admin.

---

## Tests

### Backend (AssisTec API)

```bash
cd "AssisTec API"
pnpm test
```

Requiere que la base de datos esté levantada (via Docker).

### Frontend

```bash
cd Frontend
pnpm test -- --watch=false --browsers=ChromeHeadless
pnpm run lint
```

**Regla:** antes de abrir un PR, todos los tests deben pasar localmente. No abrir PRs con tests en rojo.

---

## CI / CD

Al abrir o actualizar un PR, GitHub Actions corre automáticamente:

| Workflow | Qué hace |
|----------|----------|
| **CI — Backend** | `pnpm install` + `prisma db push` + `pnpm test` |
| **CI — Frontend** | `pnpm install` + `pnpm run lint` + `pnpm test` |
| **AI Code Review** | GGA revisa el código contra `AGENTS.md` |

Los 3 deben pasar para poder mergear.
