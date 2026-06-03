# Especificación: Formularios Microbiológicos Backend

## Resumen

Endpoints REST seguros para los 3 formularios de análisis microbiológico de AssisTec: S. Aureus (6 etapas), Coliformes (4 fases) y Salmonella (10 fases). El sistema permite persistencia por etapa con optimistic locking atómico, autorización por ownership + RBAC, cálculos automáticos (UFC/g, NMP/100ml, Presencia/Ausencia) y validación de entrada con Zod. Resuelve los bugs críticos de TOCTOU e IDOR del PR #4 base.

## Capacidades Involucradas

- `micro-forms-crud` — Persistencia stage-by-stage con optimistic locking atómico
- `micro-forms-authz` — Autorización por ownership del analista + RBAC
- `micro-forms-calculations` — Cálculos automáticos de resultados
- `micro-forms-validation` — Validación de entrada con Zod y reglas de negocio

## Requisitos Funcionales

### RF-01: Creación automática de formularios al validar solicitud

**Historia de Usuario**: Como Sistema, quiero que al validarse completamente una Solicitud de Ingreso (aprobada por Jefatura y Coordinadora), se creen automáticamente los formularios de análisis correspondientes a los análisis seleccionados, para que el analista pueda empezar a registrar datos sin intervención manual.
**Criterios de Aceptación**:
- [ ] La creación se dispara automáticamente dentro del flujo de `validar()` en `solicitud.service.js`, cuando `isFullyValidated === true`
- [ ] Por cada `SolicitudAnalisis` asociado a la solicitud, el sistema consulta `FormularioAnalisis.codigo` para determinar el tipo de formulario a crear
- [ ] Mapeo de códigos: `SAU` → `SauFormulario`, `COLI` → `ColiFormulario`, `SAL` → `SalFormulario`
- [ ] Cada formulario se crea con las muestras vinculadas al análisis (`SolicitudMuestra`) y con estado `en_proceso`, `etapaActual: 1`
- [ ] `rutAnalista` se deja como `null` inicialmente (el analista se asigna al abrirlo)
- [ ] Si ya existe un formulario para ese `idSolicitudAnalisis`, se salta (idempotente)
- [ ] La operación es transactional: si falla la creación de un formulario, no se persiste ninguno
- [ ] No existe endpoint público `POST /api/formulario/{tipo}` — la creación es exclusivamente interna
**Dependencias**: `micro-forms-crud`, `micro-forms-authz`

### RF-02: Obtener formulario por ID

**Historia de Usuario**: Como Analista, Coordinadora o Jefa de Área, quiero consultar un formulario por su identificador, para ver todas sus etapas y muestras registradas.
**Criterios de Aceptación**:
- [ ] `GET /api/formulario/{tipo}/:id` devuelve 200 con el formulario completo (todas sus etapas, fases, muestras, lecturas)
- [ ] Devuelve 404 si el ID no existe
- [ ] El ID es un BigInt que se serializa como string en la respuesta
- [ ] La respuesta incluye `updated_at` del formulario para uso en el siguiente PUT
**Dependencias**: `micro-forms-authz`

### RF-03: Obtener formulario por análisis

**Historia de Usuario**: Como Analista, quiero consultar el formulario asociado a un análisis, para saber si ya fue creado o necesito crearlo.
**Criterios de Aceptación**:
- [ ] `GET /api/formulario/{tipo}/por-analisis/:idAnalisis` devuelve `{ existe: true, formulario: {...} }` o `{ existe: false, formulario: null }`
- [ ] Devuelve 200 con `existe: false` cuando no hay formulario vinculado (no devuelve 404)
- [ ] El endpoint es idempotente y de solo lectura
**Dependencias**: `micro-forms-authz`

### RF-04: Guardar etapa/fase con optimistic locking atómico

