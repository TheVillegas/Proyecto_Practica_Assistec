# Tasks: asistec-api-bootstrap

## Fase 1 — Corrección BD_NEW.sql

- [x] 1.1 Agregar `contrasena_usuario VARCHAR(255) NOT NULL` a tabla `usuarios`
- [x] 1.2 Corregir `REFERENCES usuarios(rut_analista)` → `REFERENCES usuarios(rut_usuario)` en `solicitud_ingreso` (líneas 119, 120, 121, 137)
- [x] 1.3 Corregir typo `FFALSE` → `FALSE` en `solicitud_analisis` (línea 159)
- [x] 1.4 Eliminar coma trailing en `solicitud_analisis` (línea 161)

## Fase 2 — Scaffolding del Proyecto

- [x] 2.1 Crear `package.json` con dependencias: express, @prisma/client, prisma (dev), bcryptjs, jsonwebtoken, cors, dotenv, winston
- [x] 2.2 Crear `app.js` — Express con CORS, JSON parser, health check, error handler global
- [x] 2.3 Crear `.env.example` con PORT, DATABASE_URL, JWT_SECRET
- [x] 2.4 Ejecutar `npm install`

## Fase 3 — Prisma Schema

- [x] 3.1 Crear `prisma/schema.prisma` con datasource postgresql
- [x] 3.2 Modelar tablas nuevas de BD_NEW.sql (usuarios, clientes, direcciones, categorías, acreditaciones, formularios, tiempos, solicitud_ingreso, solicitud_muestra, solicitud_analisis)
- [x] 3.3 Modelar tablas maestras compartidas (diluyentes, equipos_incubacion, instrumentos, checklist, formas_calculo, tipos_analisis, material_siembra, micropipetas, equipos_lab, lugares_almacenamiento)
- [x] 3.4 Modelar 3 tablas legacy con `@@map`: MuestraAli, TpaReporte, RamReporte
- [x] 3.5 Ejecutar `npx prisma validate` + `npx prisma generate`

## Fase 4 — Infraestructura (Config + Middleware)

- [x] 4.1 Crear `src/config/prisma.js` — Singleton PrismaClient
- [x] 4.2 Crear `src/config/roles.js` — Constantes de roles (ANALISTA=0, COORDINADORA=1, JEFE_AREA=2, INGRESO=3)
- [x] 4.3 Crear `src/middleware/auth.js` — verifyToken (JWT) + authorize(roles[])
- [x] 4.4 Crear `src/middleware/optimisticLock.js` — Validación de updated_at para concurrencia

## Fase 5 — Módulos de Negocio

### 5.1 Auth (Login)
- [x] 5.1.1 `repositories/usuario.repository.js` — findByCorreo, findByRut
- [x] 5.1.2 `services/auth.service.js` — login (bcrypt + JWT)
- [x] 5.1.3 `controllers/auth.controller.js` — validación HTTP
- [x] 5.1.4 `routes/auth.routes.js` — POST /api/auth/login

### 5.2 Solicitud de Ingreso
- [x] 5.2.1 `repositories/solicitud.repository.js` — create, findAll, findById, update
- [x] 5.2.2 `services/solicitud.service.js` — crear (con numero_ali autoincremental), listar (filtrado por rol), editar (validar estado), validar, devolver
- [x] 5.2.3 `controllers/solicitud.controller.js`
- [x] 5.2.4 `routes/solicitud.routes.js` — CRUD + validar + devolver

### 5.3 Submuestras
- [x] 5.3.1 `repositories/muestra.repository.js` — createBatch, findBySolicitud
- [x] 5.3.2 `services/muestra.service.js` — crear batch de 1-N
- [x] 5.3.3 `controllers/muestra.controller.js`
- [x] 5.3.4 `routes/muestra.routes.js`

### 5.4 Análisis
- [x] 5.4.1 `repositories/analisis.repository.js` — create, findByMuestra
- [x] 5.4.2 `services/analisis.service.js` — asignar análisis a submuestra
- [x] 5.4.3 `controllers/analisis.controller.js`
- [x] 5.4.4 `routes/analisis.routes.js`

### 5.5 Generación de Reportes (Bridge)
- [x] 5.5.1 `repositories/reporte.repository.js` — crearBridge (MUESTRAS_ALI + TPA + RAM en transacción)
- [x] 5.5.2 `services/reporte.service.js` — evaluar análisis → determinar qué reportes generar → ejecutar bridge
- [x] 5.5.3 `controllers/reporte.controller.js`
- [x] 5.5.4 `routes/reporte.routes.js` — POST /api/solicitud/:id/generar

### 5.6 Catálogos
- [x] 5.6.1 `repositories/catalogo.repository.js` — findAll por tipo
- [x] 5.6.2 `services/catalogo.service.js`
- [x] 5.6.3 `controllers/catalogo.controller.js`
- [x] 5.6.4 `routes/catalogo.routes.js` — GET /api/catalogo/:tipo

## Fase 6 — Verificación

- [x] 6.1 Health check: GET localhost:3001
- [x] 6.2 Login funcional con credenciales de prueba
- [x] 6.3 Flujo completo: crear solicitud → submuestras → análisis → generar reportes
- [x] 6.4 Verificar que TPA_REPORTE/RAM_REPORTE se crearon en BD
- [x] 6.5 Verificar optimistic locking (editar con updated_at desactualizado → 409)
