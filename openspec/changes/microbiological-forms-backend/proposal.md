	# Proposal: Microbiological Forms Backend

## Intent

Implement secure backend endpoints for 3 microbiological analysis forms (S. Aureus, Coliformes, Salmonella) that allow analysts to record stage-by-stage lab results with automatic UFC/g and NMP calculations, normative compliance verification, and full audit trail. The existing PR #4 provides a CRUD baseline but has 2 critical security bugs (TOCTOU race condition, IDOR) and lacks business logic.

**Users affected**: Analista (write own forms), Coordinadora/Jefe Área (read/validate), Admin (full access).

## Scope

### In Scope
- Prisma models for 3 forms: S. Aureus (6 stages), Coliformes (4 phases), Salmonella (10 phases) — from PR #4
- CRUD endpoints: create form with samples, get by id, get by analysis, save stage/phase
- TOCTOU fix: atomic `WHERE updated_at = $expected` in Prisma update
- IDOR fix: `assertCanWrite` verifies `usuario.id === formulario.rutAnalista`
- Business logic: UFC/g calculator (S. Aureus HU-06-05), NMP calculator (Coliformes HU-04-04), Salmonella presence/absence (HU-04-04-01)
- Input validation with Zod schemas
- Base repository pattern to eliminate 70% code duplication across 3 repos
- Error handler sanitization (no Prisma internals leaked)
- `@updatedAt` on child tables
- Role-based access: ANALISTA/ADMIN write, COORDINADORA/JEFE_AREA/ADMIN read

### Out of Scope
- Frontend (Angular/Ionic) — separate change
- Enterobacterias form (Épica 5) — deferred
- Mohos y Levaduras (Épica 7) — deferred per ERS
- Email notifications (HU-02-01) — separate change
- PDF/Excel export

## Capabilities

### New Capabilities
- `micro-forms-crud`: Create, read, and update microbiological analysis forms with stage-by-stage persistence and optimistic locking
- `micro-forms-authz`: Ownership-based authorization (analyst owns form) + role-based read/write permissions
- `micro-forms-calculations`: UFC/g auto-calculation (S. Aureus), NMP calculation (Coliformes), presence/absence determination (Salmonella)
- `micro-forms-validation`: Zod input validation schemas for form payloads, temporal tolerances (2h readings, 25min alert), stage progression enforcement

### Modified Capabilities
None — no existing specs are affected. The forms are entirely new domain entities.

## Approach

1. **Security first**: Fix TOCTOU (atomic WHERE clause) and IDOR (ownership check) before any feature work
2. **Base repository**: Extract shared logic (assertConcurrency, touchFormulario, findById, findBySolicitudAnalisis, updateEstado) into `BaseFormRepository` class
3. **Incremental delivery**: S. Aureus first (most complex business logic — UFC/g calculator), then Coliformes (NMP), then Salmonella (10 phases but simpler logic)
4. **Reuse PR #4**: Cherry-pick Prisma models and route/controller structure; rewrite repository layer with security fixes and base class
5. **Validation layer**: Zod schemas per form type, integrated as Express middleware before controllers

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add 20+ models for 3 forms (from PR #4) |
| `src/repositories/` | New | `baseForm.repository.js`, `saureus.repository.js`, `coliformes.repository.js`, `salmonella.repository.js` |
| `src/services/` | New | `formularioMicrobiologico.service.js` + 3 form-specific services |
| `src/controllers/` | New | `formularioMicrobiologico.controller.js` |
| `src/routes/` | New | `formularioMicrobiologico.routes.js` |
| `src/middleware/` | Modified | Replace `optimisticLock.js` with atomic version; add Zod validation middleware |
| `src/config/` | New | `calculators/` — UFC, NMP, Salmonella logic |
| `app.js` | Modified | Sanitize error handler, register new routes |
| `prisma/migrations/` | New | Migration for form tables |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TOCTOU data loss in concurrent edits | High (current bug) | Atomic `WHERE updated_at` in every update; integration test with parallel requests |
| IDOR data leak across analysts | High (current bug) | Ownership check in base repository; unit test per form type |
| Salmonella 10-phase complexity | Medium | Implement last; simpler logic than S. Aureus despite more phases |
| NMP calculation accuracy | Medium | Validate against ASISTEC reference data; unit tests with known inputs/outputs |
| Prisma BigInt serialization in responses | Low | Existing BigInt serializer from PR #4; add response tests |

## Rollback Plan

- All changes are additive (new tables, new routes) — no existing functionality modified except error handler and optimistic lock middleware
- Revert migration: `prisma migrate rollback` drops new tables
- Remove route registration from `app.js` to disable endpoints without affecting existing ones
- Feature branch strategy: merge only when all 3 forms pass tests

## Dependencies

- PR #4 code (closed) — available as reference, not merged
- ERS v3.0 sections 3.4, 3.5, 3.7 — business rules source of truth
- `Formularios.xlsx` — field-level specification for each form
- Existing auth middleware (`verifyToken`, `authorizeAny`) — reused as-is
- Existing Prisma connection and PostgreSQL instance

## Success Criteria

- [ ] TOCTOU race condition eliminated (atomic WHERE, integration test passes with 10 concurrent requests)
- [ ] IDOR vulnerability closed (analyst A cannot modify analyst B's form, verified by test)
- [ ] All 3 forms create/read/update stages via REST endpoints
- [ ] UFC/g calculation matches ASISTEC reference data for S. Aureus (3 test cases)
- [ ] NMP calculation correct for Coliformes (3 test cases)
- [ ] Salmonella presence/absence determination correct (3 test cases)
- [ ] Input validation rejects malformed payloads with specific error messages
- [ ] Error handler returns no Prisma internals to client
- [ ] `npm test` passes with 0 failures
- [ ] All endpoints respond < 3s (RNF-001)
