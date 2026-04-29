const prisma = require('../config/prisma');

class SolicitudRepository {
    async create(data) {
        return await prisma.solicitudIngreso.create({
            data
        });
    }

    async findAll(whereClause = {}) {
        return await prisma.solicitudIngreso.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id) {
        return await prisma.solicitudIngreso.findUnique({
            where: { idSolicitud: BigInt(id) },
            include: {
                cliente: true,
                muestras: {
                    include: {
                        analisis: true
                    }
                }
            }
        });
    }

    async update(id, data, expectedUpdatedAt) {
        // Optimistic locking
        const existing = await prisma.solicitudIngreso.findUnique({
            where: { idSolicitud: BigInt(id) },
            select: { updatedAt: true }
        });

        if (!existing) {
            throw new Error('NOT_FOUND');
        }

        // Permitir un margen pequeño o igualdad exacta (en JS las fechas pueden perder ms al serializar)
        if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
            throw new Error('CONCURRENCY_ERROR');
        }

        return await prisma.solicitudIngreso.update({
            where: { idSolicitud: BigInt(id) },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    async getNextNumeroAli() {
        const aggr = await prisma.solicitudIngreso.aggregate({
            _max: { numeroAli: true }
        });
        return (aggr._max.numeroAli || 0) + 1;
    }
}

module.exports = new SolicitudRepository();
