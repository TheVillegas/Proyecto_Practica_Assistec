@echo off
echo ========================================================
echo   Iniciando Entorno de Desarrollo - AsisTec Lab
echo ========================================================
echo.

echo [1/4] Levantando Base de Datos en Docker...
docker compose up -d BD_AsisTec
echo.

echo [2/4] Sincronizando BD y Cargando Datos Semilla...
cd "AssisTec API"
call npx prisma db push
node run-seeds.js
cd ..
echo.

echo [3/4] Levantando Backend (API)...
start "AssisTec API" cmd /k "cd ""AssisTec API"" && npm run dev"

echo [4/4] Levantando Frontend (Angular)...
start "AssisTec Frontend" cmd /k "cd Frontend && npm start"

echo ========================================================
echo   ¡Entorno iniciado exitosamente! 
echo.
echo   - La API se abrio en una nueva ventana (Puerto 3001)
echo   - El Frontend se abrio en otra ventana (Puerto 4200)
echo ========================================================
echo.
echo 🔐 CREDENCIALES DE ADMINISTRADOR:
echo Usa cualquiera de estos dos accesos para tener maximos privilegios:
echo.
echo 1. Jefe de Area (Rol 2)
echo    Correo: jefe@lab.cl
echo    Clave:  123456
echo.
echo 2. Coordinadora (Rol 1)
echo    Correo: coord@lab.cl
echo    Clave:  123456
echo.
echo (Puedes cerrar esta ventana cuando quieras, los servidores 
echo seguiran corriendo en sus respectivas ventanas negras).
echo ========================================================
pause
