# Deuda Técnica — MuestraAli auto-generate

## CRITICAL

### 1. Atomicidad entre validación y creación de MuestraAli

**Archivo**: `AssisTec API/src/services/solicitud.service.js:237`

`generarDesdeValidacion()` se ejecuta fuera de la transacción de validación. Si falla (crash de DB, timeout), la solicitud queda en estado `validado` pero sin registro en `muestras_ali`.

**Fix ideal**: Mover `crearBridge` dentro de la transacción refactorizando `reporteRepository.crearBridge()` para aceptar un `tx` de Prisma y ejecutarlo dentro del mismo `prisma.$transaction()` de `validar()`.

**Impacto**: Bajo probabilidad, alto impacto si ocurre (inconsistencia).

### 2. N+1 queries en findAll() de MuestraAli

**Archivo**: `AssisTec API/src/repositories/muestraAli.repository.js:15-18`

Por cada MuestraAli se ejecutan 5 queries para buscar sus formularios microbiológicos (SolicitudIngreso → SolicitudMuestra → SolicitudAnalisis → SAU/COLI/SAL).

**Fix ideal**: Hacer un solo JOIN con Prisma navegando `MuestraAli.codigoAli → SolicitudIngreso.numeroAli → muestras → analisis → formularios`. O usar una vista materializada.

**Impacto**: Alto con muchas muestras (>100). Hoy imperceptible.

## WARNING (theoretical)

### 3. Falta de verificación de ownership en PUT /observaciones

**Archivo**: `AssisTec API/src/controllers/muestraAli.controller.js:35`

Cualquier analista puede modificar observaciones de cualquier `codigo_ali`. No se verifica que el usuario tenga asignada la solicitud vinculada.

**Fix ideal**: Verificar que el `codigo_ali` pertenece a una solicitud asignada al usuario actual.

## SUGGESTION

### 4. Magic strings para estados

`'NO_REALIZADO'` aparece hardcodeado en varios archivos. Refactorizar a constantes compartidas si cambian los estados.

### 5. Código muerto en frontend

`AliService.agregarMuestraALI()` apunta a `/crearMuestra` que no existe en el backend activo. Considerar eliminarlo.

### 6. Magic numbers para roles en reporte.service.js

`usuario.role === 1 / 2` hardcodeados. Usar `ROLES.COORDINADORA / ROLES.JEFE_AREA`.
