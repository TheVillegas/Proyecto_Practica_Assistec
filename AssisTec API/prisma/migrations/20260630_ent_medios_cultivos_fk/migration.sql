-- Migration: 20260630_ent_medios_cultivos_fk
-- Purpose:
--   1. Migrate ent_etapa1.id_lote_agar_vrbg_sembrado -> id_medio_agar_vrbg (medios_cultivos FK)
--   2. Add ent_etapa1.id_medio_tween_80 (nullable FK to medios_cultivos)
--   3. Fix missing ent_etapa2.ufc_por_g column (in schema.prisma but absent from prior migration)
--   4. Make all Traspaso/Confirmacion fields in ent_etapa3 nullable (UI section eliminated)
--   5. Add Manual de Inocuidad columns to ent_etapa3

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Seed Agar VRBG in medios_cultivos
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "medios_cultivos" ("nombre", "temperatura_uso", "norma_relacionada")
VALUES ('Agar VRBG', 35.0, 'NCh 2676') ON CONFLICT ("nombre") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ent_etapa1: Migrate VRBG FK from lotes_reactivo to medios_cultivos
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa1"
    ADD COLUMN IF NOT EXISTS "id_medio_agar_vrbg" INTEGER
    REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "ent_etapa1"
    SET "id_medio_agar_vrbg" = (
        SELECT "id_medio_cultivo" FROM "medios_cultivos" WHERE "nombre" = 'Agar VRBG'
    );

ALTER TABLE "ent_etapa1" ALTER COLUMN "id_medio_agar_vrbg" SET NOT NULL;

ALTER TABLE "ent_etapa1" DROP CONSTRAINT IF EXISTS "ent_etapa1_id_lote_agar_vrbg_sembrado_fkey";
ALTER TABLE "ent_etapa1" DROP COLUMN IF EXISTS "id_lote_agar_vrbg_sembrado";

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ent_etapa1: Add Tween 80 FK (nullable — new field never existed before)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa1"
    ADD COLUMN IF NOT EXISTS "id_medio_tween_80" INTEGER
    REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ent_etapa2: Fix missing ufc_por_g column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa2" ADD COLUMN IF NOT EXISTS "ufc_por_g" DECIMAL(15,4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5a. ent_etapa3: Make Traspaso / Confirmacion fields nullable
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa3"
    ALTER COLUMN "fecha_traspaso"          DROP NOT NULL,
    ALTER COLUMN "hora_traspaso"           DROP NOT NULL,
    ALTER COLUMN "rut_analista_traspaso"   DROP NOT NULL,
    ALTER COLUMN "id_agar_nutritivo"       DROP NOT NULL,
    ALTER COLUMN "id_estufa_conf"          DROP NOT NULL,
    ALTER COLUMN "fecha_lect_conf"         DROP NOT NULL,
    ALTER COLUMN "hora_lect_conf"          DROP NOT NULL,
    ALTER COLUMN "rut_analista_lect_conf"  DROP NOT NULL,
    ALTER COLUMN "fecha_oxidasa"           DROP NOT NULL,
    ALTER COLUMN "hora_oxidasa"            DROP NOT NULL,
    ALTER COLUMN "rut_analista_oxidasa"    DROP NOT NULL,
    ALTER COLUMN "reactivo_oxidasa"        DROP NOT NULL,
    ALTER COLUMN "desaireado_agar_glucosa" DROP NOT NULL,
    ALTER COLUMN "agar_glucosa"            DROP NOT NULL,
    ALTER COLUMN "control_pos_ecoli"       DROP NOT NULL,
    ALTER COLUMN "control_neg_paer"        DROP NOT NULL,
    ALTER COLUMN "blanco"                  DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5b. ent_etapa3: Add Manual de Inocuidad columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa3"
    ADD COLUMN IF NOT EXISTS "desfavorable"       BOOLEAN,
    ADD COLUMN IF NOT EXISTS "tabla_pagina"        VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "limite"              VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "fecha_hora_entrega"  TIMESTAMP;
