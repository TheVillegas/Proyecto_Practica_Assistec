-- 04_add_sau_formulario.sql
-- FORMULARIO S. AUREUS (Staphylococcus aureus)
-- Épica 6 / HU-06-01 a HU-06-06
-- Creado a partir de: sau_formulario_tables.sql

-- ============================================================
-- 1. CABECERA DEL FORMULARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_formulario (
    id_sau_formulario     BIGSERIAL    PRIMARY KEY,
    id_solicitud_analisis BIGINT       NOT NULL
                          REFERENCES solicitud_analisis(id_solicitud_analisis),
    etapa_actual          SMALLINT     NOT NULL DEFAULT 1
                          CHECK (etapa_actual BETWEEN 1 AND 6),
    estado                VARCHAR(50)  NOT NULL DEFAULT 'en_proceso',
    rut_analista          VARCHAR(255) NOT NULL
                          REFERENCES usuarios(rut_usuario),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. LISTA MAESTRA DE MUESTRAS DEL FORMULARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_muestra (
    id_sau_muestra        BIGSERIAL    PRIMARY KEY,
    id_sau_formulario     BIGINT       NOT NULL
                          REFERENCES sau_formulario(id_sau_formulario),
    id_solicitud_muestra  BIGINT       NOT NULL
                          REFERENCES solicitud_muestra(id_solicitud_muestra),
    numero_muestra        VARCHAR(50)  NOT NULL,
    es_duplicado          BOOLEAN      NOT NULL DEFAULT FALSE,
    orden                 SMALLINT     NOT NULL
);

-- ============================================================
-- 3. ETAPA 1 — SIEMBRA E INCUBACIÓN INICIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa1 (
    id_sau_etapa1            BIGSERIAL    PRIMARY KEY,
    id_sau_formulario        BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_formulario(id_sau_formulario),
    fecha_inicio_incubacion  TIMESTAMP    NOT NULL,
    rut_analista_inicio      VARCHAR(255) NOT NULL
                             REFERENCES usuarios(rut_usuario),
    fecha_termino_analisis   TIMESTAMP,
    rut_analista_termino     VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    tiempo_homo_siembra_min  NUMERIC(5,2),
    tiempo_homo_valido       BOOLEAN,
    codigo_agar_baird_parker VARCHAR(100) NOT NULL,
    peso_muestra_tipo        VARCHAR(20)  NOT NULL
                             CHECK (peso_muestra_tipo IN ('10gr/90ml','50gr/450ml')),
    id_estufa                INT          NOT NULL
                             REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    duplicado_ali_ref        VARCHAR(100),
    ctrl_duplicado_cumple    BOOLEAN,
    ctrl_positivo_blanco_ali VARCHAR(255),
    ctrl_positivo_cumple     BOOLEAN,
    ctrl_siembra_ali         VARCHAR(255),
    ctrl_siembra_cumple      BOOLEAN,
    completada               BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3a. MICROPIPETAS USADAS EN ETAPA 1
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa1_micropipeta (
    id                    SERIAL       PRIMARY KEY,
    id_sau_etapa1         BIGINT       NOT NULL
                          REFERENCES sau_etapa1(id_sau_etapa1),
    id_pipeta             INT          NOT NULL
                          REFERENCES MICROPIPETAS(ID_PIPETA),
    capacidad             VARCHAR(10)  NOT NULL
                          CHECK (capacidad IN ('1ml','10ml'))
);

-- ============================================================
-- 3b. LECTURAS POR MUESTRA — ETAPA 1
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa1_lectura (
    id_sau_etapa1_lectura BIGSERIAL    PRIMARY KEY,
    id_sau_muestra        BIGINT       NOT NULL
                          REFERENCES sau_muestra(id_sau_muestra),
    conteo_24h_placa1     NUMERIC(10,2),
    conteo_24h_placa2     NUMERIC(10,2),
    conteo_48h_placa1     NUMERIC(10,2),
    conteo_48h_placa2     NUMERIC(10,2)
);

-- ============================================================
-- 4. ETAPA 2 — RECUENTO Y CONTROLES DE RUTINA
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa2 (
    id_sau_etapa2            BIGSERIAL    PRIMARY KEY,
    id_sau_formulario        BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_formulario(id_sau_formulario),
    ctrl_siembra_s_aureus_ufc NUMERIC(10,2),
    ctrl_positivo_s_aureus   VARCHAR(50),
    ctrl_negativo_s_epider_ufc NUMERIC(10,2),
    blanco_ufc               NUMERIC(10,2),
    sd                       VARCHAR(100),
    fecha_lectura_24h        TIMESTAMP,
    rut_analista_24h         VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    fecha_lectura_48h        TIMESTAMP,
    rut_analista_48h         VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    completada               BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. ETAPA 3 — CONFIRMACIÓN / TRASPASO
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa3 (
    id_sau_etapa3            BIGSERIAL    PRIMARY KEY,
    id_sau_formulario        BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_formulario(id_sau_formulario),
    fecha_hora_traspaso      TIMESTAMP    NOT NULL,
    rut_analista_traspaso    VARCHAR(255) NOT NULL
                             REFERENCES usuarios(rut_usuario),
    duracion_traspaso_lectura INTERVAL,
    codigo_caldo_bhi         VARCHAR(100),
    id_estufa                INT          NOT NULL
                             REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    ctrl_positivo_s_aureus   VARCHAR(50),
    ctrl_negativo_s_epider   VARCHAR(50),
    blanco                   VARCHAR(50),
    fecha_hora_lectura       TIMESTAMP,
    rut_analista_lectura     VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    observaciones            TEXT,
    completada               BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5a. LECTURAS POR MUESTRA — ETAPA 3
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa3_lectura (
    id_sau_etapa3_lectura BIGSERIAL    PRIMARY KEY,
    id_sau_muestra        BIGINT       NOT NULL
                          REFERENCES sau_muestra(id_sau_muestra),
    id_sau_etapa3         BIGINT       NOT NULL
                          REFERENCES sau_etapa3(id_sau_etapa3),
    colonias_placa1       NUMERIC(10,2),
    colonias_placa2       NUMERIC(10,2)
);

-- ============================================================
-- 6. ETAPA 4 — PRUEBA DE COAGULASA
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa4 (
    id_sau_etapa4            BIGSERIAL    PRIMARY KEY,
    id_sau_formulario        BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_formulario(id_sau_formulario),
    fecha_hora_prueba        TIMESTAMP    NOT NULL,
    rut_analista_prueba      VARCHAR(255) NOT NULL
                             REFERENCES usuarios(rut_usuario),
    codigo_tubos_esteriles   VARCHAR(100),
    codigo_puntas_1ml        VARCHAR(100),
    codigo_bacident_agua     VARCHAR(100),
    id_micropipeta           INT
                             REFERENCES MICROPIPETAS(ID_PIPETA),
    id_estufa                INT          NOT NULL
                             REFERENCES EQUIPOS_INCUBACION(ID_INCUBACION),
    fecha_lectura_4_6h       TIMESTAMP,
    rut_analista_4_6h        VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    resultado_coagulasa_4_6h VARCHAR(100),
    ctrl_positivo_4_6h       VARCHAR(50),
    ctrl_negativo_4_6h       VARCHAR(50),
    blanco_4_6h              VARCHAR(50),
    fecha_lectura_24h        TIMESTAMP,
    rut_analista_24h         VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    resultado_coagulasa_24h  VARCHAR(100),
    ctrl_positivo_24h        VARCHAR(50),
    ctrl_negativo_24h        VARCHAR(50),
    blanco_24h               VARCHAR(50),
    completada               BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6a. LECTURAS POR MUESTRA — ETAPA 4
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa4_lectura (
    id_sau_etapa4_lectura BIGSERIAL    PRIMARY KEY,
    id_sau_muestra        BIGINT       NOT NULL
                          REFERENCES sau_muestra(id_sau_muestra),
    id_sau_etapa4         BIGINT       NOT NULL
                          REFERENCES sau_etapa4(id_sau_etapa4),
    tipo_lectura          VARCHAR(5)   NOT NULL
                          CHECK (tipo_lectura IN ('4_6h','24h')),
    colonias_placa1       NUMERIC(10,2),
    colonias_placa2       NUMERIC(10,2)
);

-- ============================================================
-- 7. ETAPA 5 — RESULTADOS CALCULADOS (UFC/g)
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa5_resultado (
    id_sau_etapa5_resultado  BIGSERIAL    PRIMARY KEY,
    id_sau_muestra           BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_muestra(id_sau_muestra),
    n_s_aureus               NUMERIC(15,4),
    ufc_por_g                NUMERIC(15,4),
    incongruencia_detectada  BOOLEAN      NOT NULL DEFAULT FALSE,
    observacion_incongruencia TEXT
);

-- ============================================================
-- 8. ETAPA 6 — CONFIRMACIÓN Y CIERRE NORMATIVO
-- ============================================================
CREATE TABLE IF NOT EXISTS sau_etapa6_cierre (
    id_sau_etapa6            BIGSERIAL    PRIMARY KEY,
    id_sau_formulario        BIGINT       NOT NULL UNIQUE
                             REFERENCES sau_formulario(id_sau_formulario),
    desfavorable             BOOLEAN,
    tabla_pagina_referencia  VARCHAR(255),
    limite_normativo         VARCHAR(100),
    ctrl_calidad_etapa1_ok   BOOLEAN,
    fecha_hora_entrega       TIMESTAMP,
    rut_coordinador_cierre   VARCHAR(255)
                             REFERENCES usuarios(rut_usuario),
    cerrado                  BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sau_formulario_solicitud
    ON sau_formulario(id_solicitud_analisis);

CREATE INDEX IF NOT EXISTS idx_sau_muestra_formulario
    ON sau_muestra(id_sau_formulario);

CREATE INDEX IF NOT EXISTS idx_sau_e1_lectura_muestra
    ON sau_etapa1_lectura(id_sau_muestra);

CREATE INDEX IF NOT EXISTS idx_sau_e3_lectura_muestra
    ON sau_etapa3_lectura(id_sau_muestra);

CREATE INDEX IF NOT EXISTS idx_sau_e4_lectura_muestra
    ON sau_etapa4_lectura(id_sau_muestra, tipo_lectura);

CREATE INDEX IF NOT EXISTS idx_sau_resultado_muestra
    ON sau_etapa5_resultado(id_sau_muestra);
