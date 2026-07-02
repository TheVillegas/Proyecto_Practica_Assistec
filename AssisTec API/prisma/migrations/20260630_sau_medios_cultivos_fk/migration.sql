-- Migration: Replace free-text medio de cultivo fields in sau_etapa1, sau_etapa3, sau_etapa4
-- with FK references to medios_cultivos table.

-- 1. Seed new medios_cultivos entries for S. Aureus
INSERT INTO "medios_cultivos" ("nombre", "temperatura_uso", "norma_relacionada") VALUES
  ('Agar Baird Parker', 35.0, 'NCh 2671'),
  ('Caldo BHI',         35.0, 'NCh 2671'),
  ('Bacident coagulasa', NULL, 'NCh 2671'),
  ('Agua esteril',       NULL, 'NCh 2671')
ON CONFLICT ("nombre") DO NOTHING;

-- ============================================================
-- sau_etapa1: codigo_agar_baird_parker -> id_medio_agar_baird_parker
-- ============================================================

-- 2a. Add FK column (nullable initially)
ALTER TABLE "sau_etapa1"
  ADD COLUMN IF NOT EXISTS "id_medio_agar_baird_parker" INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo");

-- 2b. Backfill all existing rows to the seeded Agar Baird Parker entry
UPDATE "sau_etapa1"
SET "id_medio_agar_baird_parker" = (
  SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Agar Baird Parker'
);

-- 2c. Make NOT NULL now that all rows are seeded
ALTER TABLE "sau_etapa1"
  ALTER COLUMN "id_medio_agar_baird_parker" SET NOT NULL;

-- 2d. Drop old text column
ALTER TABLE "sau_etapa1"
  DROP COLUMN IF EXISTS "codigo_agar_baird_parker";

-- ============================================================
-- sau_etapa3: codigo_caldo_bhi -> id_medio_caldo_bhi (nullable)
-- ============================================================

-- 3a. Add FK column (nullable)
ALTER TABLE "sau_etapa3"
  ADD COLUMN IF NOT EXISTS "id_medio_caldo_bhi" INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo");

-- 3b. Backfill rows that had a caldo BHI code
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sau_etapa3' AND column_name = 'codigo_caldo_bhi'
    ) THEN
        UPDATE "sau_etapa3"
        SET "id_medio_caldo_bhi" = (
          SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Caldo BHI'
        )
        WHERE "codigo_caldo_bhi" IS NOT NULL AND "codigo_caldo_bhi" != '';
    END IF;
END $$;

-- 3c. Drop old text column
ALTER TABLE "sau_etapa3"
  DROP COLUMN IF EXISTS "codigo_caldo_bhi";

-- ============================================================
-- sau_etapa4: codigo_bacident_agua -> id_medio_bacident + id_medio_agua_esteril
-- ============================================================

-- 4a. Add two FK columns (both nullable — coagulasa reagents are optional)
ALTER TABLE "sau_etapa4"
  ADD COLUMN IF NOT EXISTS "id_medio_bacident"     INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo"),
  ADD COLUMN IF NOT EXISTS "id_medio_agua_esteril" INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo");

-- 4b. Backfill rows that had a bacident/agua code
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sau_etapa4' AND column_name = 'codigo_bacident_agua'
    ) THEN
        UPDATE "sau_etapa4"
        SET
          "id_medio_bacident"     = (SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Bacident coagulasa'),
          "id_medio_agua_esteril" = (SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Agua esteril')
        WHERE "codigo_bacident_agua" IS NOT NULL AND "codigo_bacident_agua" != '';
    END IF;
END $$;

-- 4c. Drop old combined text column
ALTER TABLE "sau_etapa4"
  DROP COLUMN IF EXISTS "codigo_bacident_agua";
