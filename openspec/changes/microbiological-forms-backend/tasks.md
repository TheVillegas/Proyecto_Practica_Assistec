# Tareas: Formularios Microbiológicos Backend

## Resumen de Implementación
- **Archivos totales a modificar/crear (estimado)**: ~45 archivos (12 nuevos, ~8 reescritos, ~25 modificados/creados)
- **Líneas estimadas de cambio**: ~3200 líneas (nuevas + modificadas)
- **Dependencias entre fases**: Lineal con ramas paralelas — Base → Utils → S. Aureus → Coliformes → Salmonella → Integración

## Review Workload Forecast
- **Líneas cambiadas estimadas**: ~3200
- **Chained PRs recommended**: **Sí** — supera 400 líneas con amplio margen
- **400-line budget risk**: **High** — un solo PR con todo el cambio sería inreviewable
- **Decision needed before apply**: Sí — definir estrategia de PRs encadenados (ver fases abajo)

### Estrategia de PRs Recomendada
| PR | Contenido | Líneas aprox |
|----|-----------|-------------|
| PR-1: Base | T-001 a T-006 (schema, base repo, error handler, calculators, schemas, zod middleware) | ~800 |
| PR-2: S. Aureus | T-007 a T-009 (repo, service, controller+routes) | ~600 |
| PR-3: Coliformes + Salmonella | T-010 a T-013 (repos, services, controller unificado, routes) | ~900 |
| PR-4: Auto-creación + Tests | T-014 a T-016 (formularioMicrobiologico.service, solicitud.service hook, tests) | ~900 |

---

## Tareas

### Fase 1: Base — Schema, Repositorio Base, Error Handler (dependencia de todo lo demás)

#### [x] T-001: Schema Prisma — agregar `@updatedAt` a tablas hijas, `completada`, índices
- **RF**: RF-04 (sub-requisito)
- **Archivos**: `AssisTec API/prisma/schema.prisma`
- **Descripción**: Modificar el schema del PR #4 para agregar:
  - `@@updatedAt` a todas las tablas hijas de etapas/fases que no lo tengan (SauEtapa2, SauEtapa3, SauEtapa4, SauEtapa5Resultado, SauEtapa6Cierre, ColiFase2, ColiFase3, ColiFase3Submuestra, ColiFase35Controles, ColiFase4Resultado, SalFase1..SalFase5Resultado)
  - `completada Boolean @default(false)` a todas las etapas/fases que no lo tengan
  - `@@index([rutAnalista])` en SauFormulario, ColiFormulario, SalFormulario
  - `SalFase1.caldoHomogeneizacion` como `String @db.VarChar(30)`
  - `SalFase5Resultado.resultadoFinal` como enum `Presencia` | `Ausencia` (o String con validación)
  - Ejecutar `npx prisma migrate dev` para generar migración
- **Criterios de aceptación**:
  - `npx prisma validate` pasa sin errores
  - `npx prisma migrate dev` genera migración aplicable
  - Todas las tablas hijas tienen `@updatedAt`
  - Formularios tienen índice por `rutAnalista`
- **Dependencias**: ninguna
- **Estimación**: 1 archivo, ~120 líneas modificadas

#### [x] T-002: BaseFormRepository — clase base con métodos compartidos
- **RF**: RF-02, RF-03, RF-04, RF-06
- **Archivos**: `AssisTec API/src/repositories/baseForm.repository.js` (NUEVO)
- **Descripción**: Crear clase abstracta `BaseFormRepository` con:
  - Constructor que recibe `prismaModel` (delegate) e `idField` (nombre del campo PK)
  - `findById(id)` — `findUnique` con `include: this.getFullInclude()` (abstracto)
  - `findBySolicitudAnalisis(idSolicitudAnalisis)` — `findFirst` por FK (abstracto)
  - `assertConcurrency(id, expectedUpdatedAt, tx)` — `findUnique({ select: { updatedAt } })` + comparación de timestamps. Lanza `NOT_FOUND` o `CONCURRENCY_ERROR`
  - `touchFormulario(id, extra, tx)` — `update` con `updatedAt: new Date()` + extras
  - `getFullInclude()` — abstracto, cada subclase implementa su árbol
  - `create(data, tx)` — creación transaccional con muestras (patrón común)
