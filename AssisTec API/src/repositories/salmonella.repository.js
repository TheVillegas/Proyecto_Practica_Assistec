const prisma = require('../config/prisma');
const BaseFormRepository = require('./baseForm.repository');

class SalRepository extends BaseFormRepository {
    constructor() {
        super(prisma.salFormulario, 'idSalFormulario');
    }

    getFullInclude() {
        return {
            solicitudAnalisis: { include: { formulario: true, muestra: true } },
            analista: { select: { rutUsuario: true, nombreApellidoUsuario: true } },
            muestras: {
                orderBy: { orden: 'asc' },
                include: {
                    solicitudMuestra: true,
                    fase3cLecturas: true,
                    fase4bLecturas: true,
                    fase5Resultados: true
                }
            },
            fase1: { include: { medioCaldoHomogeneizacion: true } },
            fase2a: { include: { analistaResponsable: true } },
            fase2b: { include: { medioCaldo: true, estufa: true, bano: true, tweenPipetas: { include: { material: true } }, micropipetas: { include: { micropipeta: true } } } },
            fase2c: true,
            fase3a: { include: { analistaCaldoApt: true, analistaCaldosFinales: true } },
            fase3b: { include: { estufaSelenito: true, banoSelenito: true, estufaRappaport: true, banoRappaport: true, pipetas: { include: { material: true } }, micropipetas: { include: { micropipeta: true } } } },
            fase4a: { include: { medioAgarXld: true, medioAgarSs: true, estufaAgares: true, banoAgares: true, analistaTraspaso: true, analistaLectura24h: true, analistaLectura48h: true, fase4bLecturas: true } },
            fase5Resultado: true
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
            await tx.salFase1.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? (data.etapa?.completada ? 2 : 1)
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await tx.salFase2a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 2
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2b(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            const fase2b = await tx.salFase2b.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.tweenPipetas)) {
                await tx.salFase2bTweenPipeta.deleteMany({
                    where: { idSalFase2b: fase2b.idSalFase2b }
                });
                if (data.tweenPipetas.length > 0) {
                    await tx.salFase2bTweenPipeta.createMany({
                        data: data.tweenPipetas.map((p) => ({
                            idSalFase2b: fase2b.idSalFase2b,
                            idMaterial: Number(p.idMaterial)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.salFase2bMicropipeta.deleteMany({
                    where: { idSalFase2b: fase2b.idSalFase2b }
                });
                if (data.micropipetas.length > 0) {
                    await tx.salFase2bMicropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idSalFase2b: fase2b.idSalFase2b,
                            idPipeta: Number(p.idPipeta)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 2
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2c(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await tx.salFase2c.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 2
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await tx.salFase3a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 3
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3b(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            const fase3b = await tx.salFase3b.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.pipetas)) {
                await tx.salFase3bPipeta.deleteMany({
                    where: { idSalFase3b: fase3b.idSalFase3b }
                });
                if (data.pipetas.length > 0) {
                    await tx.salFase3bPipeta.createMany({
                        data: data.pipetas.map((p) => ({
                            idSalFase3b: fase3b.idSalFase3b,
                            idMaterial: Number(p.idMaterial),
                            tipoMaterial: String(p.tipoMaterial)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.salFase3bMicropipeta.deleteMany({
                    where: { idSalFase3b: fase3b.idSalFase3b }
                });
                if (data.micropipetas.length > 0) {
                    await tx.salFase3bMicropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idSalFase3b: fase3b.idSalFase3b,
                            idPipeta: Number(p.idPipeta)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 3
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3cLectura(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSalMuestra);
                    const existing = await tx.salFase3cLectura.findFirst({
                        where: { idSalMuestra: idMuestra }
                    });

                    const payload = {
                        resultadoCaldoApt: lectura.resultadoCaldoApt,
                        resultadoseLenito: lectura.resultadoseLenito,
                        resultadoRappaport: lectura.resultadoRappaport,
                        ctrlPositivoSEnteritidis: lectura.ctrlPositivoSEnteritidis,
                        ctrlNegativoKPneumoniae: lectura.ctrlNegativoKPneumoniae,
                        ctrlBlanco: lectura.ctrlBlanco
                    };

                    if (existing) {
                        await tx.salFase3cLectura.update({
                            where: { idSalFase3cLectura: existing.idSalFase3cLectura },
                            data: payload
                        });
                    } else {
                        await tx.salFase3cLectura.create({
                            data: { idSalMuestra: idMuestra, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 3
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase4a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await tx.salFase4a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 4
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase4bLectura(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSalMuestra);
                    const idFase4a = BigInt(lectura.idSalFase4a);
                    const existing = await tx.salFase4bLectura.findFirst({
                        where: { idSalMuestra: idMuestra, idSalFase4a: idFase4a }
                    });

                    const payload = {
                        resXld24hSelenito: lectura.resXld24hSelenito,
                        resSs24hSelenito: lectura.resSs24hSelenito,
                        resXld48hSelenito: lectura.resXld48hSelenito,
                        resSs48hSelenito: lectura.resSs48hSelenito,
                        resXld24hRappaport: lectura.resXld24hRappaport,
                        resSs24hRappaport: lectura.resSs24hRappaport,
                        resXld48hRappaport: lectura.resXld48hRappaport,
                        resSs48hRappaport: lectura.resSs48hRappaport,
                        ctrlPositivoSEnteritidis: lectura.ctrlPositivoSEnteritidis,
                        ctrlNegativoKPneumoniae: lectura.ctrlNegativoKPneumoniae,
                        ctrlBlanco: lectura.ctrlBlanco
                    };

                    if (existing) {
                        await tx.salFase4bLectura.update({
                            where: { idSalFase4bLectura: existing.idSalFase4bLectura },
                            data: payload
                        });
                    } else {
                        await tx.salFase4bLectura.create({
                            data: { idSalMuestra: idMuestra, idSalFase4a: idFase4a, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 4
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase5Resultado(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            for (const resultado of data.resultados ?? []) {
                const idMuestra = BigInt(resultado.idSalMuestra);
                await tx.salFase5Resultado.upsert({
                    where: { idSalMuestra: idMuestra },
                    create: {
                        idSalMuestra: idMuestra,
                        salFormularioIdSalFormulario: BigInt(idFormulario),
                        resultadoFinal: resultado.resultadoFinal
                    },
                    update: {
                        resultadoFinal: resultado.resultadoFinal,
                        salFormularioIdSalFormulario: BigInt(idFormulario)
                    }
                });
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 5
            }, expectedUpdatedAt);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new SalRepository();
