-- ============================================================
-- Enterobacterias Flow — DDL + seed data
-- ============================================================

-- CreateTable: lotes_reactivo (maestra)
CREATE TABLE "lotes_reactivo" (
    "id_lote_reactivo" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "codigo_lote" VARCHAR(50) NOT NULL,
    "fecha_vencimiento" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_reactivo_pkey" PRIMARY KEY ("id_lote_reactivo"),
    CONSTRAINT "lotes_reactivo_tipo_check" CHECK ("tipo" IN ('agar_vrbg', 'tween_80')),
    CONSTRAINT "lotes_reactivo_codigo_lote_key" UNIQUE ("codigo_lote")
);

-- CreateIndex
CREATE INDEX "idx_lotes_reactivo_tipo" ON "lotes_reactivo"("tipo") WHERE "activo" = true;

-- CreateTable: ent_formulario
CREATE TABLE "ent_formulario" (
    "id_ent_formulario" BIGSERIAL NOT NULL,
    "id_solicitud_analisis" BIGINT NOT NULL,
    "etapa_actual" SMALLINT NOT NULL DEFAULT 1,
    "subetapa_actual" SMALLINT NOT NULL DEFAULT 1,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'en_proceso',
    "rut_analista" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_formulario_pkey" PRIMARY KEY ("id_ent_formulario"),
    CONSTRAINT "ent_formulario_etapa_actual_check" CHECK ("etapa_actual" BETWEEN 1 AND 3),
    CONSTRAINT "ent_formulario_subetapa_actual_check" CHECK ("subetapa_actual" BETWEEN 1 AND 8)
);

-- CreateIndex
CREATE INDEX "idx_ent_formulario_solicitud" ON "ent_formulario"("id_solicitud_analisis");

-- AddForeignKey
ALTER TABLE "ent_formulario" ADD CONSTRAINT "ent_formulario_id_solicitud_analisis_fkey" FOREIGN KEY ("id_solicitud_analisis") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_formulario" ADD CONSTRAINT "ent_formulario_rut_analista_fkey" FOREIGN KEY ("rut_analista") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: ent_muestra
CREATE TABLE "ent_muestra" (
    "id_ent_muestra" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "id_solicitud_muestra" BIGINT NOT NULL,
    "numero_muestra" VARCHAR(50) NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "peso_muestra_tipo" VARCHAR(20),
    "orden" SMALLINT NOT NULL,

    CONSTRAINT "ent_muestra_pkey" PRIMARY KEY ("id_ent_muestra")
);

-- CreateIndex
CREATE INDEX "idx_ent_muestra_formulario" ON "ent_muestra"("id_ent_formulario");

-- AddForeignKey
ALTER TABLE "ent_muestra" ADD CONSTRAINT "ent_muestra_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ent_muestra" ADD CONSTRAINT "ent_muestra_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ent_etapa1 (Preparacion — 4 sub-etapas aplanadas)
CREATE TABLE "ent_etapa1" (
    "id_ent_etapa1" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "codigo_ali" VARCHAR(100) NOT NULL,
    "n_acta" VARCHAR(100) NOT NULL,
    "tipo_muestra" VARCHAR(20) NOT NULL,
    "n_muestra_10g_90ml" INTEGER,
    "n_muestra_50g_450ml" INTEGER,
    "id_balanza" INTEGER,
    "fecha_inicio" DATE NOT NULL,
    "hora_inicio" VARCHAR(10) NOT NULL,
    "rut_analista_inicio" VARCHAR(255) NOT NULL,
    "fecha_homog" DATE NOT NULL,
    "hora_homog" VARCHAR(10) NOT NULL,
    "rut_analista_homog" VARCHAR(255) NOT NULL,
    "id_stomacher" INTEGER,
    "tiempo_homogenizacion" SMALLINT,
    "id_lote_agar_vrbg_sembrado" BIGINT NOT NULL,
    "id_estufa_sembrado" INTEGER NOT NULL,
    "placas_sembrado" SMALLINT NOT NULL,
    "id_micropipeta" INTEGER NOT NULL,
    "fecha_sembrado" DATE NOT NULL,
    "hora_sembrado" VARCHAR(10) NOT NULL,
    "rut_analista_sembrado" VARCHAR(255) NOT NULL,
    "id_estufa_incub" INTEGER NOT NULL,
    "fecha_inicio_incubacion" TIMESTAMP(6) NOT NULL,
    "fecha_fin_incubacion" TIMESTAMP(6) NOT NULL,
    "rut_analista_incub" VARCHAR(255) NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_etapa1_pkey" PRIMARY KEY ("id_ent_etapa1"),
    CONSTRAINT "ent_etapa1_id_ent_formulario_key" UNIQUE ("id_ent_formulario"),
    CONSTRAINT "ent_etapa1_tipo_muestra_check" CHECK ("tipo_muestra" IN ('Mixta', 'Homogénea')),
    CONSTRAINT "ent_etapa1_n_muestra_10g_check" CHECK ("n_muestra_10g_90ml" IS NULL OR "n_muestra_10g_90ml" >= 0),
    CONSTRAINT "ent_etapa1_n_muestra_50g_check" CHECK ("n_muestra_50g_450ml" IS NULL OR "n_muestra_50g_450ml" >= 0),
    CONSTRAINT "ent_etapa1_tiempo_homogenizacion_check" CHECK ("tiempo_homogenizacion" IS NULL OR "tiempo_homogenizacion" > 0),
    CONSTRAINT "ent_etapa1_placas_sembrado_check" CHECK ("placas_sembrado" > 0)
);

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_balanza_fkey" FOREIGN KEY ("id_balanza") REFERENCES "instrumentos"("id_instrumento") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_inicio_fkey" FOREIGN KEY ("rut_analista_inicio") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_homog_fkey" FOREIGN KEY ("rut_analista_homog") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_stomacher_fkey" FOREIGN KEY ("id_stomacher") REFERENCES "instrumentos"("id_instrumento") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_lote_agar_vrbg_sembrado_fkey" FOREIGN KEY ("id_lote_agar_vrbg_sembrado") REFERENCES "lotes_reactivo"("id_lote_reactivo") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_estufa_sembrado_fkey" FOREIGN KEY ("id_estufa_sembrado") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_micropipeta_fkey" FOREIGN KEY ("id_micropipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_estufa_incub_fkey" FOREIGN KEY ("id_estufa_incub") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_sembrado_fkey" FOREIGN KEY ("rut_analista_sembrado") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_incub_fkey" FOREIGN KEY ("rut_analista_incub") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ent_etapa2 (Analisis — Lectura 24h)
CREATE TABLE "ent_etapa2" (
    "id_ent_etapa2" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "fecha_lectura_24h" TIMESTAMP(6) NOT NULL,
    "hora_lectura_24h" VARCHAR(10) NOT NULL,
    "rut_analista_lectura" VARCHAR(255) NOT NULL,
    "id_equipo_cuenta_colonias" INTEGER NOT NULL,
    "n_muestra_lectura" INTEGER NOT NULL,
    "dilucion" DECIMAL(10,2) NOT NULL,
    "colonias_contadas" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_etapa2_pkey" PRIMARY KEY ("id_ent_etapa2"),
    CONSTRAINT "ent_etapa2_id_ent_formulario_key" UNIQUE ("id_ent_formulario"),
    CONSTRAINT "ent_etapa2_n_muestra_lectura_check" CHECK ("n_muestra_lectura" >= 0),
    CONSTRAINT "ent_etapa2_dilucion_check" CHECK ("dilucion" > 0),
    CONSTRAINT "ent_etapa2_colonias_contadas_check" CHECK ("colonias_contadas" >= 0)
);

