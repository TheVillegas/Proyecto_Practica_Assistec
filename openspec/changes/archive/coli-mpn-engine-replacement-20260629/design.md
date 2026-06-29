# Design: Reemplazo del Motor NMP de Coliformes

> **Change:** `coli-mpn-engine-replacement`
> **Proposal:** `openspec/changes/coli-mpn-engine-replacement/proposal.md`
> **Spec:** `openspec/changes/coli-mpn-engine-replacement/spec.md`
> **Single source of truth:** `docs/algoritmo-mpn-coliformes.md`

---

## 1. Resumen del change

Se reemplaza la tabla hardcodeada `nmpColi.calculator.js` por el motor de máxima verosimilitud `mpn.engine.ts` (fiel a ISO 7218 Cláusula 11, Wilrich-Jarvis V5). El motor se compila con `tsc` a `dist/` y se importa como CommonJS desde el service JS existente. Se refactoriza `coliformes.service.js` para cerrar F1–F9 (unidades correctas, 3 grillas independientes por organismo, iteración numérica de diluciones, incongruencia derivada de `categoriaRareza === 3`, sin caps artificiales). Se agregan 21 columnas nuevas en `ColiFase4Resultado` (7 campos × 3 organismos) vía migración Prisma aditiva sin backfill.

---

## 2. Contexto técnico

| Elemento | Valor |
|---|---|
| **Backend** | Node.js + Express 5 (CommonJS, NO ESM) |
| **ORM** | Prisma 6.19.3 + PostgreSQL 16 |
| **TypeScript** | `typescript@^5.9.0` (devDep) |
| **Testing** | Jest 30.3.0 + supertest 7 + ts-jest 29.2.0 (devDeps) |
| **Build actual** | `tsc` con `module: commonjs`, `outDir: ./dist`, `include: ["src/**/*"]` |
| **Motor a integrar** | `NUEVOS_ALGORITMOS/mpn.engine.ts` — 271 líneas, ya validado contra NCh2047 e ISO 7218 Anexo C |
| **Calculador a eliminar** | `src/calculators/nmpColi.calculator.js` — 104 líneas, tabla hardcodeada con F1–F4 |

---

## 3. Decisiones de diseño

### D1. Estrategia de build TS

**Contexto**: el motor está en TypeScript (`mpn.engine.ts`). El backend es CommonJS. Hay que decidir cómo importar TS desde JS.

| Opción | Pros | Contras |
|---|---|---|
| **A. Compilar con `tsc` a `dist/`** | Sin dependencia extra; `tsc` + `tsconfig.json` ya existen; `declaration: true` genera `.d.ts` usable por IDE JS | Paso de build obligatorio antes de `start`/`test` |
| **B. `tsx` o `ts-node` runtime** | Sin paso de compilación; editar-y-ejecutar directo | Dependencia nueva (`tsx` no está); overhead de compilación en caliente; no genera `.d.ts` |
| **C. Reescribir a JS** | Sin TypeScript en runtime | **Descartada** — rompe los tipos, los golden tests tipados, y la fuente de verdad del motor |

**Decisión: A** — compilación con `tsc`, paso de build explícito.

**Justificación**: `tsc` y `tsconfig.json` ya están configurados con `module: commonjs`, `outDir: ./dist`, `include: ["src/**/*"]` y `declaration: true`. El motor se mueve a `src/calculators/mpnColi.engine.ts` y cae automáticamente bajo `include`. La generación de `.d.ts` permite que el IDE del service JS autocomplete los tipos via JSDoc (ver D10). Sin dependencias nuevas.

**Riesgos**: tiempo de build agregado a `start` (~2s para compilar el motor). Si se vuelve molesto en dev, se puede migrar a `tsc --watch` en modo `dev`.

---

### D2. Estructura del código nuevo

**Decisión**: (definida en restricciones)

```
AssisTec API/src/calculators/mpnColi.engine.ts   ← motor (movido desde NUEVOS_ALGORITMOS/)
AssisTec API/src/calculators/index.ts              ← barrel de exports
AssisTec API/dist/calculators/mpnColi.engine.js    ← artefacto compilado (generado, NO commiteado)
AssisTec API/src/calculators/nmpColi.calculator.js ← ELIMINADO
```

