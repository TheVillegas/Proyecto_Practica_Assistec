-- Migration: 20260702_sal_banos_and_medios_cultivos_fk
-- Purpose:
--   1. Create banos_termicos table (new master, separate from equipos_incubacion — see plan decision)
--   2. Seed 6 new medios_cultivos entries used by Salmonella (Caldo APT, Leche descremada,
--      Selenito, Rappaport, Agar XLD, Agar SS)
--   3. sal_fase1: caldo_homogeneizacion (free text) -> id_medio_caldo_homogeneizacion (FK);
--      caldo_asignado_auto changes semantics from free text to a medios_cultivos id
--   4. sal_fase2b: codigo_caldo_apt_leche (free text) -> id_medio_caldo (FK); add volumen_caldo
--      and id_bano (nullable, new capacity)
--   5. sal_fase3b: id_estufa_selenito becomes nullable; add id_bano_selenito, id_estufa_rappaport,
--      id_bano_rappaport (all nullable — new capacity for the previously-missing Rappaport equipo)
--   6. sal_fase4a: codigo_agar_xld/codigo_agar_ss (free text) -> id_medio_agar_xld/id_medio_agar_ss
--      (FK); add id_bano_agares (nullable, new capacity)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create banos_termicos + seed
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "banos_termicos" (
    "id_bano"         SERIAL PRIMARY KEY,
    "nombre_equipo"   VARCHAR(100) NOT NULL UNIQUE,
    "temperatura_ref" VARCHAR(50)
);

INSERT INTO "banos_termicos" ("nombre_equipo", "temperatura_ref") VALUES
    ('Baño 30-M', '41 a 42.5°C'),
    ('96-M',      '41 a 42.5°C')
ON CONFLICT ("nombre_equipo") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Seed new medios_cultivos entries for Salmonella
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "medios_cultivos" ("nombre", "temperatura_uso", "norma_relacionada") VALUES
    ('Caldo APT',         35.5, 'NCh 2675Of2002'),
    ('Leche descremada',  35.5, 'NCh 2675Of2002'),
    ('Selenito',          41.5, 'NCh 2675Of2002'),
    ('Rappaport',         35.0, 'NCh 2675Of2002'),
    ('Agar XLD',          35.0, 'NCh 2675Of2002'),
    ('Agar SS',           35.0, 'NCh 2675Of2002')
ON CONFLICT ("nombre") DO NOTHING;

-- ============================================================
-- sal_fase1: caldo_homogeneizacion -> id_medio_caldo_homogeneizacion
-- ============================================================

-- 3a. Add FK column (nullable initially)
ALTER TABLE "sal_fase1"
    ADD COLUMN IF NOT EXISTS "id_medio_caldo_homogeneizacion" INTEGER
    REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3b. Backfill: 'Leche descremada' when the free-text value mentions leche, else 'Caldo APT'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sal_fase1' AND column_name = 'caldo_homogeneizacion'
    ) THEN
        UPDATE "sal_fase1"
        SET "id_medio_caldo_homogeneizacion" = (
            SELECT "id_medio_cultivo" FROM "medios_cultivos"
            WHERE "nombre" = CASE
                WHEN "sal_fase1"."caldo_homogeneizacion" ILIKE '%leche%' THEN 'Leche descremada'
                ELSE 'Caldo APT'
            END
        )
        WHERE "caldo_homogeneizacion" IS NOT NULL;
    END IF;
END $$;

-- 3c. Make NOT NULL now that all rows are backfilled (column was required before this migration)
ALTER TABLE "sal_fase1"
    ALTER COLUMN "id_medio_caldo_homogeneizacion" SET NOT NULL;

-- 3d. Drop old text column
ALTER TABLE "sal_fase1"
    DROP COLUMN IF EXISTS "caldo_homogeneizacion";

-- 3e. caldo_asignado_auto changes semantics: free text -> medios_cultivos id.
--     Reset existing values to NULL; it is recomputed on next save.
ALTER TABLE "sal_fase1"
    ALTER COLUMN "caldo_asignado_auto" TYPE INTEGER USING NULL;

-- ============================================================
-- sal_fase2b: codigo_caldo_apt_leche -> id_medio_caldo + volumen_caldo + id_bano
-- ============================================================

