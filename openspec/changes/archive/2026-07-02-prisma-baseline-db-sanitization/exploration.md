# Exploration: Prisma Baseline DB Sanitization

## Current State

### The Root Problem

`make dev-test` (and any fresh `migrate deploy` from scratch) **fails** because:

1. **No baseline migration exists.** The current schema (`schema.prisma` with 40+ models) was initially synced via `prisma db push` — a rejected temporal fix. No migration recorded the initial table creation.

2. **The first real migration assumes pre-existing tables.** `20260521210000_dashboard_upgrades_roles_base/migration.sql` does:
   ```sql
   CREATE TABLE IF NOT EXISTS "usuario_roles" (…);
   INSERT INTO "usuario_roles" … SELECT … FROM "usuarios" …;
   ```
   This fails because `usuarios` doesn't exist yet in a fresh DB — there's no baseline migration that created it.

3. **Subsequent migrations (13 more) also assume tables already exist.** They use `ALTER TABLE`, `ADD COLUMN`, `CREATE TABLE` for new entities, and `UPDATE`/`INSERT` that reference existing tables.

4. **The entrypoint flow is broken.** `docker-entrypoint.sh` runs `prisma migrate deploy` then `node run-seeds.js`. Migrate deploy fails, seeds never run, app never starts.

### Current Bootstrap Chain (broken)

```
docker compose up
  → postgres:16 (empty DB)
  → backend container: docker-entrypoint.sh
    → sleep 5
    → prisma migrate deploy  ← FAILS here
    → node run-seeds.js      ← never runs
    → node app.js            ← never runs
```

### The Two-Schema Reality

The project has **two schema layers** coexisting in the same PostgreSQL database:

| Layer | Source | Management | Status |
|-------|--------|------------|--------|
| **Active (Prisma)** | `AssisTec API/prisma/schema.prisma` | 15 Prisma migrations | Canonical, no baseline |
| **Legacy (SQL)** | `BD/init/init_refined.sql` | Raw SQL, `Backend/` legacy | Reference-only, deprecated |

### What `init_refined.sql` Contains

| Section | Lines | Content | Status vs Prisma |
|---------|-------|---------|------------------|
| §2 Maestras (catálogos) | 12-61 | DILUYENTES, EQUIPOS_INCUBACION, EQUIPOS_LAB, INSTRUMENTOS, LUGARES_ALMACENAMIENTO, MAESTRO_CHECKLIST_LIMPIEZA, MAESTRO_FORMAS_CALCULO, MAESTRO_TIPOS_ANALISIS, MATERIAL_SIEMBRA, MICROPIPETAS, USUARIOS | All **already modeled** in Prisma schema with `@@map` |
| §3 Operacionales (TPA) | 63-163 | MUESTRAS_ALI, ALI_IMAGENES, TPA_REPORTE, TPA_ETAPA2-5 tables | `MuestraAli`, `TpaReporte` are **minimal shells** in Prisma. TPA_ETAPA* tables are **NOT in Prisma** — handled by `Backend/` legacy |
| §4 RAM modular | 164-283 | RAM_REPORTE, RAM_ETAPA1-7 tables | `RamReporte` is **minimal shell**. RAM_ETAPA* tables are **NOT in Prisma** |
| §5 Vistas | 284-301 | V_CATALOGO_UNIFICADO | **NOT in Prisma** (view, not table) |
| §6 Seeds (INSERTs) | 302-384 | Data for all 11 catalogs | **Already replicated** in `run-seeds.js` (more complete) |

### Migration Chain (chronological)