-- AddForeignKey
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_id_equipo_cuenta_colonias_fkey" FOREIGN KEY ("id_equipo_cuenta_colonias") REFERENCES "instrumentos"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_rut_analista_lectura_fkey" FOREIGN KEY ("rut_analista_lectura") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ent_etapa3 (Confirmacion — 3 sub-etapas aplanadas)
CREATE TABLE "ent_etapa3" (
    "id_ent_etapa3" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "fecha_traspaso" DATE NOT NULL,
    "hora_traspaso" VARCHAR(10) NOT NULL,
    "rut_analista_traspaso" VARCHAR(255) NOT NULL,
    "id_agar_nutritivo" BIGINT NOT NULL,
    "id_estufa_conf" INTEGER NOT NULL,
    "fecha_lect_conf" DATE NOT NULL,
    "hora_lect_conf" VARCHAR(10) NOT NULL,
    "rut_analista_lect_conf" VARCHAR(255) NOT NULL,
    "fecha_oxidasa" DATE NOT NULL,
    "hora_oxidasa" VARCHAR(10) NOT NULL,
    "rut_analista_oxidasa" VARCHAR(255) NOT NULL,
    "reactivo_oxidasa" VARCHAR(20) NOT NULL,
    "desaireado_agar_glucosa" VARCHAR(100) NOT NULL,
    "agar_glucosa" VARCHAR(100) NOT NULL,
    "control_pos_ecoli" VARCHAR(20) NOT NULL,
    "control_neg_paer" VARCHAR(20) NOT NULL,
    "blanco" VARCHAR(20) NOT NULL,
    "muestra_b" DECIMAL(15,4),
    "muestra_a" DECIMAL(15,4),
    "d" DECIMAL(15,4),
    "n1" INTEGER,
    "n2" INTEGER,
    "m" DECIMAL(15,4),
    "suma_a" DECIMAL(15,4),
    "observaciones" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_etapa3_pkey" PRIMARY KEY ("id_ent_etapa3"),
    CONSTRAINT "ent_etapa3_id_ent_formulario_key" UNIQUE ("id_ent_formulario"),
    CONSTRAINT "ent_etapa3_reactivo_oxidasa_check" CHECK ("reactivo_oxidasa" ~ '^R69-\d{2}-(0[12])$')
);

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_agar_nutritivo_fkey" FOREIGN KEY ("id_agar_nutritivo") REFERENCES "lotes_reactivo"("id_lote_reactivo") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_estufa_conf_fkey" FOREIGN KEY ("id_estufa_conf") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_traspaso_fkey" FOREIGN KEY ("rut_analista_traspaso") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_lect_conf_fkey" FOREIGN KEY ("rut_analista_lect_conf") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_oxidasa_fkey" FOREIGN KEY ("rut_analista_oxidasa") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed data: lotes reactivo
INSERT INTO "lotes_reactivo" ("tipo", "codigo_lote", "fecha_vencimiento", "activo") VALUES
    ('agar_vrbg', 'VRBG-2025-A', '2026-12-31', true),
    ('agar_vrbg', 'VRBG-2025-B', '2027-06-30', true),
    ('tween_80', 'TW80-2025-01', '2026-08-31', true),
    ('tween_80', 'TW80-2025-02', '2027-02-28', true);
