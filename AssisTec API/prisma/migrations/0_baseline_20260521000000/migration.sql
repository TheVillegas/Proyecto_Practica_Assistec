-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PresenciaAusencia" AS ENUM ('Presencia', 'Ausencia');

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "rut" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(255) NOT NULL,
    "activo" VARCHAR(255) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "rut_usuario" VARCHAR(255) NOT NULL,
    "nombre_apellido_usuario" VARCHAR(255) NOT NULL,
    "correo_usuario" VARCHAR(255) NOT NULL,
    "contrasena_usuario" VARCHAR(255) NOT NULL,
    "rol_usuario" INTEGER NOT NULL,
    "url_foto" VARCHAR(255) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("rut_usuario")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "rut_usuario" VARCHAR(255) NOT NULL,
    "rol" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("rut_usuario","rol")
);

-- CreateTable
CREATE TABLE "equipos_lab" (
    "id_equipo" SERIAL NOT NULL,
    "nombre_equipo" VARCHAR(100) NOT NULL,
    "codigo_equipo" VARCHAR(50),

    CONSTRAINT "equipos_lab_pkey" PRIMARY KEY ("id_equipo")
);

-- CreateTable
CREATE TABLE "lugares_almacenamiento" (
    "id_lugar" SERIAL NOT NULL,
    "nombre_lugar" VARCHAR(100) NOT NULL,
    "codigo_lugar" VARCHAR(20),

    CONSTRAINT "lugares_almacenamiento_pkey" PRIMARY KEY ("id_lugar")
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id_categoria" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "categorias_producto_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "subcategorias_producto" (
    "id_subcategoria" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "id_categoria" BIGINT NOT NULL,
    "activo" VARCHAR(1) DEFAULT 'S',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "subcategorias_producto_pkey" PRIMARY KEY ("id_subcategoria")
);

-- CreateTable
CREATE TABLE "accreditaciones_inn" (
    "id_acreditacion" BIGINT NOT NULL,
    "codigo" VARCHAR NOT NULL,
    "area" VARCHAR(255) NOT NULL,
    "subarea" VARCHAR(255) NOT NULL,
    "fecha_vigencia_desde" DATE NOT NULL,
    "fecha_vigente_hasta" DATE NOT NULL,
    "url_certificado" VARCHAR(255) NOT NULL,

    CONSTRAINT "accreditaciones_inn_pkey" PRIMARY KEY ("id_acreditacion")
);

-- CreateTable
CREATE TABLE "formularios_analisis" (
    "id_formularios_analisis" BIGSERIAL NOT NULL,
    "codigo" VARCHAR(255) NOT NULL,
    "nombre_analisis" VARCHAR(255) NOT NULL,
    "area" VARCHAR(255) NOT NULL,
    "genera_tpa_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "formularios_analisis_pkey" PRIMARY KEY ("id_formularios_analisis")
);

-- CreateTable
CREATE TABLE "direcciones_cliente" (
    "id_direccion" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "direccion" TEXT NOT NULL,
    "solicitado_por_default" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "direcciones_cliente_pkey" PRIMARY KEY ("id_direccion")
);

-- CreateTable
CREATE TABLE "alcance_acreditacion" (
    "id_alcance_acreditacion" SERIAL NOT NULL,
    "id_acreditacion" BIGINT NOT NULL,
    "id_formulario_analisis" BIGINT NOT NULL,
    "id_categoria_producto" BIGINT NOT NULL,
    "norma_especifica" VARCHAR(255) NOT NULL,
    "texto_alcance_original" TEXT NOT NULL,
    "excepciones" VARCHAR(255) NOT NULL,

    CONSTRAINT "alcance_acreditacion_pkey" PRIMARY KEY ("id_alcance_acreditacion")
);

-- CreateTable
CREATE TABLE "tiempos_por_categoria" (
    "id_tiempo_analisis" BIGSERIAL NOT NULL,
    "id_categoria_producto" BIGINT NOT NULL,
    "id_formulario_analisis" BIGINT NOT NULL,
    "metodologia_norma" INTEGER NOT NULL,
    "dias_negativo" INTEGER NOT NULL,
    "dias_confirmacion" INTEGER NOT NULL,

    CONSTRAINT "tiempos_por_categoria_pkey" PRIMARY KEY ("id_tiempo_analisis")
);

-- CreateTable
CREATE TABLE "solicitud_ingreso" (
    "id_solicitud" BIGSERIAL NOT NULL,
    "anio_ingreso" SMALLINT NOT NULL,
    "numero_ali" INTEGER NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "codigo_externo" TEXT NOT NULL DEFAULT '',
    "codigo_equipo_manual" VARCHAR(50),
    "categoria" BIGINT NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_direccion" INTEGER NOT NULL,
    "fecha_recepcion" TIMESTAMP NOT NULL,
    "temperatura_recepcion" DECIMAL(5,2) NOT NULL,
    "id_termometro" INTEGER NOT NULL,
    "fecha_inicio_muestreo" TIMESTAMP NOT NULL,
    "fecha_termino_muestreo" TIMESTAMP NOT NULL,
    "cantidad_muestras" SMALLINT NOT NULL,
    "cant_envases" SMALLINT NOT NULL,
    "responsable_muestreo" VARCHAR(255) NOT NULL,
    "lugar_muestreo" VARCHAR(255) NOT NULL,
    "instructivo_muestreo" VARCHAR(255) NOT NULL,
    "envases_suministrados_por" VARCHAR(255) NOT NULL,
    "id_lugar" INTEGER NOT NULL,
    "muestra_compartida_quimica" BOOLEAN NOT NULL DEFAULT false,
    "observaciones_generales" TEXT NOT NULL,
    "observaciones_cliente" TEXT NOT NULL,
    "notas_del_cliente" TEXT NOT NULL,
    "estado" VARCHAR(255) NOT NULL,
    "rut_responsable_ingreso" VARCHAR(255) NOT NULL,
    "rut_jefa_area" VARCHAR(255) NOT NULL,
    "rut_coordinarora_recepcion" VARCHAR(255) NOT NULL,
    "fecha_envio_validacion" TIMESTAMP NOT NULL,
    "fecha_entrega_revision_jefe_lab" TIMESTAMP NOT NULL,
    "motivo_devolucion" TEXT NOT NULL,
    "fecha_hora_recepcion_coordinadora" TIMESTAMP NOT NULL,
    "fecha_entrega_resultado_negativo_micro" TIMESTAMP NOT NULL,
    "dias_habiles_resultado_negativo" SMALLINT NOT NULL,
    "fecha_entrega_resultado_positivo_micro" TIMESTAMP NOT NULL,
    "dias_habiles_resultado_positivo" SMALLINT NOT NULL,
    "fecha_hora_retiro_muestras_sala" TIMESTAMP NOT NULL,
    "fecha_recepcion_analista" DATE NOT NULL,
    "fecha_solicitada_entrega_analista" DATE NOT NULL,
    "fecha_envio_informe_positivo" DATE NOT NULL,
    "fecha_envio_informe_negativo" DATE NOT NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL,
    "created_by" VARCHAR(255) NOT NULL,

    CONSTRAINT "solicitud_ingreso_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "solicitud_muestra" (
    "id_solicitud_muestra" BIGSERIAL NOT NULL,
    "id_solicitud" BIGINT NOT NULL,

    CONSTRAINT "solicitud_muestra_pkey" PRIMARY KEY ("id_solicitud_muestra")
);

-- CreateTable
CREATE TABLE "solicitud_analisis" (
    "id_solicitud_analisis" BIGINT NOT NULL,
    "id_solicitud_muestra" BIGINT NOT NULL,
    "id_alcance_acreditacion" INTEGER,
    "id_formulario_analisis" BIGINT NOT NULL,
    "acreditado" BOOLEAN NOT NULL DEFAULT false,
    "metodologia_norma" VARCHAR(255) NOT NULL,
    "dias_negativo_snapshot" INTEGER,
    "dias_confirmacion_snapshot" INTEGER,

    CONSTRAINT "solicitud_analisis_pkey" PRIMARY KEY ("id_solicitud_analisis")
);

-- CreateTable
CREATE TABLE "diluyentes" (
    "id_diluyente" SERIAL NOT NULL,
    "nombre_diluyente" VARCHAR(100) NOT NULL,
    "mililitros" VARCHAR(50) NOT NULL,

    CONSTRAINT "diluyentes_pkey" PRIMARY KEY ("id_diluyente")
);

-- CreateTable
CREATE TABLE "equipos_incubacion" (
    "id_incubacion" SERIAL NOT NULL,
    "nombre_equipo" VARCHAR(100) NOT NULL,
    "temperatura_ref" VARCHAR(50),

    CONSTRAINT "equipos_incubacion_pkey" PRIMARY KEY ("id_incubacion")
);

-- CreateTable
CREATE TABLE "banos_termicos" (
    "id_bano" SERIAL NOT NULL,
    "nombre_equipo" VARCHAR(100) NOT NULL,
    "temperatura_ref" VARCHAR(50),

    CONSTRAINT "banos_termicos_pkey" PRIMARY KEY ("id_bano")
);

-- CreateTable
CREATE TABLE "instrumentos" (
    "id_instrumento" SERIAL NOT NULL,
    "nombre_instrumento" VARCHAR(100) NOT NULL,
    "codigo_instrumento" VARCHAR(50),

    CONSTRAINT "instrumentos_pkey" PRIMARY KEY ("id_instrumento")
);

-- CreateTable
CREATE TABLE "maestro_checklist_limpieza" (
    "id_item" INTEGER NOT NULL,
    "nombre_item" VARCHAR(100) NOT NULL,
    "def_seleccionado" INTEGER DEFAULT 0,
    "def_bloqueado" INTEGER DEFAULT 0,

    CONSTRAINT "maestro_checklist_limpieza_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "maestro_formas_calculo" (
    "id_forma" INTEGER NOT NULL,
    "nombre_forma" VARCHAR(100) NOT NULL,
    "def_seleccionado" INTEGER DEFAULT 0,

    CONSTRAINT "maestro_formas_calculo_pkey" PRIMARY KEY ("id_forma")
);

-- CreateTable
CREATE TABLE "maestro_tipos_analisis" (
    "id_tipo_analisis" SERIAL NOT NULL,
    "nombre_analisis" VARCHAR(100) NOT NULL,

    CONSTRAINT "maestro_tipos_analisis_pkey" PRIMARY KEY ("id_tipo_analisis")
);

-- CreateTable
CREATE TABLE "material_siembra" (
    "id_material_siembra" SERIAL NOT NULL,
    "nombre_material" VARCHAR(100) NOT NULL,
    "detalle_medida" VARCHAR(100),

    CONSTRAINT "material_siembra_pkey" PRIMARY KEY ("id_material_siembra")
);

-- CreateTable
CREATE TABLE "micropipetas" (
    "id_pipeta" SERIAL NOT NULL,
    "nombre_pipeta" VARCHAR(100) NOT NULL,
    "codigo_pipeta" VARCHAR(50) NOT NULL,
    "capacidad" VARCHAR(20),

    CONSTRAINT "micropipetas_pkey" PRIMARY KEY ("id_pipeta")
);

-- CreateTable
CREATE TABLE "muestras_ali" (
    "codigo_ali" INTEGER NOT NULL,
    "codigo_otros" VARCHAR(255),
    "observaciones_cliente" TEXT,
    "observaciones_generales" TEXT,

    CONSTRAINT "muestras_ali_pkey" PRIMARY KEY ("codigo_ali")
);

-- CreateTable
CREATE TABLE "tpa_reporte" (
    "id" SERIAL NOT NULL,
    "codigo_ali" INTEGER NOT NULL,
    "estado_actual" VARCHAR(50),

    CONSTRAINT "tpa_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ram_reporte" (
    "id" SERIAL NOT NULL,
    "codigo_ali" INTEGER NOT NULL,
    "estado_ram" VARCHAR(50),

    CONSTRAINT "ram_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sau_formulario" (
    "id_sau_formulario" BIGSERIAL NOT NULL,
    "id_solicitud_analisis" BIGINT NOT NULL,
    "etapa_actual" SMALLINT NOT NULL DEFAULT 1,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'en_proceso',
    "rut_analista" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sau_formulario_pkey" PRIMARY KEY ("id_sau_formulario")
);

-- CreateTable
CREATE TABLE "sau_muestra" (
    "id_sau_muestra" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "id_solicitud_muestra" BIGINT NOT NULL,
    "numero_muestra" VARCHAR(50) NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "orden" SMALLINT NOT NULL,

    CONSTRAINT "sau_muestra_pkey" PRIMARY KEY ("id_sau_muestra")
);

-- CreateTable
CREATE TABLE "saureus_muestras" (
    "id" TEXT NOT NULL,
    "solicitud_analisis_id" BIGINT NOT NULL,
    "numero_muestra" INTEGER NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "ali_referencia" INTEGER,
    "dil_1" DECIMAL(65,30),
    "c1" INTEGER,
    "c2" INTEGER,
    "dil_2" DECIMAL(65,30),
    "c3" INTEGER,
    "c4" INTEGER,
    "colonias_posibles_1" INTEGER,
    "colonias_posibles_2" INTEGER,
    "col_confirmar_1" INTEGER,
    "col_confirmar_2" INTEGER,
    "confirmadas_4h_1" INTEGER,
    "confirmadas_4h_2" INTEGER,
    "fecha_lectura_4h" TIMESTAMP(3),
    "hora_lectura_4h" TEXT,
    "analista_lectura_4h" TEXT,
    "confirmadas_24h_1" INTEGER,
    "confirmadas_24h_2" INTEGER,
    "fecha_lectura_24h" TIMESTAMP(3),
    "hora_lectura_24h" TEXT,
    "analista_lectura_24h" TEXT,
    "resultado_ufc" DECIMAL(65,30),
    "resultado_texto" TEXT,
    "operador" TEXT DEFAULT '=',
    "es_sd" BOOLEAN NOT NULL DEFAULT false,
    "a_placa_a" INTEGER,
    "a_placa_b" INTEGER,
    "suma_a" INTEGER,
    "coagulasa_usada" TEXT,
    "proporcion_a" DECIMAL(65,30),
    "proporcion_b" DECIMAL(65,30),
    "regla_80_a" BOOLEAN,
    "regla_80_b" BOOLEAN,
    "suma_colonias" INTEGER,
    "n1" INTEGER,
    "n2" INTEGER,
    "factor_dilucion" DECIMAL(65,30),
    "caso_aplicado" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saureus_muestras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sau_etapa1" (
    "id_sau_etapa1" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "fecha_inicio_incubacion" TIMESTAMP NOT NULL,
    "rut_analista_inicio" VARCHAR(255) NOT NULL,
    "fecha_termino_analisis" TIMESTAMP,
    "rut_analista_termino" VARCHAR(255),
    "tiempo_homo_siembra_min" DECIMAL(5,2),
    "tiempo_homo_valido" BOOLEAN,
    "hora_homogeneizado" VARCHAR(5),
    "hora_siembra" VARCHAR(5),
    "n_muestra_10g_90ml" INTEGER,
    "n_muestra_50g_450ml" INTEGER,
    "id_micropipeta" INTEGER,
    "codigo_micropipeta" VARCHAR(100),
    "id_medio_agar_baird_parker" INTEGER NOT NULL,
    "peso_muestra_tipo" VARCHAR(20) NOT NULL,
    "id_estufa" INTEGER NOT NULL,
    "duplicado_ali_ref" VARCHAR(100),
    "ctrl_duplicado_cumple" BOOLEAN,
    "ctrl_positivo_blanco_ali" VARCHAR(255),
    "ctrl_positivo_cumple" BOOLEAN,
    "ctrl_siembra_ali" VARCHAR(255),
    "ctrl_siembra_cumple" BOOLEAN,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sau_etapa1_pkey" PRIMARY KEY ("id_sau_etapa1")
);

-- CreateTable
CREATE TABLE "sau_etapa1_micropipeta" (
    "id" SERIAL NOT NULL,
    "id_sau_etapa1" BIGINT NOT NULL,
    "id_pipeta" INTEGER NOT NULL,
    "capacidad" VARCHAR(10) NOT NULL,

    CONSTRAINT "sau_etapa1_micropipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sau_etapa1_lectura" (
    "id_sau_etapa1_lectura" BIGSERIAL NOT NULL,
    "id_sau_muestra" BIGINT NOT NULL,
    "conteo_24h_placa1" DECIMAL(10,2),
    "conteo_24h_placa2" DECIMAL(10,2),
    "conteo_48h_placa1" DECIMAL(10,2),
    "conteo_48h_placa2" DECIMAL(10,2),

    CONSTRAINT "sau_etapa1_lectura_pkey" PRIMARY KEY ("id_sau_etapa1_lectura")
);

-- CreateTable
CREATE TABLE "sau_etapa2" (
    "id_sau_etapa2" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "ctrl_siembra_s_aureus_ufc" DECIMAL(10,2),
    "ctrl_positivo_s_aureus" VARCHAR(50),
    "ctrl_negativo_s_epider_ufc" DECIMAL(10,2),
    "blanco_ufc" DECIMAL(10,2),
    "sd" VARCHAR(100),
    "fecha_lectura_24h" TIMESTAMP,
    "rut_analista_24h" VARCHAR(255),
    "fecha_lectura_48h" TIMESTAMP,
    "rut_analista_48h" VARCHAR(255),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sau_etapa2_pkey" PRIMARY KEY ("id_sau_etapa2")
);

-- CreateTable
CREATE TABLE "sau_etapa3" (
    "id_sau_etapa3" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "fecha_hora_traspaso" TIMESTAMP NOT NULL,
    "rut_analista_traspaso" VARCHAR(255) NOT NULL,
    "duracion_traspaso_lectura" TEXT,
    "id_medio_caldo_bhi" INTEGER,
    "id_estufa" INTEGER NOT NULL,
    "ctrl_positivo_s_aureus" VARCHAR(50),
    "ctrl_negativo_s_epider" VARCHAR(50),
    "blanco" VARCHAR(50),
    "fecha_hora_lectura" TIMESTAMP,
    "rut_analista_lectura" VARCHAR(255),
    "observaciones" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sau_etapa3_pkey" PRIMARY KEY ("id_sau_etapa3")
);

-- CreateTable
CREATE TABLE "sau_etapa3_lectura" (
    "id_sau_etapa3_lectura" BIGSERIAL NOT NULL,
    "id_sau_muestra" BIGINT NOT NULL,
    "id_sau_etapa3" BIGINT NOT NULL,
    "colonias_placa1" DECIMAL(10,2),
    "colonias_placa2" DECIMAL(10,2),

    CONSTRAINT "sau_etapa3_lectura_pkey" PRIMARY KEY ("id_sau_etapa3_lectura")
);

-- CreateTable
CREATE TABLE "sau_etapa4" (
    "id_sau_etapa4" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "fecha_hora_prueba" TIMESTAMP NOT NULL,
    "rut_analista_prueba" VARCHAR(255) NOT NULL,
    "codigo_tubos_esteriles" VARCHAR(100),
    "codigo_puntas_1ml" VARCHAR(100),
    "id_medio_bacident" INTEGER,
    "id_medio_agua_esteril" INTEGER,
    "id_micropipeta" INTEGER,
    "id_estufa" INTEGER NOT NULL,
    "fecha_lectura_4_6h" TIMESTAMP,
    "rut_analista_4_6h" VARCHAR(255),
    "resultado_coagulasa_4_6h" VARCHAR(100),
    "ctrl_positivo_4_6h" VARCHAR(50),
    "ctrl_negativo_4_6h" VARCHAR(50),
    "blanco_4_6h" VARCHAR(50),
    "fecha_lectura_24h" TIMESTAMP,
    "rut_analista_24h" VARCHAR(255),
    "resultado_coagulasa_24h" VARCHAR(100),
    "ctrl_positivo_24h" VARCHAR(50),
    "ctrl_negativo_24h" VARCHAR(50),
    "blanco_24h" VARCHAR(50),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sau_etapa4_pkey" PRIMARY KEY ("id_sau_etapa4")
);

-- CreateTable
CREATE TABLE "sau_etapa4_lectura" (
    "id_sau_etapa4_lectura" BIGSERIAL NOT NULL,
    "id_sau_muestra" BIGINT NOT NULL,
    "id_sau_etapa4" BIGINT NOT NULL,
    "tipo_lectura" VARCHAR(5) NOT NULL,
    "colonias_placa1" DECIMAL(10,2),
    "colonias_placa2" DECIMAL(10,2),

    CONSTRAINT "sau_etapa4_lectura_pkey" PRIMARY KEY ("id_sau_etapa4_lectura")
);

-- CreateTable
CREATE TABLE "sau_etapa5_resultado" (
    "id_sau_etapa5_resultado" BIGSERIAL NOT NULL,
    "id_sau_muestra" BIGINT NOT NULL,
    "n_s_aureus" DECIMAL(15,4),
    "ufc_por_g" DECIMAL(15,4),
    "incongruencia_detectada" BOOLEAN NOT NULL DEFAULT false,
    "observacion_incongruencia" TEXT,
    "sauFormularioIdSauFormulario" BIGINT,

    CONSTRAINT "sau_etapa5_resultado_pkey" PRIMARY KEY ("id_sau_etapa5_resultado")
);

-- CreateTable
CREATE TABLE "sau_etapa6_cierre" (
    "id_sau_etapa6" BIGSERIAL NOT NULL,
    "id_sau_formulario" BIGINT NOT NULL,
    "desfavorable" BOOLEAN,
    "tabla_pagina_referencia" VARCHAR(255),
    "limite_normativo" VARCHAR(100),
    "ctrl_calidad_etapa1_ok" BOOLEAN,
    "fecha_hora_entrega" TIMESTAMP,
    "rut_coordinador_cierre" VARCHAR(255),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sau_etapa6_cierre_pkey" PRIMARY KEY ("id_sau_etapa6")
);

-- CreateTable
CREATE TABLE "coli_formulario" (
    "id_coli_formulario" BIGSERIAL NOT NULL,
    "id_solicitud_analisis" BIGINT NOT NULL,
    "fase_actual" SMALLINT NOT NULL DEFAULT 1,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'en_proceso',
    "rut_analista" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coli_formulario_pkey" PRIMARY KEY ("id_coli_formulario")
);

-- CreateTable
CREATE TABLE "coli_muestra" (
    "id_coli_muestra" BIGSERIAL NOT NULL,
    "id_coli_formulario" BIGINT NOT NULL,
    "id_solicitud_muestra" BIGINT NOT NULL,
    "numero_muestra" VARCHAR(50) NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "peso_muestra_tipo" VARCHAR(20) NOT NULL,
    "orden" SMALLINT NOT NULL,

    CONSTRAINT "coli_muestra_pkey" PRIMARY KEY ("id_coli_muestra")
);

-- CreateTable
CREATE TABLE "coli_fase1" (
    "id_coli_fase1" BIGSERIAL NOT NULL,
    "id_coli_formulario" BIGINT NOT NULL,
    "fecha_inicio_incubacion" TIMESTAMP NOT NULL,
    "rut_analista_inicio" VARCHAR(255) NOT NULL,
    "fecha_termino_analisis" TIMESTAMP,
    "rut_analista_termino" VARCHAR(255),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "coli_fase1_pkey" PRIMARY KEY ("id_coli_fase1")
);

-- CreateTable
CREATE TABLE "coli_fase2" (
    "id_coli_fase2" BIGSERIAL NOT NULL,
    "id_coli_formulario" BIGINT NOT NULL,
    "id_medio_caldo_lauril" INTEGER NOT NULL,
    "id_medio_tween_80" INTEGER,
    "fecha_homog" TIMESTAMP,
    "rut_analista_homog" VARCHAR(255),
    "fecha_siembra" TIMESTAMP,
    "rut_analista_siembra" VARCHAR(255),
    "n_muestra_10g_90ml" INTEGER,
    "n_muestra_50g_450ml" INTEGER,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "coli_fase2_pkey" PRIMARY KEY ("id_coli_fase2")
);

-- CreateTable
CREATE TABLE "coli_fase2_estufa" (
    "id" SERIAL NOT NULL,
    "id_coli_fase2" BIGINT NOT NULL,
    "id_incubacion" INTEGER NOT NULL,

    CONSTRAINT "coli_fase2_estufa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coli_fase2_micropipeta" (
    "id" SERIAL NOT NULL,
    "id_coli_fase2" BIGINT NOT NULL,
    "id_pipeta" INTEGER NOT NULL,
    "capacidad" VARCHAR(10) NOT NULL,

    CONSTRAINT "coli_fase2_micropipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coli_fase3" (
    "id_coli_fase3" BIGSERIAL NOT NULL,
    "id_coli_formulario" BIGINT NOT NULL,
    "fecha_lectura_24h" TIMESTAMP,
    "rut_analista_24h" VARCHAR(255),
    "lectura_24h_en_tolerancia" BOOLEAN,
    "fecha_lectura_48h" TIMESTAMP,
    "rut_analista_48h" VARCHAR(255),
    "lectura_48h_en_tolerancia" BOOLEAN,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "coli_fase3_pkey" PRIMARY KEY ("id_coli_fase3")
);

-- CreateTable
CREATE TABLE "coli_fase3_submuestra" (
    "id_submuestra" BIGSERIAL NOT NULL,
    "id_coli_muestra" BIGINT NOT NULL,
    "tipo_lectura" VARCHAR(5) NOT NULL,
    "dilucion" VARCHAR(10) NOT NULL,
    "numero_tubo" SMALLINT NOT NULL,
    "presencia" BOOLEAN,

    CONSTRAINT "coli_fase3_submuestra_pkey" PRIMARY KEY ("id_submuestra")
);

-- CreateTable
CREATE TABLE "coli_fase35_controles" (
    "id_coli_fase35" BIGSERIAL NOT NULL,
    "id_coli_formulario" BIGINT NOT NULL,
    "ctrl_tot_k_aerogenes_24h" BOOLEAN,
    "ctrl_tot_k_aerogenes_48h" BOOLEAN,
    "ctrl_tot_s_aureus_24h" BOOLEAN,
    "ctrl_tot_s_aureus_48h" BOOLEAN,
    "blanco_totales_24h" VARCHAR(100),
    "blanco_totales_48h" VARCHAR(100),
    "ctrl_fec_e_coli_24h" BOOLEAN,
    "ctrl_fec_e_coli_48h" BOOLEAN,
    "ctrl_fec_k_aerogenes_24h" BOOLEAN,
    "ctrl_fec_k_aerogenes_48h" BOOLEAN,
    "blanco_fecales_24h" VARCHAR(100),
    "blanco_fecales_48h" VARCHAR(100),
    "ctrl_eco_e_coli_24h" BOOLEAN,
    "ctrl_eco_e_coli_48h" BOOLEAN,
    "ctrl_eco_k_aerogenes_24h" BOOLEAN,
    "ctrl_eco_k_aerogenes_48h" BOOLEAN,
    "blanco_ecoli_24h" VARCHAR(100),
    "blanco_ecoli_48h" VARCHAR(100),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "coli_fase35_controles_pkey" PRIMARY KEY ("id_coli_fase35")
);

-- CreateTable
CREATE TABLE "coli_fase4_resultado" (
    "id_coli_fase4_resultado" BIGSERIAL NOT NULL,
    "id_coli_muestra" BIGINT NOT NULL,
    "coliformes_totales" DECIMAL(15,4),
    "coliformes_fecales" DECIMAL(15,4),
    "e_coli" DECIMAL(15,4),
    "incongruencia_detectada" BOOLEAN NOT NULL DEFAULT false,
    "observacion_incongruencia" TEXT,
    "totales_log10_mpn" DECIMAL(15,6),
    "totales_sd_log10" DECIMAL(15,6),
    "totales_limite_inferior" DECIMAL(15,4),
    "totales_limite_superior" DECIMAL(15,4),
    "totales_rarity_index" DECIMAL(15,6),
    "totales_categoria_rareza" SMALLINT,
    "totales_estado" VARCHAR(50),
    "fecales_log10_mpn" DECIMAL(15,6),
    "fecales_sd_log10" DECIMAL(15,6),
    "fecales_limite_inferior" DECIMAL(15,4),
    "fecales_limite_superior" DECIMAL(15,4),
    "fecales_rarity_index" DECIMAL(15,6),
    "fecales_categoria_rareza" SMALLINT,
    "fecales_estado" VARCHAR(50),
    "ecoli_log10_mpn" DECIMAL(15,6),
    "ecoli_sd_log10" DECIMAL(15,6),
    "ecoli_limite_inferior" DECIMAL(15,4),
    "ecoli_limite_superior" DECIMAL(15,4),
    "ecoli_rarity_index" DECIMAL(15,6),
    "ecoli_categoria_rareza" SMALLINT,
    "ecoli_estado" VARCHAR(50),
    "coliFormularioIdColiFormulario" BIGINT,

    CONSTRAINT "coli_fase4_resultado_pkey" PRIMARY KEY ("id_coli_fase4_resultado")
);

-- CreateTable
CREATE TABLE "medios_cultivos" (
    "id_medio_cultivo" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "temperatura_uso" DECIMAL(4,1),
    "norma_relacionada" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medios_cultivos_pkey" PRIMARY KEY ("id_medio_cultivo")
);

-- CreateTable
CREATE TABLE "sal_formulario" (
    "id_sal_formulario" BIGSERIAL NOT NULL,
    "id_solicitud_analisis" BIGINT NOT NULL,
    "fase_actual" SMALLINT NOT NULL DEFAULT 1,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'en_proceso',
    "rut_analista" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sal_formulario_pkey" PRIMARY KEY ("id_sal_formulario")
);

-- CreateTable
CREATE TABLE "sal_muestra" (
    "id_sal_muestra" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "id_solicitud_muestra" BIGINT NOT NULL,
    "numero_muestra" VARCHAR(50) NOT NULL,
    "es_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "orden" SMALLINT NOT NULL,

    CONSTRAINT "sal_muestra_pkey" PRIMARY KEY ("id_sal_muestra")
);

-- CreateTable
CREATE TABLE "sal_fase1" (
    "id_sal_fase1" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "fecha_hora_inicio_incubacion" TIMESTAMP NOT NULL,
    "tipo_matriz" VARCHAR(20) NOT NULL,
    "peso_muestra" VARCHAR(20) NOT NULL,
    "id_medio_caldo_homogeneizacion" INTEGER NOT NULL,
    "caldo_asignado_auto" INTEGER,
    "hora_inicio_hidratacion" TIME,
    "hora_termino_hidratacion" TIME,
    "hidratacion_valida" BOOLEAN,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase1_pkey" PRIMARY KEY ("id_sal_fase1")
);

-- CreateTable
CREATE TABLE "sal_fase2a" (
    "id_sal_fase2a" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "fecha_siembra" DATE NOT NULL,
    "hora_inicio_homo" TIME NOT NULL,
    "hora_termino_homo" TIME NOT NULL,
    "hora_ingreso_estufa" TIME NOT NULL,
    "minutos_homo_a_estufa" DECIMAL(5,2),
    "alerta_tiempo_25min" BOOLEAN NOT NULL DEFAULT false,
    "rut_analista_responsable" VARCHAR(255) NOT NULL,
    "fecha_termino_analisis" DATE,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase2a_pkey" PRIMARY KEY ("id_sal_fase2a")
);

-- CreateTable
CREATE TABLE "sal_fase2b" (
    "id_sal_fase2b" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "id_medio_caldo" INTEGER NOT NULL,
    "volumen_caldo" VARCHAR(20),
    "id_estufa" INTEGER NOT NULL,
    "id_bano" INTEGER,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase2b_pkey" PRIMARY KEY ("id_sal_fase2b")
);

-- CreateTable
CREATE TABLE "sal_fase2b_tween_pipeta" (
    "id" SERIAL NOT NULL,
    "id_sal_fase2b" BIGINT NOT NULL,
    "id_material" INTEGER NOT NULL,

    CONSTRAINT "sal_fase2b_tween_pipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sal_fase2b_micropipeta" (
    "id" SERIAL NOT NULL,
    "id_sal_fase2b" BIGINT NOT NULL,
    "id_pipeta" INTEGER NOT NULL,

    CONSTRAINT "sal_fase2b_micropipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sal_fase2c" (
    "id_sal_fase2c" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "descripcion_ctrl_analisis" VARCHAR(255),
    "resultado_ctrl_analisis" BOOLEAN,
    "ctrl_positivo_blanco_ali" VARCHAR(255),
    "resultado_ctrl_positivo" BOOLEAN,
    "ctrl_siembra_ali" VARCHAR(255),
    "resultado_ctrl_siembra" BOOLEAN,
    "desfavorable" BOOLEAN,
    "tabla_pagina" VARCHAR(200),
    "limite" VARCHAR(200),
    "fecha_hora_entrega" TIMESTAMP,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase2c_pkey" PRIMARY KEY ("id_sal_fase2c")
);

-- CreateTable
CREATE TABLE "sal_fase3a" (
    "id_sal_fase3a" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "fecha_traspaso" DATE NOT NULL,
    "hora_lectura_caldo_apt" TIME NOT NULL,
    "rut_analista_caldo_apt" VARCHAR(255) NOT NULL,
    "hora_lectura_caldos_finales" TIME,
    "rut_analista_caldos_finales" VARCHAR(255),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase3a_pkey" PRIMARY KEY ("id_sal_fase3a")
);

-- CreateTable
CREATE TABLE "sal_fase3b" (
    "id_sal_fase3b" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "id_estufa_selenito" INTEGER,
    "id_bano_selenito" INTEGER,
    "id_estufa_rappaport" INTEGER,
    "id_bano_rappaport" INTEGER,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase3b_pkey" PRIMARY KEY ("id_sal_fase3b")
);

-- CreateTable
CREATE TABLE "sal_fase3b_pipeta" (
    "id" SERIAL NOT NULL,
    "id_sal_fase3b" BIGINT NOT NULL,
    "id_material" INTEGER NOT NULL,
    "tipo_material" VARCHAR(30) NOT NULL,

    CONSTRAINT "sal_fase3b_pipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sal_fase3b_micropipeta" (
    "id" SERIAL NOT NULL,
    "id_sal_fase3b" BIGINT NOT NULL,
    "id_pipeta" INTEGER NOT NULL,

    CONSTRAINT "sal_fase3b_micropipeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sal_fase3c_lectura" (
    "id_sal_fase3c_lectura" BIGSERIAL NOT NULL,
    "id_sal_muestra" BIGINT NOT NULL,
    "resultado_caldo_apt" BOOLEAN,
    "resultado_selenito" BOOLEAN,
    "resultado_rappaport" BOOLEAN,
    "ctrl_positivo_s_enteritidis" BOOLEAN,
    "ctrl_negativo_k_pneumoniae" BOOLEAN,
    "ctrl_blanco" BOOLEAN,

    CONSTRAINT "sal_fase3c_lectura_pkey" PRIMARY KEY ("id_sal_fase3c_lectura")
);

-- CreateTable
CREATE TABLE "sal_fase4a" (
    "id_sal_fase4a" BIGSERIAL NOT NULL,
    "id_sal_formulario" BIGINT NOT NULL,
    "fecha_hora_traspaso_agares" TIMESTAMP NOT NULL,
    "rut_analista_traspaso" VARCHAR(255) NOT NULL,
    "id_medio_agar_xld" INTEGER NOT NULL,
    "id_medio_agar_ss" INTEGER NOT NULL,
    "id_estufa_agares" INTEGER NOT NULL,
    "id_bano_agares" INTEGER,
    "fecha_hora_lectura_24h" TIMESTAMP,
    "rut_analista_lectura_24h" VARCHAR(255),
    "fecha_hora_lectura_48h" TIMESTAMP,
    "rut_analista_lectura_48h" VARCHAR(255),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "sal_fase4a_pkey" PRIMARY KEY ("id_sal_fase4a")
);

-- CreateTable
CREATE TABLE "sal_fase4b_lectura" (
    "id_sal_fase4b_lectura" BIGSERIAL NOT NULL,
    "id_sal_muestra" BIGINT NOT NULL,
    "id_sal_fase4a" BIGINT NOT NULL,
    "res_xld_24h_selenito" VARCHAR(10),
    "res_ss_24h_selenito" VARCHAR(10),
    "res_xld_48h_selenito" VARCHAR(10),
    "res_ss_48h_selenito" VARCHAR(10),
    "res_xld_24h_rappaport" VARCHAR(10),
    "res_ss_24h_rappaport" VARCHAR(10),
    "res_xld_48h_rappaport" VARCHAR(10),
    "res_ss_48h_rappaport" VARCHAR(10),
    "ctrl_positivo_s_enteritidis" VARCHAR(10),
    "ctrl_negativo_k_pneumoniae" VARCHAR(10),
    "ctrl_blanco" VARCHAR(10),

    CONSTRAINT "sal_fase4b_lectura_pkey" PRIMARY KEY ("id_sal_fase4b_lectura")
);

-- CreateTable
CREATE TABLE "sal_fase5_resultado" (
    "id_sal_fase5_resultado" BIGSERIAL NOT NULL,
    "id_sal_muestra" BIGINT NOT NULL,
    "resultado_final" "PresenciaAusencia" NOT NULL,
    "salFormularioIdSalFormulario" BIGINT,

    CONSTRAINT "sal_fase5_resultado_pkey" PRIMARY KEY ("id_sal_fase5_resultado")
);

-- CreateTable
CREATE TABLE "ent_formulario" (
    "id_ent_formulario" BIGSERIAL NOT NULL,
    "id_solicitud_analisis" BIGINT NOT NULL,
    "etapa_actual" SMALLINT NOT NULL DEFAULT 1,
    "subetapa_actual" SMALLINT NOT NULL DEFAULT 1,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'en_proceso',
    "rut_analista" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ent_formulario_pkey" PRIMARY KEY ("id_ent_formulario")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "lotes_reactivo" (
    "id_lote_reactivo" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "codigo_lote" VARCHAR(50) NOT NULL,
    "fecha_vencimiento" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_reactivo_pkey" PRIMARY KEY ("id_lote_reactivo")
);

-- CreateTable
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
    "id_medio_agar_vrbg" INTEGER NOT NULL,
    "id_medio_tween_80" INTEGER,
    "id_estufa_sembrado" INTEGER NOT NULL,
    "placas_sembrado" SMALLINT NOT NULL,
    "id_micropipeta" INTEGER NOT NULL,
    "fecha_sembrado" DATE NOT NULL,
    "hora_sembrado" VARCHAR(10) NOT NULL,
    "rut_analista_sembrado" VARCHAR(255) NOT NULL,
    "id_estufa_incub" INTEGER NOT NULL,
    "fecha_inicio_incubacion" TIMESTAMP NOT NULL,
    "fecha_fin_incubacion" TIMESTAMP NOT NULL,
    "rut_analista_incub" VARCHAR(255) NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ent_etapa1_pkey" PRIMARY KEY ("id_ent_etapa1")
);

-- CreateTable
CREATE TABLE "ent_etapa2" (
    "id_ent_etapa2" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "fecha_lectura_24h" TIMESTAMP NOT NULL,
    "hora_lectura_24h" VARCHAR(10) NOT NULL,
    "rut_analista_lectura" VARCHAR(255) NOT NULL,
    "id_equipo_cuenta_colonias" INTEGER NOT NULL,
    "n_muestra_lectura" INTEGER NOT NULL,
    "dilucion" DECIMAL(10,2) NOT NULL,
    "colonias_contadas" INTEGER NOT NULL,
    "ufc_por_g" DECIMAL(15,4),
    "lectura_muestras" JSONB,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ent_etapa2_pkey" PRIMARY KEY ("id_ent_etapa2")
);

-- CreateTable
CREATE TABLE "ent_etapa3" (
    "id_ent_etapa3" BIGSERIAL NOT NULL,
    "id_ent_formulario" BIGINT NOT NULL,
    "fecha_traspaso" DATE,
    "hora_traspaso" VARCHAR(10),
    "rut_analista_traspaso" VARCHAR(255),
    "id_agar_nutritivo" BIGINT,
    "id_estufa_conf" INTEGER,
    "fecha_lect_conf" DATE,
    "hora_lect_conf" VARCHAR(10),
    "rut_analista_lect_conf" VARCHAR(255),
    "fecha_oxidasa" DATE,
    "hora_oxidasa" VARCHAR(10),
    "rut_analista_oxidasa" VARCHAR(255),
    "reactivo_oxidasa" VARCHAR(20),
    "desaireado_agar_glucosa" VARCHAR(100),
    "agar_glucosa" VARCHAR(100),
    "control_pos_ecoli" VARCHAR(20),
    "control_neg_paer" VARCHAR(20),
    "blanco" VARCHAR(20),
    "desfavorable" BOOLEAN,
    "tabla_pagina" VARCHAR(200),
    "limite" VARCHAR(200),
    "fecha_hora_entrega" TIMESTAMP,
    "observaciones" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ent_etapa3_pkey" PRIMARY KEY ("id_ent_etapa3")
);

-- CreateTable
CREATE TABLE "ent_etapa3_resultado" (
    "id_ent_etapa3_resultado" BIGSERIAL NOT NULL,
    "id_ent_muestra" BIGINT NOT NULL,
    "muestra_b" DECIMAL(15,4),
    "muestra_a" DECIMAL(15,4),
    "d" DECIMAL(15,4),
    "n1" INTEGER,
    "n2" INTEGER,
    "m" DECIMAL(15,4),
    "suma_a" DECIMAL(15,4),
    "n_enterobacterias" DECIMAL(15,4),
    "ufc_por_g" DECIMAL(15,4),
    "operador" VARCHAR(5),
    "es_estimado" BOOLEAN,
    "es_sd" BOOLEAN,
    "caso_aplicado" VARCHAR(50),
    "incongruencia_detectada" BOOLEAN,
    "observacion_incongruencia" VARCHAR(255),
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ent_etapa3_resultado_pkey" PRIMARY KEY ("id_ent_etapa3_resultado")
);

-- CreateIndex
CREATE UNIQUE INDEX "accreditaciones_inn_codigo_key" ON "accreditaciones_inn"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "banos_termicos_nombre_equipo_key" ON "banos_termicos"("nombre_equipo");

-- CreateIndex
CREATE INDEX "sau_formulario_rut_analista_idx" ON "sau_formulario"("rut_analista");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa1_id_sau_formulario_key" ON "sau_etapa1"("id_sau_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa2_id_sau_formulario_key" ON "sau_etapa2"("id_sau_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa3_id_sau_formulario_key" ON "sau_etapa3"("id_sau_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa4_id_sau_formulario_key" ON "sau_etapa4"("id_sau_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa5_resultado_id_sau_muestra_key" ON "sau_etapa5_resultado"("id_sau_muestra");

-- CreateIndex
CREATE UNIQUE INDEX "sau_etapa6_cierre_id_sau_formulario_key" ON "sau_etapa6_cierre"("id_sau_formulario");

-- CreateIndex
CREATE INDEX "coli_formulario_rut_analista_idx" ON "coli_formulario"("rut_analista");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase1_id_coli_formulario_key" ON "coli_fase1"("id_coli_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase2_id_coli_formulario_key" ON "coli_fase2"("id_coli_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase3_id_coli_formulario_key" ON "coli_fase3"("id_coli_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase3_submuestra_id_coli_muestra_tipo_lectura_dilucion_key" ON "coli_fase3_submuestra"("id_coli_muestra", "tipo_lectura", "dilucion", "numero_tubo");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase35_controles_id_coli_formulario_key" ON "coli_fase35_controles"("id_coli_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "coli_fase4_resultado_id_coli_muestra_key" ON "coli_fase4_resultado"("id_coli_muestra");

-- CreateIndex
CREATE UNIQUE INDEX "medios_cultivos_nombre_key" ON "medios_cultivos"("nombre");

-- CreateIndex
CREATE INDEX "sal_formulario_rut_analista_idx" ON "sal_formulario"("rut_analista");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase1_id_sal_formulario_key" ON "sal_fase1"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase2a_id_sal_formulario_key" ON "sal_fase2a"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase2b_id_sal_formulario_key" ON "sal_fase2b"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase2c_id_sal_formulario_key" ON "sal_fase2c"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase3a_id_sal_formulario_key" ON "sal_fase3a"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase3b_id_sal_formulario_key" ON "sal_fase3b"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase4a_id_sal_formulario_key" ON "sal_fase4a"("id_sal_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "sal_fase5_resultado_id_sal_muestra_key" ON "sal_fase5_resultado"("id_sal_muestra");

-- CreateIndex
CREATE INDEX "ent_formulario_rut_analista_idx" ON "ent_formulario"("rut_analista");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_reactivo_codigo_lote_key" ON "lotes_reactivo"("codigo_lote");

-- CreateIndex
CREATE UNIQUE INDEX "ent_etapa1_id_ent_formulario_key" ON "ent_etapa1"("id_ent_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "ent_etapa2_id_ent_formulario_key" ON "ent_etapa2"("id_ent_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "ent_etapa3_id_ent_formulario_key" ON "ent_etapa3"("id_ent_formulario");

-- CreateIndex
CREATE UNIQUE INDEX "ent_etapa3_resultado_id_ent_muestra_key" ON "ent_etapa3_resultado"("id_ent_muestra");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "usuarios"("rut_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategorias_producto" ADD CONSTRAINT "subcategorias_producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias_producto"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones_cliente" ADD CONSTRAINT "direcciones_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alcance_acreditacion" ADD CONSTRAINT "alcance_acreditacion_id_acreditacion_fkey" FOREIGN KEY ("id_acreditacion") REFERENCES "accreditaciones_inn"("id_acreditacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alcance_acreditacion" ADD CONSTRAINT "alcance_acreditacion_id_formulario_analisis_fkey" FOREIGN KEY ("id_formulario_analisis") REFERENCES "formularios_analisis"("id_formularios_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alcance_acreditacion" ADD CONSTRAINT "alcance_acreditacion_id_categoria_producto_fkey" FOREIGN KEY ("id_categoria_producto") REFERENCES "categorias_producto"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiempos_por_categoria" ADD CONSTRAINT "tiempos_por_categoria_id_categoria_producto_fkey" FOREIGN KEY ("id_categoria_producto") REFERENCES "categorias_producto"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiempos_por_categoria" ADD CONSTRAINT "tiempos_por_categoria_id_formulario_analisis_fkey" FOREIGN KEY ("id_formulario_analisis") REFERENCES "formularios_analisis"("id_formularios_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_categoria_fkey" FOREIGN KEY ("categoria") REFERENCES "categorias_producto"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_id_direccion_fkey" FOREIGN KEY ("id_direccion") REFERENCES "direcciones_cliente"("id_direccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_id_termometro_fkey" FOREIGN KEY ("id_termometro") REFERENCES "equipos_lab"("id_equipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_id_lugar_fkey" FOREIGN KEY ("id_lugar") REFERENCES "lugares_almacenamiento"("id_lugar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_rut_responsable_ingreso_fkey" FOREIGN KEY ("rut_responsable_ingreso") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_rut_jefa_area_fkey" FOREIGN KEY ("rut_jefa_area") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_rut_coordinarora_recepcion_fkey" FOREIGN KEY ("rut_coordinarora_recepcion") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ingreso" ADD CONSTRAINT "solicitud_ingreso_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_muestra" ADD CONSTRAINT "solicitud_muestra_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud_ingreso"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_analisis" ADD CONSTRAINT "solicitud_analisis_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_analisis" ADD CONSTRAINT "solicitud_analisis_id_alcance_acreditacion_fkey" FOREIGN KEY ("id_alcance_acreditacion") REFERENCES "alcance_acreditacion"("id_alcance_acreditacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_analisis" ADD CONSTRAINT "solicitud_analisis_id_formulario_analisis_fkey" FOREIGN KEY ("id_formulario_analisis") REFERENCES "formularios_analisis"("id_formularios_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tpa_reporte" ADD CONSTRAINT "tpa_reporte_codigo_ali_fkey" FOREIGN KEY ("codigo_ali") REFERENCES "muestras_ali"("codigo_ali") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ram_reporte" ADD CONSTRAINT "ram_reporte_codigo_ali_fkey" FOREIGN KEY ("codigo_ali") REFERENCES "muestras_ali"("codigo_ali") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_formulario" ADD CONSTRAINT "sau_formulario_id_solicitud_analisis_fkey" FOREIGN KEY ("id_solicitud_analisis") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_formulario" ADD CONSTRAINT "sau_formulario_rut_analista_fkey" FOREIGN KEY ("rut_analista") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_muestra" ADD CONSTRAINT "sau_muestra_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_muestra" ADD CONSTRAINT "sau_muestra_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saureus_muestras" ADD CONSTRAINT "saureus_muestras_solicitud_analisis_id_fkey" FOREIGN KEY ("solicitud_analisis_id") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1" ADD CONSTRAINT "sau_etapa1_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1" ADD CONSTRAINT "sau_etapa1_rut_analista_inicio_fkey" FOREIGN KEY ("rut_analista_inicio") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1" ADD CONSTRAINT "sau_etapa1_rut_analista_termino_fkey" FOREIGN KEY ("rut_analista_termino") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1" ADD CONSTRAINT "sau_etapa1_id_estufa_fkey" FOREIGN KEY ("id_estufa") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1" ADD CONSTRAINT "sau_etapa1_id_medio_agar_baird_parker_fkey" FOREIGN KEY ("id_medio_agar_baird_parker") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1_micropipeta" ADD CONSTRAINT "sau_etapa1_micropipeta_id_sau_etapa1_fkey" FOREIGN KEY ("id_sau_etapa1") REFERENCES "sau_etapa1"("id_sau_etapa1") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1_micropipeta" ADD CONSTRAINT "sau_etapa1_micropipeta_id_pipeta_fkey" FOREIGN KEY ("id_pipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa1_lectura" ADD CONSTRAINT "sau_etapa1_lectura_id_sau_muestra_fkey" FOREIGN KEY ("id_sau_muestra") REFERENCES "sau_muestra"("id_sau_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa2" ADD CONSTRAINT "sau_etapa2_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa2" ADD CONSTRAINT "sau_etapa2_rut_analista_24h_fkey" FOREIGN KEY ("rut_analista_24h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa2" ADD CONSTRAINT "sau_etapa2_rut_analista_48h_fkey" FOREIGN KEY ("rut_analista_48h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3" ADD CONSTRAINT "sau_etapa3_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3" ADD CONSTRAINT "sau_etapa3_rut_analista_traspaso_fkey" FOREIGN KEY ("rut_analista_traspaso") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3" ADD CONSTRAINT "sau_etapa3_rut_analista_lectura_fkey" FOREIGN KEY ("rut_analista_lectura") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3" ADD CONSTRAINT "sau_etapa3_id_estufa_fkey" FOREIGN KEY ("id_estufa") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3" ADD CONSTRAINT "sau_etapa3_id_medio_caldo_bhi_fkey" FOREIGN KEY ("id_medio_caldo_bhi") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3_lectura" ADD CONSTRAINT "sau_etapa3_lectura_id_sau_muestra_fkey" FOREIGN KEY ("id_sau_muestra") REFERENCES "sau_muestra"("id_sau_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa3_lectura" ADD CONSTRAINT "sau_etapa3_lectura_id_sau_etapa3_fkey" FOREIGN KEY ("id_sau_etapa3") REFERENCES "sau_etapa3"("id_sau_etapa3") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_rut_analista_prueba_fkey" FOREIGN KEY ("rut_analista_prueba") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_rut_analista_4_6h_fkey" FOREIGN KEY ("rut_analista_4_6h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_rut_analista_24h_fkey" FOREIGN KEY ("rut_analista_24h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_id_micropipeta_fkey" FOREIGN KEY ("id_micropipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_id_estufa_fkey" FOREIGN KEY ("id_estufa") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_id_medio_bacident_fkey" FOREIGN KEY ("id_medio_bacident") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4" ADD CONSTRAINT "sau_etapa4_id_medio_agua_esteril_fkey" FOREIGN KEY ("id_medio_agua_esteril") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4_lectura" ADD CONSTRAINT "sau_etapa4_lectura_id_sau_muestra_fkey" FOREIGN KEY ("id_sau_muestra") REFERENCES "sau_muestra"("id_sau_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa4_lectura" ADD CONSTRAINT "sau_etapa4_lectura_id_sau_etapa4_fkey" FOREIGN KEY ("id_sau_etapa4") REFERENCES "sau_etapa4"("id_sau_etapa4") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa5_resultado" ADD CONSTRAINT "sau_etapa5_resultado_id_sau_muestra_fkey" FOREIGN KEY ("id_sau_muestra") REFERENCES "sau_muestra"("id_sau_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa5_resultado" ADD CONSTRAINT "sau_etapa5_resultado_sauFormularioIdSauFormulario_fkey" FOREIGN KEY ("sauFormularioIdSauFormulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa6_cierre" ADD CONSTRAINT "sau_etapa6_cierre_id_sau_formulario_fkey" FOREIGN KEY ("id_sau_formulario") REFERENCES "sau_formulario"("id_sau_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sau_etapa6_cierre" ADD CONSTRAINT "sau_etapa6_cierre_rut_coordinador_cierre_fkey" FOREIGN KEY ("rut_coordinador_cierre") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_formulario" ADD CONSTRAINT "coli_formulario_id_solicitud_analisis_fkey" FOREIGN KEY ("id_solicitud_analisis") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_formulario" ADD CONSTRAINT "coli_formulario_rut_analista_fkey" FOREIGN KEY ("rut_analista") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_muestra" ADD CONSTRAINT "coli_muestra_id_coli_formulario_fkey" FOREIGN KEY ("id_coli_formulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_muestra" ADD CONSTRAINT "coli_muestra_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase1" ADD CONSTRAINT "coli_fase1_id_coli_formulario_fkey" FOREIGN KEY ("id_coli_formulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase1" ADD CONSTRAINT "coli_fase1_rut_analista_inicio_fkey" FOREIGN KEY ("rut_analista_inicio") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase1" ADD CONSTRAINT "coli_fase1_rut_analista_termino_fkey" FOREIGN KEY ("rut_analista_termino") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2" ADD CONSTRAINT "coli_fase2_id_coli_formulario_fkey" FOREIGN KEY ("id_coli_formulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2" ADD CONSTRAINT "coli_fase2_id_medio_caldo_lauril_fkey" FOREIGN KEY ("id_medio_caldo_lauril") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2" ADD CONSTRAINT "coli_fase2_id_medio_tween_80_fkey" FOREIGN KEY ("id_medio_tween_80") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2" ADD CONSTRAINT "coli_fase2_rut_analista_homog_fkey" FOREIGN KEY ("rut_analista_homog") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2" ADD CONSTRAINT "coli_fase2_rut_analista_siembra_fkey" FOREIGN KEY ("rut_analista_siembra") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2_estufa" ADD CONSTRAINT "coli_fase2_estufa_id_coli_fase2_fkey" FOREIGN KEY ("id_coli_fase2") REFERENCES "coli_fase2"("id_coli_fase2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2_estufa" ADD CONSTRAINT "coli_fase2_estufa_id_incubacion_fkey" FOREIGN KEY ("id_incubacion") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2_micropipeta" ADD CONSTRAINT "coli_fase2_micropipeta_id_coli_fase2_fkey" FOREIGN KEY ("id_coli_fase2") REFERENCES "coli_fase2"("id_coli_fase2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase2_micropipeta" ADD CONSTRAINT "coli_fase2_micropipeta_id_pipeta_fkey" FOREIGN KEY ("id_pipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase3" ADD CONSTRAINT "coli_fase3_id_coli_formulario_fkey" FOREIGN KEY ("id_coli_formulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase3" ADD CONSTRAINT "coli_fase3_rut_analista_24h_fkey" FOREIGN KEY ("rut_analista_24h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase3" ADD CONSTRAINT "coli_fase3_rut_analista_48h_fkey" FOREIGN KEY ("rut_analista_48h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase3_submuestra" ADD CONSTRAINT "coli_fase3_submuestra_id_coli_muestra_fkey" FOREIGN KEY ("id_coli_muestra") REFERENCES "coli_muestra"("id_coli_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase35_controles" ADD CONSTRAINT "coli_fase35_controles_id_coli_formulario_fkey" FOREIGN KEY ("id_coli_formulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase4_resultado" ADD CONSTRAINT "coli_fase4_resultado_id_coli_muestra_fkey" FOREIGN KEY ("id_coli_muestra") REFERENCES "coli_muestra"("id_coli_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coli_fase4_resultado" ADD CONSTRAINT "coli_fase4_resultado_coliFormularioIdColiFormulario_fkey" FOREIGN KEY ("coliFormularioIdColiFormulario") REFERENCES "coli_formulario"("id_coli_formulario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_formulario" ADD CONSTRAINT "sal_formulario_id_solicitud_analisis_fkey" FOREIGN KEY ("id_solicitud_analisis") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_formulario" ADD CONSTRAINT "sal_formulario_rut_analista_fkey" FOREIGN KEY ("rut_analista") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_muestra" ADD CONSTRAINT "sal_muestra_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_muestra" ADD CONSTRAINT "sal_muestra_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase1" ADD CONSTRAINT "sal_fase1_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase1" ADD CONSTRAINT "sal_fase1_id_medio_caldo_homogeneizacion_fkey" FOREIGN KEY ("id_medio_caldo_homogeneizacion") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2a" ADD CONSTRAINT "sal_fase2a_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2a" ADD CONSTRAINT "sal_fase2a_rut_analista_responsable_fkey" FOREIGN KEY ("rut_analista_responsable") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b" ADD CONSTRAINT "sal_fase2b_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b" ADD CONSTRAINT "sal_fase2b_id_medio_caldo_fkey" FOREIGN KEY ("id_medio_caldo") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b" ADD CONSTRAINT "sal_fase2b_id_estufa_fkey" FOREIGN KEY ("id_estufa") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b" ADD CONSTRAINT "sal_fase2b_id_bano_fkey" FOREIGN KEY ("id_bano") REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b_tween_pipeta" ADD CONSTRAINT "sal_fase2b_tween_pipeta_id_sal_fase2b_fkey" FOREIGN KEY ("id_sal_fase2b") REFERENCES "sal_fase2b"("id_sal_fase2b") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b_tween_pipeta" ADD CONSTRAINT "sal_fase2b_tween_pipeta_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "material_siembra"("id_material_siembra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b_micropipeta" ADD CONSTRAINT "sal_fase2b_micropipeta_id_sal_fase2b_fkey" FOREIGN KEY ("id_sal_fase2b") REFERENCES "sal_fase2b"("id_sal_fase2b") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2b_micropipeta" ADD CONSTRAINT "sal_fase2b_micropipeta_id_pipeta_fkey" FOREIGN KEY ("id_pipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase2c" ADD CONSTRAINT "sal_fase2c_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3a" ADD CONSTRAINT "sal_fase3a_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3a" ADD CONSTRAINT "sal_fase3a_rut_analista_caldo_apt_fkey" FOREIGN KEY ("rut_analista_caldo_apt") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3a" ADD CONSTRAINT "sal_fase3a_rut_analista_caldos_finales_fkey" FOREIGN KEY ("rut_analista_caldos_finales") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_estufa_selenito_fkey" FOREIGN KEY ("id_estufa_selenito") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_bano_selenito_fkey" FOREIGN KEY ("id_bano_selenito") REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_estufa_rappaport_fkey" FOREIGN KEY ("id_estufa_rappaport") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b" ADD CONSTRAINT "sal_fase3b_id_bano_rappaport_fkey" FOREIGN KEY ("id_bano_rappaport") REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b_pipeta" ADD CONSTRAINT "sal_fase3b_pipeta_id_sal_fase3b_fkey" FOREIGN KEY ("id_sal_fase3b") REFERENCES "sal_fase3b"("id_sal_fase3b") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b_pipeta" ADD CONSTRAINT "sal_fase3b_pipeta_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "material_siembra"("id_material_siembra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b_micropipeta" ADD CONSTRAINT "sal_fase3b_micropipeta_id_sal_fase3b_fkey" FOREIGN KEY ("id_sal_fase3b") REFERENCES "sal_fase3b"("id_sal_fase3b") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3b_micropipeta" ADD CONSTRAINT "sal_fase3b_micropipeta_id_pipeta_fkey" FOREIGN KEY ("id_pipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase3c_lectura" ADD CONSTRAINT "sal_fase3c_lectura_id_sal_muestra_fkey" FOREIGN KEY ("id_sal_muestra") REFERENCES "sal_muestra"("id_sal_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_id_sal_formulario_fkey" FOREIGN KEY ("id_sal_formulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_rut_analista_traspaso_fkey" FOREIGN KEY ("rut_analista_traspaso") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_rut_analista_lectura_24h_fkey" FOREIGN KEY ("rut_analista_lectura_24h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_rut_analista_lectura_48h_fkey" FOREIGN KEY ("rut_analista_lectura_48h") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_id_estufa_agares_fkey" FOREIGN KEY ("id_estufa_agares") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_id_bano_agares_fkey" FOREIGN KEY ("id_bano_agares") REFERENCES "banos_termicos"("id_bano") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_id_medio_agar_xld_fkey" FOREIGN KEY ("id_medio_agar_xld") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4a" ADD CONSTRAINT "sal_fase4a_id_medio_agar_ss_fkey" FOREIGN KEY ("id_medio_agar_ss") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4b_lectura" ADD CONSTRAINT "sal_fase4b_lectura_id_sal_muestra_fkey" FOREIGN KEY ("id_sal_muestra") REFERENCES "sal_muestra"("id_sal_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase4b_lectura" ADD CONSTRAINT "sal_fase4b_lectura_id_sal_fase4a_fkey" FOREIGN KEY ("id_sal_fase4a") REFERENCES "sal_fase4a"("id_sal_fase4a") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase5_resultado" ADD CONSTRAINT "sal_fase5_resultado_id_sal_muestra_fkey" FOREIGN KEY ("id_sal_muestra") REFERENCES "sal_muestra"("id_sal_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sal_fase5_resultado" ADD CONSTRAINT "sal_fase5_resultado_salFormularioIdSalFormulario_fkey" FOREIGN KEY ("salFormularioIdSalFormulario") REFERENCES "sal_formulario"("id_sal_formulario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_formulario" ADD CONSTRAINT "ent_formulario_id_solicitud_analisis_fkey" FOREIGN KEY ("id_solicitud_analisis") REFERENCES "solicitud_analisis"("id_solicitud_analisis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_formulario" ADD CONSTRAINT "ent_formulario_rut_analista_fkey" FOREIGN KEY ("rut_analista") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_muestra" ADD CONSTRAINT "ent_muestra_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_muestra" ADD CONSTRAINT "ent_muestra_id_solicitud_muestra_fkey" FOREIGN KEY ("id_solicitud_muestra") REFERENCES "solicitud_muestra"("id_solicitud_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_inicio_fkey" FOREIGN KEY ("rut_analista_inicio") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_homog_fkey" FOREIGN KEY ("rut_analista_homog") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_sembrado_fkey" FOREIGN KEY ("rut_analista_sembrado") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_rut_analista_incub_fkey" FOREIGN KEY ("rut_analista_incub") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_balanza_fkey" FOREIGN KEY ("id_balanza") REFERENCES "instrumentos"("id_instrumento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_stomacher_fkey" FOREIGN KEY ("id_stomacher") REFERENCES "instrumentos"("id_instrumento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_medio_agar_vrbg_fkey" FOREIGN KEY ("id_medio_agar_vrbg") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_medio_tween_80_fkey" FOREIGN KEY ("id_medio_tween_80") REFERENCES "medios_cultivos"("id_medio_cultivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_estufa_sembrado_fkey" FOREIGN KEY ("id_estufa_sembrado") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_micropipeta_fkey" FOREIGN KEY ("id_micropipeta") REFERENCES "micropipetas"("id_pipeta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa1" ADD CONSTRAINT "ent_etapa1_id_estufa_incub_fkey" FOREIGN KEY ("id_estufa_incub") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_rut_analista_lectura_fkey" FOREIGN KEY ("rut_analista_lectura") REFERENCES "usuarios"("rut_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa2" ADD CONSTRAINT "ent_etapa2_id_equipo_cuenta_colonias_fkey" FOREIGN KEY ("id_equipo_cuenta_colonias") REFERENCES "instrumentos"("id_instrumento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_ent_formulario_fkey" FOREIGN KEY ("id_ent_formulario") REFERENCES "ent_formulario"("id_ent_formulario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_traspaso_fkey" FOREIGN KEY ("rut_analista_traspaso") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_lect_conf_fkey" FOREIGN KEY ("rut_analista_lect_conf") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_rut_analista_oxidasa_fkey" FOREIGN KEY ("rut_analista_oxidasa") REFERENCES "usuarios"("rut_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_agar_nutritivo_fkey" FOREIGN KEY ("id_agar_nutritivo") REFERENCES "lotes_reactivo"("id_lote_reactivo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3" ADD CONSTRAINT "ent_etapa3_id_estufa_conf_fkey" FOREIGN KEY ("id_estufa_conf") REFERENCES "equipos_incubacion"("id_incubacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ent_etapa3_resultado" ADD CONSTRAINT "ent_etapa3_resultado_id_ent_muestra_fkey" FOREIGN KEY ("id_ent_muestra") REFERENCES "ent_muestra"("id_ent_muestra") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Bridge object: ali_imagenes (legacy Backend/ image upload support)
CREATE TABLE IF NOT EXISTS ali_imagenes (
    id_imagen SERIAL PRIMARY KEY,
    codigo_ali BIGINT NOT NULL,
    url_imagen VARCHAR(500) NOT NULL,
    tipo_imagen VARCHAR(50) DEFAULT 'general',
    FOREIGN KEY (codigo_ali) REFERENCES muestras_ali(codigo_ali)
);

-- Bridge object: v_catalogo_unificado (legacy catalog view)
CREATE OR REPLACE VIEW v_catalogo_unificado AS
SELECT id_instrumento AS id_origen, nombre_instrumento AS nombre,
       codigo_instrumento AS codigo, 'INSTRUMENTO' AS tipo_material,
       NULL AS capacidad
FROM instrumentos
UNION ALL
SELECT id_pipeta AS id_origen, nombre_pipeta AS nombre,
       codigo_pipeta AS codigo, 'PIPETA' AS tipo_material,
       capacidad
FROM micropipetas;