El barrel `index.ts` exporta selectivamente: `export { calcularMPN, construirConteos, estimarMPN, ConteoDilucion, ResultadoMPN, EstadoMPN } from './mpnColi.engine';`. El service JS hace `require('../dist/calculators/')` o `require('../dist/calculators/mpnColi.engine')`.

---

### D3. Configuración de `ts-jest`

**Decisión**: extender `jest.config.js` con soporte para `.ts` via `ts-jest`:

```js
transform: { '^.+\\.tsx?$': 'ts-jest' },
moduleFileExtensions: ['ts', 'js', 'json'],
```

Los golden tests se mueven a `__tests__/calculators/mpnColi.engine.test.ts` y corren con `pnpm test` (que incluye `pretest` → `tsc`). Los tests del service siguen en `.js` (sin `ts-jest` overhead) pero pueden usar `jest.mock` para tipos del motor.

---

### D4. Schema Prisma — 21 columnas nuevas

**Decisión**: 7 columnas nuevas por organismo, todas nullable:

| Organismo | Columnas nuevas |
|---|---|
| `totales_*` | `totales_log10_mpn Decimal(15,6)?`, `totales_sd_log10 Decimal(15,6)?`, `totales_limite_inferior Decimal(15,4)?`, `totales_limite_superior Decimal(15,4)?`, `totales_rarity_index Decimal(15,6)?`, `totales_categoria_rareza SmallInt?`, `totales_estado String?` |
| `fecales_*` | Idéntico, prefijo `fecales_` |
| `ecoli_*` | Idéntico, prefijo `ecoli_` |

Los 3 NMPs principales (`coliformes_totales`, `coliformes_fecales`, `e_coli`) ya existen en el schema (línea 935–937) y se reutilizan para el campo `mpn` de cada organismo. La columna `totales_mpn` no se duplica — se mapea a `coliformes_totales`.

- `Infinity` se persiste como `NULL` (el service convierte vía `toDecimalOrNull`).
- `categoria_rareza` como `SmallInt` (1, 2, 3 o NULL) porque son valores discretos y validables en BD.
- `estado` como `String?` para consistencia con el patrón de strings del schema existente.

**`ColiFase3Submuestra.tipoLectura`** ya es `String @db.VarChar(5)` (línea 901). No requiere cambio de schema — el valor que se persiste ahora incluye `'totales'`, `'fecales'`, `'ecoli'` (antes solo `'totales'`).

---

### D5. Refactor del service

**`_calcularResultadosFase4`** (guardado vía `PUT /fase/4`):
1. Itera las submuestras de cada `ColiMuestra`.
2. Agrupa por `tipoLectura` (`'totales'`, `'fecales'`, `'ecoli'`).
3. Por cada `tipoLectura`, construye `ConteoDilucion[]` iterando por valor numérico de `dilucion` (**sin `Object.keys().sort()` alfabético ni `slice(0,3)`**).
4. Llama a `construirConteos(lecturasPorDilucion, [0.1, 0.01, 0.001])` → `calcularMPN(conteos)`.
5. Serializa el `ResultadoMPN` a los 7 campos del organismo (helper `_serializarResultado`).
6. Deriva `incongruenciaDetectada` = `categoriaRareza === 3` en CUALQUIER organismo.

**`calcularNmp`** (preview, `POST /calcular-nmp`):
1. Recibe `body.muestras[].lecturas` como `{ totales, fecales, ecoli }`, cada una matriz 3×3 de booleanos.
2. Por cada muestra, por cada organismo, llama a `construirConteos` + `calcularMPN` con `v = [0.1, 0.01, 0.001]`.
3. Devuelve el shape del MD §6.1 sin persistir.

**Helper privado `_serializarResultado(resultado, tipo)`**:
- Convierte `Infinity` → `null`, `NaN` → `null`, `null` → `null` para campos `Decimal`.
- Devuelve objeto plano con los 7 campos en snake_case, listo para `upsertFase4Resultados`.

---

### D6. Serialización `Infinity` → `null`

**Decisión**: helper `toDecimalOrNull(value)` en la capa de service, no en Prisma:

