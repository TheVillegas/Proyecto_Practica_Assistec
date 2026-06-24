# Tasks: Enterobacterias Flow

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

**Work units (4 chained PRs, base=main):**
- **PR1 BE** Prisma+migration+repo+Zod+service+routes+tests → ECB, RLC
- **PR2 FE svc** `lotes_reactivo` método + `ent.interfaces` + `ent-api.service` → EFW-02, partial EFW-03
- **PR3 FE wizard** 8 sub-componentes + container + HTML 3-etapa + role guards + routing → EFW-01, EFW-04..05
- **PR4 wiring** forkJoin catálogo → `ion-select`, `PUT` triggers, borrador, solicitud hook → EFW-03 full, ECB-01

~2,500 changed lines. Strategy: ask-always

## Phase 1: Backend Foundation (PR #1)

- [x] 1.1 Add `EntFormulario`, `EntMuestra`, `EntEtapa1/2/3`, `LoteReactivo` to `prisma/schema.prisma`
- [x] 1.2 Hand-written `prisma/migrations/<ts>_enterobacterias_flow/migration.sql` (DDL + 4 INSERTs `lotes_reactivo`)
- [x] 1.3 Register `'lotes_reactivo'` in `repositories/catalogo.repository.js` (RLC-03)
- [x] 1.4 RED: `validators/__tests__/ent.schema.test.js` (oxidasa regex `^R69-\d{2}-(0[12])$` + refine)
- [x] 1.5 GREEN: create `validators/ent.schema.js` (`etapa1/2/3Schema` aplanado)
- [x] 1.6 Create `repositories/enterobacterias.repository.js` extends `BaseFormRepository` (`upsertEtapaN` + TOCTOU `$transaction`)
- [x] 1.7 Create `services/enterobacterias.service.js` (24h lockout, `INVALID_STAGE_PROGRESSION`, RBAC)
- [x] 1.8 Create `controllers/enterobacterias.controller.js` (BigInt→string)
- [x] 1.9 Create `routes/enterobacterias.routes.js`; register `/api/formulario/ent` in `app.js`
- [x] 1.10 RED: integration tests (422 `INCUBATION_LOCKOUT` 12h/22h/24.5h, 409 `CONCURRENCY_ERROR`, 409 `INVALID_STAGE_PROGRESSION`)
- [x] 1.11 GREEN: `cd "AssisTec API" && pnpm test` — 0 failures

## Phase 2: Frontend Service & Catálogo (PR #2)

- [x] 2.1 Add `getLotesReactivo(tipo)` to `services/catalogos.service.ts`
- [x] 2.2 Add `LoteReactivo` to `interfaces/catalogo.interfaces.ts`
- [x] 2.3 Create `interfaces/enterobacterias.interfaces.ts`
- [x] 2.4 Create `services/enterobacterias-api.service.ts` (`providedIn:'root'`, `inject(HttpClient)`)
- [x] 2.5 RED+GREEN: `enterobacterias-api.service.spec.ts` (happy + 409/422)

## Phase 3: Frontend Wizard Refactor (PR #3)

- [ ] 3.1 Create 8 sub-componentes (`EntPesadoComponent`...`EntResultadosComponent`); `FormGroup` + `(subetapaCompleta)`
- [ ] 3.2 Rewrite `form-enterobacterias.page.ts` — container state, paso↔etapa map, `onSiguiente()` local salvo 4/5/8
- [ ] 3.3 Rewrite `form-enterobacterias.page.html` — 3-etapa card (`*ngIf="etapaActual===n"`), sub-etapas inline
- [ ] 3.4 Add `ModoLecturaPipe` — disable inputs si `rol ∉ [0,4]`, oculta Siguiente/Anterior/Borrador (EFW-04)
- [ ] 3.5 Update `app-routing.module.ts` — `allowedRoles:[0,1,2,4]` para `/form-enterobacterias/:id` (EFW-05)
- [ ] 3.6 Test: paso 1→2→3 sin HTTP; paso 4 llama `guardarEtapa(1, true)`

## Phase 4: Wiring, Auto-Save & Dynamic Catalog (PR #4)

- [ ] 4.1 `ngOnInit` `forkJoin`: equipos incub, responsables, micropipetas, `lotes_reactivo` agar_vrbg+tween_80 (EFW-03)
- [ ] 4.2 Bind `ion-select` en 8 sub-componentes a signals de catálogo; **borrar todas las `OPCIONES_*` hardcoded**
- [ ] 4.3 `onSiguiente()` paso 4: `PUT /:id/etapa/1` con payload aplanado `{pesado, homog, sembrado, incub}` + `expectedUpdatedAt`
- [ ] 4.4 `onSiguiente()` paso 5: `PUT /:id/etapa/2` con banner 24h; paso 8: `PUT etapa/3`
- [ ] 4.5 `onGuardarBorrador()`: `PUT` con `completada:false`, sin avanzar
- [ ] 4.6 Wire `solicitud.service.js::validar()` — crear `EntFormulario` idempotente + `EntMuestra` (ECB-01)
- [ ] 4.7 E2E test: flujo 1→8 graba 3 etapas; re-load devuelve nuevo `updated_at`

## Phase 5: Verification & Cleanup

- [ ] 5.1 `cd "AssisTec API" && pnpm test` — 0 failures
- [ ] 5.2 `cd Frontend && pnpm test` — 0 failures
- [ ] 5.3 `cd Frontend && pnpm run lint` — 0 errors
- [ ] 5.4 UAT contra ECB-01..07, EFW-01..05, RLC-01..03
- [ ] 5.5 Commit: `feat(ent): end-to-end Enterobacterias flow con 24h lockout`
