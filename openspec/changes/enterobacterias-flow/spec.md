# Especificación: Enterobacterias Flow

## Resumen

Conecta el frontend `form-enterobacterias` (stub de 8 sub-pasos sin backend) con un módulo backend completo bajo el patrón `sau_*` / `coli_*` / `sal_*`. Define el mapeo estricto entre el wizard (3 etapas principales con 8 sub-etapas) y los endpoints `PUT /api/formulario/ent/:id/etapa/:n`, impone la regla de bloqueo por 24h de incubación antes de pasar a Etapa 2, y crea la tabla maestra `LoteReactivo` con sembrado de los lotes "Agar VRBG" y "Tween 80" mediante un archivo de migración SQL escrito a mano. Cubre el cierre del flujo de Épica 5 del ERS v3.0.

## Capacidades Involucradas

| ID | Capacidad | Tipo |
|----|-----------|------|
| ECB | `enterobacterias-crud` | Nueva |
| EFW | `enterobacterias-frontend` | Nueva |
| RLC | `reactivo-lots-catalog` | Nueva |

---

## Mapeo Wizard → Endpoints (DIRECTIVA EXPLÍCITA DEL USUARIO)

El frontend actual muestra 3 etapas principales con 8 sub-pasos y el botón "Siguiente" navega entre pasos sin persistir ni respetar fronteras de etapa. La especificación define el mapeo estricto:

| Paso UI | Etapa Backend | Sub-etapa | Acción de "Siguiente" | Acción de "Anterior" |
|---------|---------------|-----------|------------------------|----------------------|
| 1 | **Etapa 1** Preparación | Pesado | Avanza local a paso 2 (no guarda) | — |
| 2 | **Etapa 1** Preparación | Homogeneización | Avanza local a paso 3 (no guarda) | Paso 1 (local) |
| 3 | **Etapa 1** Preparación | Sembrado | Avanza local a paso 4 (no guarda) | Paso 2 (local) |
| 4 | **Etapa 1** Preparación | Incubación | `PUT /:id/etapa/1` con `completada: true` → avanza a paso 5 | Paso 3 (local) |
| 5 | **Etapa 2** Análisis | Lectura 24h | `PUT /:id/etapa/2` con `completada: true` → avanza a paso 6 | Paso 4 (local) |
| 6 | **Etapa 3** Confirmación | Incubación | Avanza local a paso 7 (no guarda) | Paso 5 (local) |
| 7 | **Etapa 3** Confirmación | Lectura (Oxidasa) | Avanza local a paso 8 (no guarda) | Paso 6 (local) |
| 8 | **Etapa 3** Confirmación | Resultados | `PUT /:id/etapa/3` con `completada: true` → finaliza | Paso 7 (local) |

**Reglas del botón "Siguiente":**
- "Siguiente" SOLO navega entre sub-etapas dentro de la misma etapa principal sin tocar la API.
- "Siguiente" SOLO ejecuta `PUT /:id/etapa/:n` cuando el paso actual es la ÚLTIMA sub-etapa de una etapa principal (pasos 4, 5 u 8).
- El payload del `PUT` contiene TODAS las sub-etapas de la etapa padre aplanadas (no se persisten sub-etapas individualmente).
- "Anterior" SIEMPRE es navegación local; NUNCA borra datos del backend.
- "Guardar Borrador" ejecuta `PUT /:id/etapa/:n` con `completada: false` y permanece en el mismo paso.

---

## Capacidad: `enterobacterias-crud`

### Requisito: ECB-01 — Creación automática del formulario

El sistema SHALL crear el `EntFormulario` automáticamente al validarse completamente la `SolicitudAnalisis` asociada (igual que `sau_*` / `coli_*` / `sal_*`), con `etapaActual: 1` y `estado: 'en_proceso'`.

