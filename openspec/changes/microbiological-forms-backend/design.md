# Diseño Técnico: Formularios Microbiológicos Backend

## 1. Arquitectura General

### Patrón de Capas (top-down)

```
Router → Middleware (auth → optimisticLock → Zod) → Controller → Service → Repository → Prisma
```

- **Router**: Define endpoints por tipo de formulario (`/api/formulario/{tipo}`). Registra middleware de auth y validación antes de cada controller.
- **Middleware (3 capas)**:
  1. `verifyToken` + `authorizeAny` (auth) — ya existen en `AssisTec API/src/middleware/auth.js`
  2. `optimisticLock` — se REESCRIBE desde PR #4: valida `updated_at` en body sin tocar BD (la verificación atómica ocurre en el repository)
  3. Zod schema — valida shape del payload por `{tipo}×{etapa|fase}` ANTES de llegar al controller
- **Controller**: Delegación fina. Llama al service, serializa respuesta. Maneja errores de dominio (`CONCURRENCY_ERROR`, `NOT_FOUND`, `UNAUTHORIZED_ROLE`) → HTTP status.
- **Service**: Lógica de negocio. `assertCanWrite` (RBAC), mapeo de payload (snake_case ↔ camelCase), validación de progresión de etapa/fase, disparo de cálculos automáticos.
- **BaseFormRepository**: Clase abstracta con métodos compartidos (`findById`, `findBySolicitudAnalisis`, `assertConcurrency`, `touchFormulario`). Los 3 repos concretos heredan y especializan por modelo Prisma.
- **Prisma**: Operaciones atómicas vía `updateMany({ where: { id, updatedAt } })` dentro de `$transaction`.

### Diagrama de Flujo (textual)

```
┌──────────────┐    ┌───────────────┐    ┌────────────┐    ┌───────────────┐
│  HTTP Client  │───▶│  Middleware    │───▶│ Controller │───▶│   Service     │
│  (Angular)   │    │  auth→lock→zod │    │  (thin)    │    │  (lógica neg) │
└──────────────┘    └───────────────┘    └────────────┘    └───────┬───────┘
                                                                     │
                                                          ┌──────────▼──────────┐
                                                          │  BaseFormRepository  │
                                                          │  ├ findById()        │
                                                          │  ├ assertConcurrency │
                                                          │  ├ touchFormulario   │
                                                          │  └ ...               │
                                                          └──────────┬──────────┘
                                                                     │
                                                          ┌──────────▼──────────┐
                                                          │  Prisma ORM + PG 16 │
                                                          │  $transaction       │
                                                          │  updateMany WHERE   │
                                                          └─────────────────────┘
```

### Ubicación de la Creación Automática (RF-01)

La creación se inyecta en `AssisTec API/src/services/solicitud.service.js::validar()` después de la línea 220 (después de `solicitudRepository.update()`). Se crea un nuevo service `formularioMicrobiologico.service.js` con método `createBySolicitud(idSolicitud): Promise<void>`. La llamada se envuelve en la MISMA transacción Prisma usando `$transaction` para garantizar atomicidad:

```js
// En solicitud.service.js::validar(), después de update():
if (isFullyValidated) {
  await formularioService.crearFormulariosParaSolicitud(id, tx);
}
```

El service recorre `SolicitudAnalisis` de la solicitud, consulta `FormularioAnalisis.codigo`, y crea el formulario correspondiente (SAU→SauFormulario, COLI→ColiFormulario, SAL→SalFormulario) con sus muestras vinculadas.

## 2. Modelos de Datos

### Modelos Prisma (desde PR #4, sin cambios estructurales)

