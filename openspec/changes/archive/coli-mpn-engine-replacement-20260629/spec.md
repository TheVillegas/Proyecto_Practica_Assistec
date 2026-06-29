# Especificación: Reemplazo del Motor NMP de Coliformes

> **Change:** `coli-mpn-engine-replacement`
> **Fuente de verdad:** `docs/algoritmo-mpn-coliformes.md`
> **Proposal:** `openspec/changes/coli-mpn-engine-replacement/proposal.md`
> **Strict TDD:** `true` (cada requisito debe ser traducible a un test que falle antes de la implementación)

---

## 1. Resumen

Este change reemplaza el calculador NMP basado en tabla hardcodeada (`nmpColi.calculator.js`) por el motor de máxima verosimilitud `mpn.engine.ts` (fiel a ISO 7218 Cláusula 11, Wilrich-Jarvis V5). Cierra las 9 fallas (F1–F9) documentadas en el brief. Define un nuevo contrato de input (3 grillas independientes por organismo) y output (8 campos estadísticos por organismo) para los endpoints `POST /calcular-nmp` y `PUT /fase/4`. Persiste 21 columnas nuevas en `ColiFase4Resultado` (7 campos × 3 organismos, excluyendo los 3 NMPs principales que ya existen).

---

## 2. ADDED Requirements

### Requirement: El motor NMP se importa del módulo TypeScript compilado

El backend Node.js importa `mpn.engine.js` desde `dist/calculators/` después de la compilación TypeScript. El motor se usa **tal cual** (`mpn.engine.ts`), sin reimplementación.

#### Scenario: El service importa el motor compilado sin error

- **WHEN** el service requiere el módulo del motor (resuelto a `dist/calculators/mpn.engine.js`)
- **THEN** las funciones `calcularMPN`, `construirConteos`, `estimarMPN` están disponibles sin error de importación

#### Scenario: Los golden tests del motor pasan al 100%

- **WHEN** se ejecuta `pnpm test` desde `AssisTec API/`
- **THEN** todos los casos de `mpn.golden.test.ts` pasan: 41 entradas de la tabla NCh2047, 7 casos ISO 7218 Anexo C, y 4 casos extremos/QA

---

### Requirement: Cálculo NMP para 3 organismos independientes

El endpoint `POST /coli/formularios/:id/calcular-nmp` recibe, por muestra, 3 conjuntos independientes de +/− (uno por organismo: `totales`, `fecales`, `ecoli`) y produce 3 NMPs independientes con sus 8 campos estadísticos cada uno.

#### Scenario: Una muestra con los 3 organismos y patrones distintos

- **GIVEN** una muestra con `lecturas.totales = [[t,f,t],[f,f,t],[f,t,f]]`, `lecturas.fecales = [[t,t,f],[f,f,f],[t,f,t]]`, `lecturas.ecoli = [[f,f,f],[f,f,f],[f,f,f]]`
- **WHEN** el frontend llama a `POST /coli/formularios/:id/calcular-nmp`
- **THEN** la respuesta tiene 3 `ResultadoMPN` independientes: `totales` con `estado='estimado'`, `fecales` con `estado='estimado'`, `ecoli` con `estado='cero'`
- **AND** cada `ResultadoMPN` tiene sus propios valores de `mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`

#### Scenario: Una muestra con los 3 organismos totalmente negativos

- **GIVEN** una muestra con `lecturas.totales`, `lecturas.fecales`, `lecturas.ecoli` todas con celdas en `false`
- **WHEN** el frontend llama a `POST /coli/formularios/:id/calcular-nmp`
- **THEN** la respuesta tiene `coliformesTotales=0`, `coliformesFecales=0`, `eColi=0`
- **AND** cada `ResultadoMPN` tiene `estado='cero'`, `mpn=0`, `limiteInferior=0`, `limiteSuperior=ln(40)/Σ(n·v)`

---

### Requirement: Validación de input del motor sin throw

El motor rechaza inputs inválidos sin lanzar excepción, retornando `estado='invalido'` con un campo `detalle` descriptivo.

#### Scenario: Positivos mayores que tubos

