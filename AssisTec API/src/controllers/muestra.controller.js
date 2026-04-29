const muestraService = require('../services/muestra.service');

class MuestraController {
    async crearBatch(req, res) {
        try {
            const { cantidad } = req.body;
            const { id } = req.params; // id de solicitud
            
            const result = await muestraService.crearBatch(id, cantidad, req.user);
            res.status(201).json(result);
        } catch (error) {
            if (error.message === 'UNAUTHORIZED_ROLE') return res.status(401).json({ mensaje: 'Rol no autorizado' });
            if (error.message === 'INVALID_QUANTITY') return res.status(400).json({ mensaje: 'Cantidad inválida' });
            if (error.message === 'NOT_FOUND') return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
            if (error.message === 'ALREADY_VALIDATED') return res.status(403).json({ mensaje: 'Solicitud ya validada, no se puede modificar' });
            
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

    async listar(req, res) {
        try {
            const { id } = req.params; // id de solicitud
            const result = await muestraService.listarPorSolicitud(id);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new MuestraController();