```js
function toDecimalOrNull(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return value; // Prisma.Decimal lo castea automáticamente
}
```

Se aplica a `mpn` (cuando `estado === 'mayor_que'`), `limiteSuperior` (ídem), y cualquier campo que pueda ser `Infinity` o `NaN`.

---

### D7. Estructura de tests

| Archivo | Tipo | Framework | Qué cubre |
|---|---|---|---|
| `__tests__/calculators/mpnColi.engine.test.ts` | Unit (motor) | ts-jest | 41 entradas NCh2047 + 7 ISO + 4 extremos (del MD §9) |
| `__tests__/services/coliformes.service.test.js` | Unit (service) | Jest (JS) | `_calcularResultadosFase4` con BD mockeada; `calcularNmp` con body; `incongruenciaDetectada` derivado; serialización `Infinity→null` |
| `__tests__/routes/coliformes.routes.test.js` | Integration | Jest + supertest | `POST /calcular-nmp` shape nuevo; `PUT /fase/4` persistencia 21 campos |

**Mocking strategy**: los tests unitarios del service mockean el motor con `jest.mock('../dist/calculators/mpnColi.engine')` para aislar la lógica de orquestación (agrupamiento, serialización, derivación de incongruencia). Los golden tests usan el motor real sin mock.

---

### D8. Migración Prisma

**Nombre**: `20260XXX_add_mpn_statistical_fields_to_coli_fase4_resultado`
**Tipo**: solo `ALTER TABLE ... ADD COLUMN` (todas nullable).
**Sin backfill**: cero `UPDATE`. Las filas existentes quedan con `NULL` en las columnas nuevas.
**Reversible**: `prisma migrate reset` o el down que Prisma genera (drop columns).

---

### D9. Scripts de npm

```json
{
  "build:ts": "tsc -p tsconfig.json",
  "build": "npm run build:ts",
  "prestart": "npm run build:ts",
  "pretest": "npm run build:ts",
  "start": "node app.js",
  "test": "jest",
  "test:golden": "jest __tests__/calculators/mpnColi.engine.test.ts"
}
```

`pretest` compila TS antes de correr Jest (necesario porque los tests del service importan desde `dist/`). Alternativa futura: build condicional con `cross-env` si el tiempo de build molesta en TDD rápido.

---

### D10. Riesgo: tipos del motor se pierden al compilar

**Contexto**: el motor TS exporta `ConteoDilucion`, `ResultadoMPN`, `EstadoMPN`. Al compilar a CommonJS, los tipos desaparecen para el service JS.

**Decisión**: **Opción (a) — JSDoc en `dist/` vía declaration files**. `tsc` con `declaration: true` (ya configurado) genera `dist/calculators/mpnColi.engine.d.ts`. El service JS puede referenciar los tipos vía JSDoc `@type`:

```js
/** @type {import('../dist/calculators/mpnColi.engine').ResultadoMPN} */
const resultado = calcularMPN(conteos);
```

Esto da autocomplete en VSCode y validación parcial sin requerir que el service migre a TS.

**Alternativa descartada (b)**: archivo `.types.ts` separado — añade complejidad sin beneficio real porque los `.d.ts` ya cumplen la misma función.

---

## 4. Arquitectura del cambio

### Flujo `POST /calcular-nmp` (preview, sin persistir)

```
[Frontend]
   |
   | POST /coli/formularios/:id/calcular-nmp
   | body: { muestras: [{ idColiMuestra, lecturas: { totales, fecales, ecoli } }] }
   |──────────────────────────────────────────────────────────────────────▶
   |                                                                 [coliController.calcularNmp]
   |                                                                       |
   |                                                                 [coliService.calcularNmp]
   |                                                                       |
   |                              ┌────────────────────────────────────────┤
   |                              │ por cada muestra, por cada organismo:  │
   |                              │   construirConteos(grilla 3×3, v)      │
   |                              │   → calcularMPN(conteos)               │
   |                              │   → _serializarResultado(resultado)    │
   |                              └────────────────────────────────────────┘
   |                                                                       │
   |                                            ┌──────────────────────────┘
   |                                            │ motor compilado
   |                                            ▼
   |                              dist/calculators/mpnColi.engine.js
   |
   | ◀──────────────────────────────────────────────────────────────────────
   | response: { fase4Resultado: [{ coliformesTotales, totales: { mpn, ... }, ... }] }
```

