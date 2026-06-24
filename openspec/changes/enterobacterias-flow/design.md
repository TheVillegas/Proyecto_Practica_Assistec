# Design: Enterobacterias Flow

## Technical Approach

Replicate the proven `sau_*` backend pattern (Controller → Service → Repository → Zod, optimistic locking, `prisma.$transaction`) and refactor the frontend from a non-standard 8-step sub-etapa wizard to the **3-etapa card pattern** used by ALL other forms (`form-s-aureus`, `form-coliformes`). Each backend etapa maps to one frontend stepper card with all sub-etapa fields visible in inline sections — no sub-step navigation.

## Architecture Decisions

### Decision: Frontend UI pattern — 3-etapa card (sau/coli style)

| Option | Description | Verdict |
|--------|-------------|---------|
| 8-step wizard (current stub) | Progress bar tracks sub-etapas, sub-etapa indicator below stepper | **Rejected** — inconsistent with all other forms; user mandate |
| 3-etapa card (sau/coli pattern) | Stepper shows 3 main etapas; each card displays all sub-etapa fields as inline sections; "Siguiente" advances to next etapa and calls `PUT /:id/etapa/:n` | **Chosen** — matches `form-s-aureus`/`form-coliformes` UI architecture |

**Rationale**: User explicit directive: *"tomemos ejemplo los otros formularios y lo repliquemos, con distintas etapas dentro de la UI"*. Every existing form uses `*ngIf="etapaActual === n"` on a form-card; sub-etapa fields are always visible within their parent card. The 8-step sub-wizard with progress bar is a singleton anti-pattern.

### Decision: Flat etapa payload (no separate sub-etapa tables)

| Option | Description | Verdict |
|--------|-------------|---------|
| One table per sub-etapa | `ent_etapa1_pesado`, `ent_etapa1_homog`, ... — 8 sub-tables | **Rejected** — excessive normalization |
| One table per etapa (aplanado) | `ent_etapa1`, `ent_etapa2`, `ent_etapa3` — each flattens its 4/1/3 sub-etapas into columns | **Chosen** — simpler transactional writes, matches spec schema |

**Rationale**: Sub-etapas are not independently queried or reused. A single `upsertEtapa` per controller call is sufficient. `Cloned from sau` where `SauEtapa1` flattens multiple logical sections.

### Decision: Migration SQL hand-written (per spec directive)

**Choice**: Manual `migration.sql` with DDL + seed INSERTs for `lotes_reactivo`.
**Rationale**: Spec RLC-02 mandates seed data in the migration file (not in `prisma/seed.js`). Prisma models synced manually afterward. Consistent with spec requirement: *"archivo SQL creado a mano"*.

## Data Flow

```
FormEnterobacteriasPage  ──PUT──→  EnterobacteriasController
  (3-etapa stepper)                     │
       │                          EnterobacteriasService
       │                           ├── Zod validation (etapa N)
       │                           ├── 24h lockout check
       │                           └── RBAC check
       │                                  │
       │                 EnterobacteriasRepository (extends BaseFormRepository)
       │                          ├── $transaction
       │                          ├── touchFormulario (TOCTOU)
       │                          └── upsertEtapaN
       │                                  │
CatalogosService ──GET──→  CatalogoController ←── CatalogoRepository
  (forkJoin)                   (new entry: 'lotes_reactivo')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AssisTec API/prisma/schema.prisma` | Modify | Add `EntFormulario`, `EntMuestra`, `EntEtapa1`, `EntEtapa2`, `EntEtapa3`, `LoteReactivo` models |
