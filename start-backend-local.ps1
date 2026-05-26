<#
.SYNOPSIS
  Arranca el backend AssisTec API sin Docker en Windows.
.DESCRIPTION
  Verifica prerequisitos (Node.js, pnpm, PostgreSQL), sincroniza la BD,
  carga seeds y arranca el servidor en http://localhost:3001.
.PARAMETER pgPassword
  Contrasena de PostgreSQL (default: admin123).
  Si falla, te la pide por teclado.
.EXAMPLE
  .\start-backend-local.ps1
  .\start-backend-local.ps1 -pgPassword miClave
#>

param(
    [string]$pgPassword = "admin123"
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $rootDir "AssisTec API"

$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host ""
Write-Host "========================================"
Write-Host "  AssisTec API — Arranque local"
Write-Host "  (sin Docker)"
Write-Host "========================================"
Write-Host ""

# ─── Prerequisitos ────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[1/7] Verificando prerequisitos..."
$Host.UI.RawUI.ForegroundColor = "White"

# Node.js
try {
    $nodeVer = node --version
    Write-Host "  [OK] Node.js $nodeVer"
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  [FAIL] Node.js no encontrado"
    Write-Host "  Descargalo de https://nodejs.org/ (version 18+)"
    $Host.UI.RawUI.ForegroundColor = "White"
    exit 1
}

# pnpm
try {
    $pnpmVer = pnpm --version
    Write-Host "  [OK] pnpm $pnpmVer"
} catch {
    Write-Host "  [..] Instalando pnpm..."
    npm install -g pnpm
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] pnpm instalado"
    } else {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  [FAIL] No se pudo instalar pnpm"
        $Host.UI.RawUI.ForegroundColor = "White"
        exit 1
    }
}

# PostgreSQL service
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  [FAIL] PostgreSQL no instalado"
    Write-Host "  Descargalo de https://www.postgresql.org/download/windows/"
    $Host.UI.RawUI.ForegroundColor = "White"
    exit 1
}
if ($pgService.Status -ne "Running") {
    Write-Host "  [..] Iniciando PostgreSQL..."
    Start-Service $pgService.Name
    if ($pgService.Status -eq "Running") {
        Write-Host "  [OK] PostgreSQL iniciado"
    } else {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  [FAIL] No se pudo iniciar PostgreSQL"
        $Host.UI.RawUI.ForegroundColor = "White"
        exit 1
    }
} else {
    Write-Host "  [OK] PostgreSQL corriendo"
}

# ─── Base de datos ────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[2/7] Verificando base de datos..."
$Host.UI.RawUI.ForegroundColor = "White"

# Probar conexion con la contraseña recibida; si falla, pedirla
$env:PGPASSWORD = $pgPassword
$connected = $false
for ($attempt = 0; $attempt -lt 2; $attempt++) {
    $test = & psql -U postgres -h localhost -p 5432 -t -c "SELECT 1" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        break
    }
    if ($attempt -eq 0) {
        $Host.UI.RawUI.ForegroundColor = "Yellow"
        Write-Host "  [..] No conecta con la contrasena '$pgPassword'"
        $Host.UI.RawUI.ForegroundColor = "White"
        $pgPassword = Read-Host "  Ingresa la contrasena de PostgreSQL"
        $env:PGPASSWORD = $pgPassword
    }
}

if (-not $connected) {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  [FAIL] No se pudo conectar a PostgreSQL"
    $Host.UI.RawUI.ForegroundColor = "White"
    exit 1
}

# Crear base si no existe
$dbExists = & psql -U postgres -h localhost -p 5432 -t -c "SELECT 1 FROM pg_database WHERE datname='asistectest'" 2>$null
$dbExists = $dbExists.Trim()

if ($dbExists -ne "1") {
    Write-Host "  [..] Creando base 'asistectest'..."
    & psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE asistectest" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Base 'asistectest' creada"
    } else {
        $Host.UI.RawUI.ForegroundColor = "Red"
        Write-Host "  [FAIL] No se pudo crear la base de datos"
        $Host.UI.RawUI.ForegroundColor = "White"
        exit 1
    }
} else {
    Write-Host "  [OK] Base 'asistectest' ya existe"
}

# ─── .env ─────────────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[3/7] Configurando .env..."
$Host.UI.RawUI.ForegroundColor = "White"

$envFile = Join-Path $apiDir ".env"
$envExample = Join-Path $apiDir ".env_example"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "  [OK] .env creado desde .env_example"
} else {
    Write-Host "  [OK] .env ya existe"
}

# ─── pnpm install ─────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[4/7] Instalando dependencias..."
$Host.UI.RawUI.ForegroundColor = "White"

Push-Location $apiDir
try {
    if (-not (Test-Path "node_modules")) {
        pnpm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Dependencias instaladas"
        } else {
            throw "pnpm install fallo"
        }
    } else {
        Write-Host "  [OK] node_modules ya existe"
    }
} finally {
    Pop-Location
}

# ─── Prisma ───────────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[5/7] Sincronizando esquema con Prisma..."
$Host.UI.RawUI.ForegroundColor = "White"

Push-Location $apiDir
try {
    pnpm exec prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Esquema sincronizado"
    } else {
        throw "prisma db push fallo"
    }
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  [FAIL] Error al sincronizar Prisma"
    $Host.UI.RawUI.ForegroundColor = "White"
    exit 1
} finally {
    Pop-Location
}

# ─── Seeds ────────────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Yellow"
Write-Host "[6/7] Cargando datos iniciales..."
$Host.UI.RawUI.ForegroundColor = "White"

Push-Location $apiDir
try {
    node run-seeds.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Seeds cargados"
    } else {
        throw "run-seeds.js fallo"
    }
} catch {
    $Host.UI.RawUI.ForegroundColor = "Red"
    Write-Host "  [FAIL] Error al cargar seeds"
    $Host.UI.RawUI.ForegroundColor = "White"
    exit 1
} finally {
    Pop-Location
}

# ─── Arranque ─────────────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Green"
Write-Host ""
Write-Host "[7/7] Iniciando servidor..."
Write-Host ""
Write-Host "  http://localhost:3001"
Write-Host ""
Write-Host "  Para detener: Ctrl + C"
Write-Host ""
Write-Host "========================================"
$Host.UI.RawUI.ForegroundColor = "White"

Push-Location $apiDir
try {
    pnpm run dev
} finally {
    Pop-Location
}