**S. Aureus (6 etapas)**:
- `SauFormulario` (cabecera: `id_solicitud_analisis`, `etapa_actual`, `estado`, `rut_analista`, `created_at`, `updated_at`)
- `SauMuestra` (por análisis, vinculada a `SolicitudMuestra`)
- `SauEtapa1` (1:1 con formulario): homogeneizado, agar, estufa, controles
- `SauEtapa1Micropipeta`, `SauEtapa1Lectura` (hijos de Etapa 1)
- `SauEtapa2` (1:1): controles de siembra, lecturas 24h/48h
- `SauEtapa3` (1:1): traspaso BHI, estufa, controles
- `SauEtapa3Lectura` (hijo de Etapa 3, por muestra): colonias placa 1/2
- `SauEtapa4` (1:1): prueba coagulasa, lecturas 4-6h y 24h
- `SauEtapa4Lectura` (hijo de Etapa 4, por muestra × tipo_lectura)
- `SauEtapa5Resultado` (1:1 por muestra): `n_s_aureus`, `ufc_por_g`, `incongruencia_detectada`
- `SauEtapa6Cierre` (1:1): desfavorable, tabla referencia, límite normativo, cerrado

**Coliformes (4 fases)**:
- `ColiFormulario` (cabecera: `fase_actual`, `estado`, `rut_analista`, `created_at`, `updated_at`)
- `ColiMuestra` (por análisis, con `peso_muestra_tipo`)
- `ColiFase1` (1:1): incubación, analista inicio/término
- `ColiFase2` (1:1): caldo lauril, tween 80
- `ColiFase2Estufa`, `ColiFase2Micropipeta` (hijos many-to-many)
- `ColiFase3` (1:1): lecturas 24h/48h con tolerancia
- `ColiFase3Submuestra` (por muestra × tipo × dilución × tubo): presencia/ausencia
- `ColiFase35Controles` (1:1): controles totales, fecales, E. coli
- `ColiFase4Resultado` (1:1 por muestra): `coliformes_totales`, `coliformes_fecales`, `e_coli`

**Salmonella (10 fases)**:
- `SalFormulario` (cabecera: `fase_actual`, `estado`, `rut_analista`, `created_at`, `updated_at`)
- `SalMuestra` (por análisis)
- `SalFase1` (1:1): matriz, peso, caldo, hidratación (polvo), asignación automática (chocolate)
- `SalFase2a` (1:1): fechas siembra, homo, estufa, alerta 25min
- `SalFase2b` (1:1): caldo APT/leche, estufa, tween pipetas, micropipetas
- `SalFase2c` (1:1): controles de análisis, positivo, siembra
- `SalFase3a` (1:1): traspaso, lectura caldo APT, caldos finales
- `SalFase3b` (1:1): estufa selenito, pipetas, micropipetas
- `SalFase3cLectura` (por muestra): resultado caldo APT, selenito, rappaport, controles
- `SalFase4a` (1:1): traspaso agares XLD/SS, estufa, lecturas 24h/48h
- `SalFase4bLectura` (por muestra × fase4a): resultados XLD/SS × 24h/48h × selenito/rappaport
- `SalFase5Resultado` (1:1 por muestra): `resultado_final` (`Presencia` | `Ausencia`)

### Cambios respecto al PR #4

| Cambio | Razón |
|--------|-------|
| Agregar `@updatedAt` a todas las tablas hijas (Etapa/Fase) | Necesario para versionado de concurrencia en child tables (RF-04 sub-requisito) |
| Agregar `@@index([rut_analista])` en formularios | Optimizar queries por analista |
| Agregar `completada Boolean @default(false)` a todas las etapas/fases que no lo tengan | Unificar control borrador vs confirmación (RF-04) |
| `SalFase1.caldoHomogeneizacion` cambiar a `String @db.VarChar(30)` | En PR #4 falta el tipo de DB |
| `SalFase5Resultado.resultadoFinal` cambiar a enum `Presencia` | `Ausencia` | Coincidir con RF-09 |

### Relaciones Clave

```
SolicitudIngreso ──▶ SolicitudMuestra ──▶ SolicitudAnalisis ──▶ FormularioAnalisis
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                       SauFormulario   ColiFormulario   SalFormulario
                              │               │               │
                       SauMuestra      ColiMuestra      SalMuestra
```