#### Escenario: Solicitud validada genera formulario de Enterobacterias
- GIVEN una `SolicitudAnalisis` con `codigoFormulario = 'ENT'` queda `isFullyValidated = true`
- WHEN el flujo de validación ejecuta `solicitud.service.js::validar()`
- THEN SHALL crear `EntFormulario` vinculado al `id_solicitud_analisis`
- AND SHALL vincular las `EntMuestra` correspondientes a las `SolicitudMuestra` del análisis

#### Escenario: Formulario ya existente (idempotencia)
- GIVEN ya existe un `EntFormulario` para el `id_solicitud_analisis`
- WHEN se vuelve a invocar `validar()`
- THEN SHALL omitir la creación sin error

### Requisito: ECB-02 — Guardar etapa con optimistic locking

El sistema SHALL exponer `PUT /api/formulario/ent/:id/etapa/:n` con `:n ∈ {1,2,3}`, validación Zod previa, y optimistic locking atómico vía `updated_at` del formulario (patrón `updateMany({ where: { id, updatedAt }, data })`, verifica `count === 1`).

#### Escenario: Guardado exitoso de etapa 1
- GIVEN un `EntFormulario` con `updated_at = T` y las 4 sub-etapas completas en payload
- WHEN el analista envía `PUT /:id/etapa/1` con `completada: true` y `updated_at: T`
- THEN SHALL persistir los datos aplanados de las 4 sub-etapas en `ent_etapa1`
- AND SHALL actualizar `ent_formulario.etapa_actual = 2` y `updated_at = T+1`
- AND SHALL responder 200 con el `updated_at` nuevo

#### Escenario: Conflicto de concurrencia (409)
- GIVEN otro analista modificó el formulario entre el GET y el PUT (cambió `updated_at`)
- WHEN el server ejecuta `updateMany` y `count === 0`
- THEN SHALL responder 409 con código `CONCURRENCY_ERROR` y mensaje "El formulario fue modificado por otro usuario. Recargue y vuelva a intentar."

#### Escenario: Borrador parcial (no valida obligatoriedad)
- GIVEN el analista envía `PUT /:id/etapa/1` con `completada: false` y solo 2 de 4 sub-etapas con datos
- WHEN el server procesa
- THEN SHALL persistir los campos enviados sin exigir obligatoriedad
- AND SHALL responder 200 sin avanzar `etapa_actual`

### Requisito: ECB-03 — Progresión secuencial de etapas

El sistema SHALL rechazar con 409 `INVALID_STAGE_PROGRESSION` cualquier intento de guardar etapa N cuando N-1 no tenga `completada: true`.

#### Escenario: Intento de saltar etapa 1
- GIVEN `EntFormulario.etapa_actual = 1` y `ent_etapa1.completada = false`
- WHEN el analista envía `PUT /:id/etapa/2`
- THEN SHALL responder 409 con código `INVALID_STAGE_PROGRESSION`

#### Escenario: Etapas en orden
- GIVEN `ent_etapa1.completada = true` y `ent_etapa2` no existe aún
- WHEN el analista envía `PUT /:id/etapa/2`
- THEN SHALL crear `ent_etapa2` y avanzar `etapa_actual = 3`

### Requisito: ECB-04 — Validación de 24h de incubación (LAB-4)

El sistema SHALL rechazar con 422 `INCUBATION_LOCKOUT` cualquier `PUT /:id/etapa/2` enviado antes de que hayan transcurrido 24 horas desde `ent_etapa1.fecha_inicio_incubacion`.

#### Escenario: Lectura 24h prematura
- GIVEN `ent_etapa1.fecha_inicio_incubacion = 2026-06-22T08:00:00Z` y la hora actual es `2026-06-22T20:00:00Z` (12h)
- WHEN el analista envía `PUT /:id/etapa/2` con `completada: true`
- THEN SHALL responder 422 con código `INCUBATION_LOCKOUT`
- AND SHALL incluir en la respuesta el tiempo restante en horas

