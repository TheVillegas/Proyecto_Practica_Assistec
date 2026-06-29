# Tasks: Reemplazo del Motor NMP de Coliformes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~510 (PR1 ~50 + PR2 ~400 + PR3 ~60) |
| 400-line budget risk | Alto → mitigado por chained PRs |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 → PR #2 → PR #3 (feature-branch-chain) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Estrategia de chain

- **Tracker**: `feature/motor_coliformes` (desde `origin/main`). Solo esta rama mergea a `main`.
- **PR #1** → target: tracker. Rama: `feature/mpn-schema-migration`.
- **PR #2** → target: PR #1 (post-merge al tracker). Rama: `feature/mpn-ts-engine-and-golden`.
- **PR #3** → target: PR #2 (post-merge al tracker). Rama: `feature/mpn-service-refactor`.

### Suggested Work Units

| Unit | Goal | PR | Target | Líneas |
|------|------|----|--------|--------|
| 1 | Schema + migración Prisma (21 columnas) | PR #1 | tracker | ~50 |
| 2 | Motor TS compilado + golden tests + build pipeline | PR #2 | PR #1 | ~400 |
| 3 | Service refactor + persistencia + integration tests | PR #3 | PR #2 | ~60 |

---

## PR #1 — Schema + Migración

**Rama**: `feature/mpn-schema-migration`
**Target**: `feature/motor_coliformes` (tracker)
**Líneas estimadas**: ~50
**Depende de**: —

### Tareas

#### 1.1 Editar `prisma/schema.prisma` — agregar 21 columnas a `ColiFase4Resultado`

- [x] **Acción**: Agregar 7 columnas por organismo (prefijos `totales_`, `fecales_`, `ecoli_`): `log10_mpn Decimal(15,6)?`, `sd_log10 Decimal(15,6)?`, `limite_inferior Decimal(15,4)?`, `limite_superior Decimal(15,4)?`, `rarity_index Decimal(15,6)?`, `categoria_rareza Int? @db.SmallInt`, `estado String?`. Insertar después de `observacionIncongruencia` (línea 939). Los 3 NMPs principales ya existen (líneas 935-937).
- **Comando**: `diff` visual contra design.md §6.
- **Cierre**: 21 campos nuevos, todos nullable, snake_case consistente con el schema existente.

#### 1.2 Generar migración Prisma

- [x] **Acción**: Correr `pnpm prisma migrate dev --name add_mpn_statistical_fields_to_coli_fase4_resultado`.
- **Comando**: `pnpm prisma migrate dev --name add_mpn_statistical_fields_to_coli_fase4_resultado`
- **Cierre**: Migración creada en `prisma/migrations/`. El SQL solo contiene `ALTER TABLE ... ADD COLUMN` (todas nullable). Cero `UPDATE`, cero `DROP`.

#### 1.3 Regenerar cliente Prisma

- [x] **Acción**: Verificar que el cliente se regenera sin errores.
- **Comando**: `pnpm prisma generate`
- **Cierre**: Exit 0. El tipo `ColiFase4Resultado` en el cliente incluye los 21 campos nuevos.

#### 1.4 Verificar tests existentes

- [x] **Acción**: Correr la suite completa para confirmar que las columnas nullable no rompen nada.
- **Comando**: `pnpm test`
- **Cierre**: Todos los tests existentes pasan sin cambios.

#### 1.5 Commit y push

- [x] **Acción**: Commit + push de la rama.
- **Comando**: `git add -A && git commit -m "feat(schema): add 21 MPN statistical fields to ColiFase4Resultado"`
- **Cierre**: Commit en `feature/mpn-schema-migration`, push al remote.

---

## PR #2 — Motor TS + Build + Golden Tests

**Rama**: `feature/mpn-ts-engine-and-golden`
**Target**: PR #1 (post-merge al tracker)
**Líneas estimadas**: ~400 (motor 271 + tests ~104 + config ~25)
**Depende de**: PR #1