Cada muestra del formulario referencia `idSolicitudMuestra` (muestra original de la solicitud de ingreso). Un `SolicitudAnalisis` puede tener solo UN formulario de su tipo (validado por `findBySolicitudAnalisis` idempotente en creación).

## 3. Endpoints

| Método | Ruta | Body | Respuesta | RF |
|--------|------|------|-----------|-----|
| `GET` | `/api/formulario/{tipo}/:id` | — | 200: formulario completo serializado. 404: `NOT_FOUND` | RF-02 |
| `GET` | `/api/formulario/{tipo}/por-analisis/:idAnalisis` | — | 200: `{ existe, formulario }`. `existe: false` devuelve 200 (no 404) | RF-03 |
| `PUT` | `/api/formulario/{tipo}/:id/etapa/:n` | `{ updated_at, etapa, ...campos }` | 200: formulario completo actualizado. 400: Zod fail. 409: `CONCURRENCY_ERROR`. 409: `INVALID_STAGE_PROGRESSION` | RF-04, RF-06, RF-07 |
| `PUT` | `/api/formulario/{tipo}/:id/fase/:n` | `{ updated_at, fase, ...campos }` | Igual que etapa pero para Coli/Sal | RF-04, RF-08, RF-09 |

**Tipos válidos**: `sau`, `coli`, `sal`

**Nota**: NO existe `POST /api/formulario/{tipo}`. La creación es exclusivamente interna (RF-01).

**Nota sobre nomenclatura**: S. Aureus usa `etapa` (1-6). Coliformes y Salmonella usan `fase` (1-4 y 1-10 respectivamente). La ruta refleja esta diferencia semántica con el nombre del segmento.

### Middleware por endpoint

```
GET /:id                → verifyToken, authorizeAny([ANALISTA, COORDINADORA, JEFE_AREA, ADMINISTRATOR])
GET /por-analisis/:id   → verifyToken, authorizeAny([ANALISTA, COORDINADORA, JEFE_AREA, ADMINISTRATOR])
PUT /:id/etapa/:n       → verifyToken, authorizeAny([ANALISTA, ADMINISTRATOR]), optimisticLock, validateZod(tipo, etapa)
PUT /:id/fase/:n        → verifyToken, authorizeAny([ANALISTA, ADMINISTRATOR]), optimisticLock, validateZod(tipo, fase)
```

## 4. Flujo de Validación y Creación

```
1. Ingreso crea SolicitudIngreso  →  POST /api/solicitud (existente)
2. Ingreso envía a validación     →  POST /api/solicitud/:id/enviar-validacion (existente)
3. Jefe/Coord aprueba             →  POST /api/solicitud/:id/validar (existente, MODIFICADO)
4. isFullyValidated === true      →  [GANCHO NUEVO] Crear formularios automáticamente
5. Formularios listos             →  Analista abre formulario y empieza a registrar etapas
```

### Inyección en `solicitud.service.js::validar()`

```js
// Después de línea 220 (solicitudRepository.update):
if (isFullyValidated) {
  const formularioService = require('./formularioMicrobiologico.service');
  await formularioService.crearFormulariosParaSolicitud(id, tx);
}
```

El método `crearFormulariosParaSolicitud`:
1. Consulta `SolicitudAnalisis` con `include: { formulario: true }` para la solicitud
2. Por cada análisis, verifica si `FormularioAnalisis.codigo` está en `{ SAU, COLI, SAL }`
3. Verifica idempotencia: si ya existe un formulario para ese `idSolicitudAnalisis`, salta
4. Crea el formulario con `SauMuestra`/`ColiMuestra`/`SalMuestra` vinculadas a las `SolicitudMuestra` del análisis
5. Valores iniciales: `etapaActual: 1` (o `faseActual: 1`), `estado: 'en_proceso'`, `rutAnalista: null`
6. Todo dentro de `prisma.$transaction()` — si falla una creación, se revierte todo

## 5. Optimistic Locking Atómico

### Implementación

El middleware `optimisticLock.js` (reescrito) extrae `updated_at` del body y lo expone como `req.expectedUpdatedAt` (Date). No toca la BD.