**Historia de Usuario**: Como Analista, quiero guardar el progreso de una etapa/fase específica, para que mis datos queden persistidos de forma segura ante ediciones concurrentes, permitiendo guardar borradores parciales sin exigir todos los campos obligatorios.
**Criterios de Aceptación**:
- [ ] `PUT /api/formulario/{tipo}/:id/etapa/:n` (S. Aureus, n=1..6) o `PUT /api/formulario/{tipo}/:id/fase/:n` (Coli n=1..4, Sal n=1..10)
- [ ] El body debe incluir `updated_at` del formulario; el server lo valida atómicamente
- [ ] El server usa `prisma.sauFormulario.updateMany({ where: { id, updatedAt: expected }, data: {...} })` y verifica `count === 1`
- [ ] Si `count === 0`, devuelve 409 con código `CONCURRENCY_ERROR`
- [ ] **Borrador vs Confirmación**: si `completada: false`, se guardan los campos enviados sin validar obligatoriedad. Si `completada: true`, se validan TODOS los campos obligatorios de la etapa antes de persistir.
- [ ] Si la validación Zod falla (por tipo o rango), devuelve 400 ANTES de tocar la base de datos
- [ ] Al guardar correctamente, `updated_at` se actualiza y se devuelve en la respuesta
- [ ] La progresión de etapas es secuencial: no se puede guardar la etapa N si la N-1 no tiene `completada: true`
- [ ] Cada tabla hija involucrada tiene `@updatedAt` para mantener su versionado
**Dependencias**: `micro-forms-crud`, `micro-forms-authz`, `micro-forms-validation`

### RF-05: Autorización por rol (RBAC)

**Historia de Usuario**: Como administrador del sistema, quiero que solo roles autorizados accedan a los endpoints, para cumplir con la matriz de permisos del ERS (Épica Permisos).
**Criterios de Aceptación**:
- [ ] Rutas de escritura (`POST`, `PUT`) requieren rol `ANALISTA` o `ADMINISTRATOR`; otro rol recibe 403 `UNAUTHORIZED_ROLE`
- [ ] Rutas de lectura (`GET`) admiten `ANALISTA`, `COORDINADORA`, `JEFE_AREA`, `ADMINISTRATOR`
- [ ] La verificación se hace en middleware ANTES de llegar al controller
**Dependencias**: ninguna

### RF-06: Protección contra condiciones de carrera (TOCTOU fix)

**Historia de Usuario**: Como Analista, quiero que mis cambios no se pierdan cuando otro analista guarda simultáneamente el mismo formulario, para evitar pérdida de datos por concurrencia.
**Criterios de Aceptación**:
- [ ] Cualquier analista autenticado con rol `ANALISTA` o `ADMINISTRATOR` puede editar cualquier formulario (no hay restricción por ownership — es intencional)
- [ ] La protección contra concurrencia se implementa vía optimistic locking atómico (descrito en RF-04): `updateMany({ where: { id, updatedAt } })` con verificación de `count === 1`
- [ ] Si `count === 0` se devuelve 409 `CONCURRENCY_ERROR` con mensaje "El formulario fue modificado por otro usuario. Recargue y vuelva a intentar."
- [ ] Sin esta protección, dos analistas guardando distinto campo de la misma etapa pisarían sus cambios silenciosamente
**Dependencias**: `micro-forms-crud` (RF-04)

### RF-07: Cálculo automático de UFC/g para S. Aureus (Etapa 5)

**Historia de Usuario**: Como Analista, quiero que el sistema calcule automáticamente las UFC/g usando los datos de las Etapas 2, 3 y 4, para eliminar errores manuales de transcripción (HU-06-05).
**Criterios de Aceptación**:
- [ ] La lógica de cálculo se adapta de la función `calculoRAM` del backend legacy (ubicada en `Backend/`), que contiene la fórmula validada por ASISTEC
- [ ] El cálculo se dispara automáticamente en el `PUT /:id/etapa/5` tras la validación Zod
- [ ] El resultado se persiste en `n_s_aureus` y `ufc_por_gramo` del modelo `SauEtapa5Resultado`
- [ ] El campo `resultado_final` (UFC/g) es de solo lectura — el servidor ignora cualquier valor enviado por el cliente y siempre usa el calculado
- [ ] El sistema detecta incongruencias entre recuentos (Etapa 2) y confirmaciones (Etapas 3-4) y emite alerta en la respuesta
- [ ] Cálculo verificable con al menos 3 casos de prueba contra la función legacy `calculoRAM`
**Dependencias**: `micro-forms-calculations`

### RF-08: Cálculo automático de NMP/100ml para Coliformes (Fase 4)

**Historia de Usuario**: Como Analista, quiero que el sistema calcule automáticamente el NMP/100ml, para determinar presencia de coliformes totales, fecales y E.Coli (HU-04-04).
**Criterios de Aceptación**:
- [ ] El cálculo usa la tabla NMP de referencia de ASISTEC con los tubos positivos por dilución
- [ ] Se calcula al guardar Fase 4 (`PUT /:id/fase/4`)
- [ ] Genera 3 valores: `coliformes_totales`, `coliformes_fecales`, `e_coli` por muestra
- [ ] Se persiste en `ColiFase4Resultado` por muestra
- [ ] El cálculo es determinista y testeable con 3 casos conocidos
**Dependencias**: `micro-forms-calculations`

