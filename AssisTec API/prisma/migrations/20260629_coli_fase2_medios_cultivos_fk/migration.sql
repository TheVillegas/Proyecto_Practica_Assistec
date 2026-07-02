-- Migration: Replace free-text caldo_lauril/tween_80 fields in coli_fase2
-- with FK references to medios_cultivos table.

-- 1. Add new FK columns (nullable initially to allow migration without data loss)
ALTER TABLE "coli_fase2"
  ADD COLUMN IF NOT EXISTS "id_medio_caldo_lauril" INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo"),
  ADD COLUMN IF NOT EXISTS "id_medio_tween_80"     INTEGER REFERENCES "medios_cultivos"("id_medio_cultivo");

-- 2. Seed FK values from existing text codes where possible
--    (maps known text values to the seeded medios_cultivos rows)
UPDATE "coli_fase2" f2
SET "id_medio_caldo_lauril" = mc."id_medio_cultivo"
FROM "medios_cultivos" mc
WHERE mc."nombre" = 'Caldo Lauril simple';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coli_fase2' AND column_name = 'codigo_tween_80'
    ) THEN
        UPDATE "coli_fase2" f2
        SET "id_medio_tween_80" = mc."id_medio_cultivo"
        FROM "medios_cultivos" mc
        WHERE mc."nombre" = 'Tween 80'
          AND f2."codigo_tween_80" IS NOT NULL AND f2."codigo_tween_80" != '';
    END IF;
END $$;

-- 3. Make id_medio_caldo_lauril NOT NULL now that existing rows are seeded
ALTER TABLE "coli_fase2"
  ALTER COLUMN "id_medio_caldo_lauril" SET NOT NULL;

-- 4. Drop the old text columns
ALTER TABLE "coli_fase2"
  DROP COLUMN IF EXISTS "codigo_caldo_lauril",
  DROP COLUMN IF EXISTS "codigo_tween_80";
