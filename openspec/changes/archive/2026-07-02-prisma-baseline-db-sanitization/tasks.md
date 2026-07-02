# Tasks: Prisma Baseline DB Sanitization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–1100 (baseline ~600–800 generated + ~250 operational/docs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (baseline migration — size:exception) → PR 2 (entrypoint + Makefile + docs) |
| Delivery strategy | ask-always |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes (resolved by user to chained PRs)
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Generate baseline migration + bridge SQL | PR 1 (size:exception) | Generated DDL; cannot split without breaking the migration chain |
| 2 | Entrypoint + Makefile + docs + resolve recipe | PR 2 | ~250 lines; all operational, independent of PR 1 diff |

## Phase 1: Baseline Migration (Foundation)

- [x] 1.1 Generate baseline SQL via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` inside the backend container. Write output to `AssisTec API/prisma/migrations/0_baseline_20260521000000/migration.sql`.
  - **Verify**: File exists; contains `CREATE TABLE` for all 40+ models; timestamp `20260521000000` < `20260521210000`.
- [x] 1.2 Review generated SQL: confirm no `TPA_ETAPA*` or `RAM_ETAPA*` tables appear. Confirm table names match `@@map` values (snake_case). Confirm FK references are valid.
  - **Verify**: `grep -c "TPA_ETAPA\|RAM_ETAPA" migration.sql` returns 0.
- [x] 1.3 Append bridge objects raw SQL to the same `migration.sql`: `CREATE TABLE IF NOT EXISTS ali_imagenes (…)` + `CREATE OR REPLACE VIEW v_catalogo_unificado AS …` per design.md contracts.
  - **Verify**: File ends with bridge SQL; `ali_imagenes` has 4 columns + FK to `muestras_ali`; view unions `instrumentos` + `micropipetas`.
- [x] 1.4 Regenerate `migration_lock.toml` — run `prisma migrate status` in the container (read-only check) to confirm the lock file includes the new baseline entry.
  - **Verify**: `migration_lock.toml` unchanged or updated; no provider mismatch.

## Phase 2: Entrypoint & Makefile Alignment

- [x] 2.1 Edit `AssisTec API/docker-entrypoint.sh`: add conditional `dev-test-seed.sql` load after `run-seeds.js`, guarded by `LOAD_TEST_SEED=true` env var. Use `psql` with `$DATABASE_URL` or connection params from env.
  - **Verify**: Script runs `migrate deploy → run-seeds.js → (optional) psql < dev-test-seed.sql → node app.js`. No `db push` anywhere.
- [x] 2.2 Edit `Makefile` `dev-test` target: remove Steps 3 and 4 (duplicate `migrate deploy` + `run-seeds.js`). Keep Steps 1, 2, 5. Increase sleep to 30s to let entrypoint finish. Add `LOAD_TEST_SEED=true` to `docker compose up -d` or pass via env.
  - **Verify**: `make dev-test` has 3 steps (clean, up, load test seed). No duplicate migrate/seeds.
- [x] 2.3 Edit `Makefile` `db-push` target: prepend deprecation warning (`@echo "⚠️ DEPRECATED: Use 'make migrate' instead. db push should not be used."`) before the existing command.
  - **Verify**: Running `make db-push` prints deprecation warning.
- [x] 2.4 Add `migrate-resolve-baseline` target to `Makefile`: runs `prisma migrate resolve --applied 0_baseline_20260521000000` inside the container. Include a help comment explaining it's for existing dev DBs.
  - **Verify**: Target exists; `make help` lists it.

## Phase 3: Documentation

- [x] 3.1 Create `docs/database-migrations-guide.md` with sections: (1) Architecture (Prisma active + legacy deprecated), (2) Daily workflow (`migrate dev` / `migrate deploy`), (3) Baseline concept, (4) Bootstrap from zero, (5) Existing DB reconciliation (`migrate resolve`), (6) Bridge objects, (7) Troubleshooting, (8) Golden rules (no `db push` in production, no editing applied migrations).
  - **Verify**: File exists; contains all 8 sections; explicitly forbids `db push` in production.
- [x] 3.2 Update `docs/database.md` line 199: replace `prisma db push` reference with link to `docs/database-migrations-guide.md`. Add note that `db push` is deprecated for workflow use.
  - **Verify**: `grep "db push" docs/database.md` returns only deprecation/context references, not active workflow instructions.

## Phase 4: Smoke Test & Verification

- [x] 4.1 Run `docker compose down -v && make dev-test` from clean state. Capture full output.
  - **Verify**: Exit 0. `migrate deploy` succeeds. `run-seeds.js` completes. `dev-test-seed.sql` loads without errors.
- [x] 4.2 Run `prisma migrate status` inside the container.
  - **Verify**: Baseline + 14 migrations all show as "applied". No "pending" or "failed" entries.
- [x] 4.3 Query row counts via psql: `SELECT COUNT(*) FROM usuarios`, `SELECT COUNT(*) FROM diluyentes`, etc. for all 11 catalogs.
  - **Verify**: All catalogs have data. At least 5 users exist.
- [x] 4.4 Query formulario tables: `SELECT COUNT(*) FROM sau_formulario`, `coli_formulario`, `sal_formulario`, `ent_formulario`.
  - **Verify**: Each returns ≥ 1 row (from `dev-test-seed.sql`).
- [x] 4.5 Verify bridge objects: `SELECT COUNT(*) FROM ali_imagenes` (should return 0 or table exists) and `\d v_catalogo_unificado` (view exists).
  - **Verify**: Both objects exist in the database.
- [x] 4.6 Confirm no `TPA_ETAPA*` or `RAM_ETAPA*` tables: `\dt tpa_etapa*` and `\dt ram_etapa*` in psql.
  - **Verify**: No matching tables found.
