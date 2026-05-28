const coliformesRepository = require('../repositories/coliformes.repository');
const ROLES = require('../config/roles');
const { serializePrismaRecord } = require('../utils/prismaSerialize');
const { parseDate, resolvePayloadSection } = require('../utils/formularioPayload');

const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

class ColiformesService {
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
            id_coli_formulario: formulario.idColiFormulario.toString(),
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

        const existente = await coliformesRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (existente) {
            throw new Error('FORMULARIO_ALREADY_EXISTS');
        }

        const creado = await coliformesRepository.create({
            idSolicitudAnalisis,
            rutAnalista: usuario.id,
            muestras: muestras.map((m, index) => ({
                idSolicitudMuestra: m.id_solicitud_muestra ?? m.idSolicitudMuestra,
                numeroMuestra: m.numero_muestra ?? m.numeroMuestra ?? String(index + 1),
                esDuplicado: m.es_duplicado ?? m.esDuplicado ?? false,
                pesoMuestraTipo: m.peso_muestra_tipo ?? m.pesoMuestraTipo ?? '25g',
                orden: m.orden ?? index + 1
            }))
        });

        return this.serializeFormulario(creado);
    }

    async obtener(id) {
        const formulario = await coliformesRepository.findById(id);
        if (!formulario) {
            throw new Error('NOT_FOUND');
        }
        return this.serializeFormulario(formulario);
    }

    async obtenerPorAnalisis(idSolicitudAnalisis) {
        const formulario = await coliformesRepository.findBySolicitudAnalisis(idSolicitudAnalisis);
        if (!formulario) {
            return { existe: false, formulario: null };
        }
        return { existe: true, formulario: this.serializeFormulario(formulario) };
    }

    mapFase1(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaInicioIncubacion: parseDate(raw.fecha_inicio_incubacion ?? raw.fechaInicioIncubacion),
            rutAnalistaInicio: raw.rut_analista_inicio ?? raw.rutAnalistaInicio,
            fechaTerminoAnalisis: parseDate(raw.fecha_termino_analisis ?? raw.fechaTerminoAnalisis),
            rutAnalistaTermino: raw.rut_analista_termino ?? raw.rutAnalistaTermino,
            completada: raw.completada
        });
    }

    mapFase2(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            codigoCaldoLauril: raw.codigo_caldo_lauril ?? raw.codigoCaldoLauril,
            codigoTween80: raw.codigo_tween_80 ?? raw.codigoTween80,
            completada: raw.completada
        });
    }

    mapFase3(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
            fechaLectura24h: parseDate(raw.fecha_lectura_24h ?? raw.fechaLectura24h),
            rutAnalista24h: raw.rut_analista_24h ?? raw.rutAnalista24h,
            lectura24hEnTolerancia: raw.lectura_24h_en_tolerancia ?? raw.lectura24hEnTolerancia,
            fechaLectura48h: parseDate(raw.fecha_lectura_48h ?? raw.fechaLectura48h),
            rutAnalista48h: raw.rut_analista_48h ?? raw.rutAnalista48h,
            lectura48hEnTolerancia: raw.lectura_48h_en_tolerancia ?? raw.lectura48hEnTolerancia,
            completada: raw.completada
        });
    }

    mapFase35(body) {
        const raw = resolvePayloadSection(body, 'fase');
        return this.stripUndefined({
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
        });
    }

    async guardarFase(id, fase, body, expectedUpdatedAt, usuario) {
        this.assertCanWrite(usuario);
        const faseKey = String(fase).toLowerCase();
        let actualizado;

        switch (faseKey) {
            case '1':
                actualizado = await coliformesRepository.upsertFase1(id, {
                    fase: this.mapFase1(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 1
                }, expectedUpdatedAt);
                break;
            case '2':
                actualizado = await coliformesRepository.upsertFase2(id, {
                    fase: this.mapFase2(body),
                    estufas: body.estufas,
                    micropipetas: body.micropipetas,
                    faseActual: body.fase_actual ?? body.faseActual ?? 2
                }, expectedUpdatedAt);
                break;
            case '3':
                actualizado = await coliformesRepository.upsertFase3(id, {
                    fase: this.mapFase3(body),
                    submuestras: body.submuestras,
                    faseActual: body.fase_actual ?? body.faseActual ?? 3
                }, expectedUpdatedAt);
                break;
            case '35':
            case '3.5':
                actualizado = await coliformesRepository.upsertFase35Controles(id, {
                    fase: this.mapFase35(body),
                    faseActual: body.fase_actual ?? body.faseActual ?? 4
                }, expectedUpdatedAt);
                break;
            case '4':
                actualizado = await coliformesRepository.upsertFase4Resultados(id, {
                    resultados: body.resultados,
                    faseActual: body.fase_actual ?? body.faseActual ?? 4,
                    estado: body.estado
                }, expectedUpdatedAt);
                break;
            default:
                throw new Error('INVALID_FASE');
        }

        return this.serializeFormulario(actualizado);
    }
}

module.exports = new ColiformesService();