#### Escenario: Lectura 24h en ventana válida
- GIVEN `fecha_inicio_incubacion = 2026-06-22T08:00:00Z` y la hora actual es `2026-06-23T08:30:00Z` (24.5h)
- WHEN el analista envía `PUT /:id/etapa/2`
- THEN SHALL procesar el guardado normalmente (no rechaza por lockout)
- AND SHALL persistir `ent_etapa2.fecha_lectura_24h` y los conteos

#### Escenario: Tolerancia de ±2 horas
- GIVEN `fecha_inicio_incubacion = T` y la hora actual es `T + 22h` (2h antes del límite)
- WHEN el analista envía `PUT /:id/etapa/2`
- THEN SHALL responder 422 con código `INCUBATION_LOCKOUT_TOLERANCE`

### Requisito: ECB-05 — Validación de formato de Reactivo de Oxidasa

El sistema SHALL validar en el schema Zod que `ent_etapa3.reactivo_oxidasa` matche la expresión regular `^R69-\d{2}-(0[12])$`. Si no matchea, SHALL responder 400 con detalle de campo.

#### Escenario: Formato inválido
- GIVEN el analista envía `reactivo_oxidasa = "R69-25-99"` en `PUT /:id/etapa/3`
- WHEN el server valida
- THEN SHALL responder 400 con `{ campo: 'reactivo_oxidasa', mensaje: 'Formato debe ser R69-AA-NN donde NN es 01 o 02' }`

#### Escenario: Formato válido
- GIVEN `reactivo_oxidasa = "R69-25-01"`
- WHEN el server valida
- THEN SHALL aceptar el valor y persistirlo

### Requisito: ECB-06 — Autorización por rol (RBAC)

El sistema SHALL aplicar las siguientes matrices de autorización:
- `WRITE_ROLES = [0, 4]` (Analista, Admin) en `PUT /:id/etapa/:n`
- `READ_ROLES = [0, 1, 2, 4]` (Analista, Coordinadora, Jefe Área, Admin) en `GET /:id` y `GET /por-analisis/:idAnalisis`

#### Escenario: Coordinadora intenta escribir
- GIVEN un usuario con `rol = 1` (Coordinadora) autenticado
- WHEN envía `PUT /:id/etapa/1`
- THEN SHALL responder 403 con código `UNAUTHORIZED_ROLE`

#### Escenario: Coordinadora lee (no escribe)
- GIVEN un usuario con `rol = 1`
- WHEN envía `GET /:id`
- THEN SHALL responder 200 con el formulario completo (lectura permitida)

### Requisito: ECB-07 — Endpoints de lectura

El sistema SHALL exponer:
- `GET /api/formulario/ent/por-analisis/:idAnalisis` → `{ existe: true|false, formulario: ... }`
- `GET /api/formulario/ent/:id` → formulario completo con todas sus etapas y muestras
- Ambos SHALL serializar BigInt como string en la respuesta JSON.

#### Escenario: Consulta por análisis sin formulario
- GIVEN no existe `EntFormulario` para `idAnalisis = 99`
- WHEN el analista envía `GET /por-analisis/99`
- THEN SHALL responder 200 con `{ existe: false, formulario: null }` (NO 404)

---

## Capacidad: `enterobacterias-frontend`

### Requisito: EFW-01 — Refactor del wizard en 8 sub-componentes

El sistema SHALL descomponer `FormEnterobacteriasPage` (386 líneas monolíticas) en:
- Un componente contenedor (`FormEnterobacteriasPage`) que mantiene estado de navegación
- 8 sub-componentes de paso: `EntPesadoComponent`, `EntHomogeneizacionComponent`, `EntSembradoComponent`, `EntIncubacionPrepComponent`, `EntAnalisisLecturaComponent`, `EntIncubacionConfComponent`, `EntLecturaOxidasaComponent`, `EntResultadosComponent`
- Cada sub-componente SHALL tener su propio `FormGroup` tipado y emitir `(subetapaCompleta)` al contenedor

