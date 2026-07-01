-- Migration: 20260701_ent_etapa3_resultado_per_muestra
-- Purpose:
--   Move the final NCh2676 result fields off ent_etapa3 (one row per
--   formulario) into a new per-muestra table, mirroring
--   coli_fase4_resultado, so each sample (M1, Duplicado, M2, etc.) can
--   have its own saved result instead of one collapsed value.

-- ─────────────────────────────────────────────────────────────────────────────
-- ent_etapa3: drop columns that move to ent_etapa3_resultado
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa3"
    DROP COLUMN IF EXISTS "muestra_b",
    DROP COLUMN IF EXISTS "muestra_a",
    DROP COLUMN IF EXISTS "d",
    DROP COLUMN IF EXISTS "n1",
    DROP COLUMN IF EXISTS "n2",
    DROP COLUMN IF EXISTS "m",
    DROP COLUMN IF EXISTS "suma_a";

-- ─────────────────────────────────────────────────────────────────────────────
-- ent_etapa3_resultado: one row per ent_muestra
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ent_etapa3_resultado" (
    "id_ent_etapa3_resultado"   BIGSERIAL PRIMARY KEY,
    "id_ent_muestra"            BIGINT NOT NULL UNIQUE REFERENCES "ent_muestra"("id_ent_muestra"),
    "muestra_b"                 DECIMAL(15, 4),
    "muestra_a"                 DECIMAL(15, 4),
    "d"                         DECIMAL(15, 4),
    "n1"                        INTEGER,
    "n2"                        INTEGER,
    "m"                         DECIMAL(15, 4),
    "suma_a"                    DECIMAL(15, 4),
    "n_enterobacterias"         DECIMAL(15, 4),
    "ufc_por_g"                 DECIMAL(15, 4),
    "operador"                  VARCHAR(5),
    "es_estimado"               BOOLEAN,
    "es_sd"                     BOOLEAN,
    "caso_aplicado"             VARCHAR(50),
    "incongruencia_detectada"   BOOLEAN,
    "observacion_incongruencia" VARCHAR(255),
    "updated_at"                TIMESTAMP NOT NULL
);
