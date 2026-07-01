-- Migration: 20260630_sal_manual_inocuidad
-- Purpose:
--   Add Manual de Inocuidad columns to sal_fase2c, matching the fields
--   already present in ent_etapa3 (see 20260630_ent_medios_cultivos_fk)
--   and required by the real SALMONELLA.xlsx lab worksheet.

-- ─────────────────────────────────────────────────────────────────────────────
-- sal_fase2c: Add Manual de Inocuidad columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "sal_fase2c"
    ADD COLUMN IF NOT EXISTS "desfavorable"       BOOLEAN,
    ADD COLUMN IF NOT EXISTS "tabla_pagina"        VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "limite"              VARCHAR(200),
    ADD COLUMN IF NOT EXISTS "fecha_hora_entrega"  TIMESTAMP;
