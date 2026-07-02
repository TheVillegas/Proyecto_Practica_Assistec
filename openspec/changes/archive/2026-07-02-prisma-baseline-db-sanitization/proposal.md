# Proposal: Prisma Baseline DB Sanitization

## Intent

`make dev-test` (and any fresh `prisma migrate deploy`) fails on a greenfield DB. The initial schema was synced via `prisma db push` (rejected temporal fix), so the 15 existing migrations all assume tables that never had a recorded CREATE. The first one — `20260521210000_dashboard_upgrades_roles_base` — runs `INSERT INTO usuario_roles SELECT … FROM usuarios` against an empty table and dies. `run-seeds.js` never runs, the API never starts, and the 4 microbiological forms (SAU, COLI, SAL, ENT) have no clean path to persist data. This change creates a single reviewable baseline so `migrate deploy` from an empty DB produces a usable schema, seeds populate it deterministically, and the 4 formularios can be exercised end-to-end.

## Scope

### In Scope
- One **baseline Prisma migration** (timestamp `< 20260521210000`) generated from current `schema.prisma` via `prisma migrate diff --from-empty`.
- Legacy bridge objects needed by the active system: `ALI_IMAGENES` table + `V_CATALOGO_UNIFICADO` view, as raw SQL inside the baseline.
- Align `docker-entrypoint.sh` and `Makefile` (`dev-test`, `migrate-deploy`, `migrate-reset`) to `migrate deploy` only — no `db push` anywhere.
- Three clearly-named layers: **baseline** (DDL), **base seed** (`run-seeds.js`), **dev-test seed** (`dev-test-seed.sql`).
- `prisma migrate resolve` recipe for existing dev DBs already at the `db push` + 15 migrations state.
- New `docs/database-migrations-guide.md`.

### Out of Scope
- Porting `Backend/` legacy `pg` endpoints to Prisma; no `TPA_ETAPA*` / `RAM_ETAPA*` migration.
- `MuestraAli.codigoAli` Int → BigInt (current ALI numbers fit; tracked separately).
- New features in the 4 formularios — only unblocking persistence.
- Re-running or rewriting the 15 existing migrations.

## Capabilities

### New Capabilities
- `database-bootstrap`: defines the canonical chain `baseline → 15 migrations → base seed → dev-test seed` and the contract each layer must respect.

### Modified Capabilities
None. Build/infrastructure change only; no behavioral spec change.

## Approach

1. **Generate baseline** locally: `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` → write as `0_baseline_<ts>/migration.sql` (ts < `20260521210000`). Append `ALI_IMAGENES` + `V_CATALOGO_UNIFICADO` as raw SQL.
2. **Lock for existing DBs** via `prisma migrate resolve --applied 0_baseline_<ts>`.
3. **Verify the chain**: `docker compose down -v && make dev-test` from clean state must complete; `run-seeds.js` must run after `migrate deploy` succeeds.
4. **Smoke test the 4 formularios** with `dev-test-seed.sql`: write to `sau_formularios`, `coli_formularios`, `sal_formularios`, `ent_formularios` and confirm rows persist.
5. **Document** in `docs/database-migrations-guide.md`: workflow, baseline concept, troubleshooting, golden rule "never `db push` in production".

## Affected Areas

| Area                                                 | Impact   | Description                                                   |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `AssisTec API/prisma/migrations/0_baseline_<ts>/`    | New      | Baseline DDL + bridge objects                                 |
| `AssisTec API/prisma/migrations/migration_lock.toml` | Modified | Re-generated with baseline                                    |
| `AssisTec API/docker-entrypoint.sh`                  | Verified | Keeps `migrate deploy` only                                   |
| `Makefile`                                           | Modified | `dev-test` order + `migrate-reset` documents `resolve` recipe |
| `docs/database-migrations-guide.md`                  | New      | Workflow + troubleshooting                                    |
| `docs/database.md`                                   | Updated  | Drop `db push` instructions, link to new guide                |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Baseline DDL drifts from real schema | Med | Generate via `prisma migrate diff`; full `make dev-test` smoke test |
| Existing dev DBs hit "table already exists" | High | Document `prisma migrate resolve --applied`; CI uses clean volume |
| `usuario_roles` INSERT runs before `usuarios` has data | Med | Migration uses `ON CONFLICT DO NOTHING`; `seedUsuarioRoles()` is canonical backfill |
| `TpaReporte`/`RamReporte` shells missing legacy columns | Med | Documented bridge gap; out of scope, tracked separately |
| Baseline pulls unintended objects | Low | Review generated SQL before commit |

## Rollback Plan

- **Local dev**: `docker compose down -v` from previous commit; baseline is a new directory, safe to delete.
- **Existing DBs**: `prisma migrate resolve --rolled-back 0_baseline_<ts>` reverses the marker; no DDL applied.
- **CI / fresh envs**: revert the baseline-adding commit; pre-baseline state is unreachable from clean DB, so no production data at risk.

## Success Criteria

- [ ] `docker compose down -v && make dev-test` completes end-to-end from clean state.
- [ ] `migrate deploy` exits 0 before `run-seeds.js` runs.
- [ ] All 4 formularios persist a write against the `dev-test-seed.sql` fixture.
- [ ] `prisma migrate status` shows baseline + 15 migrations as applied.
- [ ] `docs/database-migrations-guide.md` exists, covers `migrate deploy` workflow, forbids `db push` in production, includes troubleshooting.
- [ ] `Makefile` no longer references `db push` as a valid path.