En el repository, cada `upsertEtapaN`/`upsertFaseN` ejecuta dentro de `$transaction`:

```js
async upsertEtapa1(idFormulario, data, expectedUpdatedAt) {
  return prisma.$transaction(async (tx) => {
    // Verificación atómica
    const result = await tx.sauFormulario.updateMany({
      where: {
        idSauFormulario: BigInt(idFormulario),
        updatedAt: expectedUpdatedAt
      },
      data: { updatedAt: new Date() }
    });

    if (result.count === 0) {
      throw new Error('CONCURRENCY_ERROR');
    }

    // Upsert de la etapa...
    await tx.sauEtapa1.upsert({ ... });

    // Lectura fresca con include completo
    return tx.sauFormulario.findUnique({
      where: { idSauFormulario: BigInt(idFormulario) },
      include: this.getFullInclude()
    });
  });
}
```

**Clave**: El `updateMany` con `WHERE id AND updatedAt` y `SET updatedAt = NOW()` es la ÚNICA vía de modificación del formulario. Si `updatedAt` no coincide (otro usuario ya lo actualizó), `count === 0` y se lanza `CONCURRENCY_ERROR`.

### Manejo de CONCURRENCY_ERROR (409)

El controller captura el error del service y devuelve:
```json
{
  "codigo": "CONCURRENCY_ERROR",
  "mensaje": "El formulario fue modificado por otro usuario. Recargue y vuelva a intentar."
}
```
HTTP 409 Conflict.

### Sin IDOR (RF-06)

Por regla de negocio, cualquier analista puede editar cualquier formulario. NO hay validación de ownership. La protección es únicamente contra condiciones de carrera vía optimistic locking atómico. El PR #4 tenía lógica de `assertCanWrite` por ownership que se ELIMINA en este diseño — se reemplaza por RBAC genérico (analista autenticado = puede editar).

## 6. BaseFormRepository

### Métodos Compartidos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `findById(id)` | Abstracto (cada repo define `getFullInclude`) | Busca formulario con todas sus relaciones |
| `findBySolicitudAnalisis(idSolicitudAnalisis)` | Abstracto | Busca por FK a SolicitudAnalisis |
| `assertConcurrency(id, expectedUpdatedAt, tx)` | Implementado en base | `findUnique({ select: { updatedAt } })` + comparación. Lanza `NOT_FOUND` o `CONCURRENCY_ERROR` |
| `touchFormulario(id, extra, tx)` | Implementado en base | `update({ where: { id }, data: { updatedAt: new Date(), ...extra } })` |

### Parametrización por Modelo

El constructor de `BaseFormRepository` recibe:
- `prismaModel`: el delegate de Prisma (ej: `prisma.sauFormulario`)
- `idField`: nombre del campo PK (ej: `'idSauFormulario'`)

```js
class BaseFormRepository {
  constructor(prismaModel, idField = 'id') {
    this.model = prismaModel;
    this.idField = idField;
  }

  async findById(id) {
    return this.model.findUnique({
      where: { [this.idField]: BigInt(id) },
      include: this.getFullInclude()
    });
  }

  getFullInclude() {
    throw new Error('Abstract — implementar en subclase');
  }
}
```

Los repositorios concretos (`SaureusRepository`, `ColiRepository`, `SalmonellaRepository`) extienden `BaseFormRepository` y solo implementan:
- `getFullInclude()` — el árbol de includes específico
- `upsertEtapaN()` / `upsertFaseN()` — lógica de upsert por etapa/fase

### Archivos Nuevos

```
AssisTec API/src/repositories/
├── baseForm.repository.js      (NUEVO)
├── saureus.repository.js       (REESCRITO - extiende Base)
├── coliformes.repository.js    (NUEVO)
└── salmonella.repository.js    (NUEVO)
```

## 7. Lógica de Cálculos

### 7.1 UFC/g — S. Aureus Etapa 5 (RF-07)

**Ubicación**: `AssisTec API/src/config/calculators/ufcCalculator.js`