- **GIVEN** un `ConteoDilucion` con `positivos=5`, `tubos=3`, `volumenMuestraPorTubo=0.01`
- **WHEN** se llama a `calcularMPN`
- **THEN** el resultado tiene `estado='invalido'`, `mpn=NaN`, todos los demás campos en `null`

#### Scenario: Volumen de muestra negativo o cero

- **GIVEN** un `ConteoDilucion` con `positivos=1`, `tubos=3`, `volumenMuestraPorTubo=0`
- **WHEN** se llama a `calcularMPN`
- **THEN** el resultado tiene `estado='invalido'`

#### Scenario: Tubos no enteros

- **GIVEN** un `ConteoDilucion` con `positivos=1`, `tubos=3.5`, `volumenMuestraPorTubo=0.01`
- **WHEN** se llama a `calcularMPN`
- **THEN** el resultado tiene `estado='invalido'`

---

### Requirement: Manejo de casos extremos sin throw

Los tres casos extremos (todos negativos, todos positivos, datos inválidos) se manejan sin throw y producen resultados predecibles.

#### Scenario: Todos los tubos negativos → estado 'cero'

- **GIVEN** conteos con `positivos=0` en todas las diluciones
- **WHEN** se llama a `calcularMPN`
- **THEN** `estado='cero'`, `mpn=0`, `limiteInferior=0`, `limiteSuperior=ln(40)/Σ(n·v)`, `rarityIndex=1`, `categoriaRareza=1`, `log10Mpn=null`, `sdLog10=null`

#### Scenario: Todos los tubos positivos → estado 'mayor_que'

- **GIVEN** conteos con `positivos=tubos` en todas las diluciones
- **WHEN** se llama a `calcularMPN`
- **THEN** `estado='mayor_que'`, `mpn=Infinity`, `limiteInferior` es finito y mayor que 0, `limiteSuperior=Infinity`, `rarityIndex=1`, `categoriaRareza=1`, `log10Mpn=null`, `sdLog10=null`

---

### Requirement: 8 campos estadísticos por organismo siempre presentes

Cada `ResultadoMPN` (por organismo) SIEMPRE incluye los 8 campos: `mpn`, `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`. En casos extremos, los campos no aplicables son `null` (o `0`/`Infinity` donde el MD lo especifica).

#### Scenario: Resultado estimado tiene todos los campos poblados

- **GIVEN** un patrón de positivos que produce `estado='estimado'`
- **WHEN** se calcula el NMP
- **THEN** `mpn` es un número finito positivo, `log10Mpn=log10(mpn)`, `sdLog10` es un número positivo, `limiteInferior < mpn < limiteSuperior`, `rarityIndex ∈ (0,1]`, `categoriaRareza ∈ {1,2,3}`, `estado='estimado'`

#### Scenario: Resultado inválido tiene todos los campos en null/NaN

- **GIVEN** datos inválidos (positivos > tubos)
- **WHEN** se calcula el NMP
- **THEN** `mpn=NaN`, `log10Mpn=null`, `sdLog10=null`, `limiteInferior=null`, `limiteSuperior=null`, `rarityIndex=null`, `categoriaRareza=null`, `estado='invalido'`

---

### Requirement: Categoría de rareza con umbrales del MD

`categoriaRareza` se calcula a partir de `rarityIndex` con los umbrales definidos en el MD §4.

#### Scenario: Rarity Index ≥ 0.05 → categoría 1 (plausible)

- **GIVEN** un `rarityIndex = 0.21`
- **WHEN** se calcula `categoriaRareza`
- **THEN** `categoriaRareza = 1`

#### Scenario: Rarity Index ∈ [0.01, 0.05) → categoría 2 (poco probable)

- **GIVEN** un `rarityIndex = 0.021`
- **WHEN** se calcula `categoriaRareza`
- **THEN** `categoriaRareza = 2`

#### Scenario: Rarity Index ∈ [0, 0.01) → categoría 3 (improbable / revisar)

- **GIVEN** un `rarityIndex = 0.005`
- **WHEN** se calcula `categoriaRareza`
- **THEN** `categoriaRareza = 3`

---

### Requirement: incongruenciaDetectada se deriva de categoriaRareza === 3

El campo `incongruenciaDetectada` de una muestra es `true` si `categoriaRareza === 3` para **cualquier** organismo de esa muestra. `observacionIncongruencia` describe el/los organismo(s) afectados.

