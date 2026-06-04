const prisma = require('../config/prisma');
const BaseFormRepository = require('./baseForm.repository');

class ColiRepository extends BaseFormRepository {
    constructor() {
        super(prisma.coliFormulario, 'idColiFormulario');
    }

    getFullInclude() {
        return {
            solicitudAnalisis: { include: { formulario: true, muestra: true } },
            analista: { select: { rutUsuario: true, nombreApellidoUsuario: true } },
            muestras: {
                orderBy: { orden: 'asc' },
                include: {
                    solicitudMuestra: true,
                    submuestras: true,
                    fase4Resultados: true
                }
            },
            fase1: { include: { analistaInicio: true, analistaTermino: true } },
            fase2: { include: { estufas: { include: { estufa: true } }, micropipetas: { include: { micropipeta: true } } } },
            fase3: { include: { analista24h: true, analista48h: true } },
            fase35Controles: true,
            fase4Resultado: true
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
            faseActual: data.faseActual ?? 1,
            estado: data.estado ?? 'en_proceso',
            muestras: data.muestras ? {
                create: data.muestras.map((m) => ({
                    idSolicitudMuestra: BigInt(m.idSolicitudMuestra),
                    numeroMuestra: String(m.numeroMuestra),
                    esDuplicado: Boolean(m.esDuplicado),
                    pesoMuestraTipo: m.pesoMuestraTipo ? String(m.pesoMuestraTipo) : 'No informado',
                    orden: Number(m.orden)
                }))
            } : undefined
        };
        return client.create({
            data: payload,
            include: this.getFullInclude()
        });
    }

    async upsertFase1(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            await tx.coliFase1.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? (data.etapa?.completada ? 2 : 1)
            }, expectedUpdatedAt);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            const fase2 = await tx.coliFase2.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.estufas)) {
                await tx.coliFase2Estufa.deleteMany({
                    where: { idColiFase2: fase2.idColiFase2 }
                });
                if (data.estufas.length > 0) {
                    await tx.coliFase2Estufa.createMany({
                        data: data.estufas.map((e) => ({
                            idColiFase2: fase2.idColiFase2,
                            idIncubacion: Number(e.idIncubacion)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.coliFase2Micropipeta.deleteMany({
                    where: { idColiFase2: fase2.idColiFase2 }
                });
                if (data.micropipetas.length > 0) {
                    await tx.coliFase2Micropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idColiFase2: fase2.idColiFase2,
                            idPipeta: Number(p.idPipeta),
                            capacidad: String(p.capacidad)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 2
            }, expectedUpdatedAt);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            await tx.coliFase3.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.submuestras)) {
                for (const sub of data.submuestras) {
                    const idMuestra = BigInt(sub.idColiMuestra);
                    const existing = await tx.coliFase3Submuestra.findFirst({
                        where: {
                            idColiMuestra: idMuestra,
                            tipoLectura: String(sub.tipoLectura),
                            dilucion: String(sub.dilucion),
                            numeroTubo: Number(sub.numeroTubo)
                        }
                    });

                    const payload = {
                        presencia: sub.presencia === true || sub.presencia === 'true' || sub.presencia === 1
                    };

                    if (existing) {
                        await tx.coliFase3Submuestra.update({
                            where: { idSubmuestra: existing.idSubmuestra },
                            data: payload
                        });
                    } else {
                        await tx.coliFase3Submuestra.create({
                            data: {
                                idColiMuestra: idMuestra,
                                tipoLectura: String(sub.tipoLectura),
                                dilucion: String(sub.dilucion),
                                numeroTubo: Number(sub.numeroTubo),
                                ...payload
                            }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 3
            }, expectedUpdatedAt);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase35Controles(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            await tx.coliFase35Controles.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 3
            }, expectedUpdatedAt);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase4Resultados(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            for (const resultado of data.resultados ?? []) {
                const idMuestra = BigInt(resultado.idColiMuestra);
                await tx.coliFase4Resultado.upsert({
                    where: { idColiMuestra: idMuestra },
                    create: {
                        idColiMuestra: idMuestra,
                        coliFormularioIdColiFormulario: BigInt(idFormulario),
                        coliformesTotales: resultado.coliformesTotales ?? null,
                        coliformesFecales: resultado.coliformesFecales ?? null,
                        eColi: resultado.eColi ?? null,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null
                    },
                    update: {
                        coliformesTotales: resultado.coliformesTotales ?? null,
                        coliformesFecales: resultado.coliformesFecales ?? null,
                        eColi: resultado.eColi ?? null,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null,
                        coliFormularioIdColiFormulario: BigInt(idFormulario)
                    }
                });
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 4
            }, expectedUpdatedAt);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new ColiRepository();
