const saureusRepository = require('../repositories/saureus.repository');
const prisma = require('../config/prisma');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');
const { calcularUfcSau } = require('../calculators/ufcSau.calculator');

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
            id_sau_formulario: formulario.idSauFormulario?.toString?.(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis?.toString?.(),
            updated_at: formulario.updatedAt instanceof Date ? formulario.updatedAt.toISOString() : formulario.updatedAt
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
            rutAnalista: usuario.id ?? usuario.rutUsuario,
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
        let formulario = await saureusRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            formulario = await this._crearDesdeSolicitud(idSolicitudAnalisis);
        }
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    async _crearDesdeSolicitud(idSolicitudAnalisis) {
        try {
            const solicitud = await prisma.solicitudAnalisis.findUnique({
                where: { idSolicitudAnalisis: BigInt(idSolicitudAnalisis) },
                include: { muestra: true }
            });
            if (!solicitud || !solicitud.muestra) return null;

            const muestrasPayload = [{
                idSolicitudMuestra: solicitud.muestra.idSolicitudMuestra,
                numeroMuestra: '1',
                esDuplicado: false,
                orden: 1
            }];

            return await saureusRepository.create({
                idSolicitudAnalisis: BigInt(idSolicitudAnalisis),
                estado: 'NO_REALIZADO',
                muestras: muestrasPayload
            });
        } catch (_) {
            return null;
        }
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
            horaHomogeneizado: raw.hora_homogeneizado ?? raw.horaHomogeneizado,
            horaSiembra: raw.hora_siembra ?? raw.horaSiembra,
            codigoAgarBairdParker: raw.codigo_agar_baird_parker ?? raw.codigoAgarBairdParker,
            pesoMuestraTipo: raw.peso_muestra_tipo ?? raw.pesoMuestraTipo,
            nMuestra10g90ml: raw.n_muestra_10g_90ml ?? raw.nMuestra10g90ml,
            nMuestra50g450ml: raw.n_muestra_50g_450ml ?? raw.nMuestra50g450ml,
            idMicropipeta: raw.id_micropipeta ?? raw.idMicropipeta,
            codigoMicropipeta: raw.codigo_micropipeta ?? raw.codigoMicropipeta,
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

    _construirDilucionesDesdeMuestra(muestra) {
        const diluciones = [];

        // Etapa1: conteo 48h en Baird-Parker (principal)
        const etapa1Lecturas = muestra.etapa1Lecturas || [];
        for (const lect of etapa1Lecturas) {
            const colonias = [
                lect.conteo48hPlaca1 != null ? Number(lect.conteo48hPlaca1) : null,
                lect.conteo48hPlaca2 != null ? Number(lect.conteo48hPlaca2) : null
            ].filter((c) => c !== null);
            if (colonias.length > 0) {
                diluciones.push({ dil: -1, colonias });
            }
        }

        // Etapa3: colonias despues de traspaso (si no hay etapa1)
        const etapa3Lecturas = muestra.etapa3Lecturas || [];
        for (const lect of etapa3Lecturas) {
            const colonias = [
                lect.coloniasPlaca1 != null ? Number(lect.coloniasPlaca1) : null,
                lect.coloniasPlaca2 != null ? Number(lect.coloniasPlaca2) : null
            ].filter((c) => c !== null);
            if (colonias.length > 0) {
                diluciones.push({ dil: -2, colonias });
            }
        }

        return diluciones;
    }

    async _calcularResultadosEtapa5(idFormulario, bodyResultados) {
        const formulario = await saureusRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const muestras = formulario.muestras || [];
        const resultadosMap = new Map();

        for (const r of bodyResultados ?? []) {
            resultadosMap.set(String(r.id_sau_muestra ?? r.idSauMuestra), r);
        }

        const computed = muestras.map((muestra) => {
            const idMuestra = String(muestra.idSauMuestra);
            const clienteData = resultadosMap.get(idMuestra) || {};
            const diluciones = this._construirDilucionesDesdeMuestra(muestra);

            let calculado;
            if (diluciones.length > 0) {
                calculado = calcularUfcSau({ volumen: 1, diluciones });
            }

            return {
                idSauMuestra: idMuestra,
                nSAureus: calculado?.ufcPorG ?? clienteData.n_s_aureus ?? clienteData.nSAureus ?? null,
                ufcPorG: calculado?.ufcPorG ?? clienteData.ufc_por_g ?? clienteData.ufcPorG ?? null,
                incongruenciaDetectada: calculado?.incongruenciaDetectada ?? Boolean(clienteData.incongruencia_detectada ?? clienteData.incongruenciaDetectada ?? false),
                observacionIncongruencia: calculado?.observacionIncongruencia ?? (clienteData.observacion_incongruencia ?? clienteData.observacionIncongruencia ?? null)
            };
        });

        return computed;
    }

    async _validarEtapasPreviasParaCierre(idFormulario) {
        const formulario = await saureusRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const etapasRequeridas = [
            formulario.etapa1?.completada,
            formulario.etapa2?.completada,
            formulario.etapa3?.completada,
            formulario.etapa4?.completada
        ];

        const tieneResultados = Array.isArray(formulario.etapa5Resultado) && formulario.etapa5Resultado.length > 0;

        const completadas = etapasRequeridas.every(Boolean) && tieneResultados;
        if (!completadas) {
            throw new Error('INVALID_STAGE_PROGRESSION');
        }

        return formulario;
    }

    _mapLecturas(lecturas) {
        if (!Array.isArray(lecturas)) return undefined;
        return lecturas.map((l) => ({
            idSauMuestra: l.id_sau_muestra ?? l.idSauMuestra,
            tipoLectura: l.tipo_lectura ?? l.tipoLectura,
            coloniasPlaca1: l.colonias_placa1 ?? l.coloniasPlaca1,
            coloniasPlaca2: l.colonias_placa2 ?? l.coloniasPlaca2,
            conteo24hPlaca1: l.conteo_24h_placa1 ?? l.conteo24hPlaca1,
            conteo24hPlaca2: l.conteo_24h_placa2 ?? l.conteo24hPlaca2,
            conteo48hPlaca1: l.conteo_48h_placa1 ?? l.conteo48hPlaca1,
            conteo48hPlaca2: l.conteo_48h_placa2 ?? l.conteo48hPlaca2
        }));
    }

    _mapMicropipetas(micropipetas) {
        if (!Array.isArray(micropipetas)) return undefined;
        return micropipetas.map((p) => ({
            idPipeta: p.id_pipeta ?? p.idPipeta,
            capacidad: p.capacidad
        }));
    }

    _resolveEtapaActual(body, defaultValue) {
        return body.etapa_actual ?? body.etapaActual ?? defaultValue;
    }

    _injectAnalistaRut(etapa, usuario) {
        if (!etapa) return etapa;
        const rut = usuario?.rutUsuario ?? usuario?.id;
        if (!rut) return etapa;

        const camposAnalista = [
            'rutAnalistaInicio', 'rutAnalistaTermino',
            'rutAnalista24h', 'rutAnalista48h',
            'rutAnalistaTraspaso', 'rutAnalistaLectura',
            'rutAnalistaPrueba', 'rutAnalista46h',
            'rutCoordinadorCierre'
        ];

        for (const campo of camposAnalista) {
            if (etapa[campo] === undefined || etapa[campo] === null) {
                etapa[campo] = rut;
            }
        }
        return etapa;
    }

    async guardarEtapa(id, etapa, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const etapaNum = Number(etapa);
        let actualizado;

        const etapaPayload = (mapper) => {
            const raw = mapper(body);
            return this._injectAnalistaRut(raw, usuario);
        };

        switch (etapaNum) {
            case 1:
                actualizado = await saureusRepository.upsertEtapa1(id, {
                    etapa: this.stripUndefined(etapaPayload(this.mapEtapaPayload.bind(this))),
                    micropipetas: this._mapMicropipetas(body.micropipetas),
                    lecturas: this._mapLecturas(body.lecturas),
                    etapaActual: this._resolveEtapaActual(body, 1)
                }, expectedUpdatedAt);
                break;
            case 2:
                actualizado = await saureusRepository.upsertEtapa2(id, {
                    etapa: this.stripUndefined(etapaPayload(this.mapEtapa2Payload.bind(this))),
                    etapaActual: this._resolveEtapaActual(body, 2)
                }, expectedUpdatedAt);
                break;
            case 3:
                actualizado = await saureusRepository.upsertEtapa3(id, {
                    etapa: this.stripUndefined(etapaPayload(this.mapEtapa3Payload.bind(this))),
                    lecturas: this._mapLecturas(body.lecturas),
                    etapaActual: this._resolveEtapaActual(body, 3)
                }, expectedUpdatedAt);
                break;
            case 4:
                actualizado = await saureusRepository.upsertEtapa4(id, {
                    etapa: this.stripUndefined(etapaPayload(this.mapEtapa4Payload.bind(this))),
                    lecturas: this._mapLecturas(body.lecturas),
                    etapaActual: this._resolveEtapaActual(body, 4)
                }, expectedUpdatedAt);
                break;
            case 5: {
                const resultadosCalculados = await this._calcularResultadosEtapa5(id, body.resultados);
                actualizado = await saureusRepository.upsertEtapa5Resultados(id, {
                    resultados: resultadosCalculados,
                    etapaActual: this._resolveEtapaActual(body, 5)
                }, expectedUpdatedAt);
                break;
            }
            case 6:
                await this._validarEtapasPreviasParaCierre(id);
                actualizado = await saureusRepository.upsertEtapa6Cierre(id, {
                    etapa: this.stripUndefined(etapaPayload(this.mapEtapa6Payload.bind(this))),
                    etapaActual: this._resolveEtapaActual(body, 6),
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
