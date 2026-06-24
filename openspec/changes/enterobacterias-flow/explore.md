# Exploration: Enterobacterias Flow

## Current State

The Enterobacterias form exists as a **frontend-only UI stub** with zero backend integration. The codebase already has three fully-implemented microbiological form templates (S. aureus, Coliformes, Salmonella) that serve as architectural reference patterns.

### Frontend (Angular 20 + Ionic 8)

- **`Frontend/src/app/pages/form-enterobacterias/`** -- Monolithic page with an 8-step wizard:
  1. Preparacion / Pesado
  2. Preparacion / Homogeneizacion
  3. Preparacion / Sembrado
  4. Preparacion / Incubacion
  5. Analisis (Lectura 24h)
  6. Confirmacion / Incubacion
  7. Confirmacion / Lectura (incluye Prueba de Oxidasa)
  8. Confirmacion / Resultados

- All form fields are hardcoded `FormGroup` controls with **no HTTP service calls**.
- Validators exist (e.g., Reactivo de Oxidasa format `R69-AA-NN`), but only on the frontend.
- Route `/form-enterobacterias` is registered in `app-routing.module.ts` with `allowedRoles: [0, 4]` (only Analista and Admin).
- Header navigation includes `/form-enterobacterias` in the formularios submenu.
- No Ionic page lifecycle hooks are wired to fetch or persist data on init/destroy.
- The page uses the `NgModule` pattern (`standalone: false`), consistent with the rest of the project.

### Backend (Node.js + Express 5 + Prisma 6)

- **NO** enterobacterias routes, controllers, services, repositories, or validators exist.
- Three similar form modules exist as reference templates:
  - `sau_*` -- S. aureus (6 etapas, calculation engine)
  - `coli_*` -- Coliformes (4 fases + NMP calculation)
  - `sal_*` -- Salmonella (5 fases, presencia/ausencia)

### Database (PostgreSQL 16 via Prisma)

- **Zero** enterobacterias tables exist in `prisma/schema.prisma`.
- Existing catalog tables that will be reused:
  - `EquipoIncubacion` (e.g., Estufa 73-M, 2-M) -- mapped to `equipos_incubacion`
  - `Instrumento` -- for balanzas, homogenizadores
  - `Micropipeta` -- micropipettes
  - `MaterialSiembra` -- seeding materials (plates, agar lots)
  - `Usuario` -- analysts and coordinators with role-based access
- The schema uses Spanish snake_case column names mapped via `@map()`.

### Auth & Roles

- JWT-based authentication via `verifyToken` middleware.
- Roles: `0=Analista`, `1=Coordinadora`, `2=Jefe_Area`, `3=Ingreso`, `4=Admin`.
- Two middleware patterns for authorization:
  - `authorizeAny([...roles])` -- checks if user has any allowed role.
  - `requireActingRole()` -- for users with multiple roles, forces them to specify which role they're acting under.
- **LAB-6 requirement**: Analista (0) edits, Coordinadora (1) is read-only -- this needs both auth middleware AND frontend guard + UI state.

### Architecture Pattern (from existing forms)

```
Backend:
  routes/{form}.routes.js  ->  controllers/{form}.controller.js  ->  services/{form}.service.js  ->  repositories/{form}.repository.js
  validators/{form}.schema.js (Zod-based validation)

Frontend:
  pages/form-{name}/           ->  Lazy-loaded page module
  services/{name}-api.service.ts ->  HTTP service (inject-based)
  features/{name}/components/  ->  Reusable step components (optional)
  interfaces/{name}.interfaces.ts -> TypeScript interfaces

Database:
  {prefix}_formulario           ->  Header (id, etapa/fase actual, estado, rut_analista)
  {prefix}_muestra              ->  Individual samples (linked to solicitud_muestra)
  {prefix}_etapa{N} or fase{N}  ->  Stage-specific data
  {prefix}_etapa{N}_lectura     ->  Per-sample readings per stage (optional)
```

## Affected Areas

### Files to CREATE (Backend)

| Path | Purpose |
|------|---------|
| `AssisTec API/prisma/schema.prisma` | Add `ent_*` models (enterobacterias formulario, muestra, etapas, lecturas, oxidasa) |
| `AssisTec API/src/routes/enterobacterias.routes.js` | Route definitions at `/api/formulario/ent` |
| `AssisTec API/src/controllers/enterobacterias.controller.js` | Request handling, error mapping |
| `AssisTec API/src/services/enterobacterias.service.js` | Business logic: stage progression, incubation lockout, oxidasa validation, alert scheduling |
| `AssisTec API/src/repositories/enterobacterias.repository.js` | Prisma queries with optimistic locking |
| `AssisTec API/src/validators/ent.schema.js` | Zod schemas for each etapa payload |
| `AssisTec API/src/tests/unit/services/enterobacterias.service.test.js` | Unit tests |
| `AssisTec API/src/tests/unit/repositories/enterobacterias.repository.test.js` | Repository tests |

