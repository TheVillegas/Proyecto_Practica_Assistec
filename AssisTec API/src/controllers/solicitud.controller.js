const solicitudService = require('../services/solicitud.service');

class SolicitudController {
    async crear(req, res) {
        try {
            const result = await solicitudService.crear(req.body, req.user);
            res.status(201).json({
                id_solicitud: result.idSolicitud.toString(),
                numero_ali: result.numeroAli
            });
        } catch (error) {
            if (error.message === 'UNAUTHORIZED_ROLE') {
                return res.status(401).json({ mensaje: 'Rol no autorizado' });
            }
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

    async listar(req, res) {
        try {
            const result = await solicitudService.listar(req.user);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

    async editar(req, res) {
        try {
            const result = await solicitudService.editar(req.params.id, req.body, req.expectedUpdatedAt, req.user);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'NOT_FOUND') return res.status(404).json({ mensaje: 'No encontrado' });
            if (error.message === 'ALREADY_VALIDATED') return res.status(403).json({ mensaje: 'Solicitud ya validada, no se puede modificar' });
            if (error.message === 'CONCURRENCY_ERROR') return res.status(409).json({ mensaje: 'El registro fue modificado por otro usuario' });
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

    async validar(req, res) {
        try {
            const result = await solicitudService.validar(req.params.id, req.expectedUpdatedAt, req.user);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'NOT_FOUND') return res.status(404).json({ mensaje: 'No encontrado' });
            if (error.message === 'UNAUTHORIZED_ROLE') return res.status(401).json({ mensaje: 'Rol no autorizado' });
            if (error.message === 'ALREADY_VALIDATED') return res.status(409).json({ mensaje: 'Ya validada' });
            if (error.message === 'CONCURRENCY_ERROR') return res.status(409).json({ mensaje: 'El registro fue modificado por otro usuario' });
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new SolicitudController();
