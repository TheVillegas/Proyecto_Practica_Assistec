-- Migration: Add homogeneizado/siembra timing + sample-count fields to coli_fase2,
-- and split coli_fase35_controles into separate 24h/48h control blocks.

-- ============================================================
-- coli_fase2: homogeneizado/siembra timing + sample counts
-- ============================================================

ALTER TABLE "coli_fase2"
  ADD COLUMN "fecha_homog" TIMESTAMP,
  ADD COLUMN "rut_analista_homog" VARCHAR(255) REFERENCES "usuarios"("rut_usuario"),
  ADD COLUMN "fecha_siembra" TIMESTAMP,
  ADD COLUMN "rut_analista_siembra" VARCHAR(255) REFERENCES "usuarios"("rut_usuario"),
  ADD COLUMN "n_muestra_10g_90ml" INTEGER,
  ADD COLUMN "n_muestra_50g_450ml" INTEGER;

-- ============================================================
-- coli_fase35_controles: split each control into 24h/48h variants
-- ============================================================

ALTER TABLE "coli_fase35_controles"
  ADD COLUMN "ctrl_tot_k_aerogenes_24h" BOOLEAN,
  ADD COLUMN "ctrl_tot_k_aerogenes_48h" BOOLEAN,
  ADD COLUMN "ctrl_tot_s_aureus_24h" BOOLEAN,
  ADD COLUMN "ctrl_tot_s_aureus_48h" BOOLEAN,
  ADD COLUMN "blanco_totales_24h" VARCHAR(100),
  ADD COLUMN "blanco_totales_48h" VARCHAR(100),
  ADD COLUMN "ctrl_fec_e_coli_24h" BOOLEAN,
  ADD COLUMN "ctrl_fec_e_coli_48h" BOOLEAN,
  ADD COLUMN "ctrl_fec_k_aerogenes_24h" BOOLEAN,
  ADD COLUMN "ctrl_fec_k_aerogenes_48h" BOOLEAN,
  ADD COLUMN "blanco_fecales_24h" VARCHAR(100),
  ADD COLUMN "blanco_fecales_48h" VARCHAR(100),
  ADD COLUMN "ctrl_eco_e_coli_24h" BOOLEAN,
  ADD COLUMN "ctrl_eco_e_coli_48h" BOOLEAN,
  ADD COLUMN "ctrl_eco_k_aerogenes_24h" BOOLEAN,
  ADD COLUMN "ctrl_eco_k_aerogenes_48h" BOOLEAN,
  ADD COLUMN "blanco_ecoli_24h" VARCHAR(100),
  ADD COLUMN "blanco_ecoli_48h" VARCHAR(100);

-- Backfill 24h variants from the previous single-block columns before dropping them.
UPDATE "coli_fase35_controles" SET
  "ctrl_tot_k_aerogenes_24h" = "ctrl_tot_k_aerogenes",
  "ctrl_tot_s_aureus_24h"    = "ctrl_tot_s_aureus",
  "blanco_totales_24h"       = "blanco_totales",
  "ctrl_fec_e_coli_24h"      = "ctrl_fec_e_coli",
  "ctrl_fec_k_aerogenes_24h" = "ctrl_fec_k_aerogenes",
  "blanco_fecales_24h"       = "blanco_fecales",
  "ctrl_eco_e_coli_24h"      = "ctrl_eco_e_coli",
  "ctrl_eco_k_aerogenes_24h" = "ctrl_eco_k_aerogenes",
  "blanco_ecoli_24h"         = "blanco_ecoli";

ALTER TABLE "coli_fase35_controles"
  DROP COLUMN "ctrl_tot_k_aerogenes",
  DROP COLUMN "ctrl_tot_s_aureus",
  DROP COLUMN "blanco_totales",
  DROP COLUMN "ctrl_fec_e_coli",
  DROP COLUMN "ctrl_fec_k_aerogenes",
  DROP COLUMN "blanco_fecales",
  DROP COLUMN "ctrl_eco_e_coli",
  DROP COLUMN "ctrl_eco_k_aerogenes",
  DROP COLUMN "blanco_ecoli";
