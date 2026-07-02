# Design: Prisma Baseline DB Sanitization

## Technical Approach

Generate a single baseline Prisma migration via `prisma migrate diff --from-empty` that creates every table from `schema.prisma` (40+ models) plus two legacy bridge objects (`ali_imagenes`, `v_catalogo_unificado`) as appended raw SQL. The baseline is placed at timestamp `20260521000000` — strictly before the first real migration `20260521210000` — so the migration chain becomes: baseline → 14 existing migrations. The entrypoint (`docker-entrypoint.sh`) and `Makefile` are cleaned to a single, deterministic `migrate deploy` flow. Three seed layers are formally separated: baseline (DDL), base seed (`run-seeds.js`), dev-test seed (`dev-test-seed.sql`). Existing dev DBs are reconciled via `prisma migrate resolve --applied`.

## Architecture Decisions

### Decision: Baseline generation strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `prisma migrate diff --from-empty` | Exact DDL match to schema; must review generated SQL for correctness | **Selected** |
| Manual SQL from `init_refined.sql` | Stale, duplicates models, risks drift | Rejected |
| `prisma db push` + `prisma migrate dev` | Loses audit trail, same root cause we are fixing | Rejected |

**Rationale**: `migrate diff` generates `CREATE TABLE` for every model exactly as the Prisma engine would, respecting `@@map`, `@map`, column types, defaults, and constraints. Manual SQL is the exact problem we are escaping.

### Decision: Bridge objects placement

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Append `ALI_IMAGENES` + `V_CATALOGO_UNIFICADO` as raw SQL inside the baseline migration | Co-location with DDL; one artifact to maintain | **Selected** |
| Separate migration for bridge objects | Extra migration step, timing complexity | Rejected |
| Add to schema.prisma as `@@ignore` models | Prisma does not support `CREATE VIEW`; `@@ignore` does not generate SQL | Rejected |

**Rationale**: `ali_imagenes` is a simple table (4 columns, FK to `muestras_ali`). `v_catalogo_unificado` is a view (UNION of `instrumentos` and `micropipetas`). Both depend on tables created by the baseline, so they belong at the end of the same migration. They are NOT added to `schema.prisma` — they remain raw SQL only.

### Decision: Seed layer contracts

| Layer | What runs | When | Idempotent? |
|-------|-----------|------|-------------|
| Baseline | `migration.sql` (DDL) | `migrate deploy` | Tables created once |
| Base seed | `run-seeds.js` | After migrate deploy | Yes (`COUNT=0` guard) |
| Dev-test seed | `dev-test-seed.sql` via psql | After base seed | Yes (`DO $$ … IF EXISTS RETURN`) |

**Rationale**: Three layers never mix. `run-seeds.js` is the canonical reference for all catalog and user data. `dev-test-seed.sql` is optional, for local development only.

### Decision: Makefile `dev-test` deduplication

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Remove duplicate `migrate deploy` + `run-seeds.js` from Makefile `dev-test`; rely on entrypoint alone | Clean chain, single responsibility | **Selected** |
| Keep duplicates as "defense in depth" | Confusion about which step failed, double output | Rejected |

**Rationale**: `docker-entrypoint.sh` already runs `migrate deploy` + `run-seeds.js` on container start. The Makefile currently repeats these steps, producing redundant output. The fix: remove Steps 3 and 4 from `dev-test`, keeping only the `dev-test-seed.sql` load after a longer sleep to let the entrypoint finish. `db-push` target gets a deprecation warning.

## Data Flow

```
docker compose up (empty DB)
    │
    ▼
docker-entrypoint.sh: sleep 5
    │
    ▼
prisma migrate deploy
    │
    ├── 0_baseline_20260521000000/      ← CREATE all tables + bridge objects
    ├── 20260521210000_…roles_base      ← CREATE usuario_roles + backfill
    ├── 20260610_saureus…               ← ALTER TABLE, ADD COLUMN…
    ├── … (12 more)                     ← follow-on DDL
    └── migration_lock.toml satisfied
    │
    ▼
node run-seeds.js                       ← idempotent: catalogos, usuarios, roles
    │
    ▼
node app.js                             ← API starts
    │
    ▼
[make dev-test only] psql < dev-test-seed.sql  ← cliente + solicitud #3 + 4 formularios
```

