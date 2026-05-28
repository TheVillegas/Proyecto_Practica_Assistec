const salmonellaRepository = require('../repositories/salmonella.repository');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

class SalmonellaService {
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
            id_sal_formulario: formulario.idSalFormulario.toString(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis.toString(),
            updated_at: formulario.updatedAt
        };
    }

    stripUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
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

        const existente = await salmonellaRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (existente) {
            throw new Error('FORMULARIO_ALREADY_EXISTS');
        }

        const creado = await salmonellaRepository.create({
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
        const formulario = await salmonellaRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        const formulario = await salmonellaRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    mapFase1(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaHoraInicioIncubacion: parseDate(raw.fecha_hora_inicio_incubacion ?? raw.fechaHoraInicioIncubacion),
            tipoMatriz: raw.tipo_matriz ?? raw.tipoMatriz,
            pesoMuestra: raw.peso_muestra ?? raw.pesoMuestra,
            caldoHomogeneizacion: raw.caldo_homogeneizacion ?? raw.caldoHomogeneizacion,
            caldoAsignadoAuto: raw.caldo_asignado_auto ?? raw.caldoAsignadoAuto,
            horaInicioHidratacion: parseDate(raw.hora_inicio_hidratacion ?? raw.horaInicioHidratacion),
            horaTerminoHidratacion: parseDate(raw.hora_termino_hidratacion ?? raw.horaTerminoHidratacion),
            hidratacionValida: raw.hidratacion_valida ?? raw.hidratacionValida,
            completada: raw.completada
        });
    }

    mapFase2a(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaSiembra: parseDate(raw.fecha_siembra ?? raw.fechaSiembra),
            horaInicioHomo: parseDate(raw.hora_inicio_homo ?? raw.horaInicioHomo),
            horaTerminoHomo: parseDate(raw.hora_termino_homo ?? raw.horaTerminoHomo),
            horaIngresoEstufa: parseDate(raw.hora_ingreso_estufa ?? raw.horaIngresoEstufa),
            minutosHomoAEstufa: raw.minutos_homo_a_estufa ?? raw.minutosHomoAEstufa,
            alertaTiempo25min: raw.alerta_tiempo_25min ?? raw.alertaTiempo25min,
            rutAnalistaResponsable: raw.rut_analista_responsable ?? raw.rutAnalistaResponsable,
            fechaTerminoAnalisis: parseDate(raw.fecha_termino_analisis ?? raw.fechaTerminoAnalisis),
            completada: raw.completada
        });
    }

    mapFase2b(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            codigoCaldoAptLeche: raw.codigo_caldo_apt_leche ?? raw.codigoCaldoAptLeche,
            idEstufa: raw.id_estufa ?? raw.idEstufa,
            completada: raw.completada
        });
    }

    mapFase2c(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            descripcionCtrlAnalisis: raw.descripcion_ctrl_analisis ?? raw.descripcionCtrlAnalisis,
            resultadoCtrlAnalisis: raw.resultado_ctrl_analisis ?? raw.resultadoCtrlAnalisis,
            ctrlPositivoBlancoAli: raw.ctrl_positivo_blanco_ali ?? raw.ctrlPositivoBlancoAli,
            resultadoCtrlPositivo: raw.resultado_ctrl_positivo ?? raw.resultadoCtrlPositivo,
            ctrlSiembraAli: raw.ctrl_siembra_ali ?? raw.ctrlSiembraAli,
            resultadoCtrlSiembra: raw.resultado_ctrl_siembra ?? raw.resultadoCtrlSiembra,
            completada: raw.completada
        });
    }

    mapFase3a(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaTraspaso: parseDate(raw.fecha_traspaso ?? raw.fechaTraspaso),
            horaLecturaCaldoApt: parseDate(raw.hora_lectura_caldo_apt ?? raw.horaLecturaCaldoApt),
            rutAnalistaCaldoApt: raw.rut_analista_caldo_apt ?? raw.rutAnalistaCaldoApt,
            horaLecturaCaldosFinales: parseDate(raw.hora_lectura_caldos_finales ?? raw.horaLecturaCaldosFinales),
            rutAnalistaCaldosFinales: raw.rut_analista_caldos_finales ?? raw.rutAnalistaCaldosFinales,
            completada: raw.completada
        });
    }

    mapFase3b(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            idEstufaSelenito: raw.id_estufa_selenito ?? raw.idEstufaSelenito,
            completada: raw.completada
        });
    }

    mapFase4a(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaHoraTraspasoAgares: parseDate(raw.fecha_hora_traspaso_agares ?? raw.fechaHoraTraspasoAgares),
            rutAnalistaTraspaso: raw.rut_analista_traspaso ?? raw.rutAnalistaTraspaso,
            codigoAgarXld: raw.codigo_agar_xld ?? raw.codigoAgarXld,
            codigoAgarSs: raw.codigo_agar_ss ?? raw.codigoAgarSs,
            idEstufaAgares: raw.id_estufa_agares ?? raw.idEstufaAgares,
            fechaHoraLectura24h: parseDate(raw.fecha_hora_lectura_24h ?? raw.fechaHoraLectura24h),
            rutAnalistaLectura24h: raw.rut_analista_lectura_24h ?? raw.rutAnalistaLectura24h,
            fechaHoraLectura48h: parseDate(raw.fecha_hora_lectura_48h ?? raw.fechaHoraLectura48h),
            rutAnalistaLectura48h: raw.rut_analista_lectura_48h ?? raw.rutAnalistaLectura48h,
            completada: raw.completada
        });
    }

    async guardarFase(id, fase, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const faseKey = String(fase).toLowerCase();
        let actualizado;

        switch (faseKey) {
            case '1':
                actualizado = await salmonellaRepository.upsertFase1(id, {
                    fase: this.mapFase1(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 1
                }, expectedUpdatedAt);
                break;
            case '2a':
                actualizado = await salmonellaRepository.upsertFase2a(id, {
                    fase: this.mapFase2a(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 2
                }, expectedUpdatedAt);
                break;
            case '2b':
                actualizado = await salmonellaRepository.upsertFase2b(id, {
                    fase: this.mapFase2b(body),
                    tweenPipetas: body.tween_pipetas ?? body.tweenPipetas,
                    micropipetas: body.micropipetas,
                    faseActual: body.fase_actual ?? body.faseActual ?? 2
                }, expectedUpdatedAt);
                break;
            case '2c':
                actualizado = await salmonellaRepository.upsertFase2c(id, {
                    fase: this.mapFase2c(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 2
                }, expectedUpdatedAt);
                break;
            case '3a':
                actualizado = await salmonellaRepository.upsertFase3a(id, {
                    fase: this.mapFase3a(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 3
                }, expectedUpdatedAt);
                break;
            case '3b':
                actualizado = await salmonellaRepository.upsertFase3b(id, {
                    fase: this.mapFase3b(body),
                    pipetas: body.pipetas,
                    micropipetas: body.micropipetas,
                    faseActual: body.fase_actual ?? body.faseActual ?? 3
                }, expectedUpdatedAt);
                break;
            case '3c':
                actualizado = await salmonellaRepository.upsertFase3cLecturas(id, {
                    lecturas: body.lecturas,
                    faseActual: body.fase_actual ?? body.faseActual ?? 3
                }, expectedUpdatedAt);
                break;
            case '4a':
            case '4':
                actualizado = await salmonellaRepository.upsertFase4a(id, {
                    fase: this.mapFase4a(body),
                    lecturas: body.lecturas,
                    faseActual: body.fase_actual ?? body.faseActual ?? 4
                }, expectedUpdatedAt);
                break;
            case '5':
                actualizado = await salmonellaRepository.upsertFase5Resultados(id, {
                    resultados: body.resultados,
                    faseActual: body.fase_actual ?? body.faseActual ?? 5,
                    estado: body.estado
                }, expectedUpdatedAt);
                break;
            default:
                throw new Error('INVALID_FASE');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new SalmonellaService();