### Tareas

#### 2.1 (RED) Mover golden tests y configurar ts-jest

- [x] **Acción**: Copiar `NUEVOS_ALGORITMOS/mpn.golden.test.ts` a `AssisTec API/__tests__/calculators/mpnColi.engine.test.ts`. Extender `jest.config.js`: agregar `'ts'` a `moduleFileExtensions`, agregar `transform: { '^.+\.tsx?$': 'ts-jest' }`, ampliar `testMatch` para incluir `**/__tests__/**/*.test.ts`.
- **Comando**: `pnpm test -- __tests__/calculators/mpnColi.engine.test.ts`
- **Cierre**: Falla con "Cannot find module 'ts-jest'" o error de import — `ts-jest` está en devDependencies pero no configurado como transform.

#### 2.2 (RED) Mover motor TS

- [x] **Acción**: Copiar `NUEVOS_ALGORITMOS/mpn.engine.ts` a `AssisTec API/src/calculators/mpnColi.engine.ts`. Actualizar import en el test: `from '../../src/calculators/mpnColi.engine'`.
- **Comando**: `pnpm test -- __tests__/calculators/mpnColi.engine.test.ts`
- **Cierre**: Falla con error de import/compilación — el motor existe pero ts-jest no lo resuelve correctamente sin el build previo.

#### 2.3 (GREEN) Configurar build TS en package.json

- [x] **Acción**: Agregar scripts a `package.json`: `"build:ts": "tsc -p tsconfig.json"`, `"build": "npm run build:ts"`, `"prestart": "npm run build:ts"`, `"pretest": "npm run build:ts"`, `"test:golden": "jest __tests__/calculators/mpnColi.engine.test.ts"`. Verificar que `tsconfig.json` ya tiene `declaration: true`, `module: commonjs`, `outDir: ./dist`, `include: ["src/**/*"]` (ya configurado — sin cambios).
- **Comando**: `pnpm build:ts`
- **Cierre**: Compila sin errores. `dist/calculators/mpnColi.engine.js` y `dist/calculators/mpnColi.engine.d.ts` existen.

#### 2.4 (GREEN) Crear barrel `src/calculators/index.ts`

- [ ] **Acción**: Crear `src/calculators/index.ts` con re-exports selectivos: `export { calcularMPN, construirConteos, estimarMPN } from './mpnColi.engine'` y los tipos `ConteoDilucion`, `ResultadoMPN`, `EstadoMPN`.
- **Comando**: `pnpm build:ts`
- **Cierre**: `dist/calculators/index.js` y `dist/calculators/index.d.ts` generados correctamente.

#### 2.5 (GREEN) Verificar .d.ts para tipos del motor (D10)

- [x] **Acción**: Confirmar que `dist/calculators/mpnColi.engine.d.ts` exporta los tipos `ConteoDilucion`, `ResultadoMPN`, `EstadoMPN`. Verificar que el service JS podría usar `@type {import('../dist/calculators/mpnColi.engine').ResultadoMPN}` vía JSDoc.
- **Comando**: `cat dist/calculators/mpnColi.engine.d.ts | head -30`
- **Cierre**: Los tipos son visibles en el `.d.ts` generado.

#### 2.6 (REFACTOR) Verificar golden tests al 100%

- [x] **Acción**: Correr los golden tests contra el motor real (sin mock).
- **Comando**: `pnpm test -- __tests__/calculators/mpnColi.engine.test.ts`
- **Cierre**: 41 entradas NCh2047 + 7 ISO + 4 extremos = 52 casos, todos pasan.

#### 2.7 Agregar `dist/` al `.gitignore`

- [x] **Acción**: Agregar línea `dist/` al `.gitignore` del backend si no existe.
- **Comando**: `grep -q '^dist/' .gitignore || echo 'dist/' >> .gitignore`
- **Cierre**: `dist/` ignorado por git.

