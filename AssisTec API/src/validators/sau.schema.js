const { z } = require('zod');
const baseSchema = require('./base.schema');
const isoDate = require('./base.schema').isoDate;

const emptyToUndefined = (val) => {
    if (val === '' || val === null) return undefined;
    return val;
};

const optionalString = () => z.string().optional().or(z.literal('')).or(z.literal(null)).transform(emptyToUndefined);
const optionalNumber = () => z.number().optional().or(z.literal('')).or(z.literal(null)).transform(emptyToUndefined);
const optionalBoolean = () => z.boolean().optional();
const optionalIsoDate = () => isoDate().optional().or(z.literal('')).or(z.literal(null)).transform(emptyToUndefined);

// ============================================================
// S. AUREUS — Etapas 1-6
// ============================================================

const etapa1PayloadSchema = z.object({
    fecha_inicio_incubacion: optionalIsoDate(),
    rut_analista_inicio: optionalString(),
    fecha_termino_analisis: optionalIsoDate(),
    rut_analista_termino: optionalString(),
    tiempo_homo_siembra_min: optionalNumber(),
    tiempo_homo_valido: optionalBoolean(),
    hora_homogeneizado: optionalString(),
    hora_siembra: optionalString(),
    codigo_agar_baird_parker: optionalString(),
    n_muestra_10g_90ml: optionalNumber(),
    n_muestra_50g_450ml: optionalNumber(),
    id_micropipeta: optionalNumber(),
    codigo_micropipeta: optionalString(),
    id_estufa: optionalNumber(),
    duplicado_ali_ref: optionalString(),
    ctrl_duplicado_cumple: optionalBoolean(),
    ctrl_positivo_blanco_ali: optionalString(),
    ctrl_positivo_cumple: optionalBoolean(),
    ctrl_siembra_ali: optionalString(),
    ctrl_siembra_cumple: optionalBoolean()
});

const etapa1Schema = baseSchema.extend({
    etapa: etapa1PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.fecha_inicio_incubacion && !!e.rut_analista_inicio && !!e.codigo_agar_baird_parker && !!e.peso_muestra_tipo && !!e.id_estufa;
}, { message: 'Campos obligatorios faltantes en etapa 1', path: ['etapa'] });

const etapa2PayloadSchema = z.object({
    ctrl_siembra_s_aureus_ufc: optionalNumber(),
    ctrl_positivo_s_aureus: optionalString(),
    ctrl_negativo_s_epider_ufc: optionalNumber(),
    blanco_ufc: optionalNumber(),
    sd: optionalString(),
    fecha_lectura_24h: optionalIsoDate(),
    rut_analista_24h: optionalString(),
    fecha_lectura_48h: optionalIsoDate(),
    rut_analista_48h: optionalString()
});

const etapa2Schema = baseSchema.extend({
    etapa: etapa2PayloadSchema
});

const etapa3PayloadSchema = z.object({
    fecha_hora_traspaso: optionalIsoDate(),
    rut_analista_traspaso: optionalString(),
    duracion_traspaso_lectura: optionalString(),
    codigo_caldo_bhi: optionalString(),
    id_estufa: optionalNumber(),
    ctrl_positivo_s_aureus: optionalString(),
    ctrl_negativo_s_epider: optionalString(),
    blanco: optionalString(),
    fecha_hora_lectura: optionalIsoDate(),
    rut_analista_lectura: optionalString(),
    observaciones: optionalString()
});

const etapa3Schema = baseSchema.extend({
    etapa: etapa3PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.fecha_hora_traspaso && !!e.rut_analista_traspaso && !!e.id_estufa;
}, { message: 'Campos obligatorios faltantes en etapa 3', path: ['etapa'] });

const etapa4PayloadSchema = z.object({
    fecha_hora_prueba: optionalIsoDate(),
    rut_analista_prueba: optionalString(),
    codigo_tubos_esteriles: optionalString(),
    codigo_puntas_1ml: optionalString(),
    codigo_bacident_agua: optionalString(),
    id_micropipeta: optionalNumber(),
    id_estufa: optionalNumber(),
    fecha_lectura_4_6h: optionalIsoDate(),
    rut_analista_4_6h: optionalString(),
    resultado_coagulasa_4_6h: optionalString(),
    ctrl_positivo_4_6h: optionalString(),
    ctrl_negativo_4_6h: optionalString(),
    blanco_4_6h: optionalString(),
    fecha_lectura_24h: optionalIsoDate(),
    rut_analista_24h: optionalString(),
    resultado_coagulasa_24h: optionalString(),
    ctrl_positivo_24h: optionalString(),
    ctrl_negativo_24h: optionalString(),
    blanco_24h: optionalString()
});

const etapa4Schema = baseSchema.extend({
    etapa: etapa4PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.fecha_hora_prueba && !!e.rut_analista_prueba && !!e.id_estufa;
}, { message: 'Campos obligatorios faltantes en etapa 4', path: ['etapa'] });

const etapa5PayloadSchema = z.object({
    resultados: z.array(z.object({
        n_s_aureus: optionalNumber(),
        ufc_por_g: optionalNumber()
    })).optional()
});

const etapa5Schema = baseSchema.extend({
    etapa: etapa5PayloadSchema
});

const etapa6PayloadSchema = z.object({
    desfavorable: optionalBoolean(),
    tabla_pagina_referencia: optionalString(),
    limite_normativo: optionalString(),
    ctrl_calidad_etapa1_ok: optionalBoolean(),
    fecha_hora_entrega: optionalIsoDate(),
    rut_coordinador_cierre: optionalString(),
    cerrado: optionalBoolean()
});

const etapa6Schema = baseSchema.extend({
    etapa: etapa6PayloadSchema
});

module.exports = {
    etapa1Schema,
    etapa2Schema,
    etapa3Schema,
    etapa4Schema,
    etapa5Schema,
    etapa6Schema
};