### Flujo `PUT /fase/4` (calcular y persistir)

```
[Frontend]
   |
   | PUT /coli/formularios/:id/fase/4
   |──────────────────────────────────────────────────────────────────────▶
   |                                                                 [coliController.guardarFase]
   |                                                                       |
   |                                                                 [coliService._calcularResultadosFase4]
   |                                                                       |
   |   ① Lee ColiFase3Submuestra desde BD (prisma, ya cargado en include)
   |   ② Agrupa por tipoLectura ('totales'|'fecales'|'ecoli')
   |   ③ Por tipoLectura, itera dilucion numéricamente → ConteoDilucion[]
   |   ④ calcularMPN(conteos) × 3 organismos                     ───▶ motor
   |   ⑤ _serializarResultado → 7 campos × 3 organismos
   |   ⑥ Deriva incongruenciaDetectada
   |                                                                       |
   |                                                                 [coliRepository.upsertFase4Resultados]
   |                                                                       |
   |   Prisma upsert con 21 columnas nuevas + incongruencia + observacion
   |
   | ◀──────────────────────────────────────────────────────────────────────
   | response: formulario serializado (incluye fase4Resultado[])
```

---

## 5. Estructura de archivos

| Archivo | Acción | Descripción |
|---|---|---|
| `AssisTec API/src/calculators/mpnColi.engine.ts` | **Crear** | Motor movido desde `NUEVOS_ALGORITMOS/mpn.engine.ts` |
| `AssisTec API/src/calculators/index.ts` | **Crear** | Barrel de exports (`calcularMPN`, `construirConteos`, tipos) |
| `AssisTec API/dist/calculators/` | **Generado** | Artefactos `tsc` — NO se commitean (`.gitignore`) |
| `AssisTec API/src/calculators/nmpColi.calculator.js` | **Eliminar** | Tabla hardcodeada con F1–F4 |
| `AssisTec API/src/services/coliformes.service.js` | **Modificar** | Refactor F5–F9: nuevo input, motor compilado, serialización |
| `AssisTec API/src/repositories/coliformes.repository.js` | **Modificar** | `upsertFase4Resultados` persiste 21 columnas nuevas |
| `AssisTec API/prisma/schema.prisma` | **Modificar** | 21 columnas nuevas en `ColiFase4Resultado` |
| `AssisTec API/prisma/migrations/2026XXXX_*/` | **Crear** | Migración aditiva (auto-generada por Prisma) |
| `AssisTec API/package.json` | **Modificar** | Scripts `build:ts`, `prestart`, `pretest`, `test:golden` |
| `AssisTec API/jest.config.js` | **Modificar** | `transform: ts-jest`, `moduleFileExtensions: [ts, js, json]` |
| `AssisTec API/__tests__/calculators/mpnColi.engine.test.ts` | **Crear** | Golden tests movidos de `NUEVOS_ALGORITMOS/` |
| `AssisTec API/__tests__/services/coliformes.service.test.js` | **Crear** | Unit tests del service con motor mockeado |
| `AssisTec API/__tests__/routes/coliformes.routes.test.js` | **Modificar** | Integration tests con nuevo contrato |

**No se modifican**: `coliformes.controller.js`, `coliformes.routes.js` (el wiring es el mismo; solo cambia el shape de datos).

---

## 6. Cambios al schema

### Diff de `ColiFase4Resultado`

```diff
  model ColiFase4Resultado {
    idColiFase4Resultado     BigInt     @id @default(autoincrement())
    idColiMuestra            BigInt     @unique
    coliformesTotales        Decimal?   @db.Decimal(15,4)
    coliformesFecales        Decimal?   @db.Decimal(15,4)
    eColi                    Decimal?   @db.Decimal(15,4)
    incongruenciaDetectada   Boolean    @default(false)
    observacionIncongruencia String?
+   totales_log10_mpn        Decimal?   @db.Decimal(15,6)
+   totales_sd_log10          Decimal?   @db.Decimal(15,6)
+   totales_limite_inferior  Decimal?   @db.Decimal(15,4)
+   totales_limite_superior  Decimal?   @db.Decimal(15,4)
+   totales_rarity_index     Decimal?   @db.Decimal(15,6)
+   totales_categoria_rareza Int?       @db.SmallInt
+   totales_estado           String?
+   fecales_log10_mpn        Decimal?   @db.Decimal(15,6)
+   ... (mismo patrón para fecales_* y ecoli_*)
  }
```

