const enterobacteriasRepository = require('../repositories/enterobacterias.repository');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];
const HOURS_24_MS = 24 * 60 * 60 * 1000;

class EnterobacteriasService {
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
            id_ent_formulario: formulario.idEntFormulario?.toString?.(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis?.toString?.(),
            updated_at: formulario.updatedAt instanceof Date ? formulario.updatedAt.toISOString() : formulario.updatedAt
        };
    }

    async obtener(id) {
        const formulario = await enterobacteriasRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        const formulario = await enterobacteriasRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    mapEtapa1Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            codigoAli: raw.codigo_ali ?? raw.codigoAli,
            nActa: raw.n_acta ?? raw.nActa,
            tipoMuestra: raw.tipo_muestra ?? raw.tipoMuestra,
            nMuestra10g90ml: raw.n_muestra_10g_90ml ?? raw.nMuestra10g90ml,
            nMuestra50g450ml: raw.n_muestra_50g_450ml ?? raw.nMuestra50g450ml,
            idBalanza: raw.id_balanza ?? raw.idBalanza,
            fechaInicio: parseDate(raw.fecha_inicio ?? raw.fechaInicio),
            horaInicio: raw.hora_inicio ?? raw.horaInicio,
            rutAnalistaInicio: raw.rut_analista_inicio ?? raw.rutAnalistaInicio,
            fechaHomog: parseDate(raw.fecha_homog ?? raw.fechaHomog),
            horaHomog: raw.hora_homog ?? raw.horaHomog,
            rutAnalistaHomog: raw.rut_analista_homog ?? raw.rutAnalistaHomog,
            idStomacher: raw.id_stomacher ?? raw.idStomacher,
            tiempoHomogenizacion: raw.tiempo_homogenizacion ?? raw.tiempoHomogenizacion,
            idLoteAgarVrbgSembrado: raw.id_lote_agar_vrbg_sembrado ?? raw.idLoteAgarVrbgSembrado,
            idEstufaSembrado: raw.id_estufa_sembrado ?? raw.idEstufaSembrado,
            placasSembrado: raw.placas_sembrado ?? raw.placasSembrado,
            idMicropipeta: raw.id_micropipeta ?? raw.idMicropipeta,
            fechaSembrado: parseDate(raw.fecha_sembrado ?? raw.fechaSembrado),
            horaSembrado: raw.hora_sembrado ?? raw.horaSembrado,
            rutAnalistaSembrado: raw.rut_analista_sembrado ?? raw.rutAnalistaSembrado,
            idEstufaIncub: raw.id_estufa_incub ?? raw.idEstufaIncub,
            fechaInicioIncubacion: parseDate(raw.fecha_inicio_incubacion ?? raw.fechaInicioIncubacion),
            fechaFinIncubacion: parseDate(raw.fecha_fin_incubacion ?? raw.fechaFinIncubacion),
            rutAnalistaIncub: raw.rut_analista_incub ?? raw.rutAnalistaIncub,
            completada: raw.completada
        };
    }

    mapEtapa2Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            fechaLectura24h: parseDate(raw.fecha_lectura_24h ?? raw.fechaLectura24h),
            horaLectura24h: raw.hora_lectura_24h ?? raw.horaLectura24h,
            rutAnalistaLectura: raw.rut_analista_lectura ?? raw.rutAnalistaLectura,
            idEquipoCuentaColonias: raw.id_equipo_cuenta_colonias ?? raw.idEquipoCuentaColonias,
            nMuestraLectura: raw.n_muestra_lectura ?? raw.nMuestraLectura,
            dilucion: raw.dilucion,
            coloniasContadas: raw.colonias_contadas ?? raw.coloniasContadas,
            completada: raw.completada
        };
    }

    mapEtapa3Payload(body) {
        const raw = resolvePayloadSection(body, 'etapa');
        return {
            fechaTraspaso: parseDate(raw.fecha_traspaso ?? raw.fechaTraspaso),
            horaTraspaso: raw.hora_traspaso ?? raw.horaTraspaso,
            rutAnalistaTraspaso: raw.rut_analista_traspaso ?? raw.rutAnalistaTraspaso,
            idAgarNutritivo: raw.id_agar_nutritivo ?? raw.idAgarNutritivo,
            idEstufaConf: raw.id_estufa_conf ?? raw.idEstufaConf,
            fechaLectConf: parseDate(raw.fecha_lect_conf ?? raw.fechaLectConf),
            horaLectConf: raw.hora_lect_conf ?? raw.horaLectConf,
            rutAnalistaLectConf: raw.rut_analista_lect_conf ?? raw.rutAnalistaLectConf,
            fechaOxidasa: parseDate(raw.fecha_oxidasa ?? raw.fechaOxidasa),
            horaOxidasa: raw.hora_oxidasa ?? raw.horaOxidasa,
            rutAnalistaOxidasa: raw.rut_analista_oxidasa ?? raw.rutAnalistaOxidasa,
            reactivoOxidasa: raw.reactivo_oxidasa ?? raw.reactivoOxidasa,
            desaireadoAgarGlucosa: raw.desaireado_agar_glucosa ?? raw.desaireadoAgarGlucosa,
            agarGlucosa: raw.agar_glucosa ?? raw.agarGlucosa,
            controlPosEcoli: raw.control_pos_ecoli ?? raw.controlPosEcoli,
            controlNegPaer: raw.control_neg_paer ?? raw.controlNegPaer,
            blanco: raw.blanco,
            muestraB: raw.muestra_b ?? raw.muestraB,
            muestraA: raw.muestra_a ?? raw.muestraA,
            d: raw.d,
            n1: raw.n1,
            n2: raw.n2,
            m: raw.m,
            sumaA: raw.suma_a ?? raw.sumaA,
            observaciones: raw.observaciones,
            completada: raw.completada
        };
    }

    stripUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
    }

    async _assertStageProgression(formulario, etapaNum) {
        if (etapaNum <= 1) return;

        if (etapaNum === 2) {
            if (!formulario.etapa1?.completada) {
                throw new Error('INVALID_STAGE_PROGRESSION');
            }
            return;
        }

        if (etapaNum === 3) {
            if (!formulario.etapa2?.completada) {
                throw new Error('INVALID_STAGE_PROGRESSION');
            }
        }
    }

    _assertIncubationLockout(formulario, etapaNum, completada) {
        if (etapaNum !== 2 || !completada) return;

        const inicio = formulario.etapa1?.fechaInicioIncubacion;
        if (!inicio) {
            throw new Error('INCUBATION_LOCKOUT');
        }

        const inicioTime = inicio instanceof Date ? inicio.getTime() : new Date(inicio).getTime();
        const ahora = Date.now();
        const diff = ahora - inicioTime;

        if (diff < HOURS_24_MS) {
            const error = new Error('INCUBATION_LOCKOUT');
            error.horasRestantes = Math.ceil((HOURS_24_MS - diff) / (60 * 60 * 1000));
            error.detalles = { horas_restantes: error.horasRestantes };
            throw error;
        }
    }

    _resolveEtapaActual(body, defaultValue) {
        return body.etapa_actual ?? body.etapaActual ?? defaultValue;
    }

    _resolveSubetapaActual(body, defaultValue) {
        return body.subetapa_actual ?? body.subetapaActual ?? defaultValue;
    }

    async guardarEtapa(id, etapa, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const etapaNum = Number(etapa);

        if (Number.isNaN(etapaNum) || etapaNum < 1 || etapaNum > 3) {
            throw new Error('INVALID_ETAPA');
        }

        const formulario = await enterobacteriasRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        await this._assertStageProgression(formulario, etapaNum);

        let actualizado;
        const completada = resolvePayloadSection(body, 'etapa').completada ?? body.completada;

        switch (etapaNum) {
            case 1:
                actualizado = await enterobacteriasRepository.upsertEtapa1(id, {
                    etapa: this.stripUndefined(this.mapEtapa1Payload(body)),
                    etapaActual: this._resolveEtapaActual(body, completada ? 2 : 1),
                    subetapaActual: this._resolveSubetapaActual(body, 1)
                }, expectedUpdatedAt);
                break;
            case 2:
                this._assertIncubationLockout(formulario, etapaNum, completada);
                actualizado = await enterobacteriasRepository.upsertEtapa2(id, {
                    etapa: this.stripUndefined(this.mapEtapa2Payload(body)),
                    etapaActual: this._resolveEtapaActual(body, 3),
                    subetapaActual: this._resolveSubetapaActual(body, 5)
                }, expectedUpdatedAt);
                break;
            case 3:
                actualizado = await enterobacteriasRepository.upsertEtapa3(id, {
                    etapa: this.stripUndefined(this.mapEtapa3Payload(body)),
                    etapaActual: this._resolveEtapaActual(body, 3),
                    subetapaActual: this._resolveSubetapaActual(body, 8),
                    estado: completada ? 'cerrado' : 'en_proceso'
                }, expectedUpdatedAt);
                break;
            default:
                throw new Error('INVALID_ETAPA');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new EnterobacteriasService();