#### Scenario: Un organismo con rareza 3 activa incongruencia

- **GIVEN** una muestra donde `totales.categoriaRareza=1`, `fecales.categoriaRareza=3`, `ecoli.categoriaRareza=1`
- **WHEN** se calcula el resultado de la muestra
- **THEN** `incongruenciaDetectada=true` y `observacionIncongruencia` menciona 'fecales'

#### Scenario: Ningún organismo con rareza 3

- **GIVEN** una muestra donde los 3 organismos tienen `categoriaRareza ∈ {1,2}`
- **WHEN** se calcula el resultado de la muestra
- **THEN** `incongruenciaDetectada=false` y `observacionIncongruencia=null`

---

### Requirement: Persistencia de 21 columnas nuevas en ColiFase4Resultado

Se agregan 21 columnas nuevas (7 campos × 3 organismos) a `ColiFase4Resultado`: `totales_log10_mpn`, `totales_sd_log10`, `totales_limite_inferior`, `totales_limite_superior`, `totales_rarity_index`, `totales_categoria_rareza`, `totales_estado` (e idénticos para `fecales_` y `ecoli_`). Los 3 NMPs principales (`coliformes_totales`, `coliformes_fecales`, `e_coli`) ya existen y se reutilizan. `Infinity` se serializa como `NULL` (Decimal no soporta Infinity).

#### Scenario: Persistencia de un resultado estimado completo

- **GIVEN** un resultado con `totales.estado='estimado'`, `totales.mpn=21`, `totales.log10Mpn=1.322`, `totales.sdLog10=0.31`
- **WHEN** se persiste vía `PUT /fase/4`
- **THEN** la fila en `ColiFase4Resultado` tiene `coliformes_totales=21`, `totales_log10_mpn=1.322`, `totales_sd_log10=0.31`, `totales_estado='estimado'`

#### Scenario: Persistencia de 'mayor_que' con Infinity → NULL

- **GIVEN** un resultado con `totales.estado='mayor_que'`, `totales.mpn=Infinity`
- **WHEN** se persiste vía `PUT /fase/4`
- **THEN** `coliformes_totales` es `NULL` en BD, `totales_estado='mayor_que'`, `totales_limite_inferior` tiene el valor finito de la cota inferior

#### Scenario: Persistencia de 'cero'

- **GIVEN** un resultado con `ecoli.estado='cero'`, `ecoli.mpn=0`
- **WHEN** se persiste vía `PUT /fase/4`
- **THEN** `e_coli=0`, `ecoli_log10_mpn=null`, `ecoli_sd_log10=null`, `ecoli_estado='cero'`

---

### Requirement: Migración aditiva sin backfill

La migración Prisma solo agrega columnas nullable. Las filas existentes quedan con `NULL` en los nuevos campos. No se eliminan ni modifican columnas existentes.

#### Scenario: Filas existentes no se ven afectadas

- **GIVEN** filas existentes en `ColiFase4Resultado` con valores en `coliformes_totales`, `coliformes_fecales`, `e_coli`
- **WHEN** se aplica la migración
- **THEN** las filas existentes mantienen sus valores y las nuevas columnas son `NULL`

---

### Requirement: fase/4 arma conteos desde BD por tipoLectura

El endpoint `PUT /coli/formularios/:id/fase/4` arma los `ConteoDilucion[]` desde `ColiFase3Submuestra` agrupando por `tipoLectura` (`'totales'`, `'fecales'`, `'ecoli'`). La iteración es por valor numérico de dilución, sin `Object.keys().sort()`, sin `slice(0,3)`, sin default `'10'`.

#### Scenario: Agrupamiento correcto por tipoLectura

- **GIVEN** submuestras en fase 3 con `tipoLectura='totales'` y `tipoLectura='fecales'` y `tipoLectura='ecoli'`, cada una con sus diluciones y presencias
- **WHEN** se llama a `PUT /fase/4`
- **THEN** se construyen 3 `ConteoDilucion[]` independientes (uno por organismo), cada uno iterando por valor numérico de dilución

#### Scenario: Dilución faltante rechaza la muestra