**Fuente**: Adaptación de `Backend/models/reporteRAMModel.js::calcularRecuentoColonias` (líneas 860-943)

**Algoritmo**:
1. Recibe: datos de Etapas 2, 3, 4 del formulario (colonias por placa, diluciones, volumen)
2. Clasifica diluciones en rangos (óptimo, bajo, exceso, sin crecimiento)
3. Aplica prioridades: PRIORIDAD_1 (rango óptimo → media ponderada) → PRIORIDAD_2 (bajo → 25/(vol*d)) → PRIORIDAD_3 (exceso → promedio o límite MNPC) → PRIORIDAD_4 (sin crecimiento → 1/(vol*d))
4. Devuelve: `{ ufc, sumaColonias, promedio, dilucion, factorDilucion, textoReporte, operador, casoAplicado, incongruenciaDetectada }`

**Integración**: Se llama desde `SaureusService::guardarEtapa(5)`. El service lee las Etapas 2, 3, 4 desde BD (con `findById`), pasa los datos al calculator, y los resultados (`nSAureus`, `ufcPorG`, `incongruenciaDetectada`) se persisten en `SauEtapa5Resultado`. El campo `resultado_final` del body del PUT es IGNORADO — el server siempre recalcula.

**Testeabilidad (RNF-05)**: La función `calcularUfc(datos)` es pura, sin dependencias de BD ni HTTP. Se testea con 3 casos contra la función legacy `calculoRAM`.

### 7.2 NMP/100ml — Coliformes Fase 4 (RF-08)

**Ubicación**: `AssisTec API/src/config/calculators/nmpCalculator.js`

**Algoritmo**:
1. Recibe: array de `{ tipoLectura: 'totales'|'fecales'|'ecoli', tubosPositivosPorDilucion: [n1, n2, n3] }` por muestra
2. Para cada tipo de lectura, busca en tabla NMP de referencia (3 tubos × combinación de positivos)
3. Multiplica por factor de dilución
4. Devuelve: `{ coliformesTotales, coliformesFecales, eColi }`

**Integración**: Se llama desde `ColiService::guardarFase(4)`. Se consulta `ColiFase3Submuestra` (presencia por tubo) para cada muestra, se agrupan por tipo de lectura y dilución, y se calcula. El resultado se persiste en `ColiFase4Resultado`. El cliente NO puede enviar estos valores.

**Testeabilidad**: Tabla NMP hardcodeada como constante. Función pura testeable con entradas/salidas conocidas.

### 7.3 Presencia/Ausencia — Salmonella Fase 5 (RF-09)

**Ubicación**: `AssisTec API/src/config/calculators/salmonellaCalculator.js`

**Algoritmo**:
1. Recibe: `SalFase4bLectura` con 8 campos de resultado por muestra: XLD/SS × 24h/48h × Selenito/Rappaport
2. Si CUALQUIER campo tiene valor `'típico'`, resultado = `'Presencia'`
3. Si TODOS los campos tienen valor `'atípico'` o `'sin_crecimiento'`, resultado = `'Ausencia'`
4. Devuelve: `{ resultadoFinal: 'Presencia' | 'Ausencia' }`

**Integración**: Se llama desde `SalmonellaService::guardarFase(5)`. El resultado se persiste en `SalFase5Resultado.resultadoFinal`. El campo es de SOLO LECTURA — el server ignora cualquier valor enviado por el cliente.

**Testeabilidad**: Función pura. 3 casos de prueba: todos típicos → Presencia, todos atípicos → Ausencia, mezcla → Presencia.

### 7.4 Resultado Final de Solo Lectura (RF-10)

En los 3 servicios, si el body del PUT incluye cualquier campo de resultado calculado (`ufc_por_g`, `coliformes_totales`, `resultado_final`), el service lo IGNORA y siempre usa el valor calculado. El controller serializa la respuesta con los valores calculados.

## 8. Validación Zod (RF-11, RF-12)

### Estructura de Schemas

