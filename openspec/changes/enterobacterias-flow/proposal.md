# Proposal: Enterobacterias Flow

## Intent

Wire the existing Enterobacterias frontend stub (8-step wizard, zero backend calls) to a full backend module following the proven `sau_*`/`coli_*` pattern. The form has 3 parent etapas (Preparación, Análisis, Confirmación) with sub-etapas, requiring phased saving per etapa and new master table entries for Agar VRBG lots and Tween 80.

## Scope

### In Scope
- Prisma models: `ent_formulario`, `ent_muestra`, `ent_etapa1` (+ sub-tables: pesado, homogenización, sembrado, incubación), `ent_etapa2`, `ent_etapa3` (+ incubación, oxidasa, resultados)
- Backend CRUD: `PUT /:id/etapa/:num` (1-3) with Zod validation, optimistic locking, role-based access (WRITE: Analista/Admin, READ: +Coordinadora/Jefe Área)
- Frontend integration: `enterobacterias-api.service.ts`, TypeScript interfaces, catalog-driven `<ion-select>` controls, auto-save per etapa
- Master tables: New `LoteReactivo` model (tipo: `agar_vrbg | tween_80`) with seed data, registered in `CatalogoRepository`
- 24h incubation time-diff validation on save (no cron/background jobs)
- Oxidasa reagent format validation (`R69-AA-NN`) in backend Zod schema

### Out of Scope
- **LAB-4 active alerting**: No cron jobs, no `node-cron`, no `bull` queue, no scheduled notifications for 24h incubation — deferred (Won't have)
- Mohos y Levaduras (Épica 7)
- PDF/Excel export
- Email notifications

## Capabilities

### New Capabilities
- `enterobacterias-crud`: Backend CRUD for enterobacterias forms — 3 etapas with sub-etapa tables, phased `PUT /:id/etapa/:num`, optimistic locking, sequential progression enforcement
- `enterobacterias-frontend`: Frontend wizard ↔ API integration — catalog-driven selects, auto-save per etapa, role-based UI (Analista edits, Coordinadora read-only)
- `reactivo-lots-catalog`: Master table `LoteReactivo` for reagent batch codes (Agar VRBG, Tween 80) with catalog API consumption

### Modified Capabilities
None — no existing specs in `openspec/specs/`.

## Approach

1. **Clone existing pattern**: Replicate `sau_*` Controller → Service → Repository → Zod structure. Route at `/api/formulario/ent`
2. **Phased saving**: Each wizard step group maps to a parent etapa (1-3). Frontend auto-saves on step completion via `PUT /:id/etapa/:num`. Sub-etapa data is flattened into the parent etapa payload
3. **Master tables first**: Add `LoteReactivo` Prisma model + migration + seed before frontend work, so selects can consume catalog data from day one
4. **24h validation**: Service layer checks `now() - fecha_inicio_incubacion >= 24h` before allowing etapa 1 → etapa 2 progression. No background jobs
5. **Incremental delivery**: Backend models + routes → Backend tests → Frontend service → Frontend integration → Role-based UI

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `ent_*` models (8-10 tables) + `LoteReactivo` model |
| `src/routes/enterobacterias.routes.js` | New | Route definitions at `/api/formulario/ent` |
| `src/controllers/enterobacterias.controller.js` | New | Request handling per etapa |
| `src/services/enterobacterias.service.js` | New | Stage progression, 24h time-diff validation |
| `src/repositories/enterobacterias.repository.js` | New | Prisma queries extending `BaseFormRepository` |
| `src/validators/ent.schema.js` | New | Zod schemas for etapas 1-3 |
| `src/repositories/catalogo.repository.js` | Modified | Add `lotes_reactivo` to catalog map |
| `app.js` | Modified | Register enterobacterias routes |
| `Frontend/.../services/enterobacterias-api.service.ts` | New | HTTP client for ent endpoints |
| `Frontend/.../interfaces/enterobacterias.interfaces.ts` | New | TypeScript interfaces |
| `Frontend/.../pages/form-enterobacterias/` | Modified | Rewrite monolithic form → multi-step with backend integration |
| `prisma/seed.js` | Modified | Seed `LoteReactivo` entries |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend rewrite scope (386-line monolith) | High | Decompose incrementally: one etapa at a time, validate each before moving on |
| Sub-etapa payload complexity | Medium | Flatten sub-etapas into parent etapa payload; backend handles decomposition |
| Optimistic lock contention on shared etapa | Low | Lock at `ent_formulario.updatedAt` level (proven pattern from sau/coli) |
| Catalog gaps block frontend selects | Low | `LoteReactivo` model created first; fallback to free-text if seed data incomplete |

## Rollback Plan

- All changes are additive (new tables, new routes). `prisma migrate rollback` drops `ent_*` and `lotes_reactivo` tables
- Remove route registration from `app.js` to disable endpoints
- Frontend changes isolated to `form-enterobacterias/` — revert to stub if needed

## Dependencies

- Existing `BaseFormRepository` pattern (reuse)
- Existing auth middleware (`verifyToken`, `authorizeAny`, `optimisticLock`)
- Existing `CatalogosService` (frontend) and `CatalogoRepository` (backend)
- ERS v3.0 Enterobacterias section — business rules source of truth

## Success Criteria

- [ ] `PUT /api/formulario/ent/:id/etapa/1|2|3` saves and returns full etapa data
- [ ] 24h incubation time-diff validation blocks premature progression to etapa 2
- [ ] `LoteReactivo` catalog returns Agar VRBG and Tween 80 options via GET
- [ ] Frontend wizard saves each etapa to backend (no hardcoded data)
- [ ] Coordinadora role sees read-only UI; Analista can edit
- [ ] Optimistic locking prevents concurrent edit data loss
- [ ] `pnpm test` passes with 0 failures for new backend tests