#### 2.8 Commit, push y abrir PR

- [x] **Acción**: Commit + push + crear PR contra el tracker.
- **Comando**: `git add -A && git commit -m "feat(calc): integrate MPN engine with TypeScript build and golden tests"`
- **Cierre**: PR abierto contra `feature/motor_coliformes`.

---

## PR #3 — Service Refactor + Integration Tests

**Rama**: `feature/mpn-service-refactor`
**Target**: PR #2 (post-merge al tracker)
**Líneas estimadas**: ~60 (neto, tras borrar ~104 del calculador viejo)
**Depende de**: PR #2

### Tareas

#### 3.1 (RED) Test unit del service — `_calcularResultadosFase4`

- [x] **Acción**: Crear `__tests__/services/coliformes.service.test.js`. Escribir test que mockea `prisma` y verifica que `_calcularResultadosFase4` agrupa submuestras por `tipoLectura`, itera diluciones numéricamente, y llama a `calcularMPN` 3 veces (una por organismo). Mockear el motor con `jest.mock('../../dist/calculators/mpnColi.engine')`.
- **Comando**: `pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: Falla — el service actual usa `calcularResultadosNMP` (tabla hardcodeada), no `calcularMPN`.

#### 3.2 (RED) Test unit del service — `calcularNmp`

- [x] **Acción**: Agregar test que verifica que `calcularNmp` recibe `body.muestras[].lecturas = { totales, fecales, ecoli }` (3 matrices 3×3) y produce 3 `ResultadoMPN` independientes. Verifica `incongruenciaDetectada` derivado de `categoriaRareza === 3` y serialización `Infinity → null`.
- **Comando**: `pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: Falla — el `calcularNmp` actual usa `tubosPositivos24h/48h` y la tabla hardcodeada.

#### 3.3 (RED) Test de integración — `POST /calcular-nmp`

- [ ] **Acción**: Crear o extender `__tests__/routes/coliformes.routes.test.js`. Test que envía body con `muestras[].lecturas = { totales, fecales, ecoli }` y verifica el shape de respuesta del MD §6.1 (3 organismos × 8 campos + incongruencia).
- **Comando**: `pnpm test -- __tests__/routes/coliformes.routes.test.js`
- **Cierre**: Falla — el endpoint actual devuelve shape viejo (3 NMPs).

#### 3.4 (RED) Test de integración — `PUT /fase/4` persistencia

- [ ] **Acción**: Test que verifica que `PUT /fase/4` persiste los 21 campos nuevos en `ColiFase4Resultado` más `incongruenciaDetectada` derivado.
- **Comando**: `pnpm test -- __tests__/routes/coliformes.routes.test.js`
- **Cierre**: Falla — el repository actual solo persiste 3 NMPs + incongruencia hardcodeada.

#### 3.5 (GREEN) Importar motor compilado en el service

- [x] **Acción**: Reemplazar `require('../calculators/nmpColi.calculator')` (línea 6) por `const { calcularMPN, construirConteos } = require('../../dist/calculators/mpnColi.engine')` (nota: path desde `src/services/` a `dist/calculators/`). Agregar JSDoc `@type` para los tipos del motor (D10).
- **Comando**: `pnpm build:ts && pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: El import resuelve sin error. Los tests siguen fallando (el service aún no usa las funciones nuevas).

#### 3.6 (GREEN) Refactor `_calcularResultadosFase4`

- [x] **Acción**: Reescribir el método (línea 153): (1) agrupar submuestras por `tipoLectura`, (2) por cada tipo, agrupar por dilución y contar positivos, (3) iterar diluciones por valor numérico descendente (sin `Object.keys().sort()`, sin `slice(0,3)`), (4) construir `ConteoDilucion[]` con `tubos` y `volumenMuestraPorTubo`, (5) llamar `construirConteos` + `calcularMPN`, (6) serializar con `_serializarResultado`. Validar que no exista `s.dilucion || '10'` (F7).
- **Comando**: `pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: Tests de agrupamiento y conteo pasan.