- **Criterios de aceptación**:
  - Clase exportada como instancia singleton
  - Métodos `assertConcurrency` y `touchFormulario` funcionan con cualquier modelo Prisma
  - `getFullInclude` lanza error si no se sobrescribe
  - Tests unitarios: mock de prismaModel, verificar llamadas correctas
- **Dependencias**: T-001
- **Estimación**: 1 archivo nuevo, ~120 líneas

#### [x] T-003: Error handler sanitizado — middleware global + mapa Prisma
- **RF**: RF-13
- **Archivos**: `AssisTec API/src/middleware/errorHandler.js` (NUEVO), `AssisTec API/app.js` (modificar)
- **Descripción**: Crear middleware `errorHandler(err, req, res, _next)` que:
  - Mapea errores de dominio: `CONCURRENCY_ERROR` → 409, `INVALID_STAGE_PROGRESSION` → 409, `NOT_FOUND` → 404, `UNAUTHORIZED_ROLE` → 403
  - Mapea errores Prisma: P2002 → 409, P2025 → 404, P2003 → 400, P2000 → 400, P2014 → 400, P2017 → 400
  - Loguea `err.message` y `err.stack` con `winston` (nivel `error`)
  - NUNCA envía `err.message` ni `err.stack` al cliente
  - Fallback → 500 con mensaje genérico
  - Registrar como ÚLTIMO middleware en `app.js`
- **Criterios de aceptación**:
  - Cada código Prisma mapeado devuelve HTTP correcto + mensaje genérico
  - `err.stack` no aparece en ninguna respuesta JSON
  - Winston loguea detalles internos
  - Test unitario: mock de cada tipo de error, verificar respuesta
- **Dependencias**: ninguna
- **Estimación**: 2 archivos (1 nuevo, 1 modificado), ~80 líneas nuevas

#### T-004: Calculators — UFC, NMP, Salmonella (funciones puras)
- **RF**: RF-07, RF-08, RF-09, RF-10
- **Archivos**:
  - `AssisTec API/src/config/calculators/ufcCalculator.js` (NUEVO)
  - `AssisTec API/src/config/calculators/nmpCalculator.js` (NUEVO)
  - `AssisTec API/src/config/calculators/salmonellaCalculator.js` (NUEVO)
- **Descripción**:
  - **ufcCalculator**: Adaptar `calcularRecuentoColonias` del legacy. Función pura `calcularUfc({ volumen, diluciones })` con 4 prioridades:
    - PRIORIDAD_1: rango óptimo → media ponderada
    - PRIORIDAD_2: rango bajo → `25/(vol*d)`
    - PRIORIDAD_3: exceso → promedio o límite MNPC
    - PRIORIDAD_4: sin crecimiento → `1/(vol*d)`
    - Devuelve `{ ufc, sumaColonias, promedio, dilucion, factorDilucion, textoReporte, operador, casoAplicado, incongruenciaDetectada }`
  - **nmpCalculator**: Tabla NMP hardcodeada (3 tubos × combinación). Función pura `calcularNMP({ tipoLectura, tubosPositivosPorDilucion })` por muestra. Devuelve `{ coliformesTotales, coliformesFecales, eColi }`
  - **salmonellaCalculator**: Función pura `determinarPresenciaAusencia({ lecturasAgar })`. Si CUALQUIER agar = `'típico'` → `Presencia`. Si TODOS = `'atípico'` o `'sin_crecimiento'` → `Ausencia`
- **Criterios de aceptación**:
  - Las 3 funciones son puras (sin BD, sin HTTP, sin side effects)
  - 3 casos de prueba por calculator contra valores conocidos
  - ufcCalculator: verificar 3 casos contra legacy `calculoRAM`
  - salmonellaCalculator: todos típicos → Presencia, todos atípicos → Ausencia, mezcla → Presencia
- **Dependencias**: ninguna
- **Estimación**: 3 archivos nuevos, ~350 líneas

#### [x] T-005: Zod schemas — todos los tipos × etapas/fases
- **RF**: RF-11, RF-12
- **Archivos**:
  - `AssisTec API/src/config/schemas/common/base.schema.js` (NUEVO)
  - `AssisTec API/src/config/schemas/sau/etapa1.schema.js` ... `etapa6.schema.js` (6 NUEVOS)
  - `AssisTec API/src/config/schemas/coli/fase1.schema.js` ... `fase4.schema.js` (4 NUEVOS)
  - `AssisTec API/src/config/schemas/sal/fase1.schema.js` ... `fase5.schema.js` (5 NUEVOS)
