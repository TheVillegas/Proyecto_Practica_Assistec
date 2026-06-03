const prisma = require('../config/prisma');
const BaseFormRepository = require('./baseForm.repository');

class SauRepository extends BaseFormRepository {
    constructor() {
        super(prisma.sauFormulario, 'idSauFormulario');
    }

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

    async _upsertLecturas(tx, lecturas, model, idField, payloadBuilder, extraMatch = {}) {
        if (!Array.isArray(lecturas)) return;
        for (const lectura of lecturas) {
            const idMuestra = BigInt(lectura.idSauMuestra);
            const where = { idSauMuestra: idMuestra, ...extraMatch };
            const existing = await model.findFirst({ where });
            const payload = payloadBuilder(lectura);
            if (existing) {
                await model.update({ where: { [idField]: existing[idField] }, data: payload });
            } else {
                await model.create({ data: { idSauMuestra: idMuestra, ...extraMatch, ...payload } });
            }
        }
    }

    async upsertEtapa1(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

            const etapa = await tx.sauEtapa1.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            if (Array.isArray(data.micropipetas)) {
                await tx.sauEtapa1Micropipeta.deleteMany({
                    where: { idSauEtapa1: etapa.idSauEtapa1 }
                });
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

            await this._upsertLecturas(tx, data.lecturas, tx.sauEtapa1Lectura, 'idSauEtapa1Lectura',
                (l) => ({
                    conteo24hPlaca1: l.conteo24hPlaca1,
                    conteo24hPlaca2: l.conteo24hPlaca2,
                    conteo48hPlaca1: l.conteo48hPlaca1,
                    conteo48hPlaca2: l.conteo48hPlaca2
                })
            );

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? (data.etapa?.completada ? 2 : 1)
            }, expectedUpdatedAt);

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa2(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);
            await tx.sauEtapa2.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });
            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 2
            }, expectedUpdatedAt);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa3(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);
            const etapa = await tx.sauEtapa3.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });

            await this._upsertLecturas(tx, data.lecturas, tx.sauEtapa3Lectura, 'idSauEtapa3Lectura',
                (l) => ({ coloniasPlaca1: l.coloniasPlaca1, coloniasPlaca2: l.coloniasPlaca2 }),
                { idSauEtapa3: etapa.idSauEtapa3 }
            );

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 3
            }, expectedUpdatedAt);

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa4(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);
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
                        await tx.sauEtapa4Lectura.update({
                            where: { idSauEtapa4Lectura: existing.idSauEtapa4Lectura },
                            data: payload
                        });
                    } else {
                        await tx.sauEtapa4Lectura.create({
                            data: { idSauMuestra: idMuestra, idSauEtapa4: etapa.idSauEtapa4, tipoLectura, ...payload }
                        });
                    }
                }
            }

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 4
            }, expectedUpdatedAt);

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa5Resultados(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);

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

            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 5
            }, expectedUpdatedAt);

            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }

    async upsertEtapa6Cierre(idFormulario, data, expectedUpdatedAt) {
        return prisma.$transaction(async (tx) => {
            await this.touchFormulario(idFormulario, {}, expectedUpdatedAt);
            await tx.sauEtapa6Cierre.upsert({
                where: { idSauFormulario: BigInt(idFormulario) },
                create: { idSauFormulario: BigInt(idFormulario), ...data.etapa },
                update: data.etapa
            });
            await this.touchFormulario(idFormulario, {
                etapaActual: data.etapaActual ?? 6,
                estado: data.estado ?? (data.etapa?.cerrado ? 'cerrado' : 'en_proceso')
            }, expectedUpdatedAt);
            return tx.sauFormulario.findUnique({
                where: { idSauFormulario: BigInt(idFormulario) },
                include: this.getFullInclude()
            });
        });
    }
}

module.exports = new SauRepository();
