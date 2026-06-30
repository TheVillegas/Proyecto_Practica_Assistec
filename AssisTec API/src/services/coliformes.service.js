const winston = require('winston');
const coliRepository = require('../repositories/coliformes.repository');
const prisma = require('../config/prisma');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');
const { calcularMPN, construirConteos } = require('../../dist/calculators/mpnColi.engine');
const { Prisma } = require('@prisma/client');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];
const VOLUMENES_MUESTRA = [0.1, 0.01, 0.001];
const TIPOS_LECTURA = ['totales', 'fecales', 'ecoli'];
const LABELS_INCONGRUENCIA = {
    totales: 'coliformes totales',
    fecales: 'coliformes fecales',
    ecoli: 'E. coli'
};

const logger = winston.createLogger({
    level: 'warn',
    transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

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
            idMedioCaldoLauril: raw.id_medio_caldo_lauril ?? raw.idMedioCaldoLauril,
            idMedioTween80: raw.id_medio_tween_80 ?? raw.idMedioTween80,
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

    /**
     * Convierte un valor numérico a Prisma.Decimal, descartando Infinity/NaN/null.
     * Prisma no soporta Infinity en campos Decimal.
     */
    _toDecimalOrNull(value) {
        if (value === null || value === undefined || !Number.isFinite(value)) {
            return null;
        }
        return new Prisma.Decimal(value);
    }

    /**
     * Convierte un valor numérico a number, descartando Infinity/NaN/null.
     * Útil para la respuesta JSON, donde JSON.stringify ya transforma Infinity/NaN a null.
     */
    _toNumberOrNull(value) {
        if (value === null || value === undefined || !Number.isFinite(value)) {
            return null;
        }
        return value;
    }

    /**
     * Resultado MPN manual para datos inválidos o faltantes.
     * @returns {import('../../dist/calculators/mpnColi.engine').ResultadoMPN}
     */
    _resultadoInvalido(detalle) {
        return {
            mpn: NaN,
            log10Mpn: null,
            sdLog10: null,
            limiteInferior: null,
            limiteSuperior: null,
            rarityIndex: null,
            categoriaRareza: null,
            estado: 'invalido',
            detalle
        };
    }

    /**
     * Agrupa submuestras por dilucion, preservando el orden numérico descendente.
     * No usa Object.keys().sort() alfabético ni default '10'.
     */
    _agruparLecturasPorDilucion(submuestras) {
        const porDilucion = new Map();
        for (const s of submuestras) {
            if (s.dilucion == null) {
                return {
                    invalido: true,
                    detalle: `Submuestra sin dilucion (tipoLectura=${s.tipoLectura ?? 'desconocido'})`
                };
            }
            const dil = String(s.dilucion);
            if (!porDilucion.has(dil)) {
                porDilucion.set(dil, { dil, lecturas: [] });
            }
            porDilucion.get(dil).lecturas.push(s.presencia === true);
        }

        const ordenadas = [...porDilucion.values()]
            .sort((a, b) => parseFloat(b.dil) - parseFloat(a.dil));

        return {
            invalido: false,
            lecturas: ordenadas.map((grupo) => grupo.lecturas)
        };
    }

    _calcularDesdeSubmuestras(submuestras, tipoLectura) {
        const delTipo = submuestras.filter((s) => s.tipoLectura === tipoLectura);
        if (delTipo.length === 0) {
            return this._resultadoInvalido(`No hay submuestras para ${tipoLectura}`);
        }

        const { lecturas, invalido, detalle } = this._agruparLecturasPorDilucion(delTipo);
        if (invalido) {
            return this._resultadoInvalido(detalle);
        }

        if (lecturas.length !== VOLUMENES_MUESTRA.length) {
            return this._resultadoInvalido(
                `Numero de diluciones invalido para ${tipoLectura}: ` +
                `se esperaban ${VOLUMENES_MUESTRA.length}, se recibieron ${lecturas.length}`
            );
        }

        const conteos = construirConteos(lecturas, VOLUMENES_MUESTRA);
        return calcularMPN(conteos);
    }

    _calcularDesdeLecturas(lecturas) {
        const conteos = construirConteos(lecturas, VOLUMENES_MUESTRA);
        return calcularMPN(conteos);
    }

    /**
     * Serializa un ResultadoMPN al objeto con los 7 campos persistidos por organismo.
     */
    _serializarResultadoDb(resultado, tipo) {
        const p = (v) => this._toDecimalOrNull(v);
        return {
            [`${tipo}Log10Mpn`]: p(resultado.log10Mpn),
            [`${tipo}SdLog10`]: p(resultado.sdLog10),
            [`${tipo}LimiteInferior`]: p(resultado.limiteInferior),
            [`${tipo}LimiteSuperior`]: p(resultado.limiteSuperior),
            [`${tipo}RarityIndex`]: p(resultado.rarityIndex),
            [`${tipo}CategoriaRareza`]: resultado.categoriaRareza ?? null,
            [`${tipo}Estado`]: resultado.estado ?? null
        };
    }

    /**
     * Construye el objeto ResultadoMPN expuesto en la respuesta HTTP.
     */
    _organismoResponse(resultado) {
        return {
            mpn: resultado.mpn,
            log10Mpn: this._toNumberOrNull(resultado.log10Mpn),
            sdLog10: this._toNumberOrNull(resultado.sdLog10),
            limiteInferior: this._toNumberOrNull(resultado.limiteInferior),
            limiteSuperior: this._toNumberOrNull(resultado.limiteSuperior),
            rarityIndex: this._toNumberOrNull(resultado.rarityIndex),
            categoriaRareza: resultado.categoriaRareza ?? null,
            estado: resultado.estado
        };
    }

    _observacionIncongruencia(resultadosPorTipo) {
        const tipos = TIPOS_LECTURA.filter((tipo) => resultadosPorTipo[tipo]?.categoriaRareza === 3);
        if (tipos.length === 0) return null;
        const nombres = tipos.map((tipo) => LABELS_INCONGRUENCIA[tipo]).join(', ');
        return `Lecturas incongruentes (rareza 3) en: ${nombres}. Revisar conteo de tubos.`;
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
            const resultadosPorTipo = {};

            for (const tipo of TIPOS_LECTURA) {
                resultadosPorTipo[tipo] = this._calcularDesdeSubmuestras(submuestras, tipo);
            }

            const incongruenciaDetectada = TIPOS_LECTURA.some(
                (tipo) => resultadosPorTipo[tipo].categoriaRareza === 3
            );

            resultados.push({
                idColiMuestra: String(muestra.idColiMuestra),
                coliformesTotales: this._toDecimalOrNull(resultadosPorTipo.totales.mpn),
                coliformesFecales: this._toDecimalOrNull(resultadosPorTipo.fecales.mpn),
                eColi: this._toDecimalOrNull(resultadosPorTipo.ecoli.mpn),
                incongruenciaDetectada,
                observacionIncongruencia: incongruenciaDetectada
                    ? this._observacionIncongruencia(resultadosPorTipo)
                    : null,
                ...this._serializarResultadoDb(resultadosPorTipo.totales, 'totales'),
                ...this._serializarResultadoDb(resultadosPorTipo.fecales, 'fecales'),
                ...this._serializarResultadoDb(resultadosPorTipo.ecoli, 'ecoli')
            });
        }

        return resultados;
    }

    _construirConteosDesdeConteosPorDilucion(conteosPorDilucion) {
        return conteosPorDilucion.map((positivos, index) => ({
            positivos: Number(positivos) || 0,
            tubos: 3,
            volumenMuestraPorTubo: VOLUMENES_MUESTRA[index]
        }));
    }

    _calcularResultadosLegacy(muestra) {
        const conteosTotales = this._construirConteosDesdeConteosPorDilucion(muestra.tubosPositivos24h);
        const conteosFecales = this._construirConteosDesdeConteosPorDilucion(muestra.tubosPositivos48h);

        return {
            totales: calcularMPN(conteosTotales),
            fecales: calcularMPN(conteosFecales),
            ecoli: calcularMPN(conteosFecales)
        };
    }

    async calcularNmp(idFormulario, body, usuario) {
        this.assertCanWrite(usuario);

        const formulario = await coliRepository.findById(idFormulario);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }

        const muestras = Array.isArray(body?.muestras) ? body.muestras : [];
        const fase4Resultado = muestras.map((muestra) => {
            const idColiMuestra = Number(muestra.idColiMuestra);
            const lecturas = muestra.lecturas;
            let resultadosPorTipo;

            const usaNuevoContrato = lecturas &&
                Array.isArray(lecturas.totales) &&
                Array.isArray(lecturas.fecales) &&
                Array.isArray(lecturas.ecoli);

            if (usaNuevoContrato) {
                resultadosPorTipo = {
                    totales: this._calcularDesdeLecturas(lecturas.totales),
                    fecales: this._calcularDesdeLecturas(lecturas.fecales),
                    ecoli: this._calcularDesdeLecturas(lecturas.ecoli)
                };
            } else if (Array.isArray(muestra.tubosPositivos24h) || Array.isArray(muestra.tubosPositivos48h)) {
                // TODO: fallback temporal para frontend que aun no envia el contrato nuevo.
                // Se conserva solo hasta que el change de UI adopte lecturas {totales, fecales, ecoli}.
                logger.warn(
                    `calcularNmp recibio body legacy para idColiMuestra=${idColiMuestra}. ` +
                    'Usando fallback tubosPositivos24h/48h.'
                );
                resultadosPorTipo = this._calcularResultadosLegacy(muestra);
            } else {
                resultadosPorTipo = {
                    totales: this._resultadoInvalido('No se recibieron lecturas para coliformes totales'),
                    fecales: this._resultadoInvalido('No se recibieron lecturas para coliformes fecales'),
                    ecoli: this._resultadoInvalido('No se recibieron lecturas para E. coli')
                };
            }

            const incongruenciaDetectada = TIPOS_LECTURA.some(
                (tipo) => resultadosPorTipo[tipo].categoriaRareza === 3
            );

            return {
                idColiMuestra,
                coliformesTotales: this._toNumberOrNull(resultadosPorTipo.totales.mpn),
                coliformesFecales: this._toNumberOrNull(resultadosPorTipo.fecales.mpn),
                eColi: this._toNumberOrNull(resultadosPorTipo.ecoli.mpn),
                totales: this._organismoResponse(resultadosPorTipo.totales),
                fecales: this._organismoResponse(resultadosPorTipo.fecales),
                ecoli: this._organismoResponse(resultadosPorTipo.ecoli),
                incongruenciaDetectada,
                observacionIncongruencia: incongruenciaDetectada
                    ? this._observacionIncongruencia(resultadosPorTipo)
                    : null
            };
        });

        return { fase4Resultado };
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