- **Descripción**: Crear schemas Zod por combinación `{tipo}×{etapa|fase}`:
  - **base.schema.js**: `updated_at` (z.string().datetime()), `completada` (z.boolean()), campos compartidos
  - **sau/etapa1.schema.js**: fechaInicioIncubacion, rutAnalistaInicio, fechaTerminoAnalisis, estufa, agar, controles, micropipetas[], lecturas[]
  - **sau/etapa2.schema.js**: controles siembra, fechas lectura 24h/48h
  - **sau/etapa3.schema.js**: traspaso BHI, estufa, controles, lecturas[]
  - **sau/etapa4.schema.js**: coagulasa, estufa, micropipeta, lecturas 4-6h y 24h
  - **sau/etapa5.schema.js**: resultados[] (n_s_aureus, ufc_por_g — solo lectura, ignorar del body)
  - **sau/etapa6.schema.js**: desfavorable, tabla referencia, límite normativo, cerrado
  - **coli/fase1.schema.js**: incubación, analista inicio/término
  - **coli/fase2.schema.js**: caldo lauril, tween 80, estufas[], micropipetas[]
  - **coli/fase3.schema.js**: lecturas 24h/48h, submuestras[], controles
  - **coli/fase4.schema.js**: resultados (solo lectura — no recibe datos del cliente)
  - **sal/fase1.schema.js**: matriz, peso, caldo, hidratación (polvo), asignación automática (chocolate)
  - **sal/fase2a.schema.js**: fechas siembra, homo, estufa
  - **sal/fase2b.schema.js**: caldo APT/leche, estufa, tween pipetas, micropipetas
  - **sal/fase2c.schema.js**: controles análisis, positivo, siembra
  - **sal/fase3.schema.js**: traspaso, lectura caldo APT, caldos finales, selenito, pipetas
  - **sal/fase4.schema.js**: agares XLD/SS, estufa, lecturas 24h/48h
  - **sal/fase5.schema.js**: resultado_final (solo lectura — no recibe datos)
  - Cada schema distingue `completada: false` (campos .optional()) vs `completada: true` (campos obligatorios)
- **Criterios de aceptación**:
  - Cada schema exporta un objeto Zod válido
  - `completada: false` acepta payload parcial
  - `completada: true` rechaza campos obligatorios faltantes
  - Tipos numéricos rechazan strings, fechas rechazan formatos inválidos
  - Rangos: diluciones >= 1, UFC >= 0
  - Test unitario por schema: 1 caso válido + 1 caso inválido
- **Dependencias**: ninguna
- **Estimación**: 17 archivos nuevos, ~700 líneas

#### [x] T-006: Middleware de validación Zod + Optimistic Lock reescrito
- **RF**: RF-11, RF-04
- **Archivos**:
  - `AssisTec API/src/middleware/validateForm.js` (NUEVO)
  - `AssisTec API/src/middleware/optimisticLock.js` (REESCRITO)
- **Descripción**:
  - **validateForm.js**: Factory `validateForm(tipo, etapa)` que:
    - Carga el schema desde `../config/schemas/${tipo}/${etapa}.schema.js`
    - Ejecuta `schema.safeParse(req.body)`
    - Si falla → 400 con `{ codigo: 'VALIDATION_ERROR', errores: [{ campo, mensaje }] }`
    - Si pasa → `req.body = result.data` (parsed + defaults) → `next()`
  - **optimisticLock.js** (reescrito): Extrae `updated_at` del body, valida fecha, expone `req.expectedUpdatedAt` (Date). NO toca BD. Si falta → 400. Si formato inválido → 400.
- **Criterios de aceptación**:
  - `validateForm('sau', 'etapa1')` carga schema correcto
  - Payload inválido → 400 con detalle por campo
  - Payload válido → `req.body` transformado, `next()` llamado
  - `optimisticLock` sin `updated_at` → 400
  - `optimisticLock` con fecha inválida → 400
  - `optimisticLock` con fecha válida → `req.expectedUpdatedAt` es Date
- **Dependencias**: T-005
- **Estimación**: 2 archivos (1 nuevo, 1 reescrito), ~70 líneas

