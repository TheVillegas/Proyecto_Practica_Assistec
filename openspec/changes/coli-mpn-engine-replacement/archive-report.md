# Archive Report — `coli-mpn-engine-replacement`

**Fecha de archive**: 2026-06-29
**Change cerrado**: sí
**Rama de archive**: `main`
**Verify status**: PASSED

## Resumen del change

Reemplazo del calculador NMP de coliformes (`nmpColi.calculator.js`, tabla hardcodeada) por el motor ISO 7218 / Wilrich-Jarvis V5 (`mpn.engine.ts`). Cierre de las 9 fallas F1-F9 del brief original. Adición de 21 columnas estadísticas en `ColiFase4Resultado`. Nuevo MD en `docs/algoritmo-mpn-coliformes.md` para la coordinadora del laboratorio y para que el frontend sepa qué datos enviar.

## PRs mergeados
- PR #19: schema migration (`feature/mpn-schema-migration` → `feature/motor_coliformes`)
- PR #20: motor TS + service refactor + repository update + tests (`feature/mpn-service-refactor` → `main`)

## Commits en main (orden cronológico inverso)

```
99a81ae Merge pull request #20 from TheVillegas/feature/mpn-service-refactor
0ee2daf chore(calc): remove obsolete nmpColi.calculator and stale tests
d1bacee test(service): add unit tests for new MPN calculation paths
96f4937 feat(repository): persist 21 MPN statistical fields and derive incongruenciaDetectada (closes F6)
49a30cc refactor(service): use MPN engine for coliformes NMP calculation (closes F5, F7, F8, F9)
b65eda3 Merge feature/motor_coliformes: MPN coliformes engine (PR #1 schema + PR #2 engine+golden)
5b7e558 feat(calc): integrate MPN engine with TypeScript build and golden tests
f3e83dc Merge feature/mpn-schema-migration: 21 MPN statistical fields in ColiFase4Resultado
74502f7 feat(schema): add 21 MPN statistical fields to ColiFase4Resultado
```

## Cambios en producción
- 21 columnas nuevas en `ColiFase4Resultado` (7 por organismo: `log10Mpn`, `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`)
- Service refactorizado: usa el motor compilado, persiste los 21 campos, `incongruenciaDetectada` derivado de `categoriaRareza === 3`
- Repository actualizado: `upsertFase4Resultados` maneja los 21 campos
- Motor MPN disponible en `src/calculators/mpnColi.engine.ts` (compilado a `dist/calculators/mpnColi.engine.{js,d.ts}`)
- 10 tests unitarios nuevos del service
- 51 golden tests del motor (cubren NCh2047, ISO 7218 Anexo C, casos extremos)
- Calculador viejo (`nmpColi.calculator.js` y su test) eliminado
- Build TS configurado (`build:ts`, `prestart`, `pretest`)
- `ts-jest` reemplazado por `@swc/jest` + `projects` (incompatibilidad con `jest@30`)
- `tsconfig.json` limitado a `src/calculators/**/*` (otros .ts preexistentes de saureus tienen errores de tipo, fuera de scope)
- MD en español para coordinadora y frontend: `docs/algoritmo-mpn-coliformes.md`

## Delta specs
Ninguno. No existen specs base en `openspec/specs/`. Todos los artifacts fueron específicos del change.

## Decisiones de arquitectura cerradas
- Build TS: `tsc` + `prestart`/`pretest`
- Naming de métricas: nunca `sd` solo (choca con `esSd` = "Sin Desarrollo" en `SauEtapa5Resultado`). Nombres canónicos: `sdLog10`, `limiteInferior`, `limiteSuperior`, `rarityIndex`, `categoriaRareza`, `estado`, `log10Mpn`, `mpn`
- Migración: aditiva sin backfill
- Servicio: 3 NMPs independientes (uno por organismo) con el mismo `v = [0.1, 0.01, 0.001] g`
- Persistencia: `Infinity` se serializa como `null` (Decimal no soporta Infinity)
- Tests: `@swc/jest` + Jest `projects` (en vez de `ts-jest`)

## Issues conocidos (deuda)
- **Frontend temporalmente inconsistente**: el frontend actual (form-coliformes.page.ts) espera el shape viejo (`tubosPositivos24h/48h`). El service tiene un fallback con `logger.warn` que acepta el body viejo. Se elimina en el change de frontend.
- **Barrel `src/calculators/index.ts` no creado**: cosmético, sin impacto. El service importa directo del motor.
- **2 suites saureus fallan preexistentemente**: out of scope, se arreglan en el change de saureus.
- **Migración vieja de Prisma rota** (`20260521210000_dashboard_upgrades_roles_base`): la shadow DB falla. Workaround usado en este change. Backlog.

## Próximos pasos
- Frontend: maquetar el contrato nuevo del MD (3 inputs independientes, 6 campos estadísticos por organismo).
- Saureus: integrar contra `main` (ya está mergeado).
- Saureus tests: arreglar las 2 suites rojas preexistentes.
- Migración vieja: cleanup del historial de migraciones de Prisma.

## Lecciones aprendidas
- ISO 7218 Cláusula 11 / Wilrich-Jarvis V5 es la fuente oficial. La tabla NCh2047 es un caso particular.
- `ts-jest@29` no es compatible con `jest@30`. Usar `@swc/jest` + `projects`.
- Branch protection de GitHub con status checks requiere admin bypass cuando no hay CI.
- Tests preexistentes rotos (mock desactualizado, Zod schema, permisos API) son un foco de deuda que conviene limpiar ANTES de mergear cambios grandes.
- Estrategia `feature-branch-chain` con 3 chained PRs funciona bien con reviewers humanos, pero sin CI es overhead — fast-track a main es más pragmático.

## Referencias
- `docs/algoritmo-mpn-coliformes.md`
- `openspec/changes/archive/coli-mpn-engine-replacement-20260629/{proposal,spec,design,tasks,verify-report}.md`
- `NUEVOS_ALGORITMOS/BRIEF_calculadora_NMP_coliformes.md`
- `NUEVOS_ALGORITMOS/mpn.engine.ts` (movido a `AssisTec API/src/calculators/`)
- `NUEVOS_ALGORITMOS/mpn.golden.test.ts` (movido a `AssisTec API/__tests__/calculators/`)
- `AssisTec API/prisma/schema.prisma`
- `AssisTec API/prisma/migrations/20260629_add_mpn_statistical_fields_to_coli_fase4_resultado/`
