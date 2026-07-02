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
const idRef = () => z.union([z.string(), z.number()]);

// ============================================================
// SALMONELLA — wizard de 10 pasos (URL fase 1-10)
//
// Cada fase{N}Schema valida el body REAL que recibe
// PUT /sal/:id/fase/:fase para ese N, segun lo leido en
// salmonella.service.js#guardarFase (case N). Ver ese archivo
// para el mapeo completo fase -> modelo Prisma.
// ============================================================

// ---- Fase 1 (URL 1) -> SalFase1 ----
const fase1PayloadSchema = z.object({
    fecha_hora_inicio_incubacion: optionalIsoDate(),
    tipo_matriz: optionalString(),
    peso_muestra: optionalString(),
    id_medio_caldo_homogeneizacion: optionalNumber(),
    caldo_asignado_auto: optionalNumber(),
    hora_inicio_hidratacion: optionalIsoDate(),
    hora_termino_hidratacion: optionalIsoDate(),
    hidratacion_valida: optionalBoolean()
});

const fase1Schema = baseSchema.extend({
    fase: fase1PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const f = data.fase;
    return !!f.fecha_hora_inicio_incubacion && !!f.tipo_matriz && !!f.peso_muestra && !!f.id_medio_caldo_homogeneizacion;
}, { message: 'Campos obligatorios faltantes en fase 1', path: ['fase'] });

// ---- Fase 2 (URL 2) -> SalFase2a ----
// El servicio lee `body.fase2a` con fallback a `body.fase`
// (ver salmonella.service.js guardarFase case 2), asi que
// se aceptan ambas claves.
const fase2aPayloadSchema = z.object({
    fecha_siembra: optionalIsoDate(),
    hora_inicio_homo: optionalIsoDate(),
    hora_termino_homo: optionalIsoDate(),
    hora_ingreso_estufa: optionalIsoDate(),
    minutos_homo_a_estufa: optionalNumber(),
    alerta_tiempo_25min: optionalBoolean(),
    rut_analista_responsable: optionalString(),
    fecha_termino_analisis: optionalIsoDate()
});

const fase2Schema = baseSchema.extend({
    fase2a: fase2aPayloadSchema.optional(),
    fase: fase2aPayloadSchema.optional()
});

// ---- Fase 3 (URL 3) -> SalFase2b ----
const fase2bPayloadSchema = z.object({
    id_medio_caldo: optionalNumber(),
    volumen_caldo: optionalString(),
    id_estufa: optionalNumber(),
    id_bano: optionalNumber()
});

const fase3Schema = baseSchema.extend({
    fase: fase2bPayloadSchema,
    tween_pipetas: z.array(z.object({ id_material: optionalNumber() })).optional(),
    micropipetas: z.array(z.object({ id_pipeta: optionalNumber() })).optional()
});

// ---- Fase 4 (URL 4) -> SalFase2c ----
const fase2cPayloadSchema = z.object({
    descripcion_ctrl_analisis: optionalString(),
    resultado_ctrl_analisis: optionalBoolean(),
    ctrl_positivo_blanco_ali: optionalString(),
    resultado_ctrl_positivo: optionalBoolean(),
    ctrl_siembra_ali: optionalString(),
    resultado_ctrl_siembra: optionalBoolean(),
    desfavorable: optionalBoolean(),
    tabla_pagina: optionalString(),
    limite: optionalString(),
    fecha_hora_entrega: optionalIsoDate()
});

const fase4Schema = baseSchema.extend({
    fase: fase2cPayloadSchema
});

// ---- Fase 5 (URL 5) -> SalFase3a ----
const fase3aPayloadSchema = z.object({
    fecha_traspaso: optionalIsoDate(),
    hora_lectura_caldo_apt: optionalIsoDate(),
    rut_analista_caldo_apt: optionalString(),
    hora_lectura_caldos_finales: optionalIsoDate(),
    rut_analista_caldos_finales: optionalString()
});

const fase5Schema = baseSchema.extend({
    fase: fase3aPayloadSchema
});

// ---- Fase 6 (URL 6) -> SalFase3b ----
const fase3bPayloadSchema = z.object({
    id_estufa_selenito: optionalNumber(),
    id_bano_selenito: optionalNumber(),
    id_estufa_rappaport: optionalNumber(),
    id_bano_rappaport: optionalNumber()
});

const fase6Schema = baseSchema.extend({
    fase: fase3bPayloadSchema,
    pipetas: z.array(z.object({
        id_material: optionalNumber(),
        tipo_material: optionalString()
    })).optional(),
    micropipetas: z.array(z.object({ id_pipeta: optionalNumber() })).optional()
});

// ---- Fase 7 (URL 7) -> SalFase3cLectura (array por muestra) ----
const fase3cLecturaSchema = z.object({
    id_sal_muestra: idRef(),
    resultado_caldo_apt: optionalBoolean(),
    resultado_selenito: optionalBoolean(),
    resultado_rappaport: optionalBoolean(),
    ctrl_positivo_s_enteritidis: optionalBoolean(),
    ctrl_negativo_k_pneumoniae: optionalBoolean(),
    ctrl_blanco: optionalBoolean()
});

const fase7Schema = baseSchema.extend({
    lecturas: z.array(fase3cLecturaSchema).optional()
});

// ---- Fase 8 (URL 8) -> SalFase4a ----
const fase4aPayloadSchema = z.object({
    fecha_hora_traspaso_agares: optionalIsoDate(),
    rut_analista_traspaso: optionalString(),
    id_medio_agar_xld: optionalNumber(),
    id_medio_agar_ss: optionalNumber(),
    id_estufa_agares: optionalNumber(),
    id_bano_agares: optionalNumber(),
    fecha_hora_lectura_24h: optionalIsoDate(),
    rut_analista_lectura_24h: optionalString(),
    fecha_hora_lectura_48h: optionalIsoDate(),
    rut_analista_lectura_48h: optionalString()
});

const fase8Schema = baseSchema.extend({
    fase: fase4aPayloadSchema
});

// ---- Fase 9 (URL 9) -> SalFase4bLectura (array por muestra) ----
const fase4bLecturaSchema = z.object({
    id_sal_muestra: idRef(),
    id_sal_fase4a: idRef(),
    res_xld_24h_selenito: optionalString(),
    res_ss_24h_selenito: optionalString(),
    res_xld_48h_selenito: optionalString(),
    res_ss_48h_selenito: optionalString(),
    res_xld_24h_rappaport: optionalString(),
    res_ss_24h_rappaport: optionalString(),
    res_xld_48h_rappaport: optionalString(),
    res_ss_48h_rappaport: optionalString(),
    ctrl_positivo_s_enteritidis: optionalBoolean(),
    ctrl_negativo_k_pneumoniae: optionalBoolean(),
    ctrl_blanco: optionalBoolean()
});

const fase9Schema = baseSchema.extend({
    lecturas: z.array(fase4bLecturaSchema).optional()
});

// ---- Fase 10 (URL 10) -> SalFase5Resultado ----
// El resultado final se calcula server-side (_calcularResultadosFase5)
// a partir de las lecturas ya guardadas; el body solo necesita
// completada/updated_at (heredado de baseSchema).
const fase10Schema = baseSchema;

module.exports = {
    fase1Schema,
    fase2Schema,
    fase3Schema,
    fase4Schema,
    fase5Schema,
    fase6Schema,
    fase7Schema,
    fase8Schema,
    fase9Schema,
    fase10Schema
};