---

### Fase 2: S. Aureus — primer formulario completo (establece patrones)

#### T-007: SaureusRepository — extiende BaseFormRepository
- **RF**: RF-02, RF-03, RF-04, RF-06
- **Archivos**: `AssisTec API/src/repositories/saureus.repository.js` (REESCRITO)
- **Descripción**: Reescribir `SaureusRepository` extendiendo `BaseFormRepository`:
  - Constructor: `super(prisma.sauFormulario, 'idSauFormulario')`
  - `getFullInclude()`: árbol completo (solicitudAnalisis, analista, muestras con lecturas, etapa1-6 con hijos)
  - `findBySolicitudAnalisis(idSolicitudAnalisis)`: `findFirst` por FK
  - `create(data)`: transaccional con muestras (hereda patrón de base, especializa includes)
  - `upsertEtapa1(idFormulario, data, expectedUpdatedAt)`: upsert etapa1 + micropipetas (deleteMany + createMany) + lecturas (upsert por muestra) + touch
  - `upsertEtapa2(idFormulario, data, expectedUpdatedAt)`: upsert etapa2 + touch
  - `upsertEtapa3(idFormulario, data, expectedUpdatedAt)`: upsert etapa3 + lecturas + touch
  - `upsertEtapa4(idFormulario, data, expectedUpdatedAt)`: upsert etapa4 + lecturas (por muestra × tipoLectura) + touch
  - `upsertEtapa5Resultados(idFormulario, data, expectedUpdatedAt)`: upsert resultados por muestra + touch
  - `upsertEtapa6Cierre(idFormulario, data, expectedUpdatedAt)`: upsert etapa6 + touch (actualiza estado si cerrado)
  - Cada upsert usa `prisma.$transaction` con `assertConcurrency` atómico
- **Criterios de aceptación**:
  - Cada `upsertEtapaN` ejecuta en transacción
  - `assertConcurrency` lanza `CONCURRENCY_ERROR` si updatedAt no coincide
  - `touchFormulario` actualiza `updatedAt` automáticamente
  - `getFullInclude` devuelve árbol que incluye todas las relaciones
  - Test unitario: mock prisma, verificar llamadas a updateMany/upsert
- **Dependencias**: T-001, T-002
- **Estimación**: 1 archivo reescrito, ~350 líneas

#### T-008: SaureusService — lógica de negocio + cálculos + progresión
- **RF**: RF-04, RF-06, RF-07, RF-10, RF-12
- **Archivos**: `AssisTec API/src/services/saureus.service.js` (REESCRITO)
- **Descripción**: Reescribir `SaureusService`:
  - `assertCanWrite(usuario)`: verifica rol ANALISTA o ADMINISTRATOR
  - `serializeFormulario(formulario)`: usa `serializePrismaRecord`, convierte BigInt a string
  - `obtener(id)`: findById → 404 si null → serializar
  - `obtenerPorAnalisis(idSolicitudAnalisis)`: findBySolicitudAnalisis → `{ existe, formulario }`
  - `guardarEtapa(id, etapa, body, expectedUpdatedAt, usuario)`:
    - `assertCanWrite(usuario)`
    - `assertStageProgression(formulario, etapaNum)`: verifica etapa N-1 completada
    - `assertTemporalTolerances(body, etapaNum)`: homo-siembra < 15min (etapa 2)
    - Switch por etapaNum (1-6):
      - Etapa 1-4: mapear payload (snake_case → camelCase), stripUndefined, upsert
      - Etapa 5: **NO usar body.resultados.ufc_por_g** — leer etapas 2,3,4 → llamar `ufcCalculator` → persistir resultados calculados
      - Etapa 6: mapear cierre, actualizar estado si cerrado
  - `mapEtapaPayload(body)`, `mapEtapa2Payload(body)`, etc.: snake_case → camelCase con `parseDate`
  - `stripUndefined(obj)`: filtra valores undefined
- **Criterios de aceptación**:
  - `guardarEtapa` con etapa 5 ignora `ufc_por_g` del body, recalcula
  - Progresión bloqueada: etapa 2 sin etapa 1 completada → `INVALID_STAGE_PROGRESSION`
  - Tolerancia temporal: homo-siembra > 15min → `alertaTiempoHomo` en respuesta
  - RBAC: rol no autorizado → `UNAUTHORIZED_ROLE`
  - Test unitario: mock repository, verificar llamadas correctas por etapa
