# Guía de Contribución — AssisTec Lab

Esta guía cubre cómo contribuir al proyecto correctamente.

---

## ⚠️ Regla de Oro

**No se hace push directo a `main`.**  
`main` está protegido: solo se puede mergear via Pull Request con CI verde y al menos 1 aprobación.

Si necesitás ayuda o algo no funciona, hablá con Matías.

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

**Nunca trabajes directamente en `main`.**

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
fix: corregir validación de rut en solicitud
chore: actualizar prisma a 6.19.3
test: agregar tests para solicitud service
```

**Reglas:**
- Descripción en minúscula, sin punto al final
- Sin emojis
- Sin "Co-Authored-By" ni atribuciones de IA

---

## Flujo de trabajo

```
main
  │
  ├── feature/mi-feature   ← creás tu rama desde main
  │     │
  │     │ (desarrollás, commiteás, probás)
  │     │
  │     └── Pull Request → main
  │           │
  │           │ (CI pasa automáticamente)
  │           │ (alguien revisa y aprueba)
  │           │
  │           merge a main  ← solo via PR, nadie pushea directo
```

1. Creá una rama desde `main` con la convención de nombres de arriba.
2. Desarrollá, commiteá siguiendo Conventional Commits.
3. Antes de abrir el PR, corré los tests localmente.
4. Abrí el PR desde GitHub con una descripción clara de qué cambia y por qué.
5. El CI se ejecuta solo. Si falla, corregí antes de pedir review.
6. Alguien revisa y aprueba (mínimo 1 aprobación requerida).
7. Merge a `main` — squash si los commits intermedios son muy ruidosos.

---

## Pull Requests

- **Usá el template** que aparece automáticamente al abrir el PR.
- **Descripción obligatoria:** qué cambiás y por qué.
- **Mínimo 1 reviewer** obligatorio.
- **CI debe pasar** antes del merge (tests + lints + code review automático).
- Para cambios en backend: incluí la ruta de la API afectada.
- Para cambios en frontend: incluí screenshot si hay cambio visual.

### Code Review Automático

Al abrir un PR, **Gentleman Guardian Angel** revisa automáticamente el código contra las reglas del `AGENTS.md`. Si encuentra violaciones, las marca en el PR. Revisalas y corregí antes de pedir review humana.

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
