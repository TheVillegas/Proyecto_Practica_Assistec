# Asistec - Plataforma de Gestión de Laboratorio

Este documento explica cómo ejecutar el proyecto "Asistec" en cualquier computador, de forma sencilla y automatizada.

El proyecto ha sido migrado a un modelo **Híbrido**. Utilizamos **Docker únicamente para la Base de Datos** (PostgreSQL), mientras que el Backend (`AssisTec API`) y Frontend (`Frontend`) se ejecutan localmente para aprovechar las herramientas de desarrollo modernas (como Prisma Studio y recargas en caliente).

---

## 🛠️ ¿Qué necesitas tener instalado?

1.  **Docker Desktop**: El programa que alojará la base de datos PostgreSQL.
2.  **Node.js** (v18 o superior): Para ejecutar el código del Backend y Frontend.
3.  **Git Bash** (o cualquier terminal): Para descargar y arrancar el proyecto.

---

## ▶️ Cómo ejecutar el proyecto paso a paso

### 1. Descargar el código
Abre tu terminal y ejecuta:

```bash
git clone <URL_DEL_REPO>
cd Proyecto_Practica
```

### 2. Levantar la Base de Datos (Docker)
Asegúrate de tener Docker Desktop abierto. En la carpeta raíz (donde está el `docker-compose.yml`), ejecuta:

```bash
docker compose up -d
```
*(Esto descargará y ejecutará PostgreSQL en el puerto 5432 de forma silenciosa en el fondo).*

### 3. Configurar y Levantar el Backend (AssisTec API)
El backend ahora está construido con Node.js y **Prisma ORM**.

1. Abre una nueva terminal y entra a la carpeta del backend:
   ```bash
   cd "AssisTec API"
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la carpeta `AssisTec API` con el siguiente contenido:
   ```env
   # Conexión a la base de datos PostgreSQL en Docker
   DATABASE_URL="postgresql://postgres:admin123@localhost:5432/asistectest?schema=public"
   
   # JWT Secret para autenticación
   JWT_SECRET="secreto_lab_pucv_2024"
   ```
4. Sincroniza la Base de Datos y carga los datos semilla (Diluyentes, Equipos, Usuarios base):
   ```bash
   npx prisma db push
   node run-seeds.js
   ```
5. ¡Arranca el servidor!
   ```bash
   npm run dev
   ```
*(Verás un mensaje: "🚀 AssisTec API corriendo en puerto 3001")*

### 4. Configurar y Levantar el Frontend (Angular/Ionic)
1. Abre OTRA pestaña en tu terminal y entra a la carpeta Frontend:
   ```bash
   cd Frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. ¡Arranca la aplicación!
   ```bash
   npm start
   ```

---

## 🚀 Despliegue a Producción (EC2)

Si estás subiendo este proyecto a un servidor **EC2 en AWS** u otro VPS, el `docker-compose.yml` está preparado para levantar **toda la infraestructura del Backend** (Base de Datos + API Node.js).

En tu servidor de producción, simplemente sube el código y ejecuta:
```bash
docker compose up -d --build
```
Esto hará lo siguiente:
1. Levantará el contenedor `contenedor_asistec_bd` con PostgreSQL.
2. Levantará el contenedor `contenedor_asistec_backend` (La API en Node).
3. **Automáticamente** sincronizará las tablas de Prisma y ejecutará los seeds mediante el archivo `docker-entrypoint.sh`.
4. El backend quedará expuesto y listo en el puerto `3001`.

*(Nota: En producción, el Frontend de Angular generalmente se compila con `npm run build` y se sirve usando NGINX o Amazon S3).*

---

## 🌐 Cómo usar la plataforma (Desarrollo)

Abre tu navegador (Chrome, Edge, etc.) y entra a:

👉 **[http://localhost:4200](http://localhost:4200)**

Para iniciar sesión y probar los roles, utiliza los correos precargados:
- **Analista**: `analista@lab.cl`
- **Coordinadora**: `coord@lab.cl`
- **Jefe de Área**: `jefe@lab.cl`
- **Ingreso**: `ingreso@lab.cl`
*(La contraseña de todos es: `123456`)*

---

## 💾 Sobre la Base de Datos (PgAdmin o Prisma Studio)

Si necesitas ver los datos crudos, ya no necesitas PgAdmin. Gracias a Prisma, puedes ver tu base de datos directamente en el navegador.
Solo abre una terminal en `AssisTec API` y ejecuta:

```bash
npx prisma studio
```
Se abrirá una interfaz gráfica en `http://localhost:5555` donde podrás ver y editar todas las tablas fácilmente.
