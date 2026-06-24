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

const reactivoOxidasa = () => z.string()
    .regex(/^R69-\d{2}-(0[12])$/, { message: 'Formato debe ser R69-AA-NN donde NN es 01 o 02' })
    .optional()
    .or(z.literal(''))
    .or(z.literal(null))
    .transform(emptyToUndefined);

// ============================================================
// ENTEROBACTERIAS — Etapas 1-3 (sub-etapas aplanadas)
// ============================================================

const etapa1PayloadSchema = z.object({
    codigo_ali: optionalString(),
    n_acta: optionalString(),
    tipo_muestra: optionalString(),
    n_muestra_10g_90ml: optionalNumber(),
    n_muestra_50g_450ml: optionalNumber(),
    id_balanza: optionalNumber(),
    fecha_inicio: optionalString(),
    hora_inicio: optionalString(),
    rut_analista_inicio: optionalString(),
    fecha_homog: optionalString(),
    hora_homog: optionalString(),
    rut_analista_homog: optionalString(),
    id_stomacher: optionalNumber(),
    tiempo_homogenizacion: optionalNumber(),
    id_lote_agar_vrbg_sembrado: optionalNumber(),
    id_estufa_sembrado: optionalNumber(),
    placas_sembrado: optionalNumber(),
    id_micropipeta: optionalNumber(),
    fecha_sembrado: optionalString(),
    hora_sembrado: optionalString(),
    rut_analista_sembrado: optionalString(),
    id_estufa_incub: optionalNumber(),
    fecha_inicio_incubacion: optionalIsoDate(),
    fecha_fin_incubacion: optionalIsoDate(),
    rut_analista_incub: optionalString()
});

const etapa1Schema = baseSchema.extend({
    etapa: etapa1PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.codigo_ali && !!e.n_acta && !!e.tipo_muestra
        && !!e.fecha_inicio && !!e.hora_inicio && !!e.rut_analista_inicio
        && !!e.fecha_homog && !!e.hora_homog && !!e.rut_analista_homog
        && !!e.id_lote_agar_vrbg_sembrado && !!e.id_estufa_sembrado && !!e.placas_sembrado
        && !!e.id_micropipeta && !!e.fecha_sembrado && !!e.hora_sembrado && !!e.rut_analista_sembrado
        && !!e.id_estufa_incub && !!e.fecha_inicio_incubacion && !!e.fecha_fin_incubacion && !!e.rut_analista_incub;
}, { message: 'Campos obligatorios faltantes en etapa 1', path: ['etapa'] });

const etapa2PayloadSchema = z.object({
    fecha_lectura_24h: optionalIsoDate(),
    hora_lectura_24h: optionalString(),
    rut_analista_lectura: optionalString(),
    id_equipo_cuenta_colonias: optionalNumber(),
    n_muestra_lectura: optionalNumber(),
    dilucion: optionalNumber(),
    colonias_contadas: optionalNumber()
});

const etapa2Schema = baseSchema.extend({
    etapa: etapa2PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.fecha_lectura_24h && !!e.hora_lectura_24h && !!e.rut_analista_lectura
        && !!e.id_equipo_cuenta_colonias && !!e.n_muestra_lectura && !!e.dilucion && !!e.colonias_contadas;
}, { message: 'Campos obligatorios faltantes en etapa 2', path: ['etapa'] });

const etapa3PayloadSchema = z.object({
    fecha_traspaso: optionalString(),
    hora_traspaso: optionalString(),
    rut_analista_traspaso: optionalString(),
    id_agar_nutritivo: optionalNumber(),
    id_estufa_conf: optionalNumber(),
    fecha_lect_conf: optionalString(),
    hora_lect_conf: optionalString(),
    rut_analista_lect_conf: optionalString(),
    fecha_oxidasa: optionalString(),
    hora_oxidasa: optionalString(),
    rut_analista_oxidasa: optionalString(),
    reactivo_oxidasa: reactivoOxidasa(),
    desaireado_agar_glucosa: optionalString(),
    agar_glucosa: optionalString(),
    control_pos_ecoli: optionalString(),
    control_neg_paer: optionalString(),
    blanco: optionalString(),
    muestra_b: optionalNumber(),
    muestra_a: optionalNumber(),
    d: optionalNumber(),
    n1: optionalNumber(),
    n2: optionalNumber(),
    m: optionalNumber(),
    suma_a: optionalNumber(),
    observaciones: optionalString()
});

const etapa3Schema = baseSchema.extend({
    etapa: etapa3PayloadSchema
}).refine((data) => {
    if (!data.completada) return true;
    const e = data.etapa;
    return !!e.fecha_traspaso && !!e.hora_traspaso && !!e.rut_analista_traspaso
        && !!e.id_agar_nutritivo && !!e.id_estufa_conf
        && !!e.fecha_lect_conf && !!e.hora_lect_conf && !!e.rut_analista_lect_conf
        && !!e.fecha_oxidasa && !!e.hora_oxidasa && !!e.rut_analista_oxidasa && !!e.reactivo_oxidasa
        && !!e.desaireado_agar_glucosa && !!e.agar_glucosa && !!e.control_pos_ecoli && !!e.control_neg_paer && !!e.blanco;
}, { message: 'Campos obligatorios faltantes en etapa 3', path: ['etapa'] });

module.exports = {
    etapa1Schema,
    etapa2Schema,
    etapa3Schema
};
