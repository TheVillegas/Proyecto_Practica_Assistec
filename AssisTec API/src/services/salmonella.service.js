const salRepository = require('../repositories/salmonella.repository');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');
const { determinarPresenciaAusencia } = require('../calculators/presenciaSal.calculator');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

class SalService {
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
            id_sal_formulario: formulario.idSalFormulario?.toString?.(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis?.toString?.(),
            updated_at: formulario.updatedAt instanceof Date ? formulario.updatedAt.toISOString() : formulario.updatedAt
        };
    }

    async obtener(id) {
        const formulario = await salRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        const formulario = await salRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    mapFase1Payload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            fechaHoraInicioIncubacion: parseDate(raw.fecha_hora_inicio_incubacion ?? raw.fechaHoraInicioIncubacion),
            tipoMatriz: raw.tipo_matriz ?? raw.tipoMatriz,
            pesoMuestra: raw.peso_muestra ?? raw.pesoMuestra,
            caldoHomogeneizacion: raw.caldo_homogeneizacion ?? raw.caldoHomogeneizacion,
            caldoAsignadoAuto: raw.caldo_asignado_auto ?? raw.caldoAsignadoAuto,
            horaInicioHidratacion: parseDate(raw.hora_inicio_hidratacion ?? raw.horaInicioHidratacion),
            horaTerminoHidratacion: parseDate(raw.hora_termino_hidratacion ?? raw.horaTerminoHidratacion),
            hidratacionValida: raw.hidratacion_valida ?? raw.hidratacionValida,
            completada: raw.completada
        };
    }

    mapFase2aPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            fechaSiembra: parseDate(raw.fecha_siembra ?? raw.fechaSiembra),
            horaInicioHomo: parseDate(raw.hora_inicio_homo ?? raw.horaInicioHomo),
            horaTerminoHomo: parseDate(raw.hora_termino_homo ?? raw.horaTerminoHomo),
            horaIngresoEstufa: parseDate(raw.hora_ingreso_estufa ?? raw.horaIngresoEstufa),
            minutosHomoAEstufa: raw.minutos_homo_a_estufa ?? raw.minutosHomoAEstufa,
            alertaTiempo25min: raw.alerta_tiempo_25min ?? raw.alertaTiempo25min,
            rutAnalistaResponsable: raw.rut_analista_responsable ?? raw.rutAnalistaResponsable,
            fechaTerminoAnalisis: parseDate(raw.fecha_termino_analisis ?? raw.fechaTerminoAnalisis),
            completada: raw.completada
        };
    }

    mapFase2bPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            codigoCaldoAptLeche: raw.codigo_caldo_apt_leche ?? raw.codigoCaldoAptLeche,
            idEstufa: raw.id_estufa ?? raw.idEstufa,
            completada: raw.completada
        };
    }

    mapFase2cPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            descripcionCtrlAnalisis: raw.descripcion_ctrl_analisis ?? raw.descripcionCtrlAnalisis,
            resultadoCtrlAnalisis: raw.resultado_ctrl_analisis ?? raw.resultadoCtrlAnalisis,
            ctrlPositivoBlancoAli: raw.ctrl_positivo_blanco_ali ?? raw.ctrlPositivoBlancoAli,
            resultadoCtrlPositivo: raw.resultado_ctrl_positivo ?? raw.resultadoCtrlPositivo,
            ctrlSiembraAli: raw.ctrl_siembra_ali ?? raw.ctrlSiembraAli,
            resultadoCtrlSiembra: raw.resultado_ctrl_siembra ?? raw.resultadoCtrlSiembra,
            completada: raw.completada
        };
    }

    mapFase3aPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            fechaTraspaso: parseDate(raw.fecha_traspaso ?? raw.fechaTraspaso),
            horaLecturaCaldoApt: parseDate(raw.hora_lectura_caldo_apt ?? raw.horaLecturaCaldoApt),
            rutAnalistaCaldoApt: raw.rut_analista_caldo_apt ?? raw.rutAnalistaCaldoApt,
            horaLecturaCaldosFinales: parseDate(raw.hora_lectura_caldos_finales ?? raw.horaLecturaCaldosFinales),
            rutAnalistaCaldosFinales: raw.rut_analista_caldos_finales ?? raw.rutAnalistaCaldosFinales,
            completada: raw.completada
        };
    }

    mapFase3bPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            idEstufaSelenito: raw.id_estufa_selenito ?? raw.idEstufaSelenito,
            completada: raw.completada
        };
    }

    mapFase4aPayload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
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
        };
    }

    stripUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
    }

    _mapTweenPipetas(pipetas) {
        if (!Array.isArray(pipetas)) return undefined;
        return pipetas.map((p) => ({ idMaterial: p.id_material ?? p.idMaterial }));
    }

    _mapPipetas(pipetas) {
        if (!Array.isArray(pipetas)) return undefined;
        return pipetas.map((p) => ({
            idMaterial: p.id_material ?? p.idMaterial,
            tipoMaterial: p.tipo_material ?? p.tipoMaterial
        }));
    }

    _mapMicropipetas(micropipetas) {
        if (!Array.isArray(micropipetas)) return undefined;
        return micropipetas.map((p) => ({ idPipeta: p.id_pipeta ?? p.idPipeta }));
    }

    _mapLecturasFase3c(lecturas) {
        if (!Array.isArray(lecturas)) return undefined;
        return lecturas.map((l) => ({
            idSalMuestra: l.id_sal_muestra ?? l.idSalMuestra,
            resultadoCaldoApt: l.resultado_caldo_apt ?? l.resultadoCaldoApt,
            resultadoseLenito: l.resultado_selenito ?? l.resultadoseLenito,
            resultadoRappaport: l.resultado_rappaport ?? l.resultadoRappaport,
            ctrlPositivoSEnteritidis: l.ctrl_positivo_s_enteritidis ?? l.ctrlPositivoSEnteritidis,
            ctrlNegativoKPneumoniae: l.ctrl_negativo_k_pneumoniae ?? l.ctrlNegativoKPneumoniae,
            ctrlBlanco: l.ctrl_blanco ?? l.ctrlBlanco
        }));
    }

    _mapLecturasFase4b(lecturas) {
        if (!Array.isArray(lecturas)) return undefined;
        return lecturas.map((l) => ({
            idSalMuestra: l.id_sal_muestra ?? l.idSalMuestra,
            idSalFase4a: l.id_sal_fase4a ?? l.idSalFase4a,
            resXld24hSelenito: l.res_xld_24h_selenito ?? l.resXld24hSelenito,
            resSs24hSelenito: l.res_ss_24h_selenito ?? l.resSs24hSelenito,
            resXld48hSelenito: l.res_xld_48h_selenito ?? l.resXld48hSelenito,
            resSs48hSelenito: l.res_ss_48h_selenito ?? l.resSs48hSelenito,
            resXld24hRappaport: l.res_xld_24h_rappaport ?? l.resXld24hRappaport,
            resSs24hRappaport: l.res_ss_24h_rappaport ?? l.resSs24hRappaport,
            resXld48hRappaport: l.res_xld_48h_rappaport ?? l.resXld48hRappaport,
            resSs48hRappaport: l.res_ss_48h_rappaport ?? l.resSs48hRappaport,
            ctrlPositivoSEnteritidis: l.ctrl_positivo_s_enteritidis ?? l.ctrlPositivoSEnteritidis,
            ctrlNegativoKPneumoniae: l.ctrl_negativo_k_pneumoniae ?? l.ctrlNegativoKPneumoniae,
            ctrlBlanco: l.ctrl_blanco ?? l.ctrlBlanco
        }));
    }

    async _calcularResultadosFase5(idFormulario) {
        const formulario = await salRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const muestras = formulario.muestras || [];
        const resultados = [];

        for (const muestra of muestras) {
            const lecturas = muestra.fase4bLecturas || [];
            const lectura = lecturas[0] || {};

            const resultado = determinarPresenciaAusencia({
                resXld24hSelenito: lectura.resXld24hSelenito,
                resSs24hSelenito: lectura.resSs24hSelenito,
                resXld48hSelenito: lectura.resXld48hSelenito,
                resSs48hSelenito: lectura.resSs48hSelenito,
                resXld24hRappaport: lectura.resXld24hRappaport,
                resSs24hRappaport: lectura.resSs24hRappaport,
                resXld48hRappaport: lectura.resXld48hRappaport,
                resSs48hRappaport: lectura.resSs48hRappaport
            });

            resultados.push({
                idSalMuestra: String(muestra.idSalMuestra),
                resultadoFinal: resultado
            });
        }

        return resultados;
    }

    async _assertStageProgression(formulario, faseNum) {
        if (faseNum <= 1) return;

        const fasesMap = {
            2: ['fase1'],
            3: ['fase1', 'fase2a', 'fase2b', 'fase2c'],
            4: ['fase1', 'fase2a', 'fase2b', 'fase2c', 'fase3a', 'fase3b'],
            5: ['fase1', 'fase2a', 'fase2b', 'fase2c', 'fase3a', 'fase3b', 'fase4a']
        };

        const requeridas = fasesMap[faseNum] || [];
        for (const faseKey of requeridas) {
            if (!formulario[faseKey]?.completada) {
                throw new Error('INVALID_STAGE_PROGRESSION');
            }
        }
    }

    _resolveFaseActual(body, defaultValue) {
        return body.fase_actual ?? body.faseActual ?? defaultValue;
    }

    async guardarFase(id, fase, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const faseNum = Number(fase);

        const formulario = await salRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        await this._assertStageProgression(formulario, faseNum);

        let actualizado;

        switch (faseNum) {
            case 1:
                actualizado = await salRepository.upsertFase1(id, {
                    etapa: this.stripUndefined(this.mapFase1Payload(body)),
                    faseActual: this._resolveFaseActual(body, 1)
                }, expectedUpdatedAt);
                break;
            case 2: {
                const fase2aData = body.fase2a || body.fase || {};
                actualizado = await salRepository.upsertFase2a(id, {
                    etapa: this.stripUndefined(this.mapFase2aPayload({ fase: fase2aData })),
                    faseActual: this._resolveFaseActual(body, 2)
                }, expectedUpdatedAt);
                break;
            }
            case 3:
                actualizado = await salRepository.upsertFase2b(id, {
                    etapa: this.stripUndefined(this.mapFase2bPayload(body)),
                    tweenPipetas: this._mapTweenPipetas(body.tween_pipetas ?? body.tweenPipetas),
                    micropipetas: this._mapMicropipetas(body.micropipetas),
                    faseActual: this._resolveFaseActual(body, 3)
                }, expectedUpdatedAt);
                break;
            case 4:
                actualizado = await salRepository.upsertFase2c(id, {
                    etapa: this.stripUndefined(this.mapFase2cPayload(body)),
                    faseActual: this._resolveFaseActual(body, 4)
                }, expectedUpdatedAt);
                break;
            case 5:
                actualizado = await salRepository.upsertFase3a(id, {
                    etapa: this.stripUndefined(this.mapFase3aPayload(body)),
                    faseActual: this._resolveFaseActual(body, 5)
                }, expectedUpdatedAt);
                break;
            case 6:
                actualizado = await salRepository.upsertFase3b(id, {
                    etapa: this.stripUndefined(this.mapFase3bPayload(body)),
                    pipetas: this._mapPipetas(body.pipetas),
                    micropipetas: this._mapMicropipetas(body.micropipetas),
                    faseActual: this._resolveFaseActual(body, 6)
                }, expectedUpdatedAt);
                break;
            case 7:
                actualizado = await salRepository.upsertFase3cLectura(id, {
                    lecturas: this._mapLecturasFase3c(body.lecturas),
                    faseActual: this._resolveFaseActual(body, 7)
                }, expectedUpdatedAt);
                break;
            case 8:
                actualizado = await salRepository.upsertFase4a(id, {
                    etapa: this.stripUndefined(this.mapFase4aPayload(body)),
                    faseActual: this._resolveFaseActual(body, 8)
                }, expectedUpdatedAt);
                break;
            case 9:
                actualizado = await salRepository.upsertFase4bLectura(id, {
                    lecturas: this._mapLecturasFase4b(body.lecturas),
                    faseActual: this._resolveFaseActual(body, 9)
                }, expectedUpdatedAt);
                break;
            case 10: {
                const resultadosCalculados = await this._calcularResultadosFase5(id);
                actualizado = await salRepository.upsertFase5Resultado(id, {
                    resultados: resultadosCalculados,
                    faseActual: this._resolveFaseActual(body, 10)
                }, expectedUpdatedAt);
                break;
            }
            default:
                throw new Error('INVALID_FASE');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new SalService();