**Reglas de persistencia**:
- `Infinity` → `NULL` (no representable en `Decimal`). El `estado` y `limiteInferior/Superior` transmiten la información completa.
- `NaN` → `NULL`.
- `null`/`undefined` → `NULL`.
- `categoriaRareza` como `SmallInt` (1/2/3/NULL) — validación en BD de valores discretos.
- `estado` como `String` (`'cero'|'estimado'|'mayor_que'|'invalido'`).

---

## 7. Cambios al service

### `_calcularResultadosFase4` — Antes vs Después

| Aspecto | Antes | Después |
|---|---|---|
| Fuente de cálculo | `calcularResultadosNMP` (tabla) | `calcularMPN` (motor MLE) |
| Agrupamiento | `tipoLectura` hardcodeado `'totales','fecales','ecoli'` | Por `tipoLectura` desde BD |
| Orden de diluciones | `Object.keys(porDilucion).sort()` (alfabético) | Iteración por valor numérico |
| Dilución faltante | `s.dilucion \|\| '10'` (default falso) | Rechazo con error de validación |
| Cap de tubos | `_normalizarConteoTubos` con cap `[0,3]` | Sin cap (motor genérico) |
| Output persistido | 3 NMPs + `incongruenciaDetectada: false` hardcoded | 3 NMPs + 21 columnas + incongruencia derivada |
| Mapeo organismo | `24h→totales`, `48h→fecales/ecoli` | 3 grillas independientes por `tipoLectura` |

### `calcularNmp` — Antes vs Después

| Aspecto | Antes | Después |
|---|---|---|
| Input | `tubosPositivos24h[]`, `tubosPositivos48h[]` (arrays de números) | `lecturas: { totales, fecales, ecoli }` (3 matrices 3×3 booleanas) |
| Output | `{ coliformesTotales, coliformesFecales, eColi }` | `{ coliformesTotales, totales: { mpn, sdLog10, ... }, ... }` (MD §6.1) |
| Persiste | No | No (solo preview) |

### Helper `_serializarResultado`

```js
_serializarResultado(resultado, tipo) {
  const p = (v) => (v === null || v === undefined || !Number.isFinite(v) ? null : v);
  return {
    [`${tipo}_log10_mpn`]: p(resultado.log10Mpn),
    [`${tipo}_sd_log10`]: p(resultado.sdLog10),
    [`${tipo}_limite_inferior`]: p(resultado.limiteInferior),
    [`${tipo}_limite_superior`]: p(resultado.limiteSuperior),
    [`${tipo}_rarity_index`]: p(resultado.rarityIndex),
    [`${tipo}_categoria_rareza`]: resultado.categoriaRareza ?? null,
    [`${tipo}_estado`]: resultado.estado,
  };
}
```

---

## 8. Estrategia de testing

| Capa | Archivo | Qué verifica | Mock |
|---|---|---|---|
| **Unit — Motor** | `__tests__/calculators/mpnColi.engine.test.ts` | 41 entradas NCh2047, 7 ISO, 4 extremos | Sin mock (motor real) |
| **Unit — Service** | `__tests__/services/coliformes.service.test.js` | `_calcularResultadosFase4`: agrupamiento, iteración numérica, serialización. `calcularNmp`: 3 organismos independientes, `incongruenciaDetectada`, `Infinity→null` | `jest.mock` del motor |
| **Integration** | `__tests__/routes/coliformes.routes.test.js` | `POST /calcular-nmp` devuelve shape MD §6.1. `PUT /fase/4` persiste 21 campos | Motor real + DB de test |

**Cobertura**: los golden tests son el contrato de fidelidad a ISO 7218. Si un valor difiere de la calculadora oficial, la implementación es incorrecta. El criterio de aceptación del change es `mpnColi.engine.test.ts` al 100%.