- **GIVEN** una muestra con submuestras para `totales` que solo tienen diluciones `'0.1'` y `'0.01'` (falta `'0.001'`)
- **WHEN** se llama a `PUT /fase/4`
- **THEN** la muestra es rechazada con error de validación (sin default `'10'`)

---

### Requirement: Cierre de falla F1 — Unidades correctas

El motor recibe `v` explícito (`[0.1, 0.01, 0.001]` g) y devuelve NMP/g directo, sin factores manuales de corrección.

#### Scenario: NMP en NMP/g con esquema confirmado

- **GIVEN** conteos con `v=[0.1, 0.01, 0.001]` (esquema laboratorio: suspensión 1:10, inóculos 1/0.1/0.01 mL)
- **WHEN** se calcula el NMP
- **THEN** el resultado está en NMP/g sin multiplicación por 10 o 100

---

### Requirement: Cierre de falla F2 — 'todos positivos' no se capa en 1100

El caso `'3,3,3'` produce `estado='mayor_que'` con `mpn=Infinity` y `limiteInferior` exacto, no 1100.

#### Scenario: 3,3,3 produce 'mayor_que' en vez de 1100

- **GIVEN** conteos con `positivos=[3,3,3]`, `tubos=[3,3,3]`, `v=[0.1, 0.01, 0.001]`
- **WHEN** se calcula el NMP
- **THEN** `estado='mayor_que'`, `mpn=Infinity`, `limiteInferior` es un valor finito mayor que 0 (NO 1100)

---

### Requirement: Cierre de falla F3 — Sin throw en combinaciones válidas no tabuladas

El motor resuelve por MLE; cualquier patrón válido tiene respuesta. Solo datos inválidos producen `estado='invalido'`.

#### Scenario: Combinación no tabulada produce resultado válido

- **GIVEN** un patrón de positivos que no existe en la tabla NCh2047 (ej: `(0,3,1)`)
- **WHEN** se calcula el NMP
- **THEN** el resultado tiene `estado='estimado'` (o el que corresponda) sin lanzar excepción

---

### Requirement: Cierre de falla F4 — SD, IC y Rarity siempre presentes

El motor entrega los 6 campos estadísticos además de `mpn` y `estado`. Se persisten y devuelven siempre.

#### Scenario: Resultado estimado incluye SD, IC y Rarity

- **GIVEN** un patrón con `estado='estimado'`
- **WHEN** se calcula el NMP
- **THEN** `sdLog10` es un número positivo, `limiteInferior` y `limiteSuperior` son números finitos, `rarityIndex ∈ (0,1]`, `categoriaRareza ∈ {1,2,3}`

---

### Requirement: Cierre de falla F5 — Iteración numérica sin sort alfabético

`_calcularResultadosFase4` itera por valor numérico de dilución, sin `Object.keys().sort()` ni `slice(0,3)`.

#### Scenario: Diluciones ordenadas numéricamente

- **GIVEN** submuestras con diluciones `'0.1'`, `'0.01'`, `'0.001'` (que alfabéticamente serían `'0.001'`, `'0.01'`, `'0.1'`)
- **WHEN** se arma el `ConteoDilucion[]`
- **THEN** las diluciones se procesan en orden numérico descendente: `0.1`, `0.01`, `0.001` (no alfabético)

---

### Requirement: Cierre de falla F6 — incongruenciaDetectada derivado, no hardcodeado

`incongruenciaDetectada` se deriva de `categoriaRareza === 3` para cada organismo. No está hardcodeado en `false`.

#### Scenario: Lectura incongruente activa la detección

- **GIVEN** un patrón `(0,3,0)` que produce `categoriaRareza=3`
- **WHEN** se calcula el resultado de la muestra
- **THEN** `incongruenciaDetectada=true`

---

### Requirement: Cierre de falla F7 — Sin default de dilución '10'

Se rechaza la muestra si falta la dilución. No se usa `s.dilucion || '10'`.

#### Scenario: Dilución faltante produce error

- **GIVEN** una submuestra con `dilucion=null` o `dilucion=undefined`
- **WHEN** se intenta construir el `ConteoDilucion[]`
- **THEN** la muestra es rechazada con error de validación (no se asigna default `'10'`)

---