### RF-09: Determinación Presencia/Ausencia para Salmonella (Fase 5)

**Historia de Usuario**: Como Analista, quiero que el sistema determine automáticamente Presencia o Ausencia según los resultados de agares (XLD/SS a 24h y 48h), para cerrar el flujo estandarizadamente (HU-04-04-01).
**Criterios de Aceptación**:
- [ ] El sistema evalúa la combinación de resultados Agar XLD/SS × 24h/48h × Selenito/Rappaport
- [ ] Si CUALQUIER agar muestra crecimiento típico, el resultado final es `Presencia`
- [ ] Si TODOS los agares muestran ausencia de crecimiento, el resultado final es `Ausencia`
- [ ] El sistema NO permite seleccionar manualmente el resultado final (se sobrescribe siempre)
- [ ] Se ejecuta al guardar Fase 5 (`PUT /:id/fase/5`)
- [ ] Determinación testeable con 3 casos de prueba (todos típicos, todos atípicos, mezcla)
**Dependencias**: `micro-forms-calculations`

### RF-10: Campo Resultado Final de solo lectura

**Historia de Usuario**: Como Analista, quiero que el campo Resultado Final no sea editable manualmente, para garantizar que solo refleje el cálculo del sistema (HU-06-05).
**Criterios de Aceptación**:
- [ ] Si el body del PUT incluye `resultado_final` con un valor distinto al calculado, el server lo IGNORA y usa el calculado
- [ ] La respuesta siempre incluye el `resultado_final` calculado por el sistema
- [ ] El campo calculado nunca se persiste desde el cliente; solo el server lo escribe
- [ ] Aplica a los 3 formularios (S. Aureus Etapa 5, Coli Fase 4, Sal Fase 5)
**Dependencias**: `micro-forms-calculations`

### RF-11: Validación Zod por etapa/fase

**Historia de Usuario**: Como Sistema, quiero validar el tipo, rango y obligatoriedad de cada campo por etapa/fase, para rechazar payloads malformados antes de llegar a Prisma.
**Criterios de Aceptación**:
- [ ] Existe un schema Zod distinto para cada combinación `{tipo} × {etapa|fase}`
- [ ] Validación de tipos (string, number, date, boolean, enum)
- [ ] Validación de rangos numéricos (ej. diluciones >= 1, UFC >= 0)
- [ ] Validación de obligatoriedad por campo (ej. `id_solicitud_muestra` requerido en creación)
- [ ] Validación de formato de fecha ISO-8601
- [ ] Validación aplicada como middleware Express ANTES del controller
- [ ] Errores devueltos como 400 con detalle por campo (`{ campo, mensaje }`)
**Dependencias**: ninguna

### RF-12: Validación de progresión de etapas y tolerancias temporales

**Historia de Usuario**: Como Sistema, quiero hacer cumplir la progresión secuencial de etapas y validar tolerancias temporales, para asegurar la integridad del flujo normativo.
**Criterios de Aceptación**:
- [ ] No se puede guardar la etapa N si la N-1 no tiene sus campos obligatorios completos (409 `INVALID_STAGE_PROGRESSION`)
- [ ] Coliformes: lectura 24h y 48h admiten tolerancia de ±2 horas (HU-04-03)
- [ ] Salmonella: alerta si el tiempo entre `inicio_homogeneizacion` y `ingreso_estufa` supera 25 minutos (HU-04-01-04)
- [ ] S. Aureus: tiempo entre homogeneizado y siembra debe ser < 15 minutos
- [ ] S. Aureus Etapa 2: bloqueada hasta cumplir tiempo de espera programado desde Etapa 1
- [ ] Las tolerancias se aplican en la validación, devolviendo 400 o 422 con código específico
- [ ] Salmonella matriz `polvo`: campos `hora_inicio_hidratacion` y `hora_termino_hidratacion` obligatorios y validados con duración >= 1h (HU-04-01-02)
- [ ] Salmonella matriz `chocolate`: `caldo_apt` se asigna automáticamente a `leche_descremada` y el body no puede sobrescribirlo (HU-04-01-03)
**Dependencias**: `micro-forms-validation`

### RF-13: Sanitización de errores del servidor