#### Escenario: Avance local entre sub-etapas de Etapa 1
- GIVEN el analista está en paso 1 (Pesado) y completó los campos
- WHEN presiona "Siguiente"
- THEN SHALL avanzar a paso 2 (Homogeneización) SIN invocar ningún endpoint HTTP
- AND SHALL conservar los datos del paso 1 en memoria

#### Escenario: Cruce de frontera Etapa 1 → Etapa 2
- GIVEN el analista está en paso 4 (Incubación) y todos los campos de las 4 sub-etapas están completos
- WHEN presiona "Siguiente"
- THEN SHALL invocar `PUT /api/formulario/ent/:id/etapa/1` con `completada: true` y el payload aplanado de las 4 sub-etapas
- AND SHALL avanzar a paso 5 (Análisis) solo si la respuesta es 2xx

### Requisito: EFW-02 — Servicio HTTP tipado

El sistema SHALL crear `enterobacterias-api.service.ts` con métodos:
- `obtenerPorAnalisis(idAnalisis: number): Observable<{ existe: boolean; formulario: EntFormularioCompleto | null }>`
- `obtener(idFormulario: number): Observable<EntFormularioCompleto>`
- `guardarEtapa(idFormulario: number, etapa: 1 | 2 | 3, payload: EntEtapaPayload, updatedAt: string): Observable<EntFormularioCompleto>`

#### Escenario: Inyección basada en `inject()`
- GIVEN el servicio se define con `providedIn: 'root'`
- WHEN un componente lo consume
- THEN SHALL usar `inject(EnterobacteriasApiService)` (no constructor injection)

### Requisito: EFW-03 — Catálogos consumidos desde tablas maestras

El sistema SHALL poblar `<ion-select>` con datos de `CatalogosService` para los siguientes campos, eliminando las constantes hardcodeadas:

| Campo UI | Catálogo backend | Endpoint |
|----------|------------------|----------|
| `estufaSembrado`, `estufaIncub`, `estufaConfIncub` | `equipos_incubacion` | `GET /catalogo/equipos_incubacion` |
| `analistaInicio`, `analistaHomog`, etc. | `usuarios` (rol 0) | `GET /catalogo/usuarios` |
| `micropipeta1mlSembrado` | `micropipetas` | `GET /catalogo/micropipetas` |
| `agarVRBGSembrado`, `agarVRBGIncub` | `lotes_reactivo` (tipo `agar_vrbg`) | `GET /catalogo/lotes_reactivo?tipo=agar_vrbg` |
| `tween80Sembrado` (si aplica) | `lotes_reactivo` (tipo `tween_80`) | `GET /catalogo/lotes_reactivo?tipo=tween_80` |

#### Escenario: Carga paralela de catálogos
- GIVEN el analista abre el formulario
- WHEN se ejecuta `ngOnInit`
- THEN SHALL invocar en paralelo (forkJoin) las 5 consultas de catálogo
- AND SHALL mostrar un spinner mientras cargan

### Requisito: EFW-04 — UI de solo lectura para Coordinadora

El sistema SHALL detectar el rol del usuario autenticado y deshabilitar TODOS los `<ion-input>`, `<ion-select>` y `<ion-textarea>` cuando el rol sea `1` (Coordinadora), `2` (Jefe Área) o no sea `[0, 4]`.

#### Escenario: Coordinadora abre formulario
- GIVEN la usuaria con `rol = 1` navega a `/form-enterobacterias/:id`
- WHEN se carga la página
- THEN SHALL renderizar los campos en modo `disabled = true`
- AND SHALL ocultar los botones "Siguiente", "Anterior" y "Guardar Borrador"
- AND SHALL mostrar el banner "Modo lectura — solo Analista o Admin pueden editar"

#### Escenario: Analista edita
- GIVEN el analista con `rol = 0` abre el formulario
- WHEN se carga la página
- THEN SHALL renderizar campos editables y SHALL mostrar el botón "Siguiente"

### Requisito: EFW-05 — Ruta con acceso para lectura (LAB-6)