```
AssisTec API/src/config/schemas/
├── sau/
│   ├── etapa1.schema.js
│   ├── etapa2.schema.js
│   ├── etapa3.schema.js
│   ├── etapa4.schema.js
│   ├── etapa5.schema.js
│   └── etapa6.schema.js
├── coli/
│   ├── fase1.schema.js
│   ├── fase2.schema.js
│   ├── fase3.schema.js
│   └── fase4.schema.js
├── sal/
│   ├── fase1.schema.js
│   ├── fase2a.schema.js
│   ├── fase2b.schema.js
│   ├── fase2c.schema.js
│   ├── fase3.schema.js
│   ├── fase4.schema.js
│   └── fase5.schema.js  (solo lectura — no recibe datos)
└── common/
    └── base.schema.js  (updated_at, completada, campos compartidos)
```

### Distinción Borrador vs Confirmación

Cada schema tiene un refinamiento condicional basado en `completada`:

```js
const sauEtapa1Schema = z.object({
  updated_at: z.string().datetime(),
  completada: z.boolean(),
  etapa: z.object({
    fecha_inicio_incubacion: completada ? z.string().datetime() : z.string().datetime().optional(),
    rut_analista_inicio: completada ? z.string().min(1) : z.string().optional(),
    // ... resto de campos
    completada: z.boolean()
  })
  // ... sub-entidades
});
```

- `completada: false` → todos los campos son `.optional()` — guarda parcial (borrador)
- `completada: true` → campos obligatorios usan `.min(1)`, `.datetime()`, etc — validación completa

### Middleware de Validación

```js
// AssisTec API/src/middleware/validateForm.js
const validateForm = (tipo, etapa) => {
  const schema = require(`../config/schemas/${tipo}/${etapa}.schema`);
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        codigo: 'VALIDATION_ERROR',
        errores: result.error.issues.map(i => ({
          campo: i.path.join('.'),
          mensaje: i.message
        }))
      });
    }
    req.body = result.data; // parsed + defaults
    next();
  };
};
```

### Validación de Progresión (RF-12)

Se implementa en el service, NO en Zod (porque requiere consultar BD):

```js
// En SaureusService::guardarEtapa()
async assertStageProgression(formulario, etapa) {
  if (etapa > 1) {
    const etapaAnterior = `etapa${etapa - 1}`;
    const anterior = await this.repository[`findEtapa${etapa - 1}`](formulario.id);
    if (!anterior || !anterior.completada) {
      throw new Error('INVALID_STAGE_PROGRESSION');
    }
  }
}
```

**Tolerancias temporales** (RF-12 sub-requisitos):
- Coliformes lectura 24h/48h: `abs(diferencia) <= 2 horas` → se calcula en el service al guardar Fase 3 y se persiste en `lectura24hEnTolerancia`/`lectura48hEnTolerancia`
- Salmonella alerta 25min: `minutosHomoAEstufa > 25` → `alertaTiempo25min = true` (calculado en service, no bloquea el guardado)
- S. Aureus homo-siembra < 15min: `tiempoHomoValido = (tiempo <= 15)` (calculado en service)
- Salmonella polvo hidratación >= 1h: `hidratacionValida = (diferencia >= 60min)` (calculado en service)
- Salmonella chocolate: `caldo_apt` se asigna automáticamente a `'leche_descremada'` en el service, ignorando el valor del body (RF-12 HU-04-01-03)

## 9. Manejo de Errores (RF-13)

### Mapa de Errores Prisma → HTTP

| Código Prisma | Significado | HTTP | Mensaje Cliente |
|---------------|-------------|------|-----------------|
| P2002 | Unique constraint violation | 409 | `"El registro ya existe"` |
| P2025 | Record not found | 404 | `"No encontrado"` |
| P2003 | Foreign key constraint failed | 400 | `"Referencia inválida"` |
| P2000 | Value too long for column | 400 | `"Valor excede límite"` |
| P2014 | Relation violation (required relation) | 400 | `"Faltan datos relacionados"` |
| P2017 | Relation not satisfied | 400 | `"Relación inválida"` |

### Handler Global Sanitizado

