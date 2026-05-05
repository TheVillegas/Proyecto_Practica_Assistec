# Configuracion del Entorno — AssisTec

Guia completa para levantar el proyecto desde cero en una maquina nueva.

---

## Prerequisitos

| Herramienta | Version minima | Proposito |
|---|---|---|
| Docker Desktop | Cualquiera reciente | Levantar PostgreSQL |
| Node.js | v18 o superior | Backend y Frontend |
| Git | Cualquiera | Control de versiones |

---

## Opcion A — Flujo recomendado (Docker para BD + Backend, Frontend local)

Esta es la forma estandar del equipo. Docker levanta la base de datos y el backend juntos; el frontend corre con `npm start` en una terminal separada para aprovechar el hot reload.

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd Proyecto_Practica_Assistec
```

### 2. Levantar BD + Backend con Docker

Asegurate de tener Docker Desktop abierto. Desde la raiz del proyecto:

```bash
docker compose up -d
```

Esto hace automaticamente:
1. Levanta PostgreSQL 16 en el puerto 5432
2. Sincroniza el schema con `prisma db push`
3. Carga todos los seeds (catalagos, usuarios de prueba)
4. Inicia el backend en `http://localhost:3001`

Para ver los logs del backend en tiempo real:

```bash
docker compose logs -f backend
```

Para detener todo:

```bash
docker compose down
```

Para resetear la base de datos desde cero (borra todos los datos):

```bash
docker compose down -v && docker compose up -d
```

### 3. Levantar el Frontend

En una terminal separada:

```bash
cd Frontend
npm install   # solo la primera vez
npm start
```

La aplicacion corre en `http://localhost:4200`.

---

## Opcion B — Backend fuera de Docker (modo desarrollo avanzado)

Util si necesitas depurar el backend con un debugger o cambiar codigo frecuentemente sin reconstruir la imagen.

### 1. Solo la base de datos con Docker

Edita el `docker-compose.yml` para correr solo el servicio de postgres, o levanta solo ese servicio:

```bash
docker compose up -d postgres
```

### 2. Configurar y correr el Backend manualmente

```bash
cd "AssisTec API"
npm install
```

Crea el archivo `.env` dentro de `AssisTec API/`:

```env
# Conexion a PostgreSQL en Docker
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/asistectest?schema=public"

# JWT
JWT_SECRET="secreto_lab_pucv_2024"
```

Sincroniza el schema y carga los datos iniciales (solo la primera vez):

```bash
npx prisma db push
node run-seeds.js
```

Inicia el servidor en modo desarrollo (con watch):

```bash
npm run dev
```

El backend corre en `http://localhost:3001`.

### 3. Levantar el Frontend

```bash
cd Frontend
npm install
npm start
```

---

## Variables de Entorno — AssisTec API (backend activo)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexion a PostgreSQL (formato Prisma) | `postgresql://postgres:admin123@localhost:5432/asistectest?schema=public` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `secreto_lab_pucv_2024` |
| `PORT` | Puerto del servidor (opcional, default 3001) | `3001` |

---

## Variables de Entorno — Backend Legacy (Backend/)

> El backend legacy usa `pg` directo en vez de Prisma. Esta seccion es de referencia historica.
> El `.env.example` del directorio `Backend/` tiene nombres INCORRECTOS — usar los nombres de abajo.

| Variable correcta (que el codigo lee) | Descripcion | Ejemplo |
|---|---|---|
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_HOST` | Host de PostgreSQL (en Docker: nombre del servicio) | `BD_AsisTec` o `localhost` |
| `NOMBRE_DB` | Nombre de la base de datos (`DB_NAME` en `.env.example` es INCORRECTO) | `asistec_db` |
| `MI_CLAVE_POSTGRES` | Contrasena de PostgreSQL (`DB_PASSWORD` en `.env.example` es INCORRECTO) | `admin123` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `JWT_SECRET` | Secreto JWT (debe ser identico al del nuevo backend) | `secreto_lab_pucv_2024` |
| `CORS_ORIGIN` | Origenes permitidos, separados por coma | `http://localhost:4200,http://localhost:8100` |
| `AWS_BUCKET_NAME` | Nombre del bucket S3 (no `S3_BUCKET_NAME`) | `nombre-del-bucket` |
| `AWS_REGION` | Region de AWS | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Access key de AWS | `...` |
| `AWS_SECRET_ACCESS_KEY` | Secret key de AWS | `...` |

**Atencion:** `DB_HOST` debe ser `BD_AsisTec` (nombre del servicio Docker) cuando el backend corre dentro de Docker, y `localhost` cuando corre fuera de Docker en modo desarrollo.

---

## Levantar Todo con Docker (BD + Backend juntos)

El `docker-compose.yml` levanta BD + Backend juntos. Util en produccion.

Primera vez o reset de BD:

```bash
docker compose down -v
docker compose up --build
```

Reinicios posteriores sin borrar datos:

```bash
docker compose up
```

El compose hace automaticamente:
1. Levanta PostgreSQL 16 en el puerto 5432
2. Sincroniza el schema con `prisma db push`
3. Carga los seeds (usuarios, diluyentes, equipos)
4. Inicia el backend en `http://localhost:3001`

> **Usuarios Windows:** el `Dockerfile` incluye `dos2unix` para convertir los line endings del `docker-entrypoint.sh` automaticamente.

---

## Usuarios de Prueba

Disponibles despues de ejecutar los seeds:

| Correo | Rol | Contrasena |
|---|---|---|
| `analista@lab.cl` | Analista | `123456` |
| `coord@lab.cl` | Coordinadora | `123456` |
| `jefe@lab.cl` | Jefe de Area | `123456` |
| `ingreso@lab.cl` | Ingreso | `123456` |

---

## Prisma Studio (explorador de base de datos)

Como alternativa a PgAdmin, puedes explorar la base de datos en el navegador:

```bash
cd "AssisTec API"
npx prisma studio
```

Se abre en `http://localhost:5555`.

---

## Sobre el Script .bat (Windows)

El repositorio puede contener un archivo `.bat` creado por un companiero para automatizar el arranque en Windows. Ese script es obsoleto — los pasos manuales de esta guia son el metodo oficial. Si el `.bat` existe, no lo borres (puede ser util como referencia), pero no confies en el si algo no funciona.

---

## Problemas Comunes

### El backend no levanta y dice "Faltan variables de entorno criticas"

Si usas el backend legacy (`Backend/`): el `.env.example` tiene los nombres INCORRECTOS de las variables. El codigo lee `NOMBRE_DB` y `MI_CLAVE_POSTGRES`, no `DB_NAME` y `DB_PASSWORD`. Copia el bloque correcto de la seccion de variables de entorno de arriba.

### El frontend no puede conectarse al backend (error CORS)

Verifica que `CORS_ORIGIN` en el `.env` del backend legacy incluya el origen exacto del frontend: `http://localhost:4200` o `http://localhost:8100`. El backend rechaza todos los requests si esta variable esta vacia.

### La subida de imagenes falla con "Verifique su conexion"

El `.env` del servidor puede tener `S3_BUCKET_NAME` pero el codigo lee `AWS_BUCKET_NAME`. Asegurate de usar el nombre correcto.

### `DB_HOST` — diferencia entre Docker y local

- Corriendo el backend **dentro** de Docker: `DB_HOST=BD_AsisTec` (nombre del servicio en docker-compose)
- Corriendo el backend **fuera** de Docker (modo dev): `DB_HOST=localhost`