---

## 9. Plan de migración / rollout

1. **Schema**: aplicar migración Prisma (`prisma migrate dev`). Solo `ADD COLUMN`, sin `UPDATE`. Las filas existentes quedan con `NULL`.
2. **Service**: mover motor a `src/calculators/`, compilar con `tsc`, refactorizar service (importar motor, eliminar `_normalizarConteoTubos`, nuevo `_calcularResultadosFase4`).
3. **Endpoints**: el controller y las rutas no cambian su wiring; solo cambia el shape de datos que el service devuelve.
4. **Tests**: golden tests → service tests → integration tests.
5. **Rollback**: revertir commits del service + revertir migración (`prisma migrate reset` al estado anterior). El frontend no se toca en este change → la UI sigue funcionando con la respuesta vieja post-rollback.

**Deuda documentada**: durante la vida de este change (antes del change de frontend que consuma el nuevo contrato), el frontend queda inconsistente con la respuesta del backend. La UI vieja espera el shape anterior (3 NMPs); la respuesta nueva incluye los 21 campos adicionales. Esta inconsistencia es conocida y se resuelve en el change de frontend correspondiente.

---

## 10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Tipos del motor se pierden al compilar a JS | Conocido | Los `.d.ts` generados por `tsc` + JSDoc en el service (D10). El service puede trabajar con `@type` imports sin migrar a TS. |
| Tamaño de respuesta aumentado (de 3 a 24 campos por muestra) | Bajo impacto | ~200 bytes extra por muestra en JSON. Aceptable para HTTP. El frontend decide qué campos renderiza. |
| Tiempo de build TS en `prestart`/`pretest` | Bajo (~2s) | Si se vuelve molesto en TDD: script `test:watch` con build condicional o `tsc --watch` en `dev`. |
| Frontend rompe con respuesta nueva | Esperado | Documentado como deuda. El frontend no se toca en este change. El cambio de UI se hace aparte usando el MD como contrato. |
| Discrepancia NMP vs calculadora oficial | Baja | Golden tests con tolerancia explícita `max(0.5, 0.12·esperado)`. Si rompen, se investiga antes de mergear. |
| Migración bloquea writes en producción | Baja | `ADD COLUMN` con `NULL` es instantáneo en PostgreSQL (no reescribe filas). Sin lock de tabla extendido. |

---

## 11. Out of scope

- **Frontend** (`Frontend/`): no se modifica. La maqueta nueva del formulario de coliformes se hace en un change aparte.
- **Change previo** `coli-nmp-calculation-and-master-tables`: no se reabre. Queda como referencia.
- **Enterobacterias**: fuera de scope (según scope del change previo).
- **Hojas de confirmación bioquímica**: fuera de scope (change futuro).

---

## 12. Referencias

| Referencia | Path |
|---|---|
| Fuente de verdad (MD) | `docs/algoritmo-mpn-coliformes.md` |
| Proposal | `openspec/changes/coli-mpn-engine-replacement/proposal.md` |
| Spec | `openspec/changes/coli-mpn-engine-replacement/spec.md` |
| Motor TS | `NUEVOS_ALGORITMOS/mpn.engine.ts` |
| Golden tests | `NUEVOS_ALGORITMOS/mpn.golden.test.ts` |
| Calculador viejo (a eliminar) | `AssisTec API/src/calculators/nmpColi.calculator.js` |
| Service actual (a refactorizar) | `AssisTec API/src/services/coliformes.service.js` |
| Repository | `AssisTec API/src/repositories/coliformes.repository.js` |
| Schema Prisma | `AssisTec API/prisma/schema.prisma` (modelo `ColiFase4Resultado` línea 932) |
| Controller | `AssisTec API/src/controllers/coliformes.controller.js` |
| Routes | `AssisTec API/src/routes/coliformes.routes.js` |
| tsconfig | `AssisTec API/tsconfig.json` |
| jest.config | `AssisTec API/jest.config.js` |
| package.json | `AssisTec API/package.json` |
| Design previo (referencia) | `openspec/changes/coli-nmp-calculation-and-master-tables/design.md` |