Se crea `AssisTec API/src/middleware/errorHandler.js` y se registra como ÚLTIMO middleware en `app.js`:

```js
const errorHandler = (err, req, res, _next) => {
  // Errores de dominio (lanzados por service/repository)
  if (err.message === 'CONCURRENCY_ERROR') {
    return res.status(409).json({
      codigo: 'CONCURRENCY_ERROR',
      mensaje: 'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.'
    });
  }
  if (err.message === 'INVALID_STAGE_PROGRESSION') {
    return res.status(409).json({
      codigo: 'INVALID_STAGE_PROGRESSION',
      mensaje: 'Debe completar la etapa anterior antes de avanzar.'
    });
  }
  // Errores de Prisma
  if (err.code && err.code.startsWith('P')) {
    const mapped = PRISMA_ERROR_MAP[err.code] || { status: 500, mensaje: 'Error interno del servidor' };
    return res.status(mapped.status).json({ codigo: err.code, mensaje: mapped.mensaje });
  }
  // Fallback: nunca exponer err.message ni err.stack
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ mensaje: 'Error interno del servidor' });
};
```

**Winston logging**: `err.message` y `err.stack` se loguean con `logger.error()`. La respuesta al cliente NUNCA incluye detalles internos.

## 10. Tests (Strict TDD)

### Casos Mínimos por RF

| RF | Casos de Prueba | Tipo |
|----|-----------------|------|
| RF-01 | 1. Creación automática al validar completamente (Jefa+Coord). 2. Idempotencia (no duplica). 3. Transacción atómica (fallo parcial revierte todo) | Integración |
| RF-02 | 1. GET retorna formulario completo. 2. GET con ID inexistente → 404. 3. BigInt serializado como string | Unit (controller) + Integración |
| RF-03 | 1. GET retorna `{ existe: true, formulario }`. 2. GET retorna `{ existe: false }` con 200 | Unit + Integración |
| RF-04 | 1. PUT etapa 1 con borrador → guarda parcial. 2. PUT con `completada: true` → valida obligatorios. 3. PUT sin `updated_at` → 400. 4. Progresión bloqueada (etapa 2 sin etapa 1 completada) → 409 | Unit (service) + Integración |
| RF-05 | 1. ANALISTA puede PUT. 2. COORDINADORA recibe 403 en PUT. 3. JEFE_AREA puede GET. 4. Sin token → 403 | Unit (middleware) |
| RF-06 | 1. 10 requests PUT paralelos sobre mismo formulario → solo 1 gana, 9 reciben 409. 2. Distintos analistas editan el mismo formulario sin bloqueo de ownership | Integración |
| RF-07 | 1. UFC PRIORIDAD_1 (rango óptimo). 2. UFC PRIORIDAD_2 (rango bajo). 3. UFC PRIORIDAD_4 (sin crecimiento). Verificar contra función legacy `calculoRAM` | Unit (calculator puro) |
| RF-08 | 1. NMP coliformes totales (3 tubos positivos). 2. NMP combinación mixta. 3. NMP cero (todos negativos) | Unit (calculator puro) |
| RF-09 | 1. Todos agares típicos → Presencia. 2. Todos atípicos → Ausencia. 3. Mezcla típico/atípico → Presencia | Unit (calculator puro) |
| RF-10 | 1. PUT envía `ufc_por_g: 999` → el server ignora y recalcula. 2. Respuesta siempre incluye valor calculado | Integración |
| RF-11 | 1. Campo obligatorio faltante con `completada: true` → 400. 2. Tipo incorrecto (string en campo numérico) → 400. 3. Rango inválido (dilución < 1) → 400 | Unit (Zod schema) |
| RF-12 | 1. Coli: lectura 24h fuera de tolerancia 2h → `enTolerancia: false`. 2. Salmonella: `hora_inicio_hidratacion` + `hora_termino_hidratacion` con duración < 1h → `hidratacionValida: false`. 3. Salmonella chocolate: body envía `caldo_apt: 'otro'` → server asigna `leche_descremada` automáticamente | Unit (service) |
| RF-13 | 1. Error P2002 → 409 con mensaje genérico. 2. Error P2025 → 404. 3. `err.message` no aparece en respuesta | Unit (errorHandler) |

