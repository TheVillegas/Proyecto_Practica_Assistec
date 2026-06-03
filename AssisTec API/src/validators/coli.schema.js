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
// COLIFORMES — Fases 1-4
// ============================================================

const fase1PayloadSchema = z.object({
    fecha_inicio_incubacion: optionalIsoDate(),
    rut_analista_inicio: optionalString(),
    fecha_termino_analisis: optionalIsoDate(),
    rut_analista_termino: optionalString()
});

const fase1Schema = baseSchema.extend({
    fase: fase1PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const f = data.fase;
    return !!f.fecha_inicio_incubacion && !!f.rut_analista_inicio;
}, { message: 'Campos obligatorios faltantes en fase 1', path: ['fase'] });

const fase2PayloadSchema = z.object({
    codigo_caldo_lauril: optionalString(),
    codigo_tween_80: optionalString()
});

const fase2Schema = baseSchema.extend({
    fase: fase2PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    return !!data.fase.codigo_caldo_lauril;
}, { message: 'Campos obligatorios faltantes en fase 2', path: ['fase'] });

const fase3PayloadSchema = z.object({
    fecha_lectura_24h: optionalIsoDate(),
    rut_analista_24h: optionalString(),
    lectura_24h_en_tolerancia: optionalBoolean(),
    fecha_lectura_48h: optionalIsoDate(),
    rut_analista_48h: optionalString(),
    lectura_48h_en_tolerancia: optionalBoolean()
});

const fase3Schema = baseSchema.extend({
    fase: fase3PayloadSchema
});

const fase4PayloadSchema = z.object({
    resultados: z.array(z.object({
        coliformes_totales: optionalNumber(),
        coliformes_fecales: optionalNumber(),
        e_coli: optionalNumber()
    })).optional()
});

const fase4Schema = baseSchema.extend({
    fase: fase4PayloadSchema
});

module.exports = {
    fase1Schema,
    fase2Schema,
    fase3Schema,
    fase4Schema
};