```
[NO BASELINE — initial schema created by db push]
  ↓ MISSING
20260521210000_dashboard_upgrades_roles_base  ← FAILS (references usuarios)
20260610_saureus_phase5_calculation            ← assumes sau_* tables exist
20260624_enterobacterias_flow                  ← assumes ent_* tables exist
20260625_add_baird_parker_reactives            ← ALTER TABLE
20260629_medios_cultivos                       ← CREATE TABLE (new)
20260629_coli_fase2_medios_cultivos_fk         ← ALTER TABLE + FK references
20260629_add_mpn_statistical_fields…           ← ALTER TABLE + ADD COLUMN
20260630_sau_medios_cultivos_fk                ← ALTER TABLE + FK
20260630_ent_medios_cultivos_fk                ← ALTER TABLE + FK
20260630_sal_manual_inocuidad                  ← ADD COLUMN
20260701_coli_siembra_controles_24h_48h        ← ADD COLUMNs
20260701_ent_etapa3_resultado_per_muestra      ← CREATE TABLE
20260701_ent_etapa2_lectura_muestras_json      ← ALTER TABLE
20260702_sal_banos_and_medios_cultivos_fk      ← CREATE TABLE + ALTER TABLEs
```

---

## Rescatar / Traducir / Excluir

### RESCATAR (mantener como referencia conceptual)

These elements from `init_refined.sql` are **already captured** in the Prisma ecosystem but should be referenced during baseline creation for completeness:

| Element | init_refined.sql | Current Prisma Model | Gap |
|---------|------------------|---------------------|-----|
| Catálogo inserts | Raw SQL INSERTs | `run-seeds.js` (idempotent JS) | ✅ No gap — seeds are more complete |
| V_CATALOGO_UNIFICADO | SQL VIEW | Not in Prisma | ⚠️ Used by legacy `Backend/` — needs creation as raw SQL in baseline or as a migration |
| ALI_IMAGENES table | Table + FK | Not in Prisma | ⚠️ Used by legacy `Backend/` for image upload — needs creation in baseline |

### TRADUCIR (already translated, verify completeness)

| Legacy SQL (init_refined.sql) | Prisma Model | Column Mapping | Status |
|-------------------------------|--------------|----------------|--------|
| USUARIOS.RUT_ANALISTA | Usuario.rutUsuario | Direct | ✅ |
| USUARIOS.NOMBRE_APELLIDO_ANALISTA | Usuario.nombreApellidoUsuario | snake→camel | ✅ |
| USUARIOS.CORREO_ANALISTA | Usuario.correoUsuario | snake→camel | ✅ |
| USUARIOS.CONTRASENA_ANALISTA | Usuario.contrasenaUsuario | snake→camel | ✅ |
| USUARIOS.ROL_ANALISTA | Usuario.rolUsuario | snake→camel | ✅ |
| USUARIOS.URL_FOTO | Usuario.urlFoto | snake→camel | ✅ |
| MUESTRAS_ALI.CODIGO_ALI | MuestraAli.codigoAli | BIGINT→Int | ⚠️ Type narrowing risk |
| TPA_REPORTE.* | TpaReporte.* | Minimal shell | ⚠️ Missing 6 columns |
| RAM_REPORTE.* | RamReporte.* | Minimal shell | ⚠️ Missing 4 columns |
| All catálogo tables | Prisma catalog models | snake→camel | ✅ |
| `usuario_roles` | UsuarioRol | New table (migration) | ✅ |

### EXCLUIR (do NOT include in Prisma baseline)

These elements from `init_refined.sql` must **NOT** enter the active Prisma bootstrap:

| Element | Reason |
|---------|--------|
| Raw SQL `CREATE TABLE` statements (duplicated) | Prisma schema is the source of truth; `prisma migrate diff` generates the DDL |
| TPA_ETAPA2_SESION through TPA_ETAPA5_RECURSOS | These are **legacy-only** tables managed by `Backend/` legacy. They are NOT in Prisma schema and should NOT be part of the Prisma baseline. |
| RAM_ETAPA1 through RAM_ETAPA7_CIERRE/FORMAS_CALCULO | Same — legacy-only. |
| Legacy column names (UPPER_SNAKE) | Prisma uses `@map("snake_case")` — the migration will use snake_case table/column names via `@@map` |
| `DEFAULT CURRENT_TIMESTAMP` patterns | Prisma uses `@default(now())` which generates proper `DEFAULT` clauses |
| `ON DELETE CASCADE` on all TPA/RAM FKs | These belong in the legacy schema, not the Prisma schema (which uses controlled cascade via `onDelete`) |

