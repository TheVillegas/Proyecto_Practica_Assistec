# Asistec - Plataforma de Gestión de Laboratorio

Este documento explica cómo ejecutar el proyecto "Asistec" en cualquier computador, de forma sencilla y automatizada.

El proyecto está diseñado para funcionar en "contenedores" (Docker), lo que significa que **no necesitas instalar Node, Angular ni PostgreSQL** en tu equipo. Todo eso viene incluido y pre-configurado.

---

## 🛠️ ¿Qué necesitas tener instalado?

Solo necesitas dos cosas:
1.  **Docker Desktop**: El programa que hace funcionar el sistema. (Debe estar abierto).
2.  **Git Bash** (o cualquier terminal): Para descargar y arrancar el proyecto.

---

## ▶️ Cómo ejecutar el proyecto

### 1. Descargar el código
Abre tu terminal y ejecuta:

```bash
git clone <URL_DEL_REPO>
cd Proyecto_Practica
```

### 2. Configuración "Llave en mano" (.env)
El sistema necesita unas credenciales para funcionar.
1.  Entra a la carpeta `Backend`.
2.  Crea un archivo nuevo llamado `.env`.
3.  Pega el siguiente contenido:

```env
# --- Configuración Básica ---
PORT=3000
JWT_SECRET=secreto_lab_pucv_2024

# --- Base de Datos (Automática) ---
# No cambies esto, ya está coordinado con Docker
DB_USER=postgres
MI_CLAVE_POSTGRES=admin123
NOMBRE_DB=asistectest
DB_PORT=5432
DB_HOST=BD_AsisTec

# --- Fotos en la Nube (AWS S3) ---
# Si no tienes estas claves, el sistema funciona igual
# pero no podrás subir fotos nuevas.
AWS_REGION=us-east-1
AWS_BUCKET_NAME=nombre-de-tu-bucket
AWS_ACCESS_KEY_ID=PON_AQUI_TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=PON_AQUI_TU_SECRET_KEY
```

### 3. ¡Arrancar!
Vuelve a la carpeta principal (donde está el archivo `docker-compose.yml`) y escribe:

```bash
docker compose up --build
```

**¿Qué está pasando?**
*   El sistema descargará automáticamente la Base de Datos correcta (PostgreSQL).
*   Configurará el Servidor (Backend).
*   Preparará la Pantalla (Frontend).

Cuando veas un mensaje verde que dice `✔ Compiled successfully` (o similar), ¡está listo!

---

## 🌐 Cómo usar la plataforma

Abre tu navegador (Chrome, Edge, etc.) y entra a:

👉 **[http://localhost:8100](http://localhost:8100)**

(La API del sistema estará corriendo en segundo plano en [http://localhost:3000](http://localhost:3000)).

---

## � Sobre la Base de Datos (Opcional)

**No necesitas hacer nada aquí.** El sistema crea la base de datos, las tablas y maneja la información por ti de forma segura dentro del contenedor `contenedor_asistec_bd`.

Si por alguna razón técnica deseas "mirar" dentro de la base de datos cruda, puedes usar **PgAdmin** con los siguientes datos:
*   **Host**: `localhost`
*   **Puerto**: `5432`
*   **Usuario**: `postgres`
*   **Contraseña**: La que pusiste en el archivo `.env` (donde dice `MI_CLAVE_POSTGRES`). Por defecto es `admin123`.

*Pero recuerda: Toda la gestión se hace desde la página web (Agregar usuarios, ver reportes, etc).*

---

## ❓ Dudas frecuentes

**Las fotos no cargan / no se suben**
Revise que las credenciales de `AWS (AWS_ACCESS_KEY...)` en el archivo `.env` sean las correctas y recientes.

**El sistema no parte**
Asegúrese de que **Docker Desktop** esté abierto y con el ícono en verde antes de escribir el comando.
