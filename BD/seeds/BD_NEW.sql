-- ============================================================
-- TABLAS BASE (sin dependencias)
-- ============================================================

CREATE TABLE clientes (
    id_cliente         SERIAL PRIMARY KEY,
    rut                VARCHAR(255) NOT NULL,
    nombre             VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NOT NULL,
    telefono           VARCHAR(255) NOT NULL,
    activo             VARCHAR(255) NOT NULL
);

CREATE TABLE usuarios (
    rut_usuario              VARCHAR(255) PRIMARY KEY,
    nombre_apellido_usuario   VARCHAR(255) NOT NULL,
    correo_usuario            VARCHAR(255) NOT NULL,
    contrasena_usuario        VARCHAR(255) NOT NULL,
    rol_usuario               INT NOT NULL,
    url_foto                  VARCHAR(255) NOT NULL
);

CREATE TABLE equipos_lab (
    id_equipo        SERIAL PRIMARY KEY,
    nombre_equipo    VARCHAR(100) NOT NULL,
    codigo_equipo    VARCHAR(50)
);

CREATE TABLE lugares_almacenamiento (
    id_lugar        SERIAL PRIMARY KEY,
    nombre_lugar    VARCHAR(100) NOT NULL,
    codigo_lugar    VARCHAR(20)
);

CREATE TABLE categorias_producto (
    id_categoria    BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL
);

CREATE TABLE accreditaciones_inn (
    id_acreditacion        BIGINT PRIMARY KEY,
    codigo                 VARCHAR UNIQUE NOT NULL,
    area                   VARCHAR(255) NOT NULL,
    subarea                VARCHAR(255) NOT NULL,
    fecha_vigencia_desde   DATE NOT NULL,
    fecha_vigente_hasta    DATE NOT NULL,
    url_certificado        VARCHAR(255) NOT NULL
);

CREATE TABLE formularios_analisis (
    id_formularios_analisis   BIGSERIAL PRIMARY KEY,
    codigo                    VARCHAR(255) NOT NULL,
    nombre_analisis           VARCHAR(255) NOT NULL,
    area                      VARCHAR(255) NOT NULL,
    genera_tpa_default        BOOLEAN DEFAULT FALSE NOT NULL
);

-- ============================================================
-- TABLAS CON DEPENDENCIAS DE PRIMER NIVEL
-- ============================================================

CREATE TABLE direcciones_cliente (
    id_direccion             SERIAL PRIMARY KEY,
    id_cliente               INT NOT NULL REFERENCES clientes(id_cliente),
    alias                    VARCHAR(255) NOT NULL,
    direccion                TEXT NOT NULL,
    solicitado_por_default   VARCHAR(255) NOT NULL,
    activo                   BOOLEAN NOT NULL
);

CREATE TABLE alcance_acreditacion (
    id_alcance_acreditacion   SERIAL PRIMARY KEY,
    id_acreditacion           INT NOT NULL REFERENCES accreditaciones_inn(id_acreditacion),
    id_formulario_analisis    BIGINT NOT NULL REFERENCES formularios_analisis(id_formularios_analisis),
    id_categoria_producto     BIGINT NOT NULL REFERENCES categorias_producto(id_categoria),
    norma_especifica          VARCHAR(255) NOT NULL,
    texto_alcance_original    TEXT NOT NULL,
    excepciones               VARCHAR(255) NOT NULL
);

CREATE TABLE tiempos_por_categoria (
    id_tiempo_analisis      BIGSERIAL PRIMARY KEY,
    id_categoria_producto   BIGINT NOT NULL REFERENCES categorias_producto(id_categoria),
    id_formulario_analisis  BIGINT NOT NULL REFERENCES formularios_analisis(id_formularios_analisis),
    metodologia_norma       INT NOT NULL,
    dias_negativo           INT NOT NULL,
    dias_confirmacion       INT NOT NULL
);

