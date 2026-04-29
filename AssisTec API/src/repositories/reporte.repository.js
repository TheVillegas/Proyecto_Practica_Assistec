const prisma = require('../config/prisma');

class ReporteRepository {
    async crearBridge(numeroAli, reqTpa, reqRam, observacionesCliente, observacionesGenerales) {
        return await prisma.$transaction(async (tx) => {
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

            return { muestraAli, tpa, ram };
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
