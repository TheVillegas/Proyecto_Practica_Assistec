const saureusRepository = require('../repositories/saureus.repository');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

class SaureusService {
    assertCanWrite(usuario) {
        const roles = Array.isArray(usuario.roles) ? usuario.roles : [];
        if (!roles.some((role) => WRITE_ROLES.includes(role))) {
            throw new Error('UNAUTHORIZED_ROLE');
        }
    }

    serializeFormulario(formulario) {
        if (!formulario) {
            return null;
        }
        const serialized = serializePrismaRecord(formulario);
        return {
            ...serialized,
            id_sau_formulario: formulario.idSauFormulario.toString(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis.toString(),
            updated_at: formulario.updatedAt
        };
    }

    async crear(data, usuario) {
        this.assertCanWrite(usuario);

        const idSolicitudAnalisis = data.id_solicitud_analisis ?? data.idSolicitudAnalisis;
        if (!idSolicitudAnalisis) {
            throw new Error('MISSING_SOLICITUD_ANALISIS');
        }

        const muestras = data.muestras ?? [];
        if (!muestras.length) {
            throw new Error('MISSING_MUESTRAS');
        }

        const existente = await saureusRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (existente) {
            throw new Error('FORMULARIO_ALREADY_EXISTS');
        }

        const creado = await saureusRepository.create({
            idSolicitudAnalisis,
            rutAnalista: usuario.id,
            muestras: muestras.map((m, index) => ({
                idSolicitudMuestra: m.id_solicitud_muestra ?? m.idSolicitudMuestra,
                numeroMuestra: m.numero_muestra ?? m.numeroMuestra ?? String(index + 1),
                esDuplicado: m.es_duplicado ?? m.esDuplicado ?? false,
                orden: m.orden ?? index + 1
            }))
        });

        return this.serializeFormulario(creado);
    }

    async obtener(id) {
        const formulario = await saureusRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        const formulario = await saureusRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    mapEtapaPayload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            fechaInicioIncubacion: parseDate(raw.fecha_inicio_incubacion ?? raw.fechaInicioIncubacion),
            rutAnalistaInicio: raw.rut_analista_inicio ?? raw.rutAnalistaInicio,
            fechaTerminoAnalisis: parseDate(raw.fecha_termino_analisis ?? raw.fechaTerminoAnalisis),
            rutAnalistaTermino: raw.rut_analista_termino ?? raw.rutAnalistaTermino,
            tiempoHomoSiembraMin: raw.tiempo_homo_siembra_min ?? raw.tiempoHomoSiembraMin,
            tiempoHomoValido: raw.tiempo_homo_valido ?? raw.tiempoHomoValido,
            codigoAgarBairdParker: raw.codigo_agar_baird_parker ?? raw.codigoAgarBairdParker,
            pesoMuestraTipo: raw.peso_muestra_tipo ?? raw.pesoMuestraTipo,
            idEstufa: raw.id_estufa ?? raw.idEstufa,
            duplicadoAliRef: raw.duplicado_ali_ref ?? raw.duplicadoAliRef,
            ctrlDuplicadoCumple: raw.ctrl_duplicado_cumple ?? raw.ctrlDuplicadoCumple,
            ctrlPositivoBlancoAli: raw.ctrl_positivo_blanco_ali ?? raw.ctrlPositivoBlancoAli,
            ctrlPositivoCumple: raw.ctrl_positivo_cumple ?? raw.ctrlPositivoCumple,
            ctrlSiembraAli: raw.ctrl_siembra_ali ?? raw.ctrlSiembraAli,
            ctrlSiembraCumple: raw.ctrl_siembra_cumple ?? raw.ctrlSiembraCumple,
            completada: raw.completada
        };
    }

