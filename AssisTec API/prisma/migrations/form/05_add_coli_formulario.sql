-- 05_add_coli_formulario.sql
-- FORMULARIO COLIFORMES TOTALES, FECALES Y E. COLI
-- Épica 4 / HU-04-01 a HU-04-04
-- Creado a partir de: coli_formulario_tables.sql

-- ============================================================
-- 1. CABECERA DEL FORMULARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_formulario (
    id_coli_formulario    BIGSERIAL    PRIMARY KEY,
    id_solicitud_analisis BIGINT       NOT NULL
                          REFERENCES solicitud_analisis(id_solicitud_analisis),
    fase_actual           SMALLINT     NOT NULL DEFAULT 1
                          CHECK (fase_actual IN (1, 2, 3, 35, 4)),
    estado                VARCHAR(50)  NOT NULL DEFAULT 'en_proceso',
    rut_analista          VARCHAR(255) NOT NULL
                          REFERENCES usuarios(rut_usuario),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. LISTA MAESTRA DE MUESTRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_muestra (
    id_coli_muestra       BIGSERIAL    PRIMARY KEY,
    id_coli_formulario    BIGINT       NOT NULL
                          REFERENCES coli_formulario(id_coli_formulario),
    id_solicitud_muestra  BIGINT       NOT NULL
                          REFERENCES solicitud_muestra(id_solicitud_muestra),
    numero_muestra        VARCHAR(50)  NOT NULL,
    es_duplicado          BOOLEAN      NOT NULL DEFAULT FALSE,
    peso_muestra_tipo     VARCHAR(20)  NOT NULL
                          CHECK (peso_muestra_tipo IN ('10gr/90ml', '50gr/450ml')),
    orden                 SMALLINT     NOT NULL
);

-- ============================================================
-- 3. FASE 1 — DETALLES DE ALIMENTO / INCUBACIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase1 (
    id_coli_fase1          BIGSERIAL    PRIMARY KEY,
    id_coli_formulario     BIGINT       NOT NULL UNIQUE
                           REFERENCES coli_formulario(id_coli_formulario),
    fecha_inicio_incubacion TIMESTAMP   NOT NULL,
    rut_analista_inicio     VARCHAR(255) NOT NULL
                            REFERENCES usuarios(rut_usuario),
    fecha_termino_analisis  TIMESTAMP,
    rut_analista_termino    VARCHAR(255)
                            REFERENCES usuarios(rut_usuario),
    completada              BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. FASE 2 — DETALLES DE SIEMBRA
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase2 (
    id_coli_fase2          BIGSERIAL    PRIMARY KEY,
    id_coli_formulario     BIGINT       NOT NULL UNIQUE
                           REFERENCES coli_formulario(id_coli_formulario),
    codigo_caldo_lauril    VARCHAR(100) NOT NULL,
    codigo_tween_80        VARCHAR(100),
    completada             BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4a. ESTUFAS USADAS EN FASE 2
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase2_estufa (
    id                    SERIAL       PRIMARY KEY,
    id_coli_fase2         BIGINT       NOT NULL
                          REFERENCES coli_fase2(id_coli_fase2),
    id_incubacion         INT          NOT NULL
                          REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION)
);

-- ============================================================
-- 4b. MICROPIPETAS USADAS EN FASE 2
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase2_micropipeta (
    id                    SERIAL       PRIMARY KEY,
    id_coli_fase2         BIGINT       NOT NULL
                          REFERENCES coli_fase2(id_coli_fase2),
    id_pipeta             INT          NOT NULL
                          REFERENCES MICROPIPETAS(ID_PIPETA),
    capacidad             VARCHAR(10)  NOT NULL
                          CHECK (capacidad IN ('1ml', '10ml'))
);

-- ============================================================
-- 5. FASE 3 — CONTROL DE ANÁLISIS (CABECERA DE LECTURA)
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase3 (
    id_coli_fase3          BIGSERIAL    PRIMARY KEY,
    id_coli_formulario     BIGINT       NOT NULL UNIQUE
                           REFERENCES coli_formulario(id_coli_formulario),
    fecha_lectura_24h      TIMESTAMP,
    rut_analista_24h       VARCHAR(255)
                           REFERENCES usuarios(rut_usuario),
    lectura_24h_en_tolerancia BOOLEAN,
    fecha_lectura_48h      TIMESTAMP,
    rut_analista_48h       VARCHAR(255)
                           REFERENCES usuarios(rut_usuario),
    lectura_48h_en_tolerancia BOOLEAN,
    completada             BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5a. SUBMUESTRAS POR MUESTRA — FASE 3 (NMP)
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase3_submuestra (
    id_submuestra          BIGSERIAL    PRIMARY KEY,
    id_coli_muestra        BIGINT       NOT NULL
                           REFERENCES coli_muestra(id_coli_muestra),
    tipo_lectura           VARCHAR(5)   NOT NULL
                           CHECK (tipo_lectura IN ('24h', '48h')),
    dilucion               VARCHAR(10)  NOT NULL
                           CHECK (dilucion IN ('1ml', '0.1ml', '0.01ml')),
    numero_tubo            SMALLINT     NOT NULL
                           CHECK (numero_tubo IN (1, 2, 3)),
    presencia              BOOLEAN,
    UNIQUE (id_coli_muestra, tipo_lectura, dilucion, numero_tubo)
);

-- ============================================================
-- 6. FASE 3.5 — CONTROLES DE CALIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase35_controles (
    id_coli_fase35         BIGSERIAL    PRIMARY KEY,
    id_coli_formulario     BIGINT       NOT NULL UNIQUE
                           REFERENCES coli_formulario(id_coli_formulario),
    ctrl_tot_k_aerogenes   BOOLEAN,
    ctrl_tot_s_aureus      BOOLEAN,
    blanco_totales         VARCHAR(100),
    ctrl_fec_e_coli        BOOLEAN,
    ctrl_fec_k_aerogenes   BOOLEAN,
    blanco_fecales         VARCHAR(100),
    ctrl_eco_e_coli        BOOLEAN,
    ctrl_eco_k_aerogenes   BOOLEAN,
    blanco_ecoli           VARCHAR(100),
    completada             BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. FASE 4 — DATOS FINALES Y RESULTADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS coli_fase4_resultado (
    id_coli_fase4_resultado BIGSERIAL   PRIMARY KEY,
    id_coli_muestra        BIGINT       NOT NULL UNIQUE
                           REFERENCES coli_muestra(id_coli_muestra),
    coliformes_totales     NUMERIC(15, 4),
    coliformes_fecales     NUMERIC(15, 4),
    e_coli                 NUMERIC(15, 4),
    incongruencia_detectada BOOLEAN     NOT NULL DEFAULT FALSE,
    observacion_incongruencia TEXT
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coli_formulario_solicitud
    ON coli_formulario(id_solicitud_analisis);

CREATE INDEX IF NOT EXISTS idx_coli_muestra_formulario
    ON coli_muestra(id_coli_formulario);

CREATE INDEX IF NOT EXISTS idx_coli_submuestra_muestra
    ON coli_fase3_submuestra(id_coli_muestra);

CREATE INDEX IF NOT EXISTS idx_coli_submuestra_lectura
    ON coli_fase3_submuestra(id_coli_muestra, tipo_lectura);

CREATE INDEX IF NOT EXISTS idx_coli_resultado_muestra
    ON coli_fase4_resultado(id_coli_muestra);
