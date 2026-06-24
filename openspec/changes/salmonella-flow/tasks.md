# Tasks: Salmonella Flow

## Review Workload Forecast

Lines changed: **~900–1100**. Budget exceeded by design; `size:exception` confirmed for single-PR.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

WU-1 route (LAB-48) · WU-2 caldo/hidratación/25-min (LAB-62/63) · WU-3 frontend wizard + API + interfaces (LAB-64) · WU-4 UFC Ent calc + adapter + flag (Extra). All ship in **one single PR**.

## Phase 1: Backend Foundation

- [x] 1.1 [RED] Add 8 failing Jest cases in `__tests__/unit/ufcEnt.calculator.test.js` cloning `ufcSau.calculator.test.js`.
- [x] 1.2 [GREEN] Create `src/calculators/ufcEnt.calculator.js` 1:1 clone; rename `calcularUfcSau`→`calcularUfcEnt`, `nSAureus`→`nEnterobacterias`.
- [x] 1.3 [REFACTOR] Suite green; extract shared helpers only if a clean refactor exists.
- [x] 1.4 Fix L93 of `muestraAli.repository.js`: `SALMONELLA: '/form-enterobacterias'` → `'/form-salmonella'`.

## Phase 2: Backend Service Rules

- [x] 2.1 [RED] Unit tests in `__tests__/unit/salmonella.service.test.js` for the 3 private methods covering caldo/hidratación/alerta cases per spec.
- [x] 2.2 [GREEN] Implement 3 private methods in `src/services/salmonella.service.js`; throw `TIPO_MATRIZ_REQUERIDO` / `HIDRATACION_INTERVALO_INVALIDO` / `HOMO_ESTUFA_INTERVALO_INVALIDO` per spec.
- [x] 2.3 [GREEN] Wire hooks into `SalService.guardarFase`: case 1 → caldo + hidratación; case 2 → alerta 25 min; persist pre-upsert.
- [x] 2.4 [REFACTOR] Extract shared date-delta helper if used >2 times; methods stay private.

## Phase 3: Enterobacterias UFC Wiring

- [x] 3.1 Add `_adaptarParaUfcEnt(etapa2)` in `src/services/enterobacterias.service.js`: `Math.log10(dilucion)`→`dil`, `coloniasContadas`→`[c, c]`.
- [x] 3.2 Read `process.env.ENT_UFC_CALC_ENABLED` (default `true`); when `false` skip calculator (UEC-03).
- [x] 3.3 In `guardarEtapa` case 2 with `completada:true`, call adapter + `calcularUfcEnt`; persist `ufcPorG` in etapa 2 (ECB-08).
- [x] 3.4 Expose `ufcPorG` (top-level + `etapa2.ufcPorG`) in `serializeFormulario` for Ent GETs (ECB-10).
- [x] 3.5 [VERIFY] Integration test in `__tests__/integration/enterobacterias.service.test.js` for `completada:true` and flag-off branches.

## Phase 4: Frontend Foundation

- [x] 4.1 Create `src/app/interfaces/salmonella.interfaces.ts` with `SalFase1Payload`…`SalFase10Payload`, `SalFormularioCompleto`, `SalMuestra`, `SalLecturaFase3c[]`, `SalLecturaFase4b[]`; no `any`.
- [x] 4.2 Create `src/app/services/salmonella-api.service.ts` (`providedIn:'root'`) with `inject(HttpClient)`; `obtenerPorAnalisis` / `obtener` / `guardarFase`; base `environment.apiUrl + '/formulario/sal'`.
- [x] 4.3 [RED] Jasmine tests in `form-salmonella.page.spec.ts` for `pasoActual` signal transitions + `guardarFase` calls on paso boundaries.

## Phase 5: Frontend Wizard

- [x] 5.1 Rewrite `form-salmonella.page.ts` with `pasoActual = signal(1)`, 10 sub-fase conditions, and 10 PUT boundaries per SFE-04.
- [x] 5.2 Rewrite `form-salmonella.page.html` with progress stepper for 10 pasos and action buttons mapped to `guardarFase(n, …)`.
- [ ] 5.3 Render `<ion-banner color="warning">` in paso 2 when `form.fase2a.alertaTiempo25min === true` with minutosHomoAEstufa (SFE-05).
- [ ] 5.4 Handle 409 `CONCURRENCY_ERROR` → toast + re-invoke `obtener()`; track `updatedAt` in state.
- [x] 5.5 [GREEN] Implement wizard so 4.3 tests pass.
- [x] 5.6 [VERIFY] `pnpm run lint` clean; `pnpm test -- --watch=false --browsers=ChromeHeadless` green.
- [ ] 5.7 [E2E] Smoke: SALMONELLA click → `/form-salmonella`; `PUT /sal/:id/fase/1` Chocolate → `caldoAsignadoAuto:'Leche descremada'`; fase/2 delta=30 → `alertaTiempo25min:true`; `PUT /ent/:id/etapa/2` `completada:true` → `ufcPorG:100`; with `ENT_UFC_CALC_ENABLED=false` → `ufcPorG:null`.

## Phase 6: Verification & Delivery

- [x] 6.1 Backend Jest suite passes (221 tests).
- [x] 6.2 Frontend Karma suite passes (188 tests).
- [x] 6.3 Frontend lint passes.
- [x] 6.4 Push branch and open PR #18 against `feature/enterobacterias-phase5`.

## Delivery Note

User confirmed `size:exception`: entire change ships as **one single PR** with full coverage, no chained/stacked splits. 400-line budget exceeded intentionally, accepted by maintainer.