| `AssisTec API/prisma/migrations/<ts>_enterobacterias_flow/migration.sql` | Create | Hand-written DDL + seed INSERTs |
| `AssisTec API/src/routes/enterobacterias.routes.js` | Create | `PUT /:id/etapa/:n`, `GET /:id`, `GET /por-analisis/:idAnalisis` |
| `AssisTec API/src/controllers/enterobacterias.controller.js` | Create | Cloned from `saureus.controller.js` pattern |
| `AssisTec API/src/services/enterobacterias.service.js` | Create | Stage progression, 24h time-diff, RBAC |
| `AssisTec API/src/repositories/enterobacterias.repository.js` | Create | Extends `BaseFormRepository`, `$transaction` per etapa |
| `AssisTec API/src/validators/ent.schema.js` | Create | Zod schemas for etapas 1-3, includes `reactivoOxidasa` regex |
| `AssisTec API/src/repositories/catalogo.repository.js` | Modify | Add `'lotes_reactivo'` entry to catalog map |
| `AssisTec API/app.js` | Modify | `require` + `app.use('/api/formulario/ent', entRoutes)` |
| `Frontend/src/app/pages/form-enterobacterias/form-enterobacterias.page.ts` | **Rewrite** | Replace 386-line monolith with 3-etapa card stepper (sau pattern) |
| `Frontend/src/app/pages/form-enterobacterias/form-enterobacterias.page.html` | **Rewrite** | 3 cards with inline sub-etapa sections, matching sau/coli HTML structure |
| `Frontend/src/app/services/enterobacterias-api.service.ts` | Create | `obtenerPorAnalisis()`, `obtener()`, `guardarEtapa()` — `inject()`-based |
| `Frontend/src/app/interfaces/enterobacterias.interfaces.ts` | Create | `EntFormulario`, `EntEtapaPayload`, `EntFormularioCompleto` |
| `Frontend/src/app/app-routing.module.ts` | Modify | `allowedRoles: [0, 1, 2, 4]` for `/form-enterobacterias/:id` |

## Interfaces / Contracts

### API Routes
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/formulario/ent/por-analisis/:id` | READ_ROLES | Check existence |
| `GET` | `/api/formulario/ent/:id` | READ_ROLES | Full form with etapas |
| `PUT` | `/api/formulario/ent/:id/etapa/:n` | WRITE_ROLES | Save etapa `n∈{1,2,3}` |

### PUT Payload Shape (body)
```json
{
  "completada": true,
  "expectedUpdatedAt": "2026-06-22T08:00:00.000Z",
  "etapa": { /* all sub-etapa fields flattened */ }
}
```

### Angular Service Interface
```typescript
// enterobacterias-api.service.ts (providedIn: 'root', inject()-based)
guardarEtapa(idFormulario: number, etapa: 1|2|3,
  payload: EntEtapaPayload, updatedAt: string): Observable<EntFormularioCompleto>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (BE) | Zod validators — oxidasa regex, completada refine | Vitest/Jest — `ent.schema.test.js` |
| Unit (BE) | 24h lockout logic — 3 boundary cases (12h, 22h, 24.5h) | Mock `Date.now()` in service test |
| Integration (BE) | `PUT /:id/etapa/2` → 409 `CONCURRENCY_ERROR` | Two parallel requests with same `expectedUpdatedAt` |
| Integration (BE) | `PUT /:id/etapa/2` → 422 `INCUBATION_LOCKOUT` | Set `fecha_inicio_incubacion` < 24h ago |
| Unit (FE) | `enterobacterias-api.service` HTTP calls | Jasmine/Karma — `HttpClientTestingController` |
| Unit (FE) | Page component — 3-etapa navigation + form groups | Karma component test |

## Migration / Rollout

1. Migration is additive — no breaking changes, no data migration required
2. `prisma migrate dev` (rollback via `migrate rollback` if needed)
3. `LoteReactivo` seed data lives in migration SQL — available immediately
4. Route registration in `app.js` — no feature flag needed (new route prefix `/ent`)
5. Frontend routes isolated to `form-enterobacterias/` — revert to stub if rollback needed

## Open Questions

- [ ] Should the `ent_formulario` auto-creation be wired into `solicitud.service.js::validar()` now, or as a follow-up task?
- [ ] Is the `Desaireado de Agar Glucosa` field really free-text, or should it join a catalog table (similar to Agar VRBG)?