El sistema SHALL modificar el `app-routing.module.ts` para incluir el rol `1` (Coordinadora) en `allowedRoles` de la ruta `/form-enterobacterias/:id`, manteniendo escritura solo para `[0, 4]`.

#### Escenario: Ruta con permisos ampliados
- GIVEN la configuración de ruta actual tiene `allowedRoles: [0, 4]`
- WHEN se aplica el cambio
- THEN SHALL ser `allowedRoles: [0, 1, 2, 4]`
- AND SHALL delegar el control fino de UI al requisito EFW-04

---

## Capacidad: `reactivo-lots-catalog`

### Requisito: RLC-01 — Tabla maestra `LoteReactivo`

El sistema SHALL crear la tabla `lotes_reactivo` con los siguientes campos:

| Columna | Tipo SQL | Restricciones | Mapeo Prisma |
|---------|----------|---------------|--------------|
| `id_lote_reactivo` | `BIGSERIAL` | PK | `idLoteReactivo` |
| `tipo` | `VARCHAR(20)` | NOT NULL, CHECK en `(agar_vrbg, tween_80)` | `tipo` |
| `codigo_lote` | `VARCHAR(50)` | NOT NULL, UNIQUE | `codigoLote` |
| `fecha_vencimiento` | `DATE` | nullable | `fechaVencimiento` |
| `activo` | `BOOLEAN` | NOT NULL DEFAULT true | `activo` |
| `created_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP | `createdAt` |
| `updated_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP | `updatedAt` |

#### Escenario: Listar lotes por tipo
- GIVEN existen 3 lotes de `agar_vrbg` y 2 de `tween_80` activos
- WHEN el frontend invoca `GET /catalogo/lotes_reactivo?tipo=agar_vrbg`
- THEN SHALL responder 200 con los 3 lotes `agar_vrbg` filtrados

### Requisito: RLC-02 — Sembrado de datos iniciales en la migración SQL

La migración SQL SHALL incluir las siguientes inserciones dentro del mismo archivo `.sql` (no en un seed aparte):

| `tipo` | `codigo_lote` | `fecha_vencimiento` | `activo` |
|--------|---------------|---------------------|----------|
| `agar_vrbg` | `VRBG-2025-A` | `2026-12-31` | `true` |
| `agar_vrbg` | `VRBG-2025-B` | `2027-06-30` | `true` |
| `tween_80` | `TW80-2025-01` | `2026-08-31` | `true` |
| `tween_80` | `TW80-2025-02` | `2027-02-28` | `true` |

#### Escenario: Catálogo poblado al primer arranque
- GIVEN se ejecuta la migración por primera vez contra una base de datos limpia
- WHEN el frontend invoca `GET /catalogo/lotes_reactivo?tipo=agar_vrbg`
- THEN SHALL responder 200 con al menos los 2 lotes sembrados

### Requisito: RLC-03 — Registro en `CatalogoRepository`

El sistema SHALL agregar la entrada `'lotes_reactivo': prisma.loteReactivo` al `map` de `CatalogoRepository.findAll()` para que el endpoint genérico `GET /catalogo/:tipo` lo exponga automáticamente.

---

## Esquema de Base de Datos (Migración SQL — DIRECTIVA EXPLÍCITA)

El archivo `prisma/migrations/<timestamp>_enterobacterias_flow/migration.sql` SHALL crearse **a mano** (sin `prisma migrate dev`) y SHALL contener —en este orden— las siguientes sentencias DDL:

### Tablas de Enterobacterias (prefijo `ent_`)

#### `ent_formulario` (cabecera)
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id_ent_formulario` | `BIGSERIAL` | PK |
| `id_solicitud_analisis` | `BIGINT` | NOT NULL, FK → `solicitud_analisis(id_solicitud_analisis)` |
| `etapa_actual` | `SMALLINT` | NOT NULL DEFAULT 1, CHECK 1..3 |
| `subetapa_actual` | `SMALLINT` | NOT NULL DEFAULT 1, CHECK 1..8 |
| `estado` | `VARCHAR(50)` | NOT NULL DEFAULT 'en_proceso' |
| `rut_analista` | `VARCHAR(255)` | nullable, FK → `usuarios(rut_usuario)` |
| `created_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP |

#### `ent_muestra`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id_ent_muestra` | `BIGSERIAL` | PK |
| `id_ent_formulario` | `BIGINT` | NOT NULL, FK → `ent_formulario` ON DELETE CASCADE |
| `id_solicitud_muestra` | `BIGINT` | NOT NULL, FK → `solicitud_muestra` |
| `numero_muestra` | `VARCHAR(50)` | NOT NULL |
| `es_duplicado` | `BOOLEAN` | NOT NULL DEFAULT false |
| `peso_muestra_tipo` | `VARCHAR(20)` | nullable |
| `orden` | `SMALLINT` | NOT NULL |

#### `ent_etapa1` (Preparación — 4 sub-etapas aplanadas)
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id_ent_etapa1` | `BIGSERIAL` | PK |
| `id_ent_formulario` | `BIGINT` | UNIQUE, NOT NULL, FK → `ent_formulario` |
| `codigo_ali` | `VARCHAR(100)` | NOT NULL |
| `n_acta` | `VARCHAR(100)` | NOT NULL |
| `tipo_muestra` | `VARCHAR(20)` | NOT NULL, CHECK en ('Mixta','Homogénea') |
| `n_muestra_10g_90ml` | `INTEGER` | nullable, CHECK >= 0 |
| `n_muestra_50g_450ml` | `INTEGER` | nullable, CHECK >= 0 |
| `id_balanza` | `INTEGER` | nullable, FK → `instrumentos(id_instrumento)` |
| `fecha_inicio` | `DATE` | NOT NULL |
| `hora_inicio` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_inicio` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `fecha_homog` | `DATE` | NOT NULL |
| `hora_homog` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_homog` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `id_stomacher` | `INTEGER` | nullable, FK → `instrumentos` |
| `tiempo_homogenizacion` | `SMALLINT` | nullable, CHECK > 0 (minutos) |
| `id_lote_agar_vrbg_sembrado` | `BIGINT` | NOT NULL, FK → `lotes_reactivo` |
| `id_estufa_sembrado` | `INTEGER` | NOT NULL, FK → `equipos_incubacion` |
| `placas_sembrado` | `SMALLINT` | NOT NULL, CHECK > 0 |
| `id_micropipeta` | `INTEGER` | NOT NULL, FK → `micropipetas` |
| `fecha_sembrado` | `DATE` | NOT NULL |
| `hora_sembrado` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_sembrado` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `id_estufa_incub` | `INTEGER` | NOT NULL, FK → `equipos_incubacion` |
| `fecha_inicio_incubacion` | `TIMESTAMP(6)` | NOT NULL |
| `fecha_fin_incubacion` | `TIMESTAMP(6)` | NOT NULL (= `fecha_inicio_incubacion + 24h`, generado por la app) |
| `rut_analista_incub` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `completada` | `BOOLEAN` | NOT NULL DEFAULT false |
| `updated_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP |

#### `ent_etapa2` (Análisis — Lectura 24h)
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id_ent_etapa2` | `BIGSERIAL` | PK |
| `id_ent_formulario` | `BIGINT` | UNIQUE, NOT NULL, FK → `ent_formulario` |
| `fecha_lectura_24h` | `TIMESTAMP(6)` | NOT NULL |
| `hora_lectura_24h` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_lectura` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `id_equipo_cuenta_colonias` | `INTEGER` | NOT NULL, FK → `instrumentos` |
| `n_muestra_lectura` | `INTEGER` | NOT NULL, CHECK >= 0 |
| `dilucion` | `DECIMAL(10,2)` | NOT NULL, CHECK > 0 |
| `colonias_contadas` | `INTEGER` | NOT NULL, CHECK >= 0 |
| `completada` | `BOOLEAN` | NOT NULL DEFAULT false |
| `updated_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP |

#### `ent_etapa3` (Confirmación — 3 sub-etapas aplanadas)
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id_ent_etapa3` | `BIGSERIAL` | PK |
| `id_ent_formulario` | `BIGINT` | UNIQUE, NOT NULL, FK → `ent_formulario` |
| `fecha_traspaso` | `DATE` | NOT NULL |
| `hora_traspaso` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_traspaso` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `id_agar_nutritivo` | `BIGINT` | NOT NULL, FK → `lotes_reactivo` |
| `id_estufa_conf` | `INTEGER` | NOT NULL, FK → `equipos_incubacion` |
| `fecha_lect_conf` | `DATE` | NOT NULL |
| `hora_lect_conf` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_lect_conf` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `fecha_oxidasa` | `DATE` | NOT NULL |
| `hora_oxidasa` | `VARCHAR(10)` | NOT NULL |
| `rut_analista_oxidasa` | `VARCHAR(255)` | NOT NULL, FK → `usuarios` |
| `reactivo_oxidasa` | `VARCHAR(20)` | NOT NULL, CHECK `~ '^R69-\d{2}-(0[12])$'` |
| `desaireado_agar_glucosa` | `VARCHAR(100)` | NOT NULL |
| `agar_glucosa` | `VARCHAR(100)` | NOT NULL |
| `control_pos_ecoli` | `VARCHAR(20)` | NOT NULL |
| `control_neg_paer` | `VARCHAR(20)` | NOT NULL |
| `blanco` | `VARCHAR(20)` | NOT NULL |
| `muestra_b` | `DECIMAL(15,4)` | nullable |
| `muestra_a` | `DECIMAL(15,4)` | nullable |
| `d` | `DECIMAL(15,4)` | nullable |
| `n1` | `INTEGER` | nullable |
| `n2` | `INTEGER` | nullable |
| `m` | `DECIMAL(15,4)` | nullable |
| `suma_a` | `DECIMAL(15,4)` | nullable |
| `observaciones` | `TEXT` | nullable |
| `completada` | `BOOLEAN` | NOT NULL DEFAULT false |
| `updated_at` | `TIMESTAMP(6)` | NOT NULL DEFAULT CURRENT_TIMESTAMP |

#### `lotes_reactivo` (maestra — ver RLC-01 para columnas)

#### Índices
- `idx_ent_formulario_solicitud` en `ent_formulario(id_solicitud_analisis)`
- `idx_ent_muestra_formulario` en `ent_muestra(id_ent_formulario)`
- `idx_lotes_reactivo_tipo` en `lotes_reactivo(tipo)` WHERE `activo = true`

### Decisión: Schema Prisma `schema.prisma`

El archivo `schema.prisma` SHALL actualizarse para reflejar las nuevas tablas (necesario para que `prisma generate` cree los modelos del cliente), pero la **fuente de verdad del esquema** es el archivo `migration.sql` escrito a mano. Los modelos Prisma se mantienen sincronizados manualmente.

---

## Contratos de API

| Método | Ruta | Auth | Body / Query | Respuesta 2xx | Errores |
|--------|------|------|--------------|---------------|---------|
| `GET` | `/api/formulario/ent/por-analisis/:idAnalisis` | `READ_ROLES` | — | `{ existe, formulario }` | 403, 404 |
| `GET` | `/api/formulario/ent/:id` | `READ_ROLES` | — | `EntFormularioCompleto` | 403, 404 |
| `PUT` | `/api/formulario/ent/:id/etapa/:n` | `WRITE_ROLES` | `EntEtapaPayload` + `updated_at` (header `If-Match` o body) | `EntFormularioCompleto` con `updated_at` nuevo | 400, 403, 404, 409 (CONCURRENCY_ERROR / INVALID_STAGE_PROGRESSION), 422 (INCUBATION_LOCKOUT) |

### Headers y Códigos
- `If-Match: <updated_at>` (opcional pero recomendado) para optimistic locking explícito.
- Content-Type: `application/json` exclusivamente.
- Errores: `{ codigo: string, mensaje: string, detalles?: { campo, mensaje }[] }`

---

## Matriz de Trazabilidad

| Req | Cubre (propuesta) | Endpoint / Tabla | Capacidad |
|-----|-------------------|------------------|-----------|
| ECB-01 | Aprox. 2.1 | `SolicitudAnalisis::validar()` | enterobacterias-crud |
| ECB-02 | Aprox. 2.2 | `PUT /:id/etapa/:n` | enterobacterias-crud |
| ECB-03 | Aprox. 2.3 | `PUT /:id/etapa/:n` (validación service) | enterobacterias-crud |
| ECB-04 | LAB-4 | `PUT /:id/etapa/2` | enterobacterias-crud |
| ECB-05 | Validación | `PUT /:id/etapa/3` (Zod) | enterobacterias-crud |
| ECB-06 | RBAC | middleware `authorizeAny` | enterobacterias-crud |
| ECB-07 | RF-02, RF-03 | `GET /:id`, `GET /por-analisis/:id` | enterobacterias-crud |
| EFW-01 | Discrepancia wizard | `FormEnterobacteriasPage` + 8 sub-componentes | enterobacterias-frontend |
| EFW-02 | Aprox. 3.1 | `enterobacterias-api.service.ts` | enterobacterias-frontend |
| EFW-03 | Catálogos | `<ion-select>` + `CatalogosService` | enterobacterias-frontend |
| EFW-04 | LAB-6 | guards en componentes | enterobacterias-frontend |
| EFW-05 | LAB-6 | `app-routing.module.ts` | enterobacterias-frontend |
| RLC-01 | Master table | `lotes_reactivo` (DDL) | reactivo-lots-catalog |
| RLC-02 | Sembrado | `migration.sql` (INSERT) | reactivo-lots-catalog |
| RLC-03 | Endpoint catálogo | `CatalogoRepository.findAll` | reactivo-lots-catalog |

## Out of Scope

- Alertas activas (cron / `node-cron` / `bull`) para notificar el fin de incubación a las 24h — diferido (Won't have). La validación de 24h se hace on-demand al recibir `PUT /:id/etapa/2`.
- Mohos y Levaduras (Épica 7).
- Exportación PDF/Excel.
- Notificaciones por email.
- Cálculo automático de NMP para Enterobacterias (no aplica — el resultado es Presencia/Ausencia por lectura visual, no NMP).
- Reasignación del flag `muestraAli.repository.js` que hoy envía Salmonella ALI a `/form-enterobacterias` (cubierto en `assistec-form-business-rule-realignment`).

## Criterios de Aceptación Globales

- [ ] Wizard de 8 pasos navega correctamente entre sub-etapas locales y dispara `PUT` solo en los pasos 4, 5 y 8.
- [ ] `PUT /api/formulario/ent/:id/etapa/2` rechaza con 422 `INCUBATION_LOCKOUT` si han transcurrido < 24h desde `fecha_inicio_incubacion`.
- [ ] Optimistic locking: dos PUT simultáneos con el mismo `updated_at` → solo uno tiene éxito, el otro recibe 409.
- [ ] Catálogo `lotes_reactivo` retorna los 2 lotes sembrados (`agar_vrbg`, `tween_80`) inmediatamente después de correr la migración.
- [ ] Coordinadora (rol 1) ve el formulario en modo lectura; Analista (rol 0) puede editar.
- [ ] `reactivo_oxidasa` con formato inválido es rechazado con 400 antes de tocar la base de datos.
- [ ] Suite de tests: ≥ 3 casos para 24h lockout, 1 caso TOCTOU, 1 caso progresión de etapas, 1 caso formato de oxidasa.