### Requirement: Cierre de falla F8 — 3 grillas independientes, no mapeo 24h/48h

El input de `calcular-nmp` acepta 3 conjuntos independientes `totales/fecales/ecoli` (matriz 3×3 de booleanos), no `tubosPositivos24h/tubosPositivos48h`.

#### Scenario: Fecales y ecoli con patrones distintos

- **GIVEN** `lecturas.fecales=[[t,t,f],[f,f,f],[t,f,t]]` y `lecturas.ecoli=[[f,f,f],[f,f,f],[f,f,f]]`
- **WHEN** se calcula el NMP
- **THEN** `fecales` tiene `estado='estimado'` y `ecoli` tiene `estado='cero'` (no son iguales)

---

### Requirement: Cierre de falla F9 — Sin cap artificial de 3 tubos

El motor es genérico en número de tubos y diluciones. No se aplica `_normalizarConteoTubos` con cap de `[0,3]` ni `slice(0,3)`.

#### Scenario: El motor acepta más de 3 tubos por dilución

- **GIVEN** conteos con `tubos=5` en una dilución
- **WHEN** se calcula el NMP
- **THEN** el motor procesa los 5 tubos sin error y produce un resultado válido

---

## 3. MODIFIED Requirements

### Requirement: Contrato de input de POST /calcular-nmp [BREAKING]

El body de `POST /coli/formularios/:id/calcular-nmp` ahora exige `muestras[].lecturas` como un objeto `{ totales, fecales, ecoli }` con grillas `[3 diluciones][3 tubos]` de booleanos. Reemplaza `tubosPositivos24h / tubosPositivos48h`.

(Previously: el body aceptaba `tubosPositivos24h` y `tubosPositivos48h` como arrays de 3 números)

#### Scenario: Nuevo formato de input aceptado

- **GIVEN** un body con `muestras[0].lecturas = { totales: [[t,f,t],[f,f,t],[f,t,f]], fecales: [[t,f,f],[f,f,f],[t,f,t]], ecoli: [[f,f,f],[f,f,f],[f,f,f]] }`
- **WHEN** se llama a `POST /calcular-nmp`
- **THEN** el endpoint procesa las 3 grillas y devuelve resultados

#### Scenario: Formato viejo rechazado

- **GIVEN** un body con `muestras[0].tubosPositivos24h = [2,1,0]`
- **WHEN** se llama a `POST /calcular-nmp`
- **THEN** el endpoint rechaza el request (el campo `tubosPositivos24h` no es reconocido)

---

### Requirement: Contrato de output de POST /calcular-nmp [BREAKING]

La respuesta ahora incluye el `ResultadoMPN` completo por organismo (8 campos estadísticos) más `incongruenciaDetectada` y `observacionIncongruencia`. Antes solo devolvía los 3 NMPs principales.

(Previously: la respuesta solo tenía `coliformesTotales`, `coliformesFecales`, `eColi`)

#### Scenario: Respuesta con ResultadoMPN completo

- **WHEN** se llama a `POST /calcular-nmp` con datos válidos
- **THEN** cada muestra en `fase4Resultado` tiene `coliformesTotales`, `coliformesFecales`, `eColi` (NMPs principales) Y objetos `totales`, `fecales`, `ecoli` (cada uno con `mpn`, `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`) más `incongruenciaDetectada` y `observacionIncongruencia`

---

### Requirement: PUT /fase/4 arma conteos por organismo desde BD [BREAKING]

El endpoint `PUT /coli/formularios/:id/fase/4` ya no mapea `24h→totales, 48h→fecales/ecoli`. Ahora arma conteos por organismo a partir de las lecturas persistidas en `ColiFase3Submuestra` agrupando por `tipoLectura`.

(Previously: el service mapeaba tiempo de lectura a organismo: `totales←24h`, `fecales←48h`, `ecoli←48h`)

#### Scenario: Conteos armados por tipoLectura

- **GIVEN** submuestras con `tipoLectura='totales'`, `tipoLectura='fecales'`, `tipoLectura='ecoli'`
- **WHEN** se llama a `PUT /fase/4`
- **THEN** se construyen 3 `ConteoDilucion[]` independientes agrupando por `tipoLectura`, no por tiempo de lectura

