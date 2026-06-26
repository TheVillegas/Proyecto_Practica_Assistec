const coliRepository = require('../repositories/coliformes.repository');
const prisma = require('../config/prisma');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');
const { calcularResultadosNMP } = require('../calculators/nmpColi.calculator');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

class ColiService {
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
            id_coli_formulario: formulario.idColiFormulario?.toString?.(),
            id_solicitud_analisis: formulario.idSolicitudAnalisis?.toString?.(),
            updated_at: formulario.updatedAt instanceof Date ? formulario.updatedAt.toISOString() : formulario.updatedAt
        };
    }

    async obtener(id) {
        const formulario = await coliRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        let formulario = await coliRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
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
                pesoMuestraTipo: '10g/90ml',
                orden: 1
            }];

            return await coliRepository.create({
                idSolicitudAnalisis: BigInt(idSolicitudAnalisis),
                estado: 'NO_REALIZADO',
                muestras: muestrasPayload
            });
        } catch (_) {
            return null;
        }
    }

    mapFase1Payload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            fechaInicioIncubacion: parseDate(raw.fecha_inicio_incubacion ?? raw.fechaInicioIncubacion),
            rutAnalistaInicio: raw.rut_analista_inicio ?? raw.rutAnalistaInicio,
            fechaTerminoAnalisis: parseDate(raw.fecha_termino_analisis ?? raw.fechaTerminoAnalisis),
            rutAnalistaTermino: raw.rut_analista_termino ?? raw.rutAnalistaTermino,
            completada: raw.completada
        };
    }

    mapFase2Payload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            codigoCaldoLauril: raw.codigo_caldo_lauril ?? raw.codigoCaldoLauril,
            codigoTween80: raw.codigo_tween_80 ?? raw.codigoTween80,
            completada: raw.completada
        };
    }

    mapFase3Payload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            fechaLectura24h: parseDate(raw.fecha_lectura_24h ?? raw.fechaLectura24h),
            rutAnalista24h: raw.rut_analista_24h ?? raw.rutAnalista24h,
            lectura24hEnTolerancia: raw.lectura_24h_en_tolerancia ?? raw.lectura24hEnTolerancia,
            fechaLectura48h: parseDate(raw.fecha_lectura_48h ?? raw.fechaLectura48h),
            rutAnalista48h: raw.rut_analista_48h ?? raw.rutAnalista48h,
            lectura48hEnTolerancia: raw.lectura_48h_en_tolerancia ?? raw.lectura48hEnTolerancia,
            completada: raw.completada
        };
    }

    mapFase35Payload(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return {
            ctrlTotKAerogenes: raw.ctrl_tot_k_aerogenes ?? raw.ctrlTotKAerogenes,
            ctrlTotSAureus: raw.ctrl_tot_s_aureus ?? raw.ctrlTotSAureus,
            blancoTotales: raw.blanco_totales ?? raw.blancoTotales,
            ctrlFecEColi: raw.ctrl_fec_e_coli ?? raw.ctrlFecEColi,
            ctrlFecKAerogenes: raw.ctrl_fec_k_aerogenes ?? raw.ctrlFecKAerogenes,
            blancoFecales: raw.blanco_fecales ?? raw.blancoFecales,
            ctrlEcoEColi: raw.ctrl_eco_e_coli ?? raw.ctrlEcoEColi,
            ctrlEcoKAerogenes: raw.ctrl_eco_k_aerogenes ?? raw.ctrlEcoKAerogenes,
            blancoEcoli: raw.blanco_ecoli ?? raw.blancoEcoli,
            completada: raw.completada
        };
    }

    stripUndefined(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
    }

    _mapSubmuestras(submuestras) {
        if (!Array.isArray(submuestras)) return undefined;
        return submuestras.map((s) => ({
            idColiMuestra: s.id_coli_muestra ?? s.idColiMuestra,
            tipoLectura: s.tipo_lectura ?? s.tipoLectura,
            dilucion: s.dilucion,
            numeroTubo: s.numero_tubo ?? s.numeroTubo,
            presencia: s.presencia
        }));
    }

    _mapEstufas(estufas) {
        if (!Array.isArray(estufas)) return undefined;
        return estufas.map((e) => ({ idIncubacion: e.id_incubacion ?? e.idIncubacion }));
    }

    _mapMicropipetas(micropipetas) {
        if (!Array.isArray(micropipetas)) return undefined;
        return micropipetas.map((p) => ({
            idPipeta: p.id_pipeta ?? p.idPipeta,
            capacidad: p.capacidad
        }));
    }

    async _calcularResultadosFase4(idFormulario) {
        const formulario = await coliRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const muestras = formulario.muestras || [];
        const resultados = [];

        for (const muestra of muestras) {
            const submuestras = muestra.submuestras || [];

            // Agrupar por tipo lectura y calcular tubos positivos por dilucion
            const tipos = ['totales', 'fecales', 'ecoli'];
            const tubosPorTipo = {};

            for (const tipo of tipos) {
                const delTipo = submuestras.filter((s) => s.tipoLectura === tipo);
                // Agrupar por dilucion y contar positivos
                const porDilucion = {};
                for (const s of delTipo) {
                    const dil = s.dilucion || '10';
                    if (!porDilucion[dil]) porDilucion[dil] = 0;
                    if (s.presencia) porDilucion[dil]++;
                }
                // Ordenar diluciones y armar array de 3 elementos
                const dilucionesOrdenadas = Object.keys(porDilucion).sort();
                const tubos = dilucionesOrdenadas.slice(0, 3).map((d) => porDilucion[d]);
                while (tubos.length < 3) tubos.push(0);
                tubosPorTipo[tipo] = tubos;
            }

            const nmp = calcularResultadosNMP({
                tubosPositivosTotales: tubosPorTipo.totales,
                tubosPositivosFecales: tubosPorTipo.fecales,
                tubosPositivosEcoli: tubosPorTipo.ecoli
            });

            resultados.push({
                idColiMuestra: String(muestra.idColiMuestra),
                coliformesTotales: nmp.coliformesTotales,
                coliformesFecales: nmp.coliformesFecales,
                eColi: nmp.eColi,
                incongruenciaDetectada: false
            });
        }

        return resultados;
    }

    async _assertStageProgression(formulario, faseNum, completada = true) {
        // Para lecturas/cálculo intermedio, el usuario puede guardar fase 3/4
        // sin haber marcado las fases previas como completadas todavía.
        if (completada !== true && (faseNum === 3 || faseNum === 4)) {
            return;
        }

        if (faseNum <= 1) return;

        const fasesCompletadas = [
            formulario.fase1?.completada,
            formulario.fase2?.completada,
            formulario.fase3?.completada,
            formulario.fase35Controles?.completada
        ];

        const faseRequerida = faseNum - 1;
        if (faseRequerida >= 1 && faseRequerida <= 4) {
            if (faseRequerida === 3) {
                // Fase 3 requiere fase 2 completada
                if (!formulario.fase2?.completada) {
                    throw new Error('INVALID_STAGE_PROGRESSION');
                }
            } else if (faseRequerida === 4) {
                // Fase 4 requiere fase 3 y fase 3.5 completadas
                if (!formulario.fase3?.completada || !formulario.fase35Controles?.completada) {
                    throw new Error('INVALID_STAGE_PROGRESSION');
                }
            } else {
                if (!fasesCompletadas[faseRequerida - 1]) {
                    throw new Error('INVALID_STAGE_PROGRESSION');
                }
            }
        }
    }

    _resolveFaseActual(body, defaultValue) {
        return body.fase_actual ?? body.faseActual ?? defaultValue;
    }

    _normalizarConteoTubos(tubos) {
        if (!Array.isArray(tubos)) {
            return [0, 0, 0];
        }

        const normalizados = tubos.slice(0, 3).map((valor) => {
            const numero = Number(valor);
            if (!Number.isFinite(numero)) return 0;
            return Math.max(0, Math.min(3, numero));
        });

        while (normalizados.length < 3) {
            normalizados.push(0);
        }

        return normalizados;
    }

    async calcularNmp(idFormulario, body, usuario) {
        this.assertCanWrite(usuario);

        const formulario = await coliRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const muestras = Array.isArray(body?.muestras) ? body.muestras : [];
        const fase4Resultado = muestras.map((muestra) => {
            const tubosPositivos24h = this._normalizarConteoTubos(muestra.tubosPositivos24h);
            const tubosPositivos48h = this._normalizarConteoTubos(muestra.tubosPositivos48h);

            const resultados = calcularResultadosNMP({
                tubosPositivosTotales: tubosPositivos24h,
                tubosPositivosFecales: tubosPositivos48h,
                tubosPositivosEcoli: tubosPositivos48h
            });

            return {
                idColiMuestra: Number(muestra.idColiMuestra),
                coliformesTotales: resultados.coliformesTotales,
                coliformesFecales: resultados.coliformesFecales,
                eColi: resultados.eColi
            };
        });

        return { fase4Resultado };
    }

    async guardarFase(id, fase, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const faseNum = Number(fase);

        // Validar progresion de fases
        const formulario = await coliRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        await this._assertStageProgression(formulario, faseNum, body.completada === true);

        let actualizado;

        switch (faseNum) {
            case 1:
                actualizado = await coliRepository.upsertFase1(id, {
                    etapa: this.stripUndefined(this.mapFase1Payload(body)),
                    faseActual: this._resolveFaseActual(body, 1)
                }, expectedUpdatedAt);
                break;
            case 2:
                actualizado = await coliRepository.upsertFase2(id, {
                    etapa: this.stripUndefined(this.mapFase2Payload(body)),
                    estufas: this._mapEstufas(body.estufas),
                    micropipetas: this._mapMicropipetas(body.micropipetas),
                    faseActual: this._resolveFaseActual(body, 2)
                }, expectedUpdatedAt);
                break;
            case 3:
                actualizado = await coliRepository.upsertFase3(id, {
                    etapa: this.stripUndefined(this.mapFase3Payload(body)),
                    submuestras: this._mapSubmuestras(body.submuestras),
                    faseActual: this._resolveFaseActual(body, 3)
                }, expectedUpdatedAt);
                break;
            case 3.5:
                actualizado = await coliRepository.upsertFase35Controles(id, {
                    etapa: this.stripUndefined(this.mapFase35Payload(body)),
                    faseActual: this._resolveFaseActual(body, 3)
                }, expectedUpdatedAt);
                break;
            case 4: {
                const resultadosCalculados = await this._calcularResultadosFase4(id);
                actualizado = await coliRepository.upsertFase4Resultados(id, {
                    resultados: resultadosCalculados,
                    faseActual: this._resolveFaseActual(body, 4)
                }, expectedUpdatedAt);
                break;
            }
            default:
                throw new Error('INVALID_FASE');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new ColiService();
