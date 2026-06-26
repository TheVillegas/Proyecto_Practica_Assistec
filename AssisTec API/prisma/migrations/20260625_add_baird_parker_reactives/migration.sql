-- Drop old constraint and add new one with baird parker
ALTER TABLE "lotes_reactivo" DROP CONSTRAINT IF EXISTS "lotes_reactivo_tipo_check";
ALTER TABLE "lotes_reactivo" ADD CONSTRAINT "lotes_reactivo_tipo_check" CHECK ("tipo" IN ('agar_vrbg', 'tween_80', 'agar_baird_parker'));

-- Insert default seed lot for Baird Parker agar
INSERT INTO "lotes_reactivo" ("tipo", "codigo_lote", "fecha_vencimiento", "activo")
VALUES ('agar_baird_parker', 'BP-LOTE-001', '2026-12-31', true)
ON CONFLICT ("codigo_lote") DO NOTHING;
