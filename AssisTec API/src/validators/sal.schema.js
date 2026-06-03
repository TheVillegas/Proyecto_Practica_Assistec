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
// SALMONELLA — Fases 1-5
// ============================================================

const fase1PayloadSchema = z.object({
    fecha_hora_inicio_incubacion: optionalIsoDate(),
    tipo_matriz: optionalString(),
    peso_muestra: optionalString(),
    caldo_homogeneizacion: optionalString(),
    caldo_asignado_auto: optionalBoolean(),
    hora_inicio_hidratacion: optionalIsoDate(),
    hora_termino_hidratacion: optionalIsoDate(),
    hidratacion_valida: optionalBoolean()
});

const fase1Schema = baseSchema.extend({
    fase: fase1PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const f = data.fase;
    return !!f.fecha_hora_inicio_incubacion && !!f.tipo_matriz && !!f.peso_muestra && !!f.caldo_homogeneizacion;
}, { message: 'Campos obligatorios faltantes en fase 1', path: ['fase'] });

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

const fase2aSchema = baseSchema.extend({
    fase: fase2aPayloadSchema
});

const fase2bPayloadSchema = z.object({
    codigo_caldo_apt_leche: optionalString(),
    id_estufa: optionalNumber()
});

const fase2bSchema = baseSchema.extend({
    fase: fase2bPayloadSchema
});

const fase2cPayloadSchema = z.object({
    descripcion_ctrl_analisis: optionalString(),
    resultado_ctrl_analisis: optionalBoolean(),
    ctrl_positivo_blanco_ali: optionalString(),
    resultado_ctrl_positivo: optionalBoolean(),
    ctrl_siembra_ali: optionalString(),
    resultado_ctrl_siembra: optionalBoolean()
});

const fase2cSchema = baseSchema.extend({
    fase: fase2cPayloadSchema
});

const fase3PayloadSchema = z.object({
    fecha_traspaso: optionalIsoDate(),
    hora_lectura_caldo_apt: optionalIsoDate(),
    rut_analista_caldo_apt: optionalString(),
    hora_lectura_caldos_finales: optionalIsoDate(),
    rut_analista_caldos_finales: optionalString()
});

const fase3Schema = baseSchema.extend({
    fase: fase3PayloadSchema
});

const fase4PayloadSchema = z.object({
    fecha_hora_traspaso_agares: optionalIsoDate(),
    rut_analista_traspaso: optionalString(),
    codigo_agar_xld: optionalString(),
    codigo_agar_ss: optionalString(),
    id_estufa_agares: optionalNumber(),
    fecha_hora_lectura_24h: optionalIsoDate(),
    rut_analista_lectura_24h: optionalString(),
    fecha_hora_lectura_48h: optionalIsoDate(),
    rut_analista_lectura_48h: optionalString()
});

const fase4Schema = baseSchema.extend({
    fase: fase4PayloadSchema
});

const fase5PayloadSchema = z.object({
    resultado_final: optionalString()
});

const fase5Schema = baseSchema.extend({
    fase: fase5PayloadSchema
});

module.exports = {
    fase1Schema,
    fase2aSchema,
    fase2bSchema,
    fase2cSchema,
    fase3Schema,
    fase3aSchema: fase3Schema,
    fase3bSchema: fase3Schema,
    fase3cSchema: fase3Schema,
    fase4Schema,
    fase4aSchema: fase4Schema,
    fase4bSchema: fase4Schema,
    fase5Schema
};
