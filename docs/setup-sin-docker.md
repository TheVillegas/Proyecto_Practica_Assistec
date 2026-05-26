# Setup sin Docker — Backend nativo en Windows

Guia para levantar el backend AssisTec API **sin Docker**, ideal si no podes instalar Docker Desktop o preferis correr todo directamente en tu maquina.

---

## Arranque automatico (recomendado)

Asegurate de tener [Node.js](https://nodejs.org/) y [PostgreSQL](https://www.postgresql.org/download/windows/) instalados, despues hace doble clic en:

```
start-backend-local.ps1
```

El script solo te pide la contrasena de PostgreSQL si no es `admin123`, y hace todo automatico:
1. Verifica Node.js y pnpm
2. Arranca PostgreSQL si esta detenido
3. Crea la base `asistectest` si no existe
4. Copia `.env` desde `.env_example`
5. Instala dependencias con `pnpm install`
6. Sincroniza el esquema con `prisma db push`
7. Carga los seeds
8. Inicia el servidor

> Si preferis hacerlo paso a paso, segui la guia manual abajo.

---

## Prerequisitos

| Herramienta | Donde descargar |
|---|---|
| **Node.js** v18+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | `npm install -g pnpm` (despues de Node.js) |
| **PostgreSQL 16** | [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) |
| **Git** | [git-scm.com](https://git-scm.com/) |

---

## 1. Instalar PostgreSQL en Windows

1. Descarga el installer de PostgreSQL 16 desde [enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
2. Ejecutalo y segui los pasos:
   - **Componentes**: deja todo marcado (PostgreSQL Server, pgAdmin, Stack Builder)
   - **Contraseña**: pone `admin123` para coincidir con la config del proyecto (o la que quieras, pero despues ajustala en el `.env`)
   - **Puerto**: deja el default `5432`
3. Al terminar, **pgAdmin** se abre automaticamente. Cerralo por ahora.

> Si ya tenes PostgreSQL instalado con otra contraseña, no importa — despues la cambiamos en el `.env`.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/TheVillegas/Proyecto_Practica_Assistec.git
cd Proyecto_Practica_Assistec
```

---

## 3. Crear la base de datos

Abre **SQL Shell (psql)** desde el menu de inicio (se instalo con PostgreSQL) y conectate con los datos que pusiste en la instalacion:

```
Server: [localhost]
Database: [postgres]
Port: [5432]
Username: [postgres]
Password: [la que pusiste al instalar]
```

Dentro de psql, ejecuta:

```sql
CREATE DATABASE asistectest;
\q
```

> Si preferis usar pgAdmin, abrilo, hace clic derecho en "Databases" -> "Create" -> "Database", ponele `asistectest` y guarda.

---

## 4. Configurar variables de entorno

Entra a la carpeta del backend y copia el archivo de ejemplo:

```bash
cd "AssisTec API"
copy .env_example .env
```

Abre el `.env` con cualquier editor (Block de Notas, VS Code, etc.) y verifica que tenga esta pinta:

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/asistectest?schema=public"
JWT_SECRET="secreto_lab_pucv_2024"
PORT=3001
```

> Si al instalar PostgreSQL pusiste otra contraseña, cambiala en `DATABASE_URL` donde dice `admin123`.

---

## 5. Instalar dependencias

```bash
pnpm install
```

Esto descarga todas las dependencias del backend (Express, Prisma, JWT, etc.).

---

## 6. Sincronizar la base de datos

Prisma necesita crear las tablas en la base de datos que creaste:

```bash
pnpm exec prisma db push
```

Deberias ver algo como:
```
Your database is now in sync with your Prisma schema.
```

---

## 7. Cargar datos iniciales (seeds)

El proyecto viene con catalogos y usuarios de prueba precargados:

```bash
node run-seeds.js
```

Esto inserta:
- Catalogos (diluyentes, equipos, instrumentos, etc.)
- Categorias y subcategorias de productos
- Formularios de analisis
- Acreditaciones
- Usuarios de prueba

---

## 8. Iniciar el backend

```bash
pnpm run dev
```

El servidor arranca en **http://localhost:3001** con autorecarga (cada vez que guardes un archivo se reinicia solo).

Para verificar que funciona, abri http://localhost:3001 en el navegador — deberia responder:

```json
{ "status": "OK", "message": "AssisTec API is running" }
```

---

## 9. Probar login

Usa estas credenciales (las crearon los seeds):

| Correo | Rol | Contrasena |
|---|---|---|
| `analista@lab.cl` | Analista | `123456` |
| `coord@lab.cl` | Coordinadora | `123456` |
| `jefe@lab.cl` | Jefe de Area | `123456` |
| `ingreso@lab.cl` | Ingreso | `123456` |
| `admin@lab.cl` | Administrador | `123456` |

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"analista@lab.cl","contrasena":"123456"}'
```

---

## Resumen de comandos (para el dia a dia)

```bash
# 1. Arrancar PostgreSQL (Windows normalmente lo arranca solo como servicio)
#    Si no: abrir "Services" -> "postgresql-x64-16" -> Start

# 2. Entrar al backend
cd "Proyecto_Practica_Assistec\AssisTec API"

# 3. Iniciar servidor
pnpm run dev
```

Para detenerlo: `Ctrl + C` en la terminal.

---

## Troubleshooting

### `pnpm : command not found`

Instala pnpm globalmente:
```bash
npm install -g pnpm
```

### `ECONNREFUSED :5432`

PostgreSQL no esta corriendo. Abri "Services" (services.msc), busca `postgresql-x64-16` y hace clic en "Start".

### `role "postgres" does not exist`

Durante la instalacion de PostgreSQL te pide un usuario. Si no usaste `postgres`, usa el que creaste. O abri psql y crealo:

```sql
CREATE USER postgres WITH PASSWORD 'admin123' SUPERUSER;
```

### La base de datos ya existe pero quiero empezar de cero

```bash
cd "AssisTec API"
pnpm exec prisma db push --force-reset
node run-seeds.js
```

---

## Referencias

- [README principal](../README.md) — version con Docker (recomendada para el equipo)
- [environment-setup.md](environment-setup.md) — guia general de entorno
- [database.md](database.md) — esquema de base de datos