---

## Bootstrap Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE MIGRATION (timestamp < 20260521210000)                 │
│ Creates ALL tables from current schema.prisma state             │
│ (40+ tables: usuarios, clientes, solicitud_*, sau_*, coli_*,   │
│  sal_*, ent_*, catálogos, formularios, etc.)                   │
└──────────────┬──────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 20260521210000_dashboard_upgrades_roles_base                    │
│ Creates usuario_roles table + backfills from usuarios           │
│ REQUIRES: usuarios table (with data from seeds)                 │
└──────────────┬──────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 12 subsequent migrations (chronological)                        │
│ 20260610 → 20260702: saureus, entero, medios, sal, coli        │
│ ALTER TABLE, ADD COLUMN, CREATE TABLE, FK constraints          │
└──────────────┬──────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────────────┐
│ run-seeds.js                                                    │
│ Inserts: catálogos base, categorías, formularios,               │
│ acreditaciones, tiempos/alcances, 5 test users                  │
│ IDEMPOTENT: skips if tables already have data                   │
└──────────────┬──────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────────────────┐
│ dev-test-seed.sql                                               │
│ Creates test data: cliente, solicitud #3, 4 formularios         │
│ App-specific, NOT part of standard bootstrap                    │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Dependency Chain

1. **Maestras (catálogos)** must exist **before** `run-seeds.js` inserts into them → must be in baseline
2. **usuarios** table must exist **before** `dashboard_upgrades_roles_base` backfills `usuario_roles` → must be in baseline
3. **usuarios** must have **seed data** **before** `dashboard_upgrades_roles_base` runs its `INSERT INTO usuario_roles SELECT FROM usuarios` → **this is the core race condition**: migration assumes seed data exists
4. **medios_cultivos** → created by `20260629_medios_cultivos` migration, then referenced by all 4 formulario migrations
5. **Formulario tables** (sau_*, coli_*, sal_*, ent_*) depend on solicitud_*, usuarios, catálogos

### Solution to the `usuarios` Race Condition

The `dashboard_upgrades_roles_base` migration inserts `usuario_roles` from existing `usuarios` data. In a true greenfield bootstrap:
- Option A: Make the migration's INSERT conditional / idempotent (keep `ON CONFLICT DO NOTHING` which it already has) and rely on seeds to provide initial users
- Option B: Move the `usuario_roles` backfill logic into `run-seeds.js` (where it already exists as `seedUsuarioRoles()`)

**Verdict**: Option B is already partially implemented — `run-seeds.js` has `seedUsuarioRoles()`. The migration creates the table structure and optional backfill. The `run-seeds.js` handles the seed-time population. This works IF the migration's `CREATE TABLE IF NOT EXISTS` + INSERT is idempotent (it is: `ON CONFLICT DO NOTHING`).

---

## Risks for the 4 Microbiological Forms

### 1. S. aureus (SAU) — saureus_muestras + sau_etapa1-6 + saureus_muestras

| Risk | Severity | Details |
|------|----------|---------|
| `SaureusMuestra` table references `solicitud_analisis` | **HIGH** | If `solicitud_analisis` isn't in the baseline, this table's FK fails |
| `medios_cultivos` FK in sau_etapa1/3/4 | **HIGH** | Created in `20260629_medios_cultivos`, referenced in `20260630_sau_medios_cultivos_fk` — baseline must have old schema first, then migration alters it |
| `micropipetas` FK | **MEDIUM** | Must be in baseline |
| `equipos_incubacion` FK | **MEDIUM** | Must be in baseline |

### 2. Coliformes (COLI) — coli_formulario + coli_fase1-4

| Risk | Severity | Details |
|------|----------|---------|
| `medios_cultivos` FK in coli_fase2 | **HIGH** | Created in `20260629_medios_cultivos`, referenced in `20260629_coli_fase2_medios_cultivos_fk` |
| MPN statistical fields (15+ columns) | **MEDIUM** | Added in `20260629_add_mpn_statistical_fields…` — baseline must NOT have them (added by migration) |
| `coli_fase3_submuestra` composite unique constraint | **LOW** | Must be in baseline or created by migration |

