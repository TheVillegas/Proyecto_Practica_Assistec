const prisma = require('../config/prisma');
const BaseFormRepository = require('./baseForm.repository');

class EnterobacteriasRepository extends BaseFormRepository {
    constructor() {
        super(prisma.entFormulario, 'idEntFormulario');
    }

    getFullInclude() {
        return {
            solicitudAnalisis: { include: { formulario: true, muestra: true } },
            analista: { select: { rutUsuario: true, nombreApellidoUsuario: true } },
            muestras: {
                orderBy: { orden: 'asc' },
                include: { solicitudMuestra: true }
            },
            etapa1: {
                include: {
                    analistaInicio: true,
                    analistaHomog: true,
                    analistaSembrado: true,
                    analistaIncub: true,
                    balanza: true,
                    stomacher: true,
                    loteAgarVrbg: true,
                    estufaSembrado: true,
                    micropipeta: true,
                    estufaIncub: true
                }
            },
            etapa2: {
                include: {
                    analistaLectura: true,
                    equipoCuenta: true
                }
            },
            etapa3: {
                include: {
                    analistaTraspaso: true,
                    analistaLectConf: true,
                    analistaOxidasa: true,
                    agarNutritivo: true,
                    estufaConf: true
                }
            }
        };
    }

    // Override touchFormulario with TOCTOU fix: updateMany + count === 1
    async touchFormulario(id, extra = {}, expectedUpdatedAt) {
        if (!expectedUpdatedAt) {
            throw new Error('MISSING_EXPECTED_UPDATED_AT');
        }
        const result = await this.model.updateMany({
            where: {
                [this.idField]: BigInt(id),
                updatedAt: expectedUpdatedAt
            },
            data: {
                updatedAt: new Date(),
                ...extra
            }
        });

        if (result.count === 0) {
            throw new Error('CONCURRENCY_ERROR');
        }

        return result;
    }

    async create(data, tx) {
        const client = tx || this.model;
        const payload = {
            idSolicitudAnalisis: BigInt(data.idSolicitudAnalisis),
            rutAnalista: data.rutAnalista,
            etapaActual: data.etapaActual ?? 1,
            subetapaActual: data.subetapaActual ?? 1,
            estado: data.estado ?? 'en_proceso',
            muestras: data.muestras ? {
                create: data.muestras.map((m) => ({
                    idSolicitudMuestra: BigInt(m.idSolicitudMuestra),
                    numeroMuestra: String(m.numeroMuestra),
                    esDuplicado: Boolean(m.esDuplicado),
                    pesoMuestraTipo: m.pesoMuestraTipo ? String(m.pesoMuestraTipo) : undefined,
                    orden: Number(m.orden)
                }))
            } : undefined
        };
        return client.create({
            data: payload,
            include: this.getFullInclude()
        });
    }

    _prepareEtapaPayload(rawEtapa) {
        if (!rawEtapa) return {};
        const payload = { ...rawEtapa };

        // Convertir relaciones BigInt cuando vienen como numero/string
        if (payload.idLoteAgarVrbgSembrado !== undefined) {
            payload.idLoteAgarVrbgSembrado = BigInt(payload.idLoteAgarVrbgSembrado);
        }
        if (payload.idAgarNutritivo !== undefined) {
            payload.idAgarNutritivo = BigInt(payload.idAgarNutritivo);
        }

        return payload;
    }

    async upsertEtapa1(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            const etapaPayload = this._prepareEtapaPayload(data.etapa);
            await tx.entEtapa1.upsert({
                where: { idEntFormulario: BigInt(idFormulario) },
                create: { idEntFormulario: BigInt(idFormulario), ...etapaPayload },
                update: etapaPayload
            });

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? (data.etapa?.completada ? 2 : 1),
                subetapaActual: data.subetapaActual ?? 1
            }, expectedUpdatedAt);

            return tx.entFormulario.findUnique({
                where: { idEntFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa2(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            const etapaPayload = this._prepareEtapaPayload(data.etapa);
            await tx.entEtapa2.upsert({
                where: { idEntFormulario: BigInt(idFormulario) },
                create: { idEntFormulario: BigInt(idFormulario), ...etapaPayload },
                update: etapaPayload
            });

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 3,
                subetapaActual: data.subetapaActual ?? 5
            }, expectedUpdatedAt);

            return tx.entFormulario.findUnique({
                where: { idEntFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa3(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            const etapaPayload = this._prepareEtapaPayload(data.etapa);
            await tx.entEtapa3.upsert({
                where: { idEntFormulario: BigInt(idFormulario) },
                create: { idEntFormulario: BigInt(idFormulario), ...etapaPayload },
                update: etapaPayload
            });

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 3,
                subetapaActual: data.subetapaActual ?? 8,
                estado: data.estado ?? (data.etapa?.completada ? 'cerrado' : 'en_proceso')
            }, expectedUpdatedAt);

            return tx.entFormulario.findUnique({
                where: { idEntFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new EnterobacteriasRepository();