- **Dependencias**: T-004, T-007
- **Estimación**: 1 archivo reescrito, ~350 líneas

#### T-009: Controller unificado + Routes para formularios
- **RF**: RF-02, RF-03, RF-04, RF-05, RF-06
- **Archivos**:
  - `AssisTec API/src/controllers/formulario.controller.js` (NUEVO — unifica los 3 tipos)
  - `AssisTec API/src/routes/formulario.routes.js` (NUEVO — unifica los 3 tipos)
- **Descripción**:
  - **formulario.controller.js**: Controller genérico que recibe el service por tipo:
    - `obtener(req, res)`: `service.obtener(req.params.id)`
    - `obtenerPorAnalisis(req, res)`: `service.obtenerPorAnalisis(req.params.idAnalisis)`
    - `guardarEtapa(req, res)`: `service.guardarEtapa(id, etapa/fase, body, expectedUpdatedAt, user)`
    - `handleError(res, error)`: mapeo de errores de dominio → HTTP
  - **formulario.routes.js**: Router con patrón de tipo dinámico:
    - `/api/formulario/:tipo` como prefijo
    - `GET /:id` → verifyToken, authorizeAny(READ_ROLES), controller.obtener
    - `GET /por-analisis/:idAnalisis` → verifyToken, authorizeAny(READ_ROLES), controller.obtenerPorAnalisis
    - `PUT /:id/etapa/:n` → verifyToken, authorizeAny(WRITE_ROLES), optimisticLock, validateForm('sau', etapa), controller.guardarEtapa
    - `PUT /:id/fase/:n` → verifyToken, authorizeAny(WRITE_ROLES), optimisticLock, validateForm('coli'|'sal', fase), controller.guardarEtapa
    - Validar `:tipo` en ('sau', 'coli', 'sal') — middleware de validación de tipo
    - NO existe ruta POST
  - Registrar en `app.js`: `app.use('/api/formulario', formularioRoutes)`
- **Criterios de aceptación**:
  - GET /:id con ID inexistente → 404
  - GET /por-analisis/:id sin formulario → 200 `{ existe: false }`
  - PUT sin `updated_at` → 400
  - PUT con rol no autorizado → 403
  - PUT con Zod inválido → 400 con detalle por campo
  - PUT con concurrencia → 409 `CONCURRENCY_ERROR`
  - Tipo inválido en URL → 400
- **Dependencias**: T-006, T-007, T-008
- **Estimación**: 2 archivos nuevos, ~200 líneas

---

### Fase 3: Coliformes + Salmonella — repos, services, integración routes

#### [x] T-010: ColiRepository — extiende BaseFormRepository
- **RF**: RF-02, RF-03, RF-04
- **Archivos**: `AssisTec API/src/repositories/coliformes.repository.js` (NUEVO)
- **Descripción**: Crear `ColiRepository` extendiendo `BaseFormRepository`:
  - Constructor: `super(prisma.coliFormulario, 'idColiFormulario')`
  - `getFullInclude()`: formulario + muestras (con submuestras) + fase1-4 con hijos
  - `create(data)`: transaccional con muestras
  - `upsertFase1(idFormulario, data, expectedUpdatedAt)`: upsert fase1 + touch
  - `upsertFase2(idFormulario, data, expectedUpdatedAt)`: upsert fase2 + estufas (deleteMany + createMany) + micropipetas + touch
  - `upsertFase3(idFormulario, data, expectedUpdatedAt)`: upsert fase3 + submuestras (upsert por muestra × tipo × dilución × tubo) + controles + touch
  - `upsertFase4Resultados(idFormulario, data, expectedUpdatedAt)`: upsert resultados por muestra + touch
  - Patrón idéntico a SaureusRepository pero con modelos Coli
- **Criterios de aceptación**:
  - Cada upsert en transacción con assertConcurrency
  - Submuestras: upsert por clave compuesta (muestra × tipo × dilución × tubo)
  - Test unitario: mock prisma, verificar llamadas
- **Dependencias**: T-001, T-002
- **Estimación**: 1 archivo nuevo, ~200 líneas

