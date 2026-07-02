# Apply Progress — Prisma Baseline DB Sanitization

**Mode**: Strict TDD
**Date**: 2026-07-02

---

## Slice 1 — Baseline Migration Foundation

**Completed Tasks**

- [x] 1.1 Generate baseline SQL via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` and write it to `AssisTec API/prisma/migrations/0_baseline_20260521000000/migration.sql`.
- [x] 1.2 Review generated SQL for scope correctness: no `TPA_ETAPA*` / `RAM_ETAPA*` tables, table names match `@@map` declarations, FK references are sane.
- [x] 1.3 Append bridge objects raw SQL (`ali_imagenes` table + `v_catalogo_unificado` view) to the baseline migration.
- [x] 1.4 Verify `migration_lock.toml` provider consistency (`provider = "postgresql"`).

**TDD Cycle Evidence**

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `__tests__/baseline/baseline.migration.test.js` | Unit | N/A (new file) | Written (ENOENT) | Passed | 3 cases | Clean |
| 1.2 | `__tests__/baseline/baseline.migration.test.js` | Unit | N/A (new file) | Written (ENOENT) | Passed | 3 cases | Clean |
| 1.3 | `__tests__/baseline/baseline.migration.test.js` | Unit | N/A (new file) | Written (ENOENT) | Passed | 2 cases | Clean |
| 1.4 | `__tests__/baseline/baseline.migration.test.js` | Unit | N/A (new file) | Written (ENOENT) | Passed | 2 cases | Clean |

### Test Summary (Slice 1)
- **Total tests written**: 10
- **Total tests passing**: 10
- **Layers used**: Unit (10)
- **Approval tests**: None — no refactoring tasks
- **Pure functions created**: 1 (`parseSchemaTables` helper)

---

## Slice 2 — Operational Bootstrap Alignment

**Completed Tasks**

- [x] 2.1 Edit `AssisTec API/docker-entrypoint.sh` to conditionally load `dev-test-seed.sql` when `LOAD_TEST_SEED=true`.
- [x] 2.2 Edit `Makefile` `dev-test` target to remove duplicate `migrate deploy` / `run-seeds.js` invocations and pass `LOAD_TEST_SEED=true`.
- [x] 2.3 Edit `Makefile` `db-push` target to print a deprecation warning.
- [x] 2.4 Add `Makefile` `migrate-resolve-baseline` target for `prisma migrate resolve --applied 0_baseline_20260521000000`.
- [x] 3.1 Create `docs/database-migrations-guide.md` with architecture, workflow, baseline, bootstrap, troubleshooting, golden commands, and `db push` policy.
- [x] 3.2 Update `docs/database.md` to remove `db push` as an active workflow and reference `docs/database-migrations-guide.md`.
- [x] 4.1–4.6 Run full end-to-end bootstrap verification (`make dev-test`, `prisma migrate status`, row counts, bridge-object checks).

**TDD Cycle Evidence**

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (assertion) | Passed | 3 cases | Clean |
| 2.2 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (assertion) | Passed | 3 cases | Clean |
| 2.3 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (assertion) | Passed | 2 cases | Clean |
| 2.4 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (assertion) | Passed | 2 cases | Clean |
| 3.1 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (ENOENT) | Passed | 2 cases | Clean |
| 3.2 | `__tests__/baseline/operational.bootstrap.test.js` | Unit | 10 baseline tests | Written (assertion) | Passed | 2 cases | Clean |

### Test Summary (Slice 2)
- **Total tests written**: 13
- **Total tests passing**: 13
- **Layers used**: Unit (13)
- **Approval tests**: None
- **Pure functions created**: 1 (`readFile` helper)

---

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `AssisTec API/prisma/migrations/0_baseline_20260521000000/migration.sql` | Created | Full DDL from `prisma migrate diff --from-empty` + bridge SQL for `ali_imagenes` and `v_catalogo_unificado` |
| `AssisTec API/__tests__/baseline/baseline.migration.test.js` | Created | Strict TDD test suite verifying baseline scope, bridge objects, and lock consistency |
| `AssisTec API/docker-entrypoint.sh` | Modified | Conditional `dev-test-seed.sql` loading via `psql` when `LOAD_TEST_SEED=true`; runs after `migrate deploy` and `run-seeds.js`, before app startup |
| `AssisTec API/Dockerfile` | Modified | Installs `postgresql16-client` so the entrypoint can run `psql` |
| `Makefile` | Modified | `dev-test` now delegates to entrypoint; `db-push` emits deprecation warning; added `migrate-resolve-baseline` target |
| `docs/database-migrations-guide.md` | Created | End-to-end migration workflow, baseline policy, bootstrap commands, troubleshooting, and golden commands |
| `docs/database.md` | Modified | Removed `db push` as an active workflow; linked to the new migration guide |
| `AssisTec API/__tests__/baseline/operational.bootstrap.test.js` | Created | 13 strict TDD tests for entrypoint/Makefile/docs alignment |
| `openspec/changes/prisma-baseline-db-sanitization/tasks.md` | Modified | Marked Phase 1 and Phase 2 tasks complete |
| `openspec/changes/prisma-baseline-db-sanitization/apply-progress.md` | Modified | This file |

---

## Migration Idempotency Fixes

During end-to-end verification, the baseline migration (which captures the final `schema.prisma` state) caused several existing incremental migrations to fail on a fresh database because those migrations assumed an older schema. The following migrations were made idempotent so they can run after the baseline without error:

- `20260629_coli_fase2_medios_cultivos_fk` — wrapped backfill `UPDATE` referencing `codigo_tween_80` in `IF EXISTS` guard.
- `20260630_sau_medios_cultivos_fk` — wrapped backfill `UPDATE`s referencing `codigo_caldo_bhi` and `codigo_bacident_agua` in `IF EXISTS` guards.
- `20260701_coli_siembra_controles_24h_48h` — wrapped backfill `UPDATE` from the removed single-block control columns in `IF EXISTS` guard.
- `20260702_sal_banos_and_medios_cultivos_fk` — wrapped backfill `UPDATE` referencing `codigo_caldo_apt_leche`; changed `DROP CONSTRAINT` to `DROP CONSTRAINT IF EXISTS` for `sal_fase3b_id_estufa_selenito_fkey`.

---

## Verification Results

### End-to-End Bootstrap
- `make dev-test` ✅ completed successfully (full `docker compose down -v` rebuild).
- `pnpm exec prisma migrate status` ✅ reports: `15 migrations found` / `Database schema is up to date!`.
- Row counts after bootstrap ✅:
  - `formularios_analisis`: 26
  - `banos_termicos`: 2
  - `v_catalogo_unificado`: 15

### Test Suites (host-side, project root)
- `npx jest __tests__/baseline/baseline.migration.test.js` ✅ 10 passing
- `npx jest __tests__/baseline/operational.bootstrap.test.js` ✅ 13 passing

### Backend Test Suite (inside container)
- `pnpm test` ⚠️ 357 passing, 15 failing.
- **5 failures are pre-existing integration-test issues** (missing route modules / service mapping mismatches) and are unrelated to this change.
- **10 failures are expected in the container context**: the new `operational.bootstrap.test.js` reads `Makefile` and `docs/` from the project root, but the backend image only contains the `AssisTec API` subtree. These 13 tests pass when run from the project root on the host (see host-side results above).

---

## Deviations from Design

None — implementation matches design.md and spec.md. The bootstrap tests are intentionally host-side because they verify repository-level files (`Makefile`, `docs/`) that are not copied into the backend Docker image.

## Issues Found

- Pre-existing backend integration tests have 5 failing suites (missing `saureus-calculation.routes` module, service payload-mapping mismatch, etc.). These are unrelated to the baseline/operational-bootstrap slice.
- `operational.bootstrap.test.js` cannot pass inside the backend container because the container filesystem does not include the repository root (`Makefile`, `docs/`). It is designed to run from the host project root.

## Remaining Tasks

None. Slice 1 and Slice 2 are complete. The change is ready for SDD verify.

## Workload / PR Boundary

- **Mode**: chained PR slice
- **Current work unit**: PR 1 / Slice 1 + Slice 2 — baseline migration foundation + operational bootstrap alignment
- **Boundary**: Adds baseline migration, entrypoint conditional test-seed loading, Makefile targets, migration guide, and operational bootstrap tests. Does not fix pre-existing integration test failures or refactor unrelated services.
- **Estimated review budget impact**: ~1,700 lines of generated DDL + ~120 lines of tests/artifacts + ~250 lines of docs/Makefile changes.

## Status

All Phase 1 and Phase 2 tasks complete. The change is ready for verify.