    mapEtapa2Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            ctrlSiembraSAureusUfc: raw.ctrl_siembra_s_aureus_ufc ?? raw.ctrlSiembraSAureusUfc,
            ctrlPositivoSAureus: raw.ctrl_positivo_s_aureus ?? raw.ctrlPositivoSAureus,
            ctrlNegativoSEpiderUfc: raw.ctrl_negativo_s_epider_ufc ?? raw.ctrlNegativoSEpiderUfc,
            blancoUfc: raw.blanco_ufc ?? raw.blancoUfc,
            sd: raw.sd,
            fechaLectura24h: parseDate(raw.fecha_lectura_24h ?? raw.fechaLectura24h),
            rutAnalista24h: raw.rut_analista_24h ?? raw.rutAnalista24h,
            fechaLectura48h: parseDate(raw.fecha_lectura_48h ?? raw.fechaLectura48h),
            rutAnalista48h: raw.rut_analista_48h ?? raw.rutAnalista48h,
            completada: raw.completada
        };
    }

    mapEtapa3Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            fechaHoraTraspaso: parseDate(raw.fecha_hora_traspaso ?? raw.fechaHoraTraspaso),
            rutAnalistaTraspaso: raw.rut_analista_traspaso ?? raw.rutAnalistaTraspaso,
            duracionTraspasoLectura: raw.duracion_traspaso_lectura ?? raw.duracionTraspasoLectura,
            codigoCaldoBhi: raw.codigo_caldo_bhi ?? raw.codigoCaldoBhi,
            idEstufa: raw.id_estufa ?? raw.idEstufa,
            ctrlPositivoSAureus: raw.ctrl_positivo_s_aureus ?? raw.ctrlPositivoSAureus,
            ctrlNegativoSEpider: raw.ctrl_negativo_s_epider ?? raw.ctrlNegativoSEpider,
            blanco: raw.blanco,
            fechaHoraLectura: parseDate(raw.fecha_hora_lectura ?? raw.fechaHoraLectura),
            rutAnalistaLectura: raw.rut_analista_lectura ?? raw.rutAnalistaLectura,
            observaciones: raw.observaciones,
            completada: raw.completada
        };
    }

    mapEtapa4Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            fechaHoraPrueba: parseDate(raw.fecha_hora_prueba ?? raw.fechaHoraPrueba),
            rutAnalistaPrueba: raw.rut_analista_prueba ?? raw.rutAnalistaPrueba,
            codigoTubosEsteriles: raw.codigo_tubos_esteriles ?? raw.codigoTubosEsteriles,
            codigoPuntas1ml: raw.codigo_puntas_1ml ?? raw.codigoPuntas1ml,
            codigoBacidentAgua: raw.codigo_bacident_agua ?? raw.codigoBacidentAgua,
            idMicropipeta: raw.id_micropipeta ?? raw.idMicropipeta,
            idEstufa: raw.id_estufa ?? raw.idEstufa,
            fechaLectura46h: parseDate(raw.fecha_lectura_4_6h ?? raw.fechaLectura46h),
            rutAnalista46h: raw.rut_analista_4_6h ?? raw.rutAnalista46h,
            resultadoCoagulasa46h: raw.resultado_coagulasa_4_6h ?? raw.resultadoCoagulasa46h,
            ctrlPositivo46h: raw.ctrl_positivo_4_6h ?? raw.ctrlPositivo46h,
            ctrlNegativo46h: raw.ctrl_negativo_4_6h ?? raw.ctrlNegativo46h,
            blanco46h: raw.blanco_4_6h ?? raw.blanco46h,
            fechaLectura24h: parseDate(raw.fecha_lectura_24h ?? raw.fechaLectura24h),
            rutAnalista24h: raw.rut_analista_24h ?? raw.rutAnalista24h,
            resultadoCoagulasa24h: raw.resultado_coagulasa_24h ?? raw.resultadoCoagulasa24h,
            ctrlPositivo24h: raw.ctrl_positivo_24h ?? raw.ctrlPositivo24h,
            ctrlNegativo24h: raw.ctrl_negativo_24h ?? raw.ctrlNegativo24h,
            blanco24h: raw.blanco_24h ?? raw.blanco24h,
            completada: raw.completada
        };
    }

    mapEtapa6Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            desfavorable: raw.desfavorable,
            tablaPaginaReferencia: raw.tabla_pagina_referencia ?? raw.tablaPaginaReferencia,
            limiteNormativo: raw.limite_normativo ?? raw.limiteNormativo,
            ctrlCalidadEtapa1Ok: raw.ctrl_calidad_etapa1_ok ?? raw.ctrlCalidadEtapa1Ok,
            fechaHoraEntrega: parseDate(raw.fecha_hora_entrega ?? raw.fechaHoraEntrega),
            rutCoordinadorCierre: raw.rut_coordinador_cierre ?? raw.rutCoordinadorCierre,
            cerrado: raw.cerrado
        };
    }

    stripUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
    }

    async guardarEtapa(id, etapa, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const etapaNum = Number(etapa);
        let actualizado;

        switch (etapaNum) {
            case 1:
                actualizado = await saureusRepository.upsertEtapa1(id, {
                    etapa: this.stripUndefined(this.mapEtapaPayload(body)),
                    micropipetas: body.micropipetas,
                    lecturas: body.lecturas,
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 1
                }, expectedUpdatedAt);
                break;
            case 2:
                actualizado = await saureusRepository.upsertEtapa2(id, {
                    etapa: this.stripUndefined(this.mapEtapa2Payload(body)),
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 2
                }, expectedUpdatedAt);
                break;
            case 3:
                actualizado = await saureusRepository.upsertEtapa3(id, {
                    etapa: this.stripUndefined(this.mapEtapa3Payload(body)),
                    lecturas: body.lecturas,
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 3
                }, expectedUpdatedAt);
                break;
            case 4:
                actualizado = await saureusRepository.upsertEtapa4(id, {
                    etapa: this.stripUndefined(this.mapEtapa4Payload(body)),
                    lecturas: body.lecturas,
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 4
                }, expectedUpdatedAt);
                break;
            case 5:
                actualizado = await saureusRepository.upsertEtapa5Resultados(id, {
                    resultados: body.resultados,
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 5
                }, expectedUpdatedAt);
                break;
            case 6:
                actualizado = await saureusRepository.upsertEtapa6Cierre(id, {
                    etapa: this.stripUndefined(this.mapEtapa6Payload(body)),
                    etapaActual: body.etapa_actual ?? body.etapaActual ?? 6,
                    estado: body.estado
                }, expectedUpdatedAt);
                break;
            default:
                throw new Error('INVALID_ETAPA');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new SaureusService();
