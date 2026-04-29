const prisma = require('../config/prisma');

class MuestraRepository {
    async createBatch(idSolicitud, cantidad) {
        // En Prisma 6 podemos usar createManyAndReturn para SQLite/Postgres
        // o mapear en un ciclo
        
        const data = Array.from({ length: cantidad }).map(() => ({
            idSolicitud: BigInt(idSolicitud)
        }));

        // Insertar multiples registros
        await prisma.solicitudMuestra.createMany({
            data
        });

        // Retornar los creados (limitamos a la solicitud)
        return await prisma.solicitudMuestra.findMany({
            where: { idSolicitud: BigInt(idSolicitud) },
            orderBy: { idSolicitudMuestra: 'desc' },
            take: cantidad
        });
    }

    async findBySolicitud(idSolicitud) {
        return await prisma.solicitudMuestra.findMany({
            where: { idSolicitud: BigInt(idSolicitud) },
            include: {
                analisis: {
                    include: {
                        formulario: true,
                        alcance: true
                    }
                }
            }
        });
    }
}

module.exports = new MuestraRepository();
