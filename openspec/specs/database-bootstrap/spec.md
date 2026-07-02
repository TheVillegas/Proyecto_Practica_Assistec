# Database Bootstrap Specification

## Purpose

Define the canonical bootstrap chain that takes a PostgreSQL instance from empty to fully operational for AssisTec Lab, covering schema creation, seed layers, migration workflow, and formulario persistence.

## Requirements

### Requirement: Baseline Migration

The system MUST include a single baseline Prisma migration with timestamp < `20260521210000` that creates all tables defined in `schema.prisma` plus legacy bridge objects (`ALI_IMAGENES` table, `V_CATALOGO_UNIFICADO` view) as raw SQL appended to the migration file.

#### Scenario: Fresh DB bootstrap applies baseline first

- GIVEN a fresh PostgreSQL instance with no tables
- WHEN `prisma migrate deploy` runs
- THEN the baseline migration applies first
- AND all 14 subsequent migrations apply in chronological order
- AND `prisma migrate status` reports all migrations as applied

#### Scenario: Baseline covers full schema

- GIVEN the baseline migration SQL
- WHEN inspected
- THEN it contains CREATE TABLE for all 40+ models from `schema.prisma`
- AND it includes raw SQL for `ALI_IMAGENES` and `V_CATALOGO_UNIFICADO`

#### Scenario: Baseline timestamp is ordered correctly

- GIVEN the baseline migration directory name
- WHEN compared to `20260521210000_dashboard_upgrades_roles_base`
- THEN the baseline timestamp is strictly less

---

### Requirement: Three-Layer Seed Separation

The bootstrap MUST maintain three clearly separated layers: **baseline** (DDL), **base seed** (`run-seeds.js` — catalogs, users, roles), **dev-test seed** (`dev-test-seed.sql` — client, solicitud #3, 4 formularios). Each layer runs only after its predecessor succeeds.

#### Scenario: Base seed runs after migrate deploy

- GIVEN `migrate deploy` has completed successfully
- WHEN `node run-seeds.js` executes
- THEN catalogs (diluyentes, equipos_lab, instrumentos, etc.) are populated
- AND test users exist in `usuarios`
- AND `usuario_roles` are backfilled

#### Scenario: Dev-test seed runs after base seed

- GIVEN `run-seeds.js` has completed
- WHEN `dev-test-seed.sql` executes via psql
- THEN solicitud #3 (ALI-003/2026) exists
- AND 4 formulario records are created (sau, coli, sal, ent)

---

### Requirement: Entrypoint and Makefile Alignment

`docker-entrypoint.sh` and `Makefile` MUST use `prisma migrate deploy` exclusively. No target or script SHALL reference `prisma db push` as a valid workflow path.

#### Scenario: make dev-test executes full chain

- GIVEN a developer runs `make dev-test`
- WHEN the command completes
- THEN containers were recreated (`down -v && up -d`)
- AND `migrate deploy` exited 0
- AND `run-seeds.js` ran successfully
- AND `dev-test-seed.sql` loaded via psql

#### Scenario: No db-push in active workflow

- GIVEN the Makefile
- WHEN inspected
- THEN `db-push` target exists only with a deprecation warning or is removed
- AND `dev-test`, `dev`, `migrate-deploy` do NOT invoke `db push`

---

### Requirement: Existing Dev Database Resolution

The project MUST provide a documented recipe using `prisma migrate resolve --applied` for dev databases that already have the schema from `db push` + 14 migrations.

#### Scenario: Existing DB marks baseline as applied

- GIVEN a dev DB with tables created via `db push` and 14 migrations applied
- WHEN the developer runs `prisma migrate resolve --applied 0_baseline_<ts>`
- THEN `prisma migrate status` shows the baseline as applied
- AND subsequent `migrate deploy` skips the baseline and applies only new migrations

---

### Requirement: Migrations Guide Documentation

`docs/database-migrations-guide.md` MUST exist and cover: architecture (Prisma active + legacy deprecated), daily workflow (`migrate deploy`), baseline concept, bootstrap from zero, troubleshooting, and the golden rule "never `db push` in production".

#### Scenario: Guide exists and is complete

- GIVEN the file `docs/database-migrations-guide.md`
- WHEN read
- THEN it contains sections for architecture, workflow, baseline, bootstrap, troubleshooting
- AND it explicitly forbids `db push` in production

---

### Requirement: Formulario Persistence Support

The bootstrap chain MUST allow full CRUD for all 4 microbiological formularios: SAU (saureus_muestras + sau_etapa1-6), COLI (coli_formulario + coli_fase1-4), SAL (sal_formulario + sal_fase1-5), ENT (ent_formulario + ent_etapa1-3).

#### Scenario: All 4 formularios accept writes post-bootstrap

- GIVEN the full bootstrap chain has completed
- WHEN a test INSERT targets each formulario table
- THEN the row persists without FK violations
- AND the dev-test-seed.sql fixture creates valid records for all 4

---

### Requirement: Explicit Scope Exclusion — TPA_ETAPA and RAM_ETAPA

The baseline migration MUST NOT include `TPA_ETAPA2_SESION` through `TPA_ETAPA5_RECURSOS` or `RAM_ETAPA1` through `RAM_ETAPA7_CIERRE` tables. These are legacy-only, managed by `Backend/`.

#### Scenario: Legacy tables absent from baseline

- GIVEN the baseline migration SQL
- WHEN searched for `TPA_ETAPA` or `RAM_ETAPA` CREATE statements
- THEN none are found
- AND only Prisma-schema models + bridge objects are present