#### [x] T-011: ColiService — lógica de negocio + cálculo NMP
- **RF**: RF-04, RF-08, RF-10, RF-12
- **Archivos**: `AssisTec API/src/services/coliformes.service.js` (NUEVO)
- **Descripción**: Crear `ColiService`:
  - `assertCanWrite(usuario)`, `serializeFormulario(formulario)`, `obtener(id)`, `obtenerPorAnalisis(id)`: mismo patrón que SaureusService
  - `guardarFase(id, fase, body, expectedUpdatedAt, usuario)`:
    - `assertCanWrite`, `assertStageProgression`
    - `assertTemporalTolerances`: lectura 24h/48h con tolerancia ±2h (Fase 3)
    - Switch por faseNum (1-4):
      - Fase 1-3: mapear payload, stripUndefined, upsert
      - Fase 4: **NO usar body del cliente** — leer Fase3Submuestra → agrupar por tipo lectura → llamar `nmpCalculator` → persistir en ColiFase4Resultado
  - `mapFasePayload(body)`: snake_case → camelCase
  - `assertTemporalTolerances(body, faseNum)`: calcular `lectura24hEnTolerancia`, `lectura48hEnTolerancia`
- **Criterios de aceptación**:
  - Fase 4 ignora valores del cliente, recalcula NMP
  - Tolerancia ±2h: fuera de rango → `enTolerancia: false` en respuesta
  - Progresión: fase 2 sin fase 1 completada → `INVALID_STAGE_PROGRESSION`
  - Test unitario: mock repository + nmpCalculator
- **Dependencias**: T-004, T-010
- **Estimación**: 1 archivo nuevo, ~250 líneas

#### [x] T-012: SalmonellaRepository — extiende BaseFormRepository
- **RF**: RF-02, RF-03, RF-04
- **Archivos**: `AssisTec API/src/repositories/salmonella.repository.js` (NUEVO)
- **Descripción**: Crear `SalRepository` extendiendo `BaseFormRepository`:
  - Constructor: `super(prisma.salFormulario, 'idSalFormulario')`
  - `getFullInclude()`: formulario + muestras + fase1-5 con todos los hijos (fase2a, 2b, 2c, 3a, 3b, 3cLectura, 4a, 4bLectura, 5Resultado)
  - `create(data)`: transaccional con muestras
  - `upsertFase1(idFormulario, data, expectedUpdatedAt)`: upsert fase1 + touch
  - `upsertFase2a(idFormulario, data, expectedUpdatedAt)`: upsert fase2a + touch
  - `upsertFase2b(idFormulario, data, expectedUpdatedAt)`: upsert fase2b + estufas + pipetas + micropipetas + touch
  - `upsertFase2c(idFormulario, data, expectedUpdatedAt)`: upsert fase2c + touch
  - `upsertFase3a(idFormulario, data, expectedUpdatedAt)`: upsert fase3a + touch
  - `upsertFase3b(idFormulario, data, expectedUpdatedAt)`: upsert fase3b + estufa + pipetas + micropipetas + touch
  - `upsertFase3cLectura(idFormulario, data, expectedUpdatedAt)`: upsert lecturas por muestra + touch
  - `upsertFase4a(idFormulario, data, expectedUpdatedAt)`: upsert fase4a + touch
  - `upsertFase4bLectura(idFormulario, data, expectedUpdatedAt)`: upsert lecturas por muestra × fase4a + touch
  - `upsertFase5Resultado(idFormulario, data, expectedUpdatedAt)`: upsert resultado por muestra + touch
- **Criterios de aceptación**:
  - Cada upsert en transacción con assertConcurrency
  - 10 métodos upsert (más que SAU y Coli)
  - Test unitario: mock prisma, verificar llamadas
- **Dependencias**: T-001, T-002
- **Estimación**: 1 archivo nuevo, ~300 líneas