### 3. Salmonella (SAL) — sal_formulario + sal_fase1-5

| Risk | Severity | Details |
|------|----------|---------|
| `banos_termicos` table | **HIGH** | Created in `20260702_sal_banos_and_medios_cultivos_fk` migration — must NOT be in baseline |
| `medios_cultivos` FK (6 new entries) | **HIGH** | Migration seeds 6 Salmonella-specific medios; baseline must NOT include these |
| `PresenciaAusencia` enum | **LOW** | Prisma enum, must be defined in baseline schema but has no DB representation (it's a CHECK/type) |

### 4. Enterobacterias (ENT) — ent_formulario + ent_etapa1-3

| Risk | Severity | Details |
|------|----------|---------|
| `lotes_reactivo` FK in ent_etapa3 | **MEDIUM** | Created by `20260624_enterobacterias_flow` migration |
| `instrumentos` FK (balanza, stomacher, cuenta_colonias) | **MEDIUM** | Multiple FKs pointing to the same `instrumentos` table |
| `ent_etapa3_resultado` per-muestra (new table) | **LOW** | Created in `20260701_ent_etapa3_resultado_per_muestra` |

### Cross-form Risk: Bridge Legacy Tables

| Risk | Severity | Details |
|------|----------|---------|
| `muestras_ali` + `tpa_reporte` + `ram_reporte` are minimal shells | **HIGH** | The Prisma schema models these with only 3-4 columns each. The legacy `Backend/` expects 8-15 columns (OBSERVACIONES_*, FIRMA_DIGITAL, etc.). If the baseline creates them as Prisma models (bare minimum), legacy queries may fail on missing columns. |
| `ALI_IMAGENES` table missing | **MEDIUM** | Not in Prisma schema at all. The legacy `Backend/` has image upload code that references this table. |
| `V_CATALOGO_UNIFICADO` view missing | **LOW** | Used by legacy `Backend/` for catalog queries. |

---

## Affected Areas (File Map)

```
AssisTec API/prisma/
├── schema.prisma                         ← Source of truth (40+ models)
├── migrations/
│   ├── [MISSING] 0_baseline/            ← NEEDS CREATION
│   ├── 20260521210000_dashboard_upgrades_roles_base/
│   ├── 20260610_saureus_phase5_calculation/
│   ├── … (13 migrations total)
│   └── migration_lock.toml               ← Must be regenerated
├── run-seeds.js                          ← Already complete (idempotent)
├── dev-test-seed.sql                     ← Test data (post-bootstrap)
└── seed.js                               ← NOT FOUND — no prisma/seed.ts

BD/init/
└── init_refined.sql                      ← Legacy reference (NOT to execute)

BD/seeds/                                 ← Legacy seed files (reference only)
BD/migrations/                            ← Legacy migrations (reference only)

Backend/                                  ← Legacy backend (deprecated)
├── models/                               ← pg direct SQL (references TPA_ETAPA*, RAM_ETAPA*)
└── README_LEGACY.md

docker-compose.yml                        ← Entrypoint: migrate deploy + seeds
AssisTec API/docker-entrypoint.sh         ← Bootstrap chain
AssisTec API/Dockerfile                   ← Build: prisma generate

Makefile                                  ← make dev-test, make dev
docs/database.md                          ← Current DB docs (outdated: mentions db push)

openspec/changes/prisma-baseline-db-sanitization/
└── exploration.md                        ← THIS FILE
```

---

## Shape of `docs/database-migrations-guide.md`

This document should serve as the **definitive reference** for any developer working with the database. Proposed structure:

```markdown
# Guía de Migraciones de Base de Datos — AssisTec

## 1. Arquitectura de la Base de Datos
- Dos capas: Prisma (activo) + Legacy (deprecated)
- Diagrama de las dos capas
- Qué gestiona cada una

## 2. Workflow de Migraciones (Día a Día)
- Editar schema.prisma → `prisma migrate dev --name descripcion`
- Nunca usar `prisma db push` en producción
- Cómo revisar el SQL generado antes de commitear

## 3. Bootstrap desde Cero
- `prisma migrate deploy` (aplica baseline + todas las migraciones)
- `node run-seeds.js` (catálogos, usuarios, datos de prueba)
- Qué esperar en un `make dev` exitoso

## 4. Baseline Migration (qué es y por qué existe)
- Cómo se creó la baseline (timestamp, timestamp)
- Qué incluye y qué NO incluye
- Cómo regenerar la baseline si el schema cambia drásticamente

## 5. Estructura de Migraciones
- Convención de nombres
- Orden cronológico
- Cómo leer una migración (UP migration en migration.sql)

## 6. Relación con el Backend Legacy
- Qué tablas son puente (bridge)
- Qué tablas legacy NO están en Prisma
- Cómo agregar una tabla legacy sin romper Prisma

## 7. Troubleshooting
- `make dev-test` falla → revisar baseline
- Migración rechazada → drift detection
- Reset completo → `docker compose down -v && make dev-test`

## 8. Reglas de Oro
- NO USAR `prisma db push`
- NO editar migraciones existentes
- NO borrar migraciones del historial
- SIEMPRE revisar el SQL generado antes de commitear
```

---

## Technical Risks Summary

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | Baseline migration MUST capture the exact current schema state, or later migrations will fail on ALTER TABLE for non-existent columns | **BLOCKER** | Generate baseline via `prisma migrate diff` from empty → current schema |
| R2 | `dashboard_upgrades_roles_base` INSERT assumes `usuarios` has data at migration time (seed race condition) | **HIGH** | Migration already uses `ON CONFLICT DO NOTHING` — seeds fill the gap. Ensure `run-seeds.js` runs before any query that reads `usuario_roles` |
| R3 | `TpaReporte`/`RamReporte` Prisma models are minimal shells (3 columns) vs legacy (10-15 columns) | **HIGH** | Baseline creates Prisma version. Legacy columns must be added as a separate migration or marked as `@@ignore` if not used by active backend |
| R4 | `MuestraAli.codigoAli` is `Int` in Prisma vs `BIGINT` in legacy | **MEDIUM** | For current ALI numbers (< 2B), safe. Long-term: change to BigInt in schema |
| R5 | Legacy-only tables (TPA_ETAPA*, RAM_ETAPA*, ALI_IMAGENES, V_CATALOGO_UNIFICADO) not in Prisma | **MEDIUM** | Must be created by a separate mechanism (legacy migration in BD/migrations/ or raw SQL in entrypoint) if the legacy backend is still active |
| R6 | `migration_lock.toml` may need regeneration after baseline insertion | **LOW** | `prisma migrate resolve` or regenerate the lock file |
| R7 | Existing DBs (with data) have the schema state from `db push` + 15 migrations already applied | **MEDIUM** | Baseline must be marked as already-applied (`prisma migrate resolve --applied baseline_name`) on existing DBs to avoid re-creating tables |

---

## Recommendation

1. **Generate a baseline migration** (timestamp `< 20260521210000`) using `prisma migrate diff` from an empty DB to the current `schema.prisma` state.
2. **Ensure the baseline migration is marked as baseline** in `migration_lock.toml`.
3. **Add raw SQL in the baseline** for legacy-only objects (`ALI_IMAGENES`, `V_CATALOGO_UNIFICADO`) if the legacy backend is still active — OR accept that `Backend/` legacy will fail on fresh instances.
4. **Document the migration workflow** in `docs/database-migrations-guide.md`.
5. **Add `prisma migrate resolve` instructions** to `Makefile` for existing DB instances.
6. **Verify the full bootstrap chain** end-to-end: `make dev-test` succeeds, all 4 formularios can persist data.

### Ready for Proposal

**Yes** — the exploration has identified all structural issues, dependencies, risks, and a clear path forward. The next phase should be `sdd-propose` to formalize the scope and approach.