### Files to CREATE (Frontend)

| Path | Purpose |
|------|---------|
| `Frontend/src/app/services/enterobacterias-api.service.ts` | HTTP service for all etapa CRUD operations |
| `Frontend/src/app/interfaces/enterobacterias.interfaces.ts` | TypeScript interfaces matching backend responses |
| `Frontend/src/app/features/enterobacterias/components/` | Reusable step components (Pesado, Homogeneizacion, Sembrado, Incubacion, Lectura, Oxidasa) |
| `Frontend/src/app/features/enterobacterias/services/` | Feature-specific services (alert scheduling, timer logic) |

### Files to MODIFY

| Path | Change |
|------|--------|
| `AssisTec API/app.js` | Register `enterobacteriasRoutes` at `/api/formulario/ent` |
| `Frontend/src/app/app-routing.module.ts` | Add `COORDINADORA (1)` to `allowedRoles` for read-only view, keep WRITE for ANALISTA (0) |
| `Frontend/src/app/pages/form-enterobacterias/` | **Rewrite** from monolithic FormGroup to multi-component wizard with backend integration |
| `Frontend/src/app/services/catalogos.service.ts` | Add methods if new catalog types are needed (Agar VRBG lots, Oxidasa reagents) |
| `Frontend/src/app/components/header/header.component.ts` | Verify enterobacterias route is correctly handled |

## Approaches

### 1. Follow existing pattern (clone `sau_*` or `coli_*` structure)

Replicate the exact Controller -> Service -> Repository pattern used by S. aureus / Coliformes.

- **Pros**: Consistent with codebase, teams already understand the pattern, proven optimistic locking, supports strict TDD.
- **Cons**: S. aureus has 6 etapas and Salmonella has 5 fases -- Enterobacterias has 3 etapas with subetapas, requiring a slightly different schema.
- **Effort**: Medium

### 2. Extend with sub-etapa navigation

Model the 8 steps as sub-etapas within 3 parent etapas (Preparacion, Analisis, Confirmacion), with the main `PUT /:id/etapa/:num` endpoint handling both parent-level metadata and sub-etapa transitions.

- **Pros**: Preserves the existing 3-etapa mental model from the spec. Each sub-etapa is independently saveable.
- **Cons**: Backend must validate sub-etapa ordering within each parent etapa. Frontend must track sub-step completion.
- **Effort**: Medium

### 3. Single monolithic endpoint for the entire form

One `POST /api/formulario/ent` creates the form, one `PUT /api/formulario/ent/:id` updates the entire state at once.

- **Pros**: Simplest backend. No optimistic locking complexity. Frontend can use a single FormGroup.
- **Cons**: Breaks the existing etapa-by-etapa pattern. No progressive save for long-running analyses. Cannot enforce sequential stages easily.
- **Effort**: Low (but violates architectural consistency)

### Recommendation

**Approach 2** -- Extend with sub-etapa navigation. The existing 8-step wizard in the frontend already maps cleanly to this model. The backend follows the proven `PUT /:id/etapa/:num` pattern but adds sub-etapa validation within each parent etapa. This preserves consistency with `sau_*` and `coli_*` while accommodating the unique sub-etapa structure of Enterobacterias.

## Database Model Design (Recommended)

Based on the current frontend wizard and existing patterns, proposed Prisma models:

```
ent_formulario           -- Header: id_ent_formulario, id_solicitud_analisis,
                            etapa_actual (1-3), subetapa_actual (1-8),
                            estado, rut_analista, created_at, updated_at

ent_muestra              -- Samples: id_ent_muestra, id_ent_formulario,
                            id_solicitud_muestra, numero_muestra, es_duplicado,
                            peso_muestra_tipo, orden

ent_etapa1               -- Preparacion (subetapas 1-4): id_ent_etapa1,
                            id_ent_formulario (unique), fecha_inicio, hora_inicio,
                            rut_analista_inicio, tipo_muestra, completada

ent_etapa1_pesado        -- Balanza, peso_10g_90ml, peso_50g_450ml, analista
ent_etapa1_homogenizacion -- Stomacher, tiempo_homogenizacion, analista
ent_etapa1_sembrado      -- Agar VRBG (lote), estufa, placas, micropipeta, analista
ent_etapa1_incubacion    -- Estufa (73-M/2-M), fecha_inicio_incubacion,
                            fecha_fin_incubacion (24h), bloqueada (bool)

ent_etapa2               -- Analisis (subetapa 5): id_ent_etapa2, id_ent_formulario,
                            fecha_lectura_24h, colonias_contadas, dilucion,
                            equipo_cuenta_colonias, completada

ent_etapa3               -- Confirmacion (subetapas 6-8): id_ent_etapa3,
                            id_ent_formulario, completada

ent_etapa3_incubacion    -- Traspaso a agar nutritivo, estufa, analista
ent_etapa3_oxidasa       -- Prueba de Oxidasa: reactivo_oxidasa (R69-AA-NN),
                            desaireado_agar_glucosa, agar_glucosa,
                            control_pos_ecoli, control_neg_paer, blanco,
                            fecha, hora, analista, resultado
ent_etapa3_resultados     -- Calculo final: muestra_b, muestra_a, d, n1, n2, m, suma_a
```