#### [x] T-013: SalmonellaService — lógica de negocio + cálculo Presencia/Ausencia
- **RF**: RF-04, RF-09, RF-10, RF-12
- **Archivos**: `AssisTec API/src/services/salmonella.service.js` (NUEVO)
- **Descripción**: Crear `SalService`:
  - `assertCanWrite`, `serializeFormulario`, `obtener`, `obtenerPorAnalisis`: patrón estándar
  - `guardarFase(id, fase, body, expectedUpdatedAt, usuario)`:
    - `assertCanWrite`, `assertStageProgression`
    - `assertTemporalTolerances`:
      - Fase 2a: alerta si homo → estufa > 25min → `alertaTiempo25min = true`
      - Fase 1: si matriz = `polvo`, validar hidratación >= 1h → `hidratacionValida`
      - Fase 1: si matriz = `chocolate`, asignar `caldoHomogeneizacion = 'leche_descremada'` (ignorar body)
    - Switch por faseNum (1-10):
      - Fase 1-4: mapear payload, stripUndefined, upsert
      - Fase 5: **NO usar body** — leer Fase4bLectura → llamar `salmonellaCalculator` → persistir resultado en SalFase5Resultado
  - `mapFasePayload(body)`: snake_case → camelCase
- **Criterios de aceptación**:
  - Fase 5 ignora `resultado_final` del body, calcula Presencia/Ausencia
  - Fase 1 chocolate: body envía otro caldo → server asigna `leche_descremada`
  - Fase 1 polvo: hidratación < 1h → `hidratacionValida: false`
  - Fase 2a: tiempo > 25min → `alertaTiempo25min: true`
  - Progresión: fase N sin N-1 completada → `INVALID_STAGE_PROGRESSION`
  - Test unitario: mock repository + salmonellaCalculator
- **Dependencias**: T-004, T-012
- **Estimación**: 1 archivo nuevo, ~300 líneas

---

### Fase 4: Auto-creación, Integración, Tests

#### [x] T-014: FormularioMicrobiologicoService — auto-creación al validar solicitud
- **RF**: RF-01
- **Archivos**: `AssisTec API/src/services/formularioMicrobiologico.service.js` (NUEVO)
- **Descripción**: Crear service con método `crearFormulariosParaSolicitud(idSolicitud, tx)`:
  1. Consulta `SolicitudAnalisis` con `include: { formulario: true, muestra: true }` para la solicitud
  2. Por cada análisis, verifica `FormularioAnalisis.codigo` en `{ SAU, COLI, SAL }`
  3. Idempotencia: si ya existe formulario para ese `idSolicitudAnalisis`, salta
  4. Crea el formulario correspondiente:
     - `SAU` → `SauFormulario` con `SauMuestra` vinculadas a `SolicitudMuestra`
     - `COLI` → `ColiFormulario` con `ColiMuestra`
     - `SAL` → `SalFormulario` con `SalMuestra`
  5. Valores iniciales: `etapaActual: 1` / `faseActual: 1`, `estado: 'en_proceso'`, `rutAnalista: null`
  6. Todo dentro de `tx` (transacción padre) — si falla una creación, se revierte todo
  7. NO crea formulario para códigos que no sean SAU/COLI/SAL
- **Criterios de aceptación**:
  - Creación automática al validar solicitud completamente
  - Idempotencia: llamar 2 veces no duplica formularios
  - Transacción atómica: fallo parcial revierte todo
  - Solo crea para SAU, COLI, SAL — ignora otros códigos
  - Muestras vinculadas correctamente a SolicitudMuestra
  - Test de integración: crear solicitud con análisis SAU+COLI+SAL → validar → verificar 3 formularios creados
- **Dependencias**: T-007, T-010, T-012
- **Estimación**: 1 archivo nuevo, ~150 líneas

#### [x] T-015: Gancho en solicitud.service.js::validar()
- **RF**: RF-01
- **Archivos**: `AssisTec API/src/services/solicitud.service.js` (modificar)
- **Descripción**: Inyectar llamada a `formularioMicrobiologicoService.crearFormulariosParaSolicitud()` en `validar()`:
  - Después de línea 220 (`solicitudRepository.update()`), dentro del bloque `if (isFullyValidated)`:
  ```js
  if (isFullyValidated) {
    // ...existing code...
    const formularioService = require('./formularioMicrobiologico.service');
    await formularioService.crearFormulariosParaSolicitud(id, tx);
  }
  ```
  - La llamada debe usar la MISMA transacción Prisma (`tx`) que ya se usa en `validar()`
  - Si la creación falla, la transacción se revierte (la solicitud NO se marca como validada)
  - Agregar `require` al inicio del archivo
- **Criterios de aceptación**:
  - `validar()` con `isFullyValidated === true` → crea formularios automáticamente
  - `validar()` con `isFullyValidated === false` → NO crea formularios
  - Si creación falla → transacción revierte, solicitud NO cambia de estado
  - Test de integración: flujo completo validar → verificar formularios
