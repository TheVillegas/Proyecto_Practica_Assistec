const prisma = require('../config/prisma');

class SalmonellaRepository {
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
            fase1: true,
            fase2a: { include: { analistaResponsable: true } },
            fase2b: {
                include: {
                    estufa: true,
                    tweenPipetas: { include: { material: true } },
                    micropipetas: { include: { micropipeta: true } }
                }
            },
            fase2c: true,
            fase3a: { include: { analistaCaldoApt: true, analistaCaldosFinales: true } },
            fase3b: {
                include: {
                    estufaSelenito: true,
                    pipetas: { include: { material: true } },
                    micropipetas: { include: { micropipeta: true } }
                }
            },
            fase4a: {
                include: {
                    estufaAgares: true,
                    analistaTraspaso: true,
                    analistaLectura24h: true,
                    analistaLectura48h: true,
                    fase4bLecturas: true
                }
            },
            fase5Resultado: true
        };
    }

    async assertConcurrency(id, expectedUpdatedAt, tx = prisma) {
        const existing = await tx.salFormulario.findUnique({
            where: { idSalFormulario: BigInt(id) },
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
        return tx.salFormulario.update({
            where: { idSalFormulario: BigInt(id) },
            data: { updatedAt: new Date(), ...extra }
        });
    }

    async create(data) {
        return prisma.$transaction(async (tx) => {
            const formulario = await tx.salFormulario.create({
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
                            orden: Number(m.orden)
                        }))
                    }
                }
            });

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: formulario.idSalFormulario },
                include: this.getFullInclude()
            });
        });
    }

    async findById(id) {
        return prisma.salFormulario.findUnique({
            where: { idSalFormulario: BigInt(id) },
            include: this.getFullInclude()
        });
    }

    async findBySolicitudAnalisis(idSolicitudAnalisis) {
        return prisma.salFormulario.findFirst({
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
            await tx.salFase1.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 1 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.salFase2a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 2 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2b(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const fase = await tx.salFase2b.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });

            if (Array.isArray(data.tweenPipetas)) {
                await tx.salFase2bTweenPipeta.deleteMany({ where: { idSalFase2b: fase.idSalFase2b } });
                if (data.tweenPipetas.length > 0) {
                    await tx.salFase2bTweenPipeta.createMany({
                        data: data.tweenPipetas.map((t) => ({
                            idSalFase2b: fase.idSalFase2b,
                            idMaterial: Number(t.idMaterial)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.salFase2bMicropipeta.deleteMany({ where: { idSalFase2b: fase.idSalFase2b } });
                if (data.micropipetas.length > 0) {
                    await tx.salFase2bMicropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idSalFase2b: fase.idSalFase2b,
                            idPipeta: Number(p.idPipeta)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 2 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase2c(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.salFase2c.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 2 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.salFase3a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });
            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 3 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3b(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const fase = await tx.salFase3b.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });

            if (Array.isArray(data.pipetas)) {
                await tx.salFase3bPipeta.deleteMany({ where: { idSalFase3b: fase.idSalFase3b } });
                if (data.pipetas.length > 0) {
                    await tx.salFase3bPipeta.createMany({
                        data: data.pipetas.map((p) => ({
                            idSalFase3b: fase.idSalFase3b,
                            idMaterial: Number(p.idMaterial),
                            tipoMaterial: String(p.tipoMaterial)
                        }))
                    });
                }
            }

            if (Array.isArray(data.micropipetas)) {
                await tx.salFase3bMicropipeta.deleteMany({ where: { idSalFase3b: fase.idSalFase3b } });
                if (data.micropipetas.length > 0) {
                    await tx.salFase3bMicropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idSalFase3b: fase.idSalFase3b,
                            idPipeta: Number(p.idPipeta)
                        }))
                    });
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 3 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase3cLecturas(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);

            for (const lectura of data.lecturas ?? []) {
                const idMuestra = BigInt(lectura.idSalMuestra);
                const existing = await tx.salFase3cLectura.findFirst({ where: { idSalMuestra: idMuestra } });
                const payload = {
                    resultadoCaldoApt: lectura.resultadoCaldoApt,
                    resultadoseLenito: lectura.resultadoseLenito ?? lectura.resultadoSelenito,
                    resultadoRappaport: lectura.resultadoRappaport,
                    ctrlPositivoSEnteritidis: lectura.ctrlPositivoSEnteritidis,
                    ctrlNegativoKPneumoniae: lectura.ctrlNegativoKPneumoniae,
                    ctrlBlanco: lectura.ctrlBlanco
                };
                if (existing) {
                    await tx.salFase3cLectura.update({ where: { idSalFase3cLectura: existing.idSalFase3cLectura }, data: payload });
                } else {
                    await tx.salFase3cLectura.create({ data: { idSalMuestra: idMuestra, ...payload } });
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 3 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase4a(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const fase = await tx.salFase4a.upsert({
                where: { idSalFormulario: BigInt(idFormulario) },
                create: { idSalFormulario: BigInt(idFormulario), ...data.fase },
                update: data.fase
            });

            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSalMuestra);
                    const existing = await tx.salFase4bLectura.findFirst({
                        where: { idSalMuestra: idMuestra, idSalFase4a: fase.idSalFase4a }
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
                        await tx.salFase4bLectura.update({ where: { idSalFase4bLectura: existing.idSalFase4bLectura }, data: payload });
                    } else {
                        await tx.salFase4bLectura.create({
                            data: { idSalMuestra: idMuestra, idSalFase4a: fase.idSalFase4a, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, { faseActual: data.faseActual ?? 4 }, tx);
            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertFase5Resultados(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);

            for (const resultado of data.resultados ?? []) {
                const idMuestra = BigInt(resultado.idSalMuestra);
                await tx.salFase5Resultado.upsert({
                    where: { idSalMuestra: idMuestra },
                    create: {
                        idSalMuestra: idMuestra,
                        salFormularioIdSalFormulario: BigInt(idFormulario),
                        resultadoFinal: String(resultado.resultadoFinal)
                    },
                    update: {
                        resultadoFinal: String(resultado.resultadoFinal),
                        salFormularioIdSalFormulario: BigInt(idFormulario)
                    }
                });
            }

            await this.touchFormulario(idFormulario, {
                faseActual: data.faseActual ?? 5,
                estado: data.estado ?? 'cerrado'
            }, tx);

            return tx.salFormulario.findUnique({
                where: { idSalFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new SalmonellaRepository();