---

## 4. REMOVED Requirements

### Requirement: nmpColi.calculator.js (calculador viejo)

(Razón: reemplazado por `mpn.engine.ts` compilado. La tabla hardcodeada tiene las fallas F1–F4.)

El archivo `AssisTec API/src/calculators/nmpColi.calculator.js` se elimina del repositorio. Ningún consumidor importa la tabla hardcodeada como fuente de cálculo.

#### Scenario: El archivo no existe en el repositorio

- **WHEN** se busca `nmpColi.calculator.js` en el repositorio
- **THEN** el archivo no existe

#### Scenario: Ningún import referencia el calculador viejo

- **WHEN** se busca `nmpColi.calculator` en los imports del proyecto
- **THEN** no hay referencias activas

---

### Requirement: _normalizarConteoTubos (cap artificial)

(Razón: cierra F9. El motor es genérico; el normalizador capaba a 3 tubos y limitaba valores a `[0,3]`.)

El método `_normalizarConteoTubos` se elimina de `coliformes.service.js`.

#### Scenario: El método no existe en el service

- **WHEN** se inspecciona `coliformes.service.js`
- **THEN** `_normalizarConteoTubos` no está definido

---

### Requirement: Mapeo 24h/48h → organismo (F8)

(Razón: cierra F8. El mapeo mezclaba tiempo de lectura con tipo de organismo.)

El mapeo `totales←tubosPositivos24h`, `fecales←tubosPositivos48h`, `ecoli←tubosPositivos48h` se elimina de `calcularNmp`.

#### Scenario: El service no mapea por tiempo de lectura

- **WHEN** se inspecciona el método `calcularNmp` en `coliformes.service.js`
- **THEN** no hay referencia a `tubosPositivos24h` ni `tubosPositivos48h`

---

## 5. Cross-references

| Referencia | Archivo |
|---|---|
| Proposal | `openspec/changes/coli-mpn-engine-replacement/proposal.md` |
| Fuente de verdad (MD) | `docs/algoritmo-mpn-coliformes.md` |
| Brief original (F1–F9) | `NUEVOS_ALGORITMOS/BRIEF_calculadora_NMP_coliformes.md` |
| Motor TS | `NUEVOS_ALGORITMOS/mpn.engine.ts` |
| Golden tests | `NUEVOS_ALGORITMOS/mpn.golden.test.ts` |
| Calculador viejo (eliminado) | `AssisTec API/src/calculators/nmpColi.calculator.js` |
| Service actual (refactor) | `AssisTec API/src/services/coliformes.service.js` |
| Schema Prisma | `AssisTec API/prisma/schema.prisma` (modelo `ColiFase4Resultado`, línea ~932) |
| Submuestras | `AssisTec API/prisma/schema.prisma` (modelo `ColiFase3Submuestra`, línea ~898) |
| Rutas | `AssisTec API/src/routes/coliformes.routes.js` |
| Controller | `AssisTec API/src/controllers/coliformes.controller.js` |

### Cierre de fallas F1–F9

| Falla | Requisito de cierre | Escenario verificador |
|---|---|---|
| F1 | Cierre de falla F1 — Unidades correctas | NMP en NMP/g con esquema confirmado |
| F2 | Cierre de falla F2 — 'todos positivos' no se capa en 1100 | 3,3,3 produce 'mayor_que' en vez de 1100 |
| F3 | Cierre de falla F3 — Sin throw en combinaciones válidas | Combinación no tabulada produce resultado válido |
| F4 | Cierre de falla F4 — SD, IC y Rarity siempre presentes | Resultado estimado incluye SD, IC y Rarity |
| F5 | Cierre de falla F5 — Iteración numérica sin sort alfabético | Diluciones ordenadas numéricamente |
| F6 | Cierre de falla F6 — incongruenciaDetectada derivado | Lectura incongruente activa la detección |
| F7 | Cierre de falla F7 — Sin default de dilución '10' | Dilución faltante produce error |
| F8 | Cierre de falla F8 — 3 grillas independientes | Fecales y ecoli con patrones distintos |
| F9 | Cierre de falla F9 — Sin cap artificial de 3 tubos | El motor acepta más de 3 tubos por dilución |
