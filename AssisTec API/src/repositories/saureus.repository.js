const prisma = require('../config/prisma');

class SaureusRepository {
    getFullInclude() {
        return {
            solicitudAnalisis: { include: { formulario: true, muestra: true } },
            analista: { select: { rutUsuario: true, nombreApellidoUsuario: true } },
            muestras: {
                orderBy: { orden: 'asc' },
                include: {
                    solicitudMuestra: true,
                    etapa1Lecturas: true,
                    etapa3Lecturas: true,
                    etapa4Lecturas: true,
                    etapa5Resultados: true
                }
            },
            etapa1: { include: { micropipetas: { include: { micropipeta: true } }, estufa: true, analistaInicio: true, analistaTermino: true } },
            etapa2: { include: { analista24h: true, analista48h: true } },
            etapa3: { include: { lecturas: true, estufa: true, analistaTraspaso: true, analistaLectura: true } },
            etapa4: { include: { lecturas: true, estufa: true, micropipeta: true, analistaPrueba: true, analista46h: true, analista24h: true } },
            etapa5Resultado: true,
            etapa6Cierre: { include: { coordinadorCierre: true } }
        };
    }

    async assertConcurrency(id, expectedUpdatedAt, tx = prisma) {
        const existing = await tx.sauFormulario.findUnique({
            where: { idSauFormulario: BigInt(id) },
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
        return tx.sauFormulario.update({
            where: { idSauFormulario: BigInt(id) },
            data: { updatedAt: new Date(), ...extra }
        });
    }

    async create(data) {
        return prisma.$transaction(async (tx) => {
            const formulario = await tx.sauFormulario.create({
                data: {
                    idSolicitudAnalisis: BigInt(data.idSolicitudAnalisis),
                    rutAnalista: data.rutAnalista,
                    etapaActual: data.etapaActual ?? 1,
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

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: formulario.idSauFormulario },
                include: this.getFullInclude()
            });
        });
    }

    async findById(id) {
        return prisma.sauFormulario.findUnique({
            where: { idSauFormulario: BigInt(id) },
            include: this.getFullInclude()
        });
    }

    async findBySolicitudAnalisis(idSolicitudAnalisis) {
        return prisma.sauFormulario.findFirst({
            where: { idSolicitudAnalisis: BigInt(idSolicitudAnalisis) },
            include: this.getFullInclude()
        });
    }

    async updateEstado(id, estado, etapaActual, expectedUpdatedAt) {
        await this.assertConcurrency(id, expectedUpdatedAt);
        await this.touchFormulario(id, {
            ...(estado !== undefined ? { estado } : {}),
            ...(etapaActual !== undefined ? { etapaActual } : {})
        });
        return this.findById(id);
    }

    async upsertEtapa1(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);

            const etapa = await tx.sauEtapa1.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.micropipetas)) {
                await tx.sauEtapa1Micropipeta.deleteMany({ where: { idSauEtapa1: etapa.idSauEtapa1 } });
                if (data.micropipetas.length > 0) {
                    await tx.sauEtapa1Micropipeta.createMany({
                        data: data.micropipetas.map((p) => ({
                            idSauEtapa1: etapa.idSauEtapa1,
                            idPipeta: Number(p.idPipeta),
                            capacidad: String(p.capacidad)
                        }))
                    });
                }
            }

            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSauMuestra);
                    const existing = await tx.sauEtapa1Lectura.findFirst({ where: { idSauMuestra: idMuestra } });
                    const payload = {
                        conteo24hPlaca1: lectura.conteo24hPlaca1,
                        conteo24hPlaca2: lectura.conteo24hPlaca2,
                        conteo48hPlaca1: lectura.conteo48hPlaca1,
                        conteo48hPlaca2: lectura.conteo48hPlaca2
                    };
                    if (existing) {
                        await tx.sauEtapa1Lectura.update({ where: { idSauEtapa1Lectura: existing.idSauEtapa1Lectura }, data: payload });
                    } else {
                        await tx.sauEtapa1Lectura.create({ data: { idSauMuestra: idMuestra, ...payload } });
                    }
                }
            }

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? Math.max(1, data.etapa?.completada ? 2 : 1)
            }, tx);

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa2(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.sauEtapa2.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });
            await this.touchFormulario(idFormulario, { etapaActual: data.etapaActual ?? 2 }, tx);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa3(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const etapa = await tx.sauEtapa3.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSauMuestra);
                    const existing = await tx.sauEtapa3Lectura.findFirst({
                        where: { idSauMuestra: idMuestra, idSauEtapa3: etapa.idSauEtapa3 }
                    });
                    const payload = {
                        coloniasPlaca1: lectura.coloniasPlaca1,
                        coloniasPlaca2: lectura.coloniasPlaca2
                    };
                    if (existing) {
                        await tx.sauEtapa3Lectura.update({ where: { idSauEtapa3Lectura: existing.idSauEtapa3Lectura }, data: payload });
                    } else {
                        await tx.sauEtapa3Lectura.create({
                            data: { idSauMuestra: idMuestra, idSauEtapa3: etapa.idSauEtapa3, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, { etapaActual: data.etapaActual ?? 3 }, tx);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa4(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            const etapa = await tx.sauEtapa4.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.lecturas)) {
                for (const lectura of data.lecturas) {
                    const idMuestra = BigInt(lectura.idSauMuestra);
                    const tipoLectura = String(lectura.tipoLectura);
                    const existing = await tx.sauEtapa4Lectura.findFirst({
                        where: { idSauMuestra: idMuestra, idSauEtapa4: etapa.idSauEtapa4, tipoLectura }
                    });
                    const payload = {
                        coloniasPlaca1: lectura.coloniasPlaca1,
                        coloniasPlaca2: lectura.coloniasPlaca2
                    };
                    if (existing) {
                        await tx.sauEtapa4Lectura.update({ where: { idSauEtapa4Lectura: existing.idSauEtapa4Lectura }, data: payload });
                    } else {
                        await tx.sauEtapa4Lectura.create({
                            data: { idSauMuestra: idMuestra, idSauEtapa4: etapa.idSauEtapa4, tipoLectura, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, { etapaActual: data.etapaActual ?? 4 }, tx);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa5Resultados(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);

            for (const resultado of data.resultados ?? []) {
                const idMuestra = BigInt(resultado.idSauMuestra);
                await tx.sauEtapa5Resultado.upsert({
                    where: { idSauMuestra: idMuestra },
                    create: {
                        idSauMuestra: idMuestra,
                        sauFormularioIdSauFormulario: BigInt(idFormulario),
                        nSAureus: resultado.nSAureus,
                        ufcPorG: resultado.ufcPorG,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null
                    },
                    update: {
                        nSAureus: resultado.nSAureus,
                        ufcPorG: resultado.ufcPorG,
                        incongruenciaDetectada: Boolean(resultado.incongruenciaDetectada ?? false),
                        observacionIncongruencia: resultado.observacionIncongruencia ?? null,
                        sauFormularioIdSauFormulario: BigInt(idFormulario)
                    }
                });
            }

            await this.touchFormulario(idFormulario, { etapaActual: data.etapaActual ?? 5 }, tx);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa6Cierre(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.assertConcurrency(idFormulario, expectedUpdatedAt, tx);
            await tx.sauEtapa6Cierre.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });
            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 6,
                estado: data.estado ?? (data.etapa?.cerrado ? 'cerrado' : 'en_proceso')
            }, tx);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new SaureusRepository();
