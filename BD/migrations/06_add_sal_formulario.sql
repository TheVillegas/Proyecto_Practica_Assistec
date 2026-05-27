-- 06_add_sal_formulario.sql
-- FORMULARIO SALMONELLA spp.
-- Épica 4.1–4.4 / HU-04-01-01 a HU-04-04-01
-- Creado a partir de: sal_formulario_tables.sql

-- ============================================================
-- 1. CABECERA DEL FORMULARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_formulario (
    id_sal_formulario     BIGSERIAL    PRIMARY KEY,
    id_solicitud_analisis BIGINT       NOT NULL
                          REFERENCES solicitud_analisis(id_solicitud_analisis),
    fase_actual           SMALLINT     NOT NULL DEFAULT 1
                          CHECK (fase_actual IN (1,21,22,23,31,32,33,41,42,5)),
    estado                VARCHAR(50)  NOT NULL DEFAULT 'en_proceso',
    rut_analista          VARCHAR(255) NOT NULL
                          REFERENCES usuarios(rut_usuario),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. LISTA MAESTRA DE MUESTRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_muestra (
    id_sal_muestra        BIGSERIAL    PRIMARY KEY,
    id_sal_formulario     BIGINT       NOT NULL
                          REFERENCES sal_formulario(id_sal_formulario),
    id_solicitud_muestra  BIGINT       NOT NULL
                          REFERENCES solicitud_muestra(id_solicitud_muestra),
    numero_muestra        VARCHAR(50)  NOT NULL,
    es_duplicado          BOOLEAN      NOT NULL DEFAULT FALSE,
    orden                 SMALLINT     NOT NULL
);

-- ============================================================
-- 3. FASE 1 — CONFIGURACIÓN INICIAL DE LA MUESTRA
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase1 (
    id_sal_fase1              BIGSERIAL    PRIMARY KEY,
    id_sal_formulario         BIGINT       NOT NULL UNIQUE
                              REFERENCES sal_formulario(id_sal_formulario),
    fecha_hora_inicio_incubacion TIMESTAMP NOT NULL,
    tipo_matriz               VARCHAR(20)  NOT NULL
                              CHECK (tipo_matriz IN ('general', 'polvo', 'chocolate')),
    peso_muestra              VARCHAR(20)  NOT NULL
                              CHECK (peso_muestra IN ('25gr/225ml', '50gr/450ml')),
    caldo_homogeneizacion     VARCHAR(30)  NOT NULL
                              CHECK (caldo_homogeneizacion IN ('caldo_apt', 'leche_descremada')),
    caldo_asignado_auto       BOOLEAN      NOT NULL DEFAULT FALSE,
    hora_inicio_hidratacion   TIME,
    hora_termino_hidratacion  TIME,
    hidratacion_valida        BOOLEAN,
    completada                BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at                TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. FASE 2A — DATOS DE TIEMPO Y TRAZABILIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase2a (
    id_sal_fase2a              BIGSERIAL    PRIMARY KEY,
    id_sal_formulario          BIGINT       NOT NULL UNIQUE
                               REFERENCES sal_formulario(id_sal_formulario),
    fecha_siembra              DATE         NOT NULL,
    hora_inicio_homo           TIME         NOT NULL,
    hora_termino_homo          TIME         NOT NULL,
    hora_ingreso_estufa        TIME         NOT NULL,
    minutos_homo_a_estufa      NUMERIC(5,2),
    alerta_tiempo_25min        BOOLEAN      NOT NULL DEFAULT FALSE,
    rut_analista_responsable   VARCHAR(255) NOT NULL
                               REFERENCES usuarios(rut_usuario),
    fecha_termino_analisis     DATE,
    completada                 BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at                 TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. FASE 2B — INSUMOS UTILIZADOS EN SIEMBRA
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase2b (
    id_sal_fase2b          BIGSERIAL    PRIMARY KEY,
    id_sal_formulario      BIGINT       NOT NULL UNIQUE
                           REFERENCES sal_formulario(id_sal_formulario),
    codigo_caldo_apt_leche VARCHAR(100) NOT NULL,
    id_estufa              INT          NOT NULL
                           REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    completada             BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5a. TWEEN 80 / PIPETAS — FASE 2B
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase2b_tween_pipeta (
    id                    SERIAL       PRIMARY KEY,
    id_sal_fase2b         BIGINT       NOT NULL
                          REFERENCES sal_fase2b(id_sal_fase2b),
    id_material           INT          NOT NULL
                          REFERENCES MATERIAL_SIEMBRA(ID_MATERIAL_SIEMBRA)
);

-- ============================================================
-- 5b. MICROPIPETAS — FASE 2B
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase2b_micropipeta (
    id                    SERIAL       PRIMARY KEY,
    id_sal_fase2b         BIGINT       NOT NULL
                          REFERENCES sal_fase2b(id_sal_fase2b),
    id_pipeta             INT          NOT NULL
                          REFERENCES MICROPIPETAS(ID_PIPETA)
);

-- ============================================================
-- 6. FASE 2C — CONTROLES DE CALIDAD (SIEMBRA)
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase2c (
    id_sal_fase2c               BIGSERIAL    PRIMARY KEY,
    id_sal_formulario           BIGINT       NOT NULL UNIQUE
                                REFERENCES sal_formulario(id_sal_formulario),
    descripcion_ctrl_analisis   VARCHAR(255),
    resultado_ctrl_analisis     BOOLEAN,
    ctrl_positivo_blanco_ali    VARCHAR(255),
    resultado_ctrl_positivo     BOOLEAN,
    ctrl_siembra_ali            VARCHAR(255),
    resultado_ctrl_siembra      BOOLEAN,
    completada                  BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. FASE 3A — DATOS DE TIEMPO DE TRASPASO
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase3a (
    id_sal_fase3a                  BIGSERIAL    PRIMARY KEY,
    id_sal_formulario              BIGINT       NOT NULL UNIQUE
                                   REFERENCES sal_formulario(id_sal_formulario),
    fecha_traspaso                 DATE         NOT NULL,
    hora_lectura_caldo_apt         TIME         NOT NULL,
    rut_analista_caldo_apt         VARCHAR(255) NOT NULL
                                   REFERENCES usuarios(rut_usuario),
    hora_lectura_caldos_finales    TIME,
    rut_analista_caldos_finales    VARCHAR(255)
                                   REFERENCES usuarios(rut_usuario),
    completada                     BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at                     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. FASE 3B — INSUMOS DE TRASPASO
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase3b (
    id_sal_fase3b          BIGSERIAL    PRIMARY KEY,
    id_sal_formulario      BIGINT       NOT NULL UNIQUE
                           REFERENCES sal_formulario(id_sal_formulario),
    id_estufa_selenito     INT          NOT NULL
                           REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    completada             BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8a. PIPETAS / PUNTAS — FASE 3B
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase3b_pipeta (
    id                    SERIAL       PRIMARY KEY,
    id_sal_fase3b         BIGINT       NOT NULL
                          REFERENCES sal_fase3b(id_sal_fase3b),
    id_material           INT          NOT NULL
                          REFERENCES MATERIAL_SIEMBRA(ID_MATERIAL_SIEMBRA),
    tipo_material         VARCHAR(30)  NOT NULL
                          CHECK (tipo_material IN ('puntas_1ml', 'pipeta_desechable'))
);

-- ============================================================
-- 8b. MICROPIPETAS — FASE 3B
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase3b_micropipeta (
    id                    SERIAL       PRIMARY KEY,
    id_sal_fase3b         BIGINT       NOT NULL
                          REFERENCES sal_fase3b(id_sal_fase3b),
    id_pipeta             INT          NOT NULL
                          REFERENCES MICROPIPETAS(ID_PIPETA)
);

-- ============================================================
-- 9. FASE 3C — TABLA DE MUESTRAS (RESULTADOS EN CALDOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase3c_lectura (
    id_sal_fase3c_lectura      BIGSERIAL    PRIMARY KEY,
    id_sal_muestra             BIGINT       NOT NULL
                               REFERENCES sal_muestra(id_sal_muestra),
    resultado_caldo_apt        BOOLEAN,
    resultado_selenito         BOOLEAN,
    resultado_rappaport        BOOLEAN,
    ctrl_positivo_s_enteritidis BOOLEAN,
    ctrl_negativo_k_pneumoniae BOOLEAN,
    ctrl_blanco                BOOLEAN
);

-- ============================================================
-- 10. FASE 4A — DATOS DE TIEMPO Y AGARES
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase4a (
    id_sal_fase4a              BIGSERIAL    PRIMARY KEY,
    id_sal_formulario          BIGINT       NOT NULL UNIQUE
                               REFERENCES sal_formulario(id_sal_formulario),
    fecha_hora_traspaso_agares TIMESTAMP    NOT NULL,
    rut_analista_traspaso      VARCHAR(255) NOT NULL
                               REFERENCES usuarios(rut_usuario),
    codigo_agar_xld            VARCHAR(100) NOT NULL,
    codigo_agar_ss             VARCHAR(100) NOT NULL,
    id_estufa_agares           INT          NOT NULL
                               REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    fecha_hora_lectura_24h     TIMESTAMP,
    rut_analista_lectura_24h   VARCHAR(255)
                               REFERENCES usuarios(rut_usuario),
    fecha_hora_lectura_48h     TIMESTAMP,
    rut_analista_lectura_48h   VARCHAR(255)
                               REFERENCES usuarios(rut_usuario),
    completada                 BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at                 TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. FASE 4B — RESULTADOS EN AGAR POR MUESTRA
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase4b_lectura (
    id_sal_fase4b_lectura       BIGSERIAL    PRIMARY KEY,
    id_sal_muestra              BIGINT       NOT NULL
                                REFERENCES sal_muestra(id_sal_muestra),
    id_sal_fase4a               BIGINT       NOT NULL
                                REFERENCES sal_fase4a(id_sal_fase4a),
    res_xld_24h_selenito        VARCHAR(10)
                                CHECK (res_xld_24h_selenito IN ('tipico','atipico','negativo')),
    res_ss_24h_selenito         VARCHAR(10)
                                CHECK (res_ss_24h_selenito IN ('tipico','atipico','negativo')),
    res_xld_48h_selenito        VARCHAR(10)
                                CHECK (res_xld_48h_selenito IN ('tipico','atipico','negativo')),
    res_ss_48h_selenito         VARCHAR(10)
                                CHECK (res_ss_48h_selenito IN ('tipico','atipico','negativo')),
    res_xld_24h_rappaport       VARCHAR(10)
                                CHECK (res_xld_24h_rappaport IN ('tipico','atipico','negativo')),
    res_ss_24h_rappaport        VARCHAR(10)
                                CHECK (res_ss_24h_rappaport IN ('tipico','atipico','negativo')),
    res_xld_48h_rappaport       VARCHAR(10)
                                CHECK (res_xld_48h_rappaport IN ('tipico','atipico','negativo')),
    res_ss_48h_rappaport        VARCHAR(10)
                                CHECK (res_ss_48h_rappaport IN ('tipico','atipico','negativo')),
    ctrl_positivo_s_enteritidis VARCHAR(10)
                                CHECK (ctrl_positivo_s_enteritidis IN ('tipico','atipico','negativo')),
    ctrl_negativo_k_pneumoniae  VARCHAR(10)
                                CHECK (ctrl_negativo_k_pneumoniae IN ('tipico','atipico','negativo')),
    ctrl_blanco                 VARCHAR(10)
                                CHECK (ctrl_blanco IN ('tipico','atipico','negativo'))
);

-- ============================================================
-- 12. FASE 5 — RESULTADO FINAL (PRESENCIA / AUSENCIA)
-- ============================================================
CREATE TABLE IF NOT EXISTS sal_fase5_resultado (
    id_sal_fase5_resultado BIGSERIAL    PRIMARY KEY,
    id_sal_muestra         BIGINT       NOT NULL UNIQUE
                           REFERENCES sal_muestra(id_sal_muestra),
    resultado_final        VARCHAR(10)  NOT NULL
                           CHECK (resultado_final IN ('Presencia', 'Ausencia'))
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sal_formulario_solicitud
    ON sal_formulario(id_solicitud_analisis);

CREATE INDEX IF NOT EXISTS idx_sal_muestra_formulario
    ON sal_muestra(id_sal_formulario);

CREATE INDEX IF NOT EXISTS idx_sal_fase3c_muestra
    ON sal_fase3c_lectura(id_sal_muestra);

CREATE INDEX IF NOT EXISTS idx_sal_fase4b_muestra
    ON sal_fase4b_lectura(id_sal_muestra);

CREATE INDEX IF NOT EXISTS idx_sal_fase5_muestra
    ON sal_fase5_resultado(id_sal_muestra);