### Estructura de Tests

```
AssisTec API/
├── tests/
│   ├── unit/
│   │   ├── calculators/
│   │   │   ├── ufc.test.js
│   │   │   ├── nmp.test.js
│   │   │   └── salmonella.test.js
│   │   ├── schemas/
│   │   │   ├── sau.etapa1.test.js
│   │   │   ├── coli.fase1.test.js
│   │   │   └── sal.fase1.test.js
│   │   ├── errorHandler.test.js
│   │   └── baseRepository.test.js
│   └── integration/
│       ├── concurrentUpdate.test.js  (RF-06: 10 requests paralelos)
│       ├── sau.endpoints.test.js
│       ├── coli.endpoints.test.js
│       ├── sal.endpoints.test.js
│       └── autoCreation.test.js     (RF-01)
```

**Test command**: `cd "AssisTec API" && npm test` (ya configurado)

**Nivel**: Después de cada test de integración, se limpia la BD de prueba con `prisma.sauFormulario.deleteMany()` y derivados.

## 11. Secuencia de Implementación

| Orden | Tarea | Depende de | Archivos |
|-------|-------|------------|----------|
| 1 | **Modelos Prisma** (migración inicial + schema completo) | PR #4 schema | `prisma/schema.prisma`, `prisma/migrations/` |
| 2 | **BaseFormRepository** (clase abstracta con métodos compartidos) | 1 | `src/repositories/baseForm.repository.js` |
| 3 | **Error handler sanitizado** (middleware global + mapa Prisma) | — | `src/middleware/errorHandler.js`, `app.js` |
| 4 | **Calculators** (UFC, NMP, Salmonella — funciones puras) | — | `src/config/calculators/` |
| 5 | **Zod schemas** (todos los tipos × etapas/fases) | — | `src/config/schemas/` |
| 6 | **Zod middleware** (`validateForm(tipo, etapa)`) | 5 | `src/middleware/validateForm.js` |
| 7 | **Optimistic lock middleware** (reescritura del existente) | — | `src/middleware/optimisticLock.js` |
| 8 | **SaureusRepository + Service + Controller + Routes** | 1, 2, 4, 5 | `src/repositories/saureus.repository.js`, `src/services/saureus.service.js`, `src/controllers/formulario.controller.js`, `src/routes/formulario.routes.js` |
| 9 | **ColiRepository + Service** (extiende base, lógica NMP) | 1, 2, 4, 5, 8 | `src/repositories/coliformes.repository.js`, `src/services/coliformes.service.js` |
| 10 | **SalmonellaRepository + Service** (extiende base, lógica Presencia/Ausencia) | 1, 2, 4, 5, 8 | `src/repositories/salmonella.repository.js`, `src/services/salmonella.service.js` |
| 11 | **Auto-creación en validar()** (gancho en solicitud.service.js) | 1, 2, 8 | `src/services/solicitud.service.js`, `src/services/formularioMicrobiologico.service.js` |
| 12 | **Tests unitarios** (calculators, schemas, errorHandler) | 4, 5, 3 | `tests/unit/` |
| 13 | **Tests de integración** (endpoints, concurrencia, auto-creación) | 8, 9, 10, 11 | `tests/integration/` |

### Rationale del Orden

1. **Schema primero**: Prisma models y migración son prerequisito para todo lo demás.
2. **Utilities puras antes que integración**: Calculators y Zod schemas son funciones puras — se pueden desarrollar y testear sin servidor HTTP.
3. **S. Aureus primero**: Es el formulario más complejo (6 etapas, cálculo UFC/g). Su implementación establece los patrones que Coli y Sal replican.
4. **Auto-creación al final**: Depende de que los 3 repositorios estén listos para crear formularios.
5. **Tests continuos**: Los tests unitarios se escriben junto con cada módulo (TDD). Los tests de integración se ejecutan al final para verificar el flujo completo.
