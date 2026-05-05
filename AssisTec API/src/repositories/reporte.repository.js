const prisma = require('../config/prisma');

class ReporteRepository {
    async crearBridge({
        idSolicitud,
        numeroAli,
        reqTpa,
        reqRam,
        observacionesCliente,
        observacionesGenerales,
        expectedUpdatedAt,
        actualizarSolicitud
    }) {
        return await prisma.$transaction(async (tx) => {
            let solicitud = null;

            if (idSolicitud && actualizarSolicitud) {
                const actual = await tx.solicitudIngreso.findUnique({
                    where: { idSolicitud: BigInt(idSolicitud) },
                    select: { updatedAt: true }
                });

                if (!actual) {
                    throw new Error('NOT_FOUND');
                }

                if (expectedUpdatedAt && actual.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
                    throw new Error('CONCURRENCY_ERROR');
                }
            }

            // 1. MuestraAli
            const muestraAli = await tx.muestraAli.create({
                data: {
                    codigoAli: numeroAli,
                    observacionesCliente,
                    observacionesGenerales
                }
            });

            // 2. TPA
            let tpa = null;
            if (reqTpa) {
                tpa = await tx.tpaReporte.create({
                    data: {
                        codigoAli: numeroAli,
                        estadoActual: 'NO_REALIZADO'
                    }
                });
            }

            // 3. RAM
            let ram = null;
            if (reqRam) {
                ram = await tx.ramReporte.create({
                    data: {
                        codigoAli: numeroAli,
                        estadoRam: 'Borrador'
                    }
                });
            }

            if (idSolicitud && actualizarSolicitud) {
                solicitud = await tx.solicitudIngreso.update({
                    where: { idSolicitud: BigInt(idSolicitud) },
                    data: {
                        ...actualizarSolicitud,
                        updatedAt: new Date()
                    }
                });
            }

            return { muestraAli, tpa, ram, solicitud };
        });
    }

    async findByCodigoAli(numeroAli) {
        return await prisma.muestraAli.findUnique({
            where: { codigoAli: numeroAli },
            include: { tpaReportes: true, ramReportes: true }
        });
    }
}

module.exports = new ReporteRepository();