- **Dependencias**: T-014
- **Estimación**: 1 archivo modificado, ~10 líneas nuevas

#### [x] T-016: Tests de integración — endpoints, concurrencia, auto-creación
- **RF**: RF-01 a RF-13 (todos)
- **Archivos**:
  - `AssisTec API/__tests__/integration/concurrentUpdate.test.js` (NUEVO)
  - `AssisTec API/__tests__/integration/sau.endpoints.test.js` (NUEVO)
  - `AssisTec API/__tests__/integration/coli.endpoints.test.js` (NUEVO)
  - `AssisTec API/__tests__/integration/sal.endpoints.test.js` (NUEVO)
  - `AssisTec API/__tests__/integration/autoCreation.test.js` (NUEVO)
- **Descripción**:
  - **concurrentUpdate.test.js** (RF-06): 10 requests PUT paralelos sobre mismo formulario → solo 1 gana, 9 reciben 409. Distintos analistas editan mismo formulario sin bloqueo de ownership.
  - **sau.endpoints.test.js** (RF-02, RF-03, RF-04, RF-07, RF-10):
    - GET retorna formulario completo
    - GET con ID inexistente → 404
    - PUT etapa 1 borrador → guarda parcial
    - PUT etapa 1 completada → valida obligatorios
    - PUT etapa 5 → recalcula UFC, ignora body
    - Progresión bloqueada → 409
  - **coli.endpoints.test.js** (RF-08, RF-10, RF-12):
    - PUT fase 4 → recalcula NMP, ignora body
    - Tolerancia 24h/48h ±2h
  - **sal.endpoints.test.js** (RF-09, RF-10, RF-12):
    - PUT fase 5 → calcula Presencia/Ausencia
    - Chocolate: asigna leche_descremada automáticamente
    - Polvo: valida hidratación >= 1h
  - **autoCreation.test.js** (RF-01):
    - Crear solicitud con análisis SAU+COLI+SAL → validar → verificar 3 formularios
    - Idempotencia: validar 2 veces → no duplica
    - Transacción atómica: simular fallo → revierte todo
  - Limpieza de BD después de cada test: `deleteMany()` en todas las tablas de formularios
- **Criterios de aceptación**:
  - `npm test` pasa con 0 fallos
  - Cobertura mínima: 3 casos por calculadora, 1 caso TOCTOU, 1 caso progresión por formulario, 3 casos auto-creación
  - Tests limpios: sin estado residual entre tests
- **Dependencias**: T-007, T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015
- **Estimación**: 5 archivos nuevos, ~600 líneas

---

## Criterios de Done

1. **Strict TDD**: Cada módulo tiene tests escritos ANTES de la implementación. `npm test` pasa con 0 fallos.
2. **Todos los RF cubiertos**: RF-01 a RF-13 implementados y verificados con tests.
3. **Sin POST público**: No existe endpoint `POST /api/formulario/{tipo}` — la creación es exclusivamente interna.
4. **Optimistic locking atómico**: Todos los PUT usan `updateMany({ where: { id, updatedAt } })` con verificación `count === 1`.
5. **Resultado final solo lectura**: Los 3 calculadores ignoran valores del cliente y recalculan siempre.
6. **Error sanitizado**: Ningún `err.message` ni `err.stack` de Prisma llega al cliente.
7. **Progresión secuencial**: No se puede guardar etapa N sin N-1 completada.
8. **BigInt serializado**: Todos los IDs BigInt se serializan como string en respuestas JSON.
9. **Spanish UI labels**: Todos los mensajes de error y respuestas en español.
10. **Conventional commits**: Cada commit sigue el formato `feat:`, `fix:`, `test:`, `refactor:`.
11. **Sin `any` types**: Todo TypeScript/JavaScript tipado correctamente.
12. **Sin `console.log`**: Usar `winston` logger en todo el código de producción.
13. **Sin hardcoded secrets**: Todas las configuraciones vía `process.env`.
14. **BaseRepository compartido**: Los 3 repos concretos extienden `BaseFormRepository` — sin duplicación de `assertConcurrency`, `touchFormulario`, `findById`.
15. **Tests de integración limpios**: BD de prueba sin estado residual entre tests.
