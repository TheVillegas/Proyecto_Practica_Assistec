# Guia de Contribucion — AssisTec

Esta guia cubre todo lo que un companiero nuevo necesita saber para trabajar en el proyecto.

---

## Indice

1. [Levantar el entorno](#levantar-el-entorno)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Convenciones de ramas](#convenciones-de-ramas)
4. [Convenciones de commits](#convenciones-de-commits)
5. [Flujo de trabajo](#flujo-de-trabajo)
6. [Pull Requests](#pull-requests)
7. [Tests](#tests)
8. [Sobre el .bat de Windows](#sobre-el-bat-de-windows)

---

## Levantar el entorno

Seguir la guia completa en [`docs/environment-setup.md`](docs/environment-setup.md).

Resumen rapido:

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Backend
cd "AssisTec API" && npm install
# Crear .env (ver docs/environment-setup.md)
npx prisma db push && node run-seeds.js
npm run dev          # corre en http://localhost:3001

# 3. Frontend (otra terminal)
cd Frontend && npm install && npm start   # corre en http://localhost:4200
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
├── docs/            # Documentacion tecnica centralizada
│   ├── architecture.md
│   ├── database.md
│   └── environment-setup.md
├── docker-compose.yml
├── README.md
└── CONTRIBUTING.md  # Este archivo
```

---

## Convenciones de ramas

Todas las ramas parten desde `master`.

| Tipo | Formato | Cuando usarlo |
|---|---|---|
| Feature nueva | `feature/nombre-descriptivo` | Agregar funcionalidad |
| Bug fix | `fix/nombre-descriptivo` | Corregir un error |
| Tarea de mantenimiento | `chore/nombre-descriptivo` | Dependencias, config, CI |
| Documentacion | `docs/nombre-descriptivo` | Solo cambios en docs |

Ejemplos validos:
```
feature/solicitud-ingreso
fix/cors-origin-vacio
chore/actualizar-prisma
docs/guia-despliegue
```

**Nunca trabajes directamente en `master`.**

---

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

Formato: `tipo: descripcion en imperativo`

| Tipo | Cuando usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `chore:` | Mantenimiento (deps, config, sin codigo de produccion) |
| `docs:` | Solo documentacion |
| `test:` | Solo tests |
| `refactor:` | Refactorizacion sin cambio de comportamiento |

Ejemplos:
```
feat: agregar endpoint de validacion de solicitud
fix: corregir CORS_ORIGIN cuando variable esta vacia
docs: documentar variables de entorno del backend legacy
test: agregar tests para SolicitudService
chore: actualizar prisma a 6.2.0
```

**Reglas:**
- Descripcion en minuscula, sin punto al final
- Sin emojis
- Sin "Co-Authored-By" ni atribuciones de IA

---

## Flujo de trabajo

```
master
  |
  +-- feature/mi-feature
        |
        | (desarrollas, commiteas, pruebas)
        |
        +-- Pull Request → master
              |
              | (CI pasa, al menos 1 review)
              |
              merge a master
```

1. Crea una rama desde `master` con la convencion de nombres de arriba.
2. Desarrolla, commitea siguiendo Conventional Commits.
3. Antes de abrir el PR, corre los tests localmente (ver seccion Tests).
4. Abre el PR con el template, describe los cambios y vincula el issue si existe.
5. El CI debe pasar. Si falla, corrige antes de pedir review.
6. Al menos un companiero debe revisar y aprobar.
7. Merge a `master` — squash si los commits intermedios son muy ruidosos.

---

## Pull Requests

- Usa el template provisto (aparece automaticamente al abrir un PR en GitHub).
- Descripcion obligatoria: que cambias y por que.
- Al menos 1 reviewer obligatorio.
- El CI (GitHub Actions) debe pasar antes del merge.
- Para cambios en el backend, incluye la ruta de la API afectada.
- Para cambios en el frontend, incluye screenshot si hay cambio visual.

---

## Tests

### Backend (AssisTec API)

```bash
cd "AssisTec API"
npm test
```

Corre los tests con Jest. Requiere que la base de datos este levantada o usar variables de entorno de test.

### Frontend

```bash
cd Frontend
npm test          # modo watch (desarrollo)
ng test --watch=false --browsers=ChromeHeadless   # una sola pasada (CI)
```

Lint del frontend:

```bash
cd Frontend
npm run lint
```

**Regla:** antes de abrir un PR, todos los tests deben pasar localmente. No abras PRs con tests en rojo.

---

## Sobre el .bat de Windows

Puede existir un archivo `.bat` en el repositorio para arrancar el proyecto en Windows. Ese script fue creado como solucion de emergencia y es obsoleto. El metodo oficial es el de esta guia. Si el `.bat` no funciona o da errores, ignora el script y sigue los pasos manuales de `docs/environment-setup.md`.
