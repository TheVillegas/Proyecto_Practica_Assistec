const prisma = require('../config/prisma');

class AnalisisRepository {
    async create(data) {
        // En Prisma tenemos id_solicitud_analisis mapeado pero sin autoincrement 
        // en el schema (según spec/DB), así que debemos obtener el max id o 
        // manejarlo si es serial en BD. En BD es BIGINT PRIMARY KEY, asumiendo seq.
        // Si no hay seq, calculamos el máximo (para este test lo calcularemos)
        
        const aggr = await prisma.solicitudAnalisis.aggregate({
            _max: { idSolicitudAnalisis: true }
        });
        const nextId = (aggr._max.idSolicitudAnalisis || BigInt(0)) + BigInt(1);

        return await prisma.solicitudAnalisis.create({
            data: {
                ...data,
                idSolicitudAnalisis: nextId
            }
        });
    }

    async findByMuestra(idMuestra) {
        return await prisma.solicitudAnalisis.findMany({
            where: { idSolicitudMuestra: BigInt(idMuestra) },
            include: {
                formulario: true,
                alcance: true
            }
        });
    }
}

module.exports = new AnalisisRepository();