### Note on Catalog Gaps

Current `CatalogoRepository` maps these types that are relevant to `equipos_incubacion`, `instrumentos`, `micropipetas`, `material_siembra`. However, **Agar VRBG lots** and **Reactivo de Oxidasa batches** do NOT have dedicated catalog tables. They could be:
- Stored inline as free-text `codigo_agar_vrbg` fields (simpler, like `codigoAgarBairdParker` in S. aureus).
- Or modeled as new catalog tables `lotes_agar` and `lotes_reactivo_oxidasa`.

The existing `MaterialSiembra` table could also be extended to represent agar lots generically.

## Risks

1. **Frontend rewrite scope**: The existing `FormEnterobacteriasPage` is 386 lines of monolithic form logic. Rewriting it as a multi-component wizard with backend integration is a significant effort. Risk: underestimating the component decomposition.

2. **No background job infrastructure**: LAB-4 requires 24h incubation lockout with 2h alerts. The codebase has **zero** cron/scheduler/background job infrastructure. Solutions:
   - **Option A**: Add `node-cron` or `bull` queue (adds infrastructure complexity).
   - **Option B**: Compute incubation status on-demand from stored `fecha_inicio_incubacion` (simpler, but requires frontend polling).
   - **Option C**: A lightweight in-process timer (`setTimeout`) stored per-form on server start, hydrated from DB on restart (hacky but works for single-instance).

4. **muestraAli.repository.js misrouting**: The legacy `muestraAli.repository.js` currently sends SALMONELLA ALI cards to `/form-enterobacterias`. This was flagged in a previous exploration (`assistec-form-business-rule-realignment`) and must be fixed to point to `/form-salmonella` once that form is operational. Enterobacterias should get its own card type or use the existing categoria-based routing.

5. **Role-based access granularity**: LAB-6 requires Analista (0) can edit, Coordinadora (1) is read-only. The current `saureus.routes.js` uses `WRITE_ROLES = [0, 4]` and `READ_ROLES = [0, 1, 2, 4]`. This maps perfectly. But the frontend route currently only allows `[0, 4]` -- needs to add `1` for read-only. The frontend must also conditionally disable form controls based on the acting role.

6. **Optimistic locking in sub-etapas**: The existing pattern locks at the formulario level via `updatedAt`. Sub-etapas sharing the same parent etapa table means concurrent saves to different sub-etapas within the same parent could conflict unnecessarily. Consider finer-grained locking or merging sub-etapa saves.

7. **Validation duplication**: The Reactivo de Oxidasa validator (`R69-AA-NN`) currently exists only in the frontend. It must be duplicated in the backend Zod schema to maintain defense-in-depth.

8. **No existing oxidase/enterobacterias calculation engine**: Unlike S. aureus which has `calculators/ufcSau.calculator.js` and `saureus/` services, Enterobacterias has no calculation logic yet. LAB-5 requires confirmacion results computation.

## Discovery: Existing Form Pattern Discrepancy

The existing S. aureus backend uses `PUT /:id/etapa/:num` with numeric etapas 1-6. The frontend wizard currently has 8 "pasos". To align:
- Pasos 1-4 (Preparacion subetapas) -> could map to etapa 1 with subetapa tracking
- Paso 5 (Analisis/Lectura) -> etapa 2
- Pasos 6-8 (Confirmacion subetapas) -> etapa 3

This is the approach recommended in Approach 2.

## Discovery: Catalogos Service Already Covers Most Needs

The frontend `CatalogosService` and backend `CatalogoRepository` already provide endpoints for:
- `equipos_incubacion` (estufas 73-M, 2-M)
- `instrumentos` (balanzas)
- `micropipetas`
- `material_siembra`
- `usuarios` (analistas)

Only missing: **Agar VRBG lots** and **Reactivo de Oxidasa batches**. Recommendation: use free-text fields initially (like S. aureus does for `codigo_agar_baird_parker`), add proper catalog tables in a follow-up.

## Ready for Proposal

Yes -- the technical landscape is fully mapped. The frontend has a UI prototype that defines the data model, the backend has proven patterns to follow, and the risks are identified with mitigation strategies.
