-- Ajuste para snapshots historicos de analisis en Solicitud de Ingreso.
ALTER TABLE solicitud_analisis
  ALTER COLUMN id_alcance_acreditacion DROP NOT NULL;

ALTER TABLE solicitud_analisis
  ADD COLUMN IF NOT EXISTS dias_negativo_snapshot INT,
  ADD COLUMN IF NOT EXISTS dias_confirmacion_snapshot INT;