### Existing DBs flow (reconciliation)

```
Dev BD with db push schema + 14 migrations already applied
    │
    ▼
prisma migrate resolve --applied 0_baseline_20260521000000
    │  (marks baseline as applied, no DDL executed)
    ▼
prisma migrate status                  ← baseline + 14 as "applied"
    │
    ▼
Future prisma migrate deploy           ← applies only NEW migrations
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AssisTec API/prisma/migrations/0_baseline_20260521000000/migration.sql` | Create | DDL from `prisma migrate diff --from-empty` + appended bridge SQL |
| `AssisTec API/prisma/migrations/migration_lock.toml` | Modify | Regenerated to include baseline entry |
| `AssisTec API/docker-entrypoint.sh` | Modify | Add `dev-test-seed.sql` load after seeds (controlled by env var `LOAD_TEST_SEED=true`) |
| `Makefile` | Modify | Remove duplicate `migrate deploy` + `run-seeds.js` from `dev-test`; add deprecation warning to `db-push`; add `migrate-resolve` recipe |
| `docs/database-migrations-guide.md` | Create | Architecture, workflow, baseline concept, troubleshooting, golden rules |
| `docs/database.md` | Modify | Drop `db push` references, link to migrations guide |

## Interfaces / Contracts

```sql
-- Bridge object: ali_imagenes (appended to baseline migration.sql)
CREATE TABLE IF NOT EXISTS ali_imagenes (
    id_imagen SERIAL PRIMARY KEY,
    codigo_ali BIGINT NOT NULL,
    url_imagen VARCHAR(500) NOT NULL,
    tipo_imagen VARCHAR(50) DEFAULT 'general',
    FOREIGN KEY (codigo_ali) REFERENCES muestras_ali(codigo_ali)
);

-- Bridge object: v_catalogo_unificado (appended to baseline migration.sql)
CREATE OR REPLACE VIEW v_catalogo_unificado AS
SELECT id_instrumento AS id_origen, nombre_instrumento AS nombre,
       codigo_instrumento AS codigo, 'INSTRUMENTO' AS tipo_material,
       NULL AS capacidad
FROM instrumentos
UNION ALL
SELECT id_pipeta AS id_origen, nombre_pipeta AS nombre,
       codigo_pipeta AS codigo, 'PIPETA' AS tipo_material,
       capacidad
FROM micropipetas;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | `make dev-test` completes end-to-end | `docker compose down -v && make dev-test` from clean state → expect exit 0 |
| Integration | All 14 migrations apply after baseline | `prisma migrate status` → all as "applied", none as "pending" |
| Integration | Seeds populate all 11 catalogs + 5 users | Query row counts via psql |
| Integration | `dev-test-seed.sql` creates solicitud #3 + 4 formularios | Query `solicitud_ingreso`, `sau_formulario`, `coli_formulario`, `sal_formulario`, `ent_formulario` |
| Smoke | 4 formularios accept writes | INSERT into each formulario table → FK constraints pass |

## Migration / Rollout

- **New devs / CI**: `docker compose down -v && make dev-test` — baseline applies fresh, seeds run, test data loads.
- **Existing dev DBs**: Run `prisma migrate resolve --applied 0_baseline_20260521000000` once to reconcile. Documented in Makefile as `make migrate-resolve-baseline`.
- **Rollback**: Delete `0_baseline_20260521000000/` directory + revert `migration_lock.toml`. Existing DBs: `prisma migrate resolve --rolled-back 0_baseline_20260521000000`. No DDL reverse needed (baseline never ran on existing DBs; on fresh DBs, `docker compose down -v` destroys data).

## Open Questions

None — all technical decisions are resolvable from exploration, proposal, and spec.
