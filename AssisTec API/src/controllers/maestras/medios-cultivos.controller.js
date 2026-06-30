const prisma = require('../../config/prisma');

class MediosCultivosController {
    async getAll(req, res) {
        try {
            const medios = await prisma.medioCultivo.findMany({
                where: { activo: true },
                orderBy: { nombre: 'asc' }
            });
            res.status(200).json(medios);
        } catch (error) {
            res.status(500).json({ codigo: 'INTERNAL_ERROR', mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new MediosCultivosController();