#### 3.7 (GREEN) Refactor `calcularNmp`

- [x] **Acción**: Reescribir el método (línea 261): recibir `body.muestras[].lecturas = { totales, fecales, ecoli }`, por cada muestra y cada organismo convertir grilla 3×3 booleanos a `ConteoDilucion[]` vía `construirConteos`, llamar `calcularMPN`, devolver shape MD §6.1. Eliminar toda referencia a `tubosPositivos24h/48h`.
- **Comando**: `pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: Tests de `calcularNmp` con 3 organismos independientes pasan.

#### 3.8 (GREEN) Helper `_serializarResultado` + `toDecimalOrNull`

- [x] **Acción**: Agregar método privado `_serializarResultado(resultado, tipo)` que mapea `ResultadoMPN` a 7 campos snake_case con prefijo de organismo. Helper `toDecimalOrNull(value)`: `Infinity`/`NaN`/`null`/`undefined` → `null`, finito → valor. Derivar `incongruenciaDetectada = categoriaRareza === 3` en cualquier organismo.
- **Comando**: `pnpm test -- __tests__/services/coliformes.service.test.js`
- **Cierre**: Tests de serialización e incongruencia pasan.

#### 3.9 (GREEN) Actualizar `upsertFase4Resultados` en repository

- [x] **Acción**: Modificar `coliformes.repository.js` línea 217: agregar los 21 campos nuevos al `create` y `update` del `upsert`. Mapear desde el objeto serializado por `_serializarResultado`.
- **Comando**: `pnpm test -- __tests__/routes/coliformes.routes.test.js`
- **Cierre**: Tests de persistencia pasan. Las 21 columnas se escriben en BD.

#### 3.10 (REFACTOR) Eliminar `_normalizarConteoTubos`

- [x] **Acción**: Borrar el método `_normalizarConteoTubos` (líneas 243-259) del service. Verificar que ningún otro método lo invoca.
- **Comando**: `grep -n '_normalizarConteoTubos' src/services/coliformes.service.js`
- **Cierre**: Cero ocurrencias.

#### 3.11 (REFACTOR) Eliminar calculador viejo y su test

- [x] **Acción**: Borrar `src/calculators/nmpColi.calculator.js` y `src/tests/unit/calculators/nmpColi.calculator.test.js`. Verificar que ningún import los referencia.
- **Comando**: `grep -rn 'nmpColi.calculator' src/ __tests__/`
- **Cierre**: Cero referencias. Los archivos no existen.

#### 3.12 (REFACTOR) Suite completa

- [x] **Acción**: Correr todos los tests (golden + service + integration + existentes).
- **Comando**: `pnpm build:ts && pnpm test`
- **Cierre**: Todos pasan. Sin regresiones. `pnpm build:ts` compila sin errores.

#### 3.13 Commits y push

- [x] **Acción**: Commits separados por cambio lógico + push + abrir PR contra PR #2.
- **Commits sugeridos**:
  - `test(service): add unit tests for MPN service orchestration`
  - `test(routes): add integration tests for calcular-nmp and fase/4 endpoints`
  - `refactor(service): replace NMP table calculator with compiled TS engine`
  - `refactor(repository): persist 21 MPN statistical fields in fase/4`
  - `refactor(calc): remove legacy nmpColi.calculator.js and its tests`
- **Cierre**: PR abierto contra `feature/mpn-ts-engine-and-golden`.

---

## Post-merge final

Después de mergear los 3 PRs en cadena al tracker `feature/motor_coliformes`:

- [ ] Verificar que `feature/motor_coliformes` mergea a `main` sin conflictos.
- [ ] Verificar que `pnpm build:ts && pnpm test` pasa en `main`.
- [ ] Documentar deuda: el frontend queda inconsistente con la respuesta nueva hasta el change de UI.
