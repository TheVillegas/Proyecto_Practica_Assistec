const prisma = require('../config/prisma');

class ColiformesRepository {
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

    async assertConcurrency(id, expectedUpdatedAt, tx = prisma) {
        const existing = await tx.coliFormulario.findUnique({
            where: { idColiFormulario: BigInt(id) },
            select: { updatedAt: true }
        });

        if (!existing) {
            throw new Error('NOT_FOUND');
        }

        if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
            throw new Error('CONCURRENCY_ERROR');
        }
    }

    async touchFormulario(id, extra = {}, tx = prisma) {
        return tx.coliFormulario.update({
            where: { idColiFormulario: BigInt(id) },
            data: { updatedAt: new Date(), ...extra }
        });
    }

    async create(data) {
        return prisma.$transaction(async (tx) => {
            const formulario = await tx.coliFormulario.create({
                data: {
                    idSolicitudAnalisis: BigInt(data.idSolicitudAnalisis),
                    rutAnalista: data.rutAnalista,
                    faseActual: data.faseActual ?? 1,
                    estado: data.estado ?? 'en_proceso',
                    muestras: {
                        create: (data.muestras ?? []).map((m) => ({
                            idSolicitudMuestra: BigInt(m.idSolicitudMuestra),
                            numeroMuestra: String(m.numeroMuestra),
                            esDuplicado: Boolean(m.esDuplicado),
                            pesoMuestraTipo: String(m.pesoMuestraTipo ?? '25g'),
                            orden: Number(m.orden)
                        }))
                    }
                }
            });

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: formulario.idColiFormulario },
                include: this.getFullInclude()
            });
        });
    }

    async findById(id) {
        return prisma.coliFormulario.findUnique({
            where: { idColiFormulario: BigInt(id) },
            include: this.getFullInclude()
        });
    }

    async findBySolicitudAnalisis(idSolicitudAnalisis) {
        return prisma.coliFormulario.findFirst({
            where: { idSolicitudAnalisis: BigInt(idSolicitudAnalisis) },
            include: this.getFullInclude()
        });
    }

    async updateEstado(id, estado, faseActual, expectedUpdatedAt) {
        await this.assertConcurrency(id, expectedUpdatedAt);
        await this.touchFormulario(id, {
            ...(estado !== undefined ? { estado } : {}),
            ...(faseActual !== undefined ? { faseActual } : {})
        });
        return this.findById(id);
    }

    async upsertFase1(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.coliFase1.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 1 }, tx);
            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const fase = await tx.coliFase2.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });

            if (Array.isArray(data.estufas)) {
                await tx.coliFase2Estufa.deleteMany({ where: { idColiFase2: fase.idColiFase2 } });
                if (data.estufas.length > 0) {
                    await tx.coliFase2Estufa.createMany({
                        data: data.estufas.map((e) => ({
                            idColiFase2: fase.idColiFase2,
                            idIncubacion: Number(e.idIncubacion)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.coliFase2Micropipeta.deleteMany({ where: { idColiFase2: fase.idColiFase2 } });
                if (data.micropipetas.length > 0) {
                    await tx.coliFase2Micropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idColiFase2: fase.idColiFase2,
                            idPipeta: Number(p.idPipeta),
                            capacidad: String(p.capacidad)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 2 }, tx);
            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.coliFase3.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });

            if (Array.isArray(data.submuestras)) {
                for (const sub of data.submuestras) {
                    const idMuestra = BigInt(sub.idColiMuestra);
                    const tipoLectura = String(sub.tipoLectura);
                    const dilucion = String(sub.dilucion);
                    const numeroTubo = Number(sub.numeroTubo);
                    await tx.coliFase3Submuestra.upsert({
                        where: {
                            idColiMuestra_tipoLectura_dilucion_numeroTubo: {
                                idColiMuestra: idMuestra,
                                tipoLectura,
                                dilucion,
                                numeroTubo
                            }
                        },
                        create: {
                            idColiMuestra: idMuestra,
                            tipoLectura,
                            dilucion,
                            numeroTubo,
                            presencia: sub.presencia
                        },
                        update: { presencia: sub.presencia }
                    });
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 3 }, tx);
            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase35Controles(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.coliFase35Controles.upsert({
                where: { idColiFormulario: BigInt(idFormulario) },
                create: { idColiFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 4 }, tx);
            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase4Resultados(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);

            for (const resultado of data.resultados ?? []) {
                const idMuestra = BigInt(resultado.idColiMuestra);
                await tx.coliFase4Resultado.upsert({
                    where: { idColiMuestra: idMuestra },
                    create: {
                        idColiMuestra: idMuestra,
                        coliFormularioIdColiFormulario: BigInt(idFormulario),
                        coliformesTotales: resultado.coliformesTotales,
                        coliformesFecales: resultado.coliformesFecales,
                        eColi: resultado.eColi,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null
                    },
                    update: {
                        coliformesTotales: resultado.coliformesTotales,
                        coliformesFecales: resultado.coliformesFecales,
                        eColi: resultado.eColi,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null,
                        coliFormularioIdColiFormulario: BigInt(idFormulario)
                    }
                });
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 4,
                estado: data.estado ?? 'en_proceso'
            }, tx);

            return tx.coliFormulario.findUnique({
                where: { idColiFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new ColiformesRepository();