-- ============================================================
-- SOLICITUD DE INGRESO
-- ============================================================

CREATE TABLE solicitud_ingreso (
    id_solicitud                            BIGSERIAL PRIMARY KEY,
    anio_ingreso                            SMALLINT NOT NULL,
    numero_ali                              INT NOT NULL,
    numero_acta                             TEXT NOT NULL,
    codigo_externo                          TEXT NOT NULL,
    categoria                               BIGINT NOT NULL REFERENCES categorias_producto(id_categoria),
    id_cliente                              INT NOT NULL REFERENCES clientes(id_cliente),
    id_direccion                            INT NOT NULL REFERENCES direcciones_cliente(id_direccion),
    fecha_recepcion                         TIMESTAMP NOT NULL,
    temperatura_recepcion                   NUMERIC(5,2) NOT NULL,
    id_termometro                           INT NOT NULL REFERENCES equipos_lab(id_equipo),
    fecha_inicio_muestreo                   TIMESTAMP NOT NULL,
    fecha_termino_muestreo                  TIMESTAMP NOT NULL,
    cantidad_muestras                       SMALLINT NOT NULL,
    cant_envases                            SMALLINT NOT NULL,
    responsable_muestreo                    VARCHAR(255) NOT NULL,
    lugar_muestreo                          VARCHAR(255) NOT NULL,
    instructivo_muestreo                    VARCHAR(255) NOT NULL,
    envases_suministrados_por               VARCHAR(255) NOT NULL,
    id_lugar                                INT NOT NULL REFERENCES lugares_almacenamiento(id_lugar),
    muestra_compartida_quimica              BOOLEAN DEFAULT FALSE NOT NULL,
    observaciones_generales                 TEXT NOT NULL,
    observaciones_cliente                   TEXT NOT NULL,
    notas_del_cliente                       TEXT NOT NULL,
    estado                                  VARCHAR(255) NOT NULL,
    rut_responsable_ingreso                 VARCHAR(255) NOT NULL REFERENCES usuarios(rut_usuario),
    rut_jefa_area                           VARCHAR(255) NOT NULL REFERENCES usuarios(rut_usuario),
    rut_coordinarora_recepcion              VARCHAR(255) NOT NULL REFERENCES usuarios(rut_usuario),
    fecha_envio_validacion                  TIMESTAMP NOT NULL,
    fecha_entrega_revision_jefe_lab         TIMESTAMP NOT NULL,
    motivo_devolucion                       TEXT NOT NULL,
    fecha_hora_recepcion_coordinadora       TIMESTAMP NOT NULL,
    fecha_entrega_resultado_negativo_micro  TIMESTAMP NOT NULL,
    dias_habiles_resultado_negativo         SMALLINT NOT NULL,
    fecha_entrega_resultado_positivo_micro  TIMESTAMP NOT NULL,
    dias_habiles_resultado_positivo         SMALLINT NOT NULL,
    fecha_hora_retiro_muestras_sala         TIMESTAMP NOT NULL,
    fecha_recepcion_analista                DATE NOT NULL,
    fecha_solicitada_entrega_analista       DATE NOT NULL,
    fecha_envio_informe_positivo            DATE NOT NULL,
    fecha_envio_informe_negativo            DATE NOT NULL,
    created_at                              DATE NOT NULL,
    updated_at                              DATE NOT NULL,
    created_by                              VARCHAR(255) NOT NULL REFERENCES usuarios(rut_usuario)
);

-- ============================================================
-- SOLICITUD MUESTRA
-- ============================================================

CREATE TABLE solicitud_muestra (
    id_solicitud_muestra      BIGSERIAL PRIMARY KEY,
    id_solicitud              BIGINT NOT NULL REFERENCES solicitud_ingreso(id_solicitud)
);

-- ============================================================
-- SOLICITUD ANÁLISIS
-- ============================================================

