-- CreateTable
CREATE TABLE "saureus_muestras" (
    "id" TEXT NOT NULL,
    "solicitud_analisis_id" BIGINT NOT NULL,
    "numero_muestra" INTEGER NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "ali_referencia" INTEGER,
    "dil_1" DECIMAL(5,2),
    "c1" INTEGER,
    "c2" INTEGER,
    "dil_2" DECIMAL(5,2),
    "c3" INTEGER,
    "c4" INTEGER,
    "colonias_posibles_1" INTEGER,
    "colonias_posibles_2" INTEGER,
    "col_confirmar_1" INTEGER,
    "col_confirmar_2" INTEGER,
    "confirmadas_4h_1" INTEGER,
    "confirmadas_4h_2" INTEGER,
    "fecha_lectura_4h" TIMESTAMP(6),
    "hora_lectura_4h" VARCHAR(50),
    "analista_lectura_4h" VARCHAR(255),
    "confirmadas_24h_1" INTEGER,
    "confirmadas_24h_2" INTEGER,
    "fecha_lectura_24h" TIMESTAMP(6),
    "hora_lectura_24h" VARCHAR(50),
    "analista_lectura_24h" VARCHAR(255),
    "resultado_ufc" DECIMAL(10,2),
    "resultado_texto" VARCHAR(100),
    "operador" VARCHAR(5) DEFAULT '=',
    "es_sd" BOOLEAN NOT NULL DEFAULT false,
    "a_placa_a" INTEGER,
    "a_placa_b" INTEGER,
    "suma_a" INTEGER,
    "coagulasa_usada" VARCHAR(50),
    "proporcion_a" DECIMAL(5,4),
    "proporcion_b" DECIMAL(5,4),
    "regla_80_a" BOOLEAN,
    "regla_80_b" BOOLEAN,
    "suma_colonias" INTEGER,
    "n1" INTEGER,
    "n2" INTEGER,
    "factor_dilucion" DECIMAL(10,4),
    "caso_aplicado" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "saureus_muestras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saureus_muestras_solicitud_analisis_id_idx" ON "saureus_muestras"("solicitud_analisis_id");

-- AddForeignKey
ALTER TABLE "saureus_muestras" ADD CONSTRAINT "saureus_muestras_solicitud_analisis_id_fkey" FOREIGN KEY ("solicitud_analisis_id") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;
