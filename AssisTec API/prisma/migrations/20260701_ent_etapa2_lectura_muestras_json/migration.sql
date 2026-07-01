-- Migration: 20260701_ent_etapa2_lectura_muestras_json
-- Purpose:
--   Persist the raw multi-sample reading grid (per-dilution colony counts
--   and A/b confirmation entries) captured in Etapa 2 (backend numbering;
--   "Etapa 3: Controles ALI + Lectura 24h" in the 6-stage UI wizard).
--   Previously this in-memory grid was discarded on save except for a
--   single derived flat dilucion/coloniasContadas summary, losing the
--   full audit trail on reload.

-- ─────────────────────────────────────────────────────────────────────────────
-- ent_etapa2: add raw reading grid column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "ent_etapa2"
    ADD COLUMN IF NOT EXISTS "lectura_muestras" JSONB;