-- 4a. Add FK column (nullable initially)
ALTER TABLE "sal_fase2b"
    ADD COLUMN IF NOT EXISTS "id_medio_caldo" INTEGER
    REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4b. Backfill using the same leche/APT heuristic
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sal_fase2b' AND column_name = 'codigo_caldo_apt_leche'
    ) THEN
        UPDATE "sal_fase2b"
        SET "id_medio_caldo" = (
            SELECT "id_medio_cultivo" FROM "medios_cultivos"
            WHERE "nombre" = CASE
                WHEN "sal_fase2b"."codigo_caldo_apt_leche" ILIKE '%leche%' THEN 'Leche descremada'
                ELSE 'Caldo APT'
            END
        )
        WHERE "codigo_caldo_apt_leche" IS NOT NULL;
    END IF;
END $$;

-- 4c. Make NOT NULL now that all rows are backfilled (column was required before this migration)
ALTER TABLE "sal_fase2b"
    ALTER COLUMN "id_medio_caldo" SET NOT NULL;

-- 4d. Drop old text column
ALTER TABLE "sal_fase2b"
    DROP COLUMN IF EXISTS "codigo_caldo_apt_leche";

-- 4e. New optional fields: volumen_caldo (225/450ml qualifier, not previously captured) and id_bano
ALTER TABLE "sal_fase2b"
    ADD COLUMN IF NOT EXISTS "volumen_caldo" VARCHAR(20),
    ADD COLUMN IF NOT EXISTS "id_bano" INTEGER REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- sal_fase3b: id_estufa_selenito becomes optional; add Rappaport equipo + baños
-- ============================================================

-- 5a. id_estufa_selenito: Selenito can now use a Baño instead of an Estufa.
--     Also re-point the FK's ON DELETE action from RESTRICT (leftover from when
--     this column was required) to SET NULL, matching the new optional semantics
--     and the sibling equipo/baño columns below.
ALTER TABLE "sal_fase3b"
    ALTER COLUMN "id_estufa_selenito" DROP NOT NULL;

ALTER TABLE "sal_fase3b"
    DROP CONSTRAINT IF EXISTS "sal_fase3b_id_estufa_selenito_fkey";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sal_fase3b_id_estufa_selenito_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sal_fase3b' AND column_name = 'id_estufa_selenito'
    ) THEN
        ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_estufa_selenito_fkey" FOREIGN KEY ("id_estufa_selenito") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE SET NULL   ON UPDATE CASCADE;
    END IF;
END $$;

-- 5b. New optional equipo columns (no backfill — new capacity)
ALTER TABLE "sal_fase3b"
    ADD COLUMN IF NOT EXISTS "id_bano_selenito"    INTEGER REFERENCES "banos_termicos"("id_bano")           ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS "id_estufa_rappaport" INTEGER REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS "id_bano_rappaport"   INTEGER REFERENCES "banos_termicos"("id_bano")           ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- sal_fase4a: codigo_agar_xld/codigo_agar_ss -> id_medio_agar_xld/id_medio_agar_ss + id_bano_agares
-- ============================================================

-- 6a. Add FK columns (nullable initially)
ALTER TABLE "sal_fase4a"
    ADD COLUMN IF NOT EXISTS "id_medio_agar_xld" INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS "id_medio_agar_ss"  INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6b. Backfill unconditionally: every historical row used the two fixed agars XLD/SS
UPDATE "sal_fase4a"
SET
    "id_medio_agar_xld" = (SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Agar XLD'),
    "id_medio_agar_ss"  = (SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Agar SS');

-- 6c. Make NOT NULL now that all rows are backfilled (columns were required before this migration)
ALTER TABLE "sal_fase4a"
    ALTER COLUMN "id_medio_agar_xld" SET NOT NULL,
    ALTER COLUMN "id_medio_agar_ss"  SET NOT NULL;

-- 6d. Drop old text columns
ALTER TABLE "sal_fase4a"
    DROP COLUMN IF EXISTS "codigo_agar_xld",
    DROP COLUMN IF EXISTS "codigo_agar_ss";

-- 6e. New optional field: id_bano_agares (no backfill — new capacity)
ALTER TABLE "sal_fase4a"
    ADD COLUMN IF NOT EXISTS "id_bano_agares" INTEGER REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;