CREATE TABLE solicitud_analisis (
    id_solicitud_analisis       BIGINT PRIMARY KEY,
    id_solicitud_muestra        BIGINT NOT NULL REFERENCES solicitud_muestra(id_solicitud_muestra),
    id_alcance_acreditacion     INT REFERENCES alcance_acreditacion(id_alcance_acreditacion),
    id_formulario_analisis      BIGINT NOT NULL REFERENCES formularios_analisis(id_formularios_analisis),
    acreditado                  BOOLEAN DEFAULT FALSE NOT NULL,
    metodologia_norma           VARCHAR(255) NOT NULL,
    dias_negativo_snapshot      INT,
    dias_confirmacion_snapshot  INT
);


-- --------------------------------------------------------
-- 2. TABLAS MAESTRAS (Catálogos)
-- --------------------------------------------------------
CREATE TABLE DILUYENTES (
    ID_DILUYENTE SERIAL PRIMARY KEY,
    NOMBRE_DILUYENTE VARCHAR(100) NOT NULL,
    MILILITROS VARCHAR(50) NOT NULL
);

CREATE TABLE EQUIPOS_INCUBACION (
    ID_INCUBACION SERIAL PRIMARY KEY,
    NOMBRE_EQUIPO VARCHAR(100) NOT NULL,
    TEMPERATURA_REF VARCHAR(50)
);

CREATE TABLE INSTRUMENTOS (
    ID_INSTRUMENTO SERIAL PRIMARY KEY,
    NOMBRE_INSTRUMENTO VARCHAR(100) NOT NULL,
    CODIGO_INSTRUMENTO VARCHAR(50)
);

CREATE TABLE MAESTRO_CHECKLIST_LIMPIEZA (
    ID_ITEM INT PRIMARY KEY,
    NOMBRE_ITEM VARCHAR(100) NOT NULL,
    DEF_SELECCIONADO INT DEFAULT 0,
    DEF_BLOQUEADO INT DEFAULT 0
);

CREATE TABLE MAESTRO_FORMAS_CALCULO (
    ID_FORMA INT PRIMARY KEY,
    NOMBRE_FORMA VARCHAR(100) NOT NULL,
    DEF_SELECCIONADO INT DEFAULT 0
);

CREATE TABLE MAESTRO_TIPOS_ANALISIS (
    ID_TIPO_ANALISIS SERIAL PRIMARY KEY,
    NOMBRE_ANALISIS VARCHAR(100) NOT NULL
);

CREATE TABLE MATERIAL_SIEMBRA (
    ID_MATERIAL_SIEMBRA SERIAL PRIMARY KEY,
    NOMBRE_MATERIAL VARCHAR(100) NOT NULL,
    DETALLE_MEDIDA VARCHAR(100)
);

CREATE TABLE MICROPIPETAS (
    ID_PIPETA SERIAL PRIMARY KEY,

    NOMBRE_PIPETA VARCHAR(100) NOT NULL,
    CODIGO_PIPETA VARCHAR(50) NOT NULL,
    CAPACIDAD VARCHAR(20)
);

-- --------------------------------------------------------
-- 3.VISTAS Y UTILIDADES
-- --------------------------------------------------------
CREATE OR REPLACE VIEW V_CATALOGO_UNIFICADO AS
SELECT ID_INSTRUMENTO AS id_origen,
    NOMBRE_INSTRUMENTO AS nombre,
    CODIGO_INSTRUMENTO AS codigo,
    'INSTRUMENTO' AS tipo_material,
    NULL::VARCHAR AS capacidad
FROM INSTRUMENTOS
UNION ALL
SELECT ID_PIPETA AS id_origen,
    NOMBRE_PIPETA || ' (' || CAPACIDAD || ')' AS nombre,
    CODIGO_PIPETA AS codigo,
    'PIPETA' AS tipo_material,
    capacidad
FROM MICROPIPETAS
ORDER BY nombre ASC;

