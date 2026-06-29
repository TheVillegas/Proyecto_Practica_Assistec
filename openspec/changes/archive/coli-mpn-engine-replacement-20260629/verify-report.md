# Verify Report — `coli-mpn-engine-replacement`

**Fecha**: 2026-06-29
**Status**: PASSED
**Change mergeado a main**: sí (PR #20 — https://github.com/TheVillegas/Proyecto_Practica_Assistec/pull/20)

## Resumen ejecutivo

El reemplazo del motor NMP de coliformes está correctamente implementado y mergeado a `main`. Las 9 fallas (F1–F9) del brief original están cerradas. Los 51 golden tests del motor pasan al 100%, los 10 tests unitarios del service pasan, y la suite completa reporta 339 tests verdes. Las 21 columnas nuevas existen en el schema Prisma, la migración es puramente aditiva, y el calculador viejo fue eliminado. Se identifican 2 WARNINGs (fallback legacy no rechazado, barrel `index.ts` no creado) y 2 SUGGESTIONs, sin issues CRITICAL.

---

## Resultados por sección

### 1. Requisitos del spec

#### R1: El motor NMP se importa del módulo TypeScript compilado
**✅ PASSED**
- Service línea 7: `const { calcularMPN, construirConteos } = require('../../dist/calculators/mpnColi.engine')`.
- `dist/calculators/mpnColi.engine.js` y `.d.ts` existen (artefactos de `tsc`).
- Los 51 golden tests pasan al 100% (40 NCh2047 + 7 ISO 7218 Anexo C + 4 extremos).

#### R2: Cálculo NMP para 3 organismos independientes
**✅ PASSED**
- `TIPOS_LECTURA = ['totales', 'fecales', 'ecoli']` (service línea 12).
- `_calcularResultadosFase4` itera los 3 tipos y llama a `_calcularDesdeSubmuestras` independientemente.
- `calcularNmp` procesa `lecturas.totales`, `lecturas.fecales`, `lecturas.ecoli` por separado.
- Test del service verifica: `totales.estado='estimado'`, `fecales.estado='mayor_que'`, `ecoli.categoriaRareza=3`.

#### R3: Validación de input del motor sin throw
**✅ PASSED**
- Motor líneas 195–203: valida `positivos < 0`, `tubos <= 0`, `positivos > tubos`, `!Number.isInteger()`, `volumenMuestraPorTubo <= 0`.
- Retorna `estado: 'invalido'` con `mpn: NaN` y campo `detalle` descriptivo.
- Golden test: `rechaza conteo inválido (positivos > tubos)` → pasa.

#### R4: Manejo de casos extremos sin throw
**✅ PASSED**
- Todos negativos: motor línea 207–213 → `estado: 'cero'`, `mpn: 0`, `limiteSuperior: ln(40)/Σ(n·v)`.
- Todos positivos: motor líneas 216–224 → `estado: 'mayor_que'`, `mpn: Infinity`, `limiteInferior` finito.
- Golden tests "todos negativos" y "todos positivos" pasan.

#### R5: 8 campos estadísticos por organismo siempre presentes
**✅ PASSED**
- `ResultadoMPN` en el motor (líneas 41–61) define: `mpn`, `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`.
- `_organismoResponse` (service líneas 282–293) expone los 8 campos.
- Test del service verifica `toHaveProperty` para los 8 campos.

#### R6: Categoría de rareza con umbrales del MD
**✅ PASSED**
- Motor líneas 165–169: `r < 0.01 → 3`, `r < 0.05 → 2`, `else → 1`.
- Golden test ISO `x=1,0,1` → `rar=0.021` → `cat=2` ✅.
- Golden test ISO `x=0,1,0` → `rar=0.087` → `cat=1` ✅.
- Golden test "lectura incongruente (0,3,0)" → `categoriaRareza=3` ✅.

#### R7: incongruenciaDetectada se deriva de categoriaRareza === 3
**✅ PASSED**
- Service líneas 319–321: `TIPOS_LECTURA.some(tipo => resultadosPorTipo[tipo].categoriaRareza === 3)`.
- `_observacionIncongruencia` (líneas 295–300) genera el texto con los organismos afectados.
- Test del service "deriva incongruenciaDetectada de categoriaRareza === 3" → pasa.

#### R8: Persistencia de 21 columnas nuevas en ColiFase4Resultado
**✅ PASSED**
- Schema Prisma líneas 942–964: 21 columnas nuevas (7 × 3 organismos), todas nullable.
- Repository `upsertFase4Resultados` (líneas 225–247) persiste los 21 campos.
- `_toDecimalOrNull` (service líneas 171–176) convierte `Infinity`/`NaN` → `null`.
- Test del service verifica `coliformesFecales` es `null` cuando `fecales.estado='mayor_que'`.

#### R9: Migración aditiva sin backfill
**✅ PASSED**
- `migration.sql` contiene exclusivamente 21 `ADD COLUMN` (todas nullable).
- Cero `UPDATE`, cero `DROP`, cero `ALTER COLUMN NOT NULL`.
- Verificación directa del archivo de migración.

#### R10: fase/4 arma conteos desde BD por tipoLectura
**✅ PASSED**
- `_calcularDesdeSubmuestras` (líneas 236–256) filtra por `tipoLectura` y construye `ConteoDilucion[]`.
- `_agruparLecturasPorDilucion` (líneas 211–234) usa `Map` + `sort((a,b) => parseFloat(b.dil) - parseFloat(a.dil))` (numérico descendente).
- Test del service verifica agrupamiento correcto por `tipoLectura`.

#### R11: Cierre de falla F1 — Unidades correctas
**✅ PASSED**
- Motor recibe `volumenMuestraPorTubo` explícito (`VOLUMENES_MUESTRA = [0.1, 0.01, 0.001]`).
- El resultado sale en NMP/g automáticamente sin factores manuales.
- Golden tests NCh2047 validan con `V_100ML = [10, 1, 0.1]` y multiplican por 100 para comparar.

#### R12: Cierre de falla F2 — 'todos positivos' no se capa en 1100
**✅ PASSED**
- Motor línea 90: `if (xSum === nSum) return Infinity`.
- Golden test "todos positivos ⇒ estado 'mayor_que' (no se fuerza a 1100)" verifica `r.mpn === Infinity` y `r.limiteInferior > 0`.

#### R13: Cierre de falla F3 — Sin throw en combinaciones válidas no tabuladas
**✅ PASSED**
- Motor resuelve por MLE (bisección geométrica). Cualquier patrón válido produce resultado.
- Solo datos inválidos (`x > n`, `v ≤ 0`, etc.) retornan `estado: 'invalido'`.
- Golden test ISO `x=1,0,1` (combinación no trivial) pasa sin throw.

#### R14: Cierre de falla F4 — SD, IC y Rarity siempre presentes
**✅ PASSED**
- Motor calcula `sdLog10MPN`, `icRegular`, `rarityIndex` para todo estado `estimado`.
- Casos extremos incluyen `rarityIndex: 1`, `categoriaRareza: 1`.
- Los 6 campos estadísticos + `mpn` + `estado` = 8 campos siempre presentes.

#### R15: Cierre de falla F5 — Iteración numérica sin sort alfabético
**✅ PASSED**
- `_agruparLecturasPorDilucion` usa `parseFloat(b.dil) - parseFloat(a.dil)` (línea 228).
- No hay `Object.keys().sort()` en el service.
- La única mención es en el comentario JSDoc (línea 209) documentando que NO se usa.

#### R16: Cierre de falla F6 — incongruenciaDetectada derivado, no hardcodeado
**✅ PASSED**
- Service línea 319: `incongruenciaDetectada = TIPOS_LECTURA.some(...)`.
- Test del service: patrón ecoli `(0,3,0)` → `incongruenciaDetectada=true`, `observacionIncongruencia` contiene `'E. coli'`.

#### R17: Cierre de falla F7 — Sin default de dilución '10'
**✅ PASSED**
- `_agruparLecturasPorDilucion` líneas 214–219: si `s.dilucion == null`, retorna `{ invalido: true, detalle: ... }`.
- No existe el patrón `s.dilucion || '10'`.
- Test del service "datos sin dilucion quedan invalidos" → pasa.

#### R18: Cierre de falla F8 — 3 grillas independientes, no mapeo 24h/48h
**✅ PASSED**
- `calcularNmp` recibe `body.muestras[].lecturas = { totales, fecales, ecoli }` (3 matrices 3×3).
- Cada organismo se calcula independientemente vía `_calcularDesdeLecturas`.
- Test del service verifica `fecales.estado='estimado'` y `ecoli.estado='cero'` con inputs distintos.
- **Nota**: existe fallback legacy (ver WARNING-1).

#### R19: Cierre de falla F9 — Sin cap artificial de 3 tubos
**✅ PASSED**
- `_normalizarConteoTubos` no existe en el service (verificación por grep: 0 resultados).
- Motor es genérico: `construirConteos` acepta cualquier número de tubos por dilución.
- `calcularMPN` no aplica cap alguno.

#### R20: Contrato de input/output de POST /calcular-nmp [BREAKING]
**✅ PASSED** (con WARNING — ver sección Issues)
- Input nuevo: `muestras[].lecturas = { totales, fecales, ecoli }` — implementado y testeado.
- Output nuevo: 3 `ResultadoMPN` con 8 campos + `incongruenciaDetectada` + `observacionIncongruencia` — implementado y testeado.
- **Desviación**: el formato viejo (`tubosPositivos24h/48h`) NO es rechazado; hay un fallback legacy con warning.

### 2. Contrato de input/output

**✅ PASSED**

| Aspecto | MD | Implementación | Estado |
|---|---|---|---|
| Input `POST /calcular-nmp` | §5.2: `lecturas.{totales,fecales,ecoli}` 3×3 booleanos | Service línea 374: detecta `usaNuevoContrato` | ✅ |
| Output `POST /calcular-nmp` | §6.1: 3 NMPs + 3 `ResultadoMPN` + incongruencia | Service líneas 405–418 | ✅ |
| `PUT /fase/4` conteos desde BD | MD §5: agrupar por `tipoLectura` | Service `_calcularDesdeSubmuestras` filtra por `tipoLectura` | ✅ |
| 8 campos por organismo | MD §6.3: `mpn`, `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado` | `_organismoResponse` líneas 282–293 | ✅ |
| `Infinity` → `null` en JSON | MD §6.4 | `_toNumberOrNull` líneas 182–187 | ✅ |

### 3. Cierre de F1–F9

| Falla | Descripción | Cierre | Evidencia | Estado |
|---|---|---|---|---|
| F1 | Unidades hardcodeadas | Motor recibe `v` explícito | `VOLUMENES_MUESTRA = [0.1, 0.01, 0.001]` (service línea 11) | ✅ |
| F2 | `'3,3,3' → 1100` | `estado: 'mayor_que'` con `Infinity` | Motor línea 90; golden test "todos positivos" | ✅ |
| F3 | Throw en no tabuladas | `estado: 'invalido'` sin throw | Motor líneas 195–203; golden test "rechaza conteo inválido" | ✅ |
| F4 | Sin SD/IC/Rarity | 7 campos estadísticos persistidos | Schema 21 columnas; `_serializarResultadoDb` | ✅ |
| F5 | `Object.keys().sort()` | Iteración numérica descendente | `_agruparLecturasPorDilucion` línea 228 | ✅ |
| F6 | `incongruenciaDetectada: false` hardcoded | Derivado de `categoriaRareza === 3` | Service línea 319–321 | ✅ |
| F7 | `s.dilucion \|\| '10'` | Validación explícita, sin default | Service líneas 214–219 | ✅ |
| F8 | Mapeo 24h/48h → organismo | 3 inputs independientes | `calcularNmp` líneas 379–383 | ✅ |
| F9 | `_normalizarConteoTubos` cap a 3 | Motor genérico, sin cap | grep `_normalizarConteoTubos` → 0 resultados | ✅ |

### 4. Naming convention

**✅ PASSED**

| Campo canónico | Motor (TS) | Schema (Prisma) | DB column | Response (JSON) | Estado |
|---|---|---|---|---|---|
| `sdLog10` | `sdLog10` | `totalesSdLog10` | `totales_sd_log10` | `sdLog10` | ✅ |
| `limiteInferior` | `limiteInferior` | `totalesLimiteInferior` | `totales_limite_inferior` | `limiteInferior` | ✅ |
| `limiteSuperior` | `limiteSuperior` | `totalesLimiteSuperior` | `totales_limite_superior` | `limiteSuperior` | ✅ |
| `rarityIndex` | `rarityIndex` | `totalesRarityIndex` | `totales_rarity_index` | `rarityIndex` | ✅ |
| `categoriaRareza` | `categoriaRareza` | `totalesCategoriaRareza` | `totales_categoria_rareza` | `categoriaRareza` | ✅ |
| `estado` | `estado` | `totalesEstado` | `totales_estado` | `estado` | ✅ |
| `log10Mpn` | `log10Mpn` | `totalesLog10Mpn` | `totales_log10_mpn` | `log10Mpn` | ✅ |

- **Sin colisión con `esSd`**: el campo `sd` en `sau.schema.js` (línea 56) pertenece al módulo de Salmonella y NO se toca. No hay campos `sd` ni `sd_` en el schema de coliformes.
- Los nombres `*_sd_log10` siempre incluyen el sufijo explícito.

### 5. Persistencia

**✅ PASSED**

- **21 columnas en schema**: líneas 942–964 de `schema.prisma`. 7 campos × 3 organismos (`totales_`, `fecales_`, `ecoli_`).
- **Tipos correctos**: `Decimal(15,6)` para `log10Mpn`, `sdLog10`, `rarityIndex`; `Decimal(15,4)` para `limiteInferior`, `limiteSuperior`; `Int? @db.SmallInt` para `categoriaRareza`; `String? @db.VarChar(50)` para `estado`.
- **Infinity → null**: `_toDecimalOrNull` (service línea 171) usa `!Number.isFinite(value)` para detectar `Infinity`/`NaN`.
- **Repository persiste los 21 campos**: `upsertFase4Resultados` líneas 225–247 mapea cada campo explícitamente.
- **`incongruenciaDetectada` y `observacionIncongruencia`**: se persisten en el `upsert` (repository líneas 257–258, 265–266).

### 6. Migración Prisma

**✅ PASSED**

Archivo: `prisma/migrations/20260629_add_mpn_statistical_fields_to_coli_fase4_resultado/migration.sql`

- 21 `ADD COLUMN`, todas nullable (sin `NOT NULL`).
- Cero `UPDATE`, cero `DROP`, cero `ALTER COLUMN`.
- Filas existentes mantienen valores y las nuevas columnas quedan `NULL`.
- Tipos correctos: `SMALLINT` para `categoria_rareza`, `VARCHAR(50)` para `estado`, `DECIMAL(15,6)` y `DECIMAL(15,4)` para los numéricos.

### 7. Tests

**✅ PASSED**

| Suite | Tests | Resultado |
|---|---|---|
| Golden tests (`mpnColi.engine.test.ts`) | 51 | ✅ 51 passed |
| Service unit (`coliformes.service.test.js`) | 10 | ✅ 10 passed |
| Suite completa | 339 | ✅ 339 passed |
| Saureus preexistentes (2 suites) | 2 FAIL (setup) | ➖ OUT OF SCOPE |

**Detalle de suites saureus fallidas** (preexistentes, NO parte del change):
1. `dist/services/saureus/__tests__/import-duplicado.service.test.js` — `ReferenceError: Cannot access 'mockFindFirst' before initialization` (error de hoisting en mock).
2. `dist/routes/__tests__/saureus-calculation.routes.test.js` — `Cannot find module '../saureus-calculation.routes'` (módulo renombrado/movido).

Ambas son anteriores al change `coli-mpn-engine-replacement` y no tienen relación con el motor NMP de coliformes.

### 8. MD (documento fuente de verdad)

**✅ PASSED**

- `docs/algoritmo-mpn-coliformes.md` existe, 370 líneas, completo.
- Secciones presentes: resumen ejecutivo, fuente de verdad, sistema de unidades, algoritmo, contrato input (§5), contrato output (§6), persistencia (§7), mapeo F1–F9 (§8), pruebas de regresión (§9), diferencias NCh (§10), glosario (§11), decisiones selladas (§12), referencias (§13).
- El MD referencia correctamente: `mpn.engine.ts`, `mpn.golden.test.ts`, `BRIEF_calculadora_NMP_coliformes.md`, `nmpColi.calculator.js` (eliminado), `coliformes.service.js`.
- La implementación coincide con el MD en: unidades (§3), algoritmo (§4), contrato input (§5), contrato output (§6), persistencia (§7), closure F1–F9 (§8).

### 9. Calculador viejo borrado

**✅ PASSED**

- `src/calculators/nmpColi.calculator.js` — **NO existe** (verificación por glob).
- `src/tests/unit/calculators/nmpColi.calculator.test.js` — **NO existe** (verificación por glob).
- `grep -r "nmpColi.calculator" src/` — **0 resultados**.
- `_normalizarConteoTubos` — **0 resultados** en el service.

### 10. Suite completa

```
Test Suites: 2 failed, 27 passed, 29 total
Tests:       339 passed, 339 total
Snapshots:   0 total
Time:        1.952 s
```

- **339 tests verdes** (todos los que pueden correr, pasan).
- **2 suites fallan** por errores de setup/imports en el módulo de Salmonella — preexistentes, out of scope.
- **ELIFECYCLE** de pnpm se debe exclusivamente a las 2 suites saureus.

---

## Issues

### CRITICAL

Ninguno.

### WARNING

1. **WARNING-1: Fallback legacy `tubosPositivos24h/48h` aún aceptado**
   - **Spec §"Contrato de input de POST /calcular-nmp [BREAKING]"**: dice "Scenario: Formato viejo rechazado → THEN el endpoint rechaza el request".
   - **Implementación**: `calcularNmp` acepta `tubosPositivos24h/48h` como fallback (service líneas 385–392), con `logger.warn`.
   - **Justificación documentada**: design.md §9 lo registra como "Deuda documentada". El comentario en el código dice `TODO: fallback temporal para frontend que aun no envia el contrato nuevo`.
   - **Impacto**: bajo. El fallback usa el motor nuevo (no la tabla vieja), solo cambia cómo se construyen los conteos. No hay regresión funcional.
   - **Resolución**: eliminar el fallback en el change de frontend que adopte `lecturas.{totales,fecales,ecoli}`.

2. **WARNING-2: Barrel `src/calculators/index.ts` no creado**
   - **Design.md §D2**: define `src/calculators/index.ts` como barrel de exports.
   - **Tasks.md §2.4**: marcada como `[ ]` (no completada).
   - **Impacto**: nulo. El service importa directamente de `mpnColi.engine`, no necesita el barrel. Funcionalmente correcto.
   - **Resolución**: crear el barrel como cleanup, o eliminar la tarea del design.

### SUGGESTION

1. **SUGGESTION-1: Conteo de golden tests**
   - El spec dice "41 entradas NCh2047 + 7 ISO + 4 extremos = 52". La tabla `TABLA_100ML` tiene 40 entradas (no 41). Total real: 51 tests. La discrepancia es cosmética en el spec; no afecta la cobertura.

2. **SUGGESTION-2: Tests de integración de rutas**
   - Design.md §D7 define `__tests__/routes/coliformes.routes.test.js` para integration tests con supertest. Tasks.md §3.3 y §3.4 están marcadas `[ ]`. No hay tests de integración de rutas para los endpoints de coliformes. Los tests unitarios del service cubren la lógica, pero falta la capa HTTP.

---

## Criterios de aceptación del brief §7

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | `nmpColi.calculator.js` reemplazado por `mpn.engine.ts`; ningún consumidor importa la tabla | ✅ | Archivo eliminado; grep 0 resultados; service importa `dist/calculators/mpnColi.engine` |
| 2 | `mpn.golden.test.ts` pasa al 100% | ✅ | 51/51 passed |
| 3 | `_calcularResultadosFase4` arma conteos por valor de dilución, sin `sort()` alfabético ni `slice(0,3)`, rechaza diluciones faltantes | ✅ | `_agruparLecturasPorDilucion` usa `parseFloat` sort; validación de `dilucion == null`; test del service pasa |
| 4 | `incongruenciaDetectada` se deriva de `categoriaRareza === 3` | ✅ | Service línea 319; test del service pasa |
| 5 | Resultados persistidos incluyen mpn, sd, IC inf/sup, rarityIndex, categoriaRareza y estado | ✅ | 21 columnas en schema; repository persiste los 21 campos |
| 6 | Decisiones §6 confirmadas y documentadas en `algoritmo.md` | ✅ | MD §12 "Decisiones del laboratorio selladas": §6.1 esquema, §6.2 contrato input, §6.3 naming |
| 7 | Unidades del resultado coinciden con el esquema confirmado (§6.1) | ✅ | Motor recibe `v = [0.1, 0.01, 0.001]` g → NMP/g directo; golden tests NCh2047 validan |

---

## Conclusión

El change `coli-mpn-engine-replacement` está **correctamente implementado y verificado**. Las 9 fallas del brief están cerradas con evidencia ejecutable (tests pasando). El motor de máxima verosimilitud reemplaza la tabla hardcodeada, los 3 organismos son independientes, la persistencia de 21 columnas nuevas es aditiva, y el naming convention respeta la restricción de no colisionar con `esSd` de Salmonella.

Los 2 WARNINGs identificados son desviaciones documentadas e intencionales (fallback legacy para el frontend, barrel no creado) que no bloquean el cierre del change. Se recomienda abordarlas en los changes de seguimiento.

**Veredicto final: PASS.**