**Historia de Usuario**: Como Sistema, quiero que el handler de errores no filtre mensajes internos de Prisma al cliente, para no exponer detalles de implementación.
**Criterios de Aceptación**:
- [ ] El middleware global de errores (`app.js`) NO envía `err.message` ni `err.stack` al cliente
- [ ] Errores de Prisma (P2002, P2025, etc.) se mapean a códigos HTTP semánticos (409 unique, 404 not found, 400 invalid)
- [ ] Los detalles internos se loguean con `winston` (nivel `error`) pero la respuesta solo trae mensaje genérico o código
- [ ] Errores de validación Zod devuelven 400 con detalle por campo, sin filtrar el schema
**Dependencias**: ninguna

## Requisitos No Funcionales

- **RNF-01 — Rendimiento**: Todos los endpoints de formularios deben responder en menos de 3 segundos bajo carga normal (hasta 20 usuarios concurrentes) — ver RNF-001 del ERS.
- **RNF-02 — Concurrencia atómica**: La condición `WHERE id = ? AND updated_at = ?` en cada `update` es la ÚNICA forma de modificar un formulario. No se permiten lecturas + escrituras separadas para mutar el formulario principal.
- **RNF-03 — Auditoría**: Cada escritura registra `rutAnalista`, `updated_at` y (futuro) entrada en bitácora (RNF-007 ERS).
- **RNF-04 — Compatibilidad HTTP**: Respuestas JSON exclusivamente; sin estado server-side; tokens JWT en header `Authorization: Bearer`.
- **RNF-05 — Testabilidad**: Toda la lógica de cálculo (UFC, NMP, Salmonella) y de validación (Zod, ownership) debe ser testeable de forma unitaria sin servidor HTTP levantado.
- **RNF-06 — Cobertura de pruebas**: `npm test` debe pasar con 0 fallos. Casos mínimos: 3 casos por calculadora, 1 caso TOCTOU (10 requests paralelos), 1 caso IDOR por formulario, 1 caso de validación de progresión por formulario.

## Matriz de Trazabilidad

| RF-ID | HU-ERS | Capability | Endpoint principal |
|-------|--------|------------|--------------------|
| RF-01 | (general) | micro-forms-crud | `solicitud.service.js::validar()` (creación automática) |
| RF-02 | (general) | micro-forms-crud | `GET /api/formulario/{tipo}/:id` |
| RF-03 | (general) | micro-forms-crud | `GET /api/formulario/{tipo}/por-analisis/:idAnalisis` |
| RF-04 | (general) | micro-forms-crud | `PUT /api/formulario/{tipo}/:id/etapa\|fase/:n` |
| RF-05 | Permisos (Roles y Accesos) | micro-forms-authz | middleware `authorizeAny` |
| RF-06 | Permisos (Roles y Accesos) | micro-forms-authz | `assertCanWrite` en repository |
| RF-07 | HU-06-05 | micro-forms-calculations | `PUT /api/formulario/sau/:id/etapa/5` |
| RF-08 | HU-04-04 | micro-forms-calculations | `PUT /api/formulario/coli/:id/fase/4` |
| RF-09 | HU-04-04-01 | micro-forms-calculations | `PUT /api/formulario/sal/:id/fase/5` |
| RF-10 | HU-06-05 | micro-forms-calculations | (aplicado en RF-07/08/09) |
| RF-11 | (general) | micro-forms-validation | middleware Zod |
| RF-12 | HU-04-03, HU-04-01-04, HU-06-01 | micro-forms-validation | middleware Zod + reglas negocio |
| RF-13 | (seguridad implícita) | cross-cutting | middleware global de errores |

## Issues Conocidos Resueltos

| ID | Descripción | RF que lo cubre |
|----|-------------|-----------------|
| TOCTOU-01 | Race condition entre lectura y escritura del formulario | RF-04 + RF-06 |
| ERR-01 | `err.message` filtrado al cliente | RF-13 |
| TS-01 | Tablas hijas sin `@updatedAt` | RF-04 (sub-requisito) |
| IDOR-01 | ~~Analista A edita formulario de Analista B~~ | **No aplica** — cualquier analista puede editar cualquier formulario por regla de negocio |
| CALC-01 | Fórmula UFC/g debe provenir del legacy `calculoRAM` | RF-07 |

## Out of Scope (No Especificado Aquí)

- Endpoints de Enterobacterias (Épica 5) y Mohos y Levaduras (Épica 7)
- Frontend Angular/Ionic (cambio separado)
- Notificaciones por email (HU-02-01)
- Exportación PDF/Excel
- Endpoint de validación final del cierre con normativa Sernapesca (HU-06-06) — solo se especifica el guardado de la Etapa 6; la lógica de comparación con manual de inocuidad se difiere
- Endpoint público `POST /api/formulario/{tipo}` — la creación es automática desde el flujo de validación
