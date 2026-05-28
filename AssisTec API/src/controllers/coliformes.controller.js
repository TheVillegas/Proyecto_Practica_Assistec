const coliformesService = require('../services/coliformes.service');

const handleError = (res, error) => {
    const map = {
        NOT_FOUND: [404, 'Formulario no encontrado'],
        UNAUTHORIZED_ROLE: [403, 'Rol no autorizado'],
        CONCURRENCY_ERROR: [409, 'El registro fue modificado por otro usuario'],
        MISSING_SOLICITUD_ANALISIS: [400, 'Debe indicar id_solicitud_analisis'],
        MISSING_MUESTRAS: [400, 'Debe indicar al menos una muestra'],
        FORMULARIO_ALREADY_EXISTS: [409, 'Ya existe un formulario para este análisis'],
        INVALID_FASE: [400, 'Fase no válida (use 1, 2, 3, 35 o 4)']
    };

    if (map[error.message]) {
        const [status, mensaje] = map[error.message];
        return res.status(status).json({ mensaje });
    }

    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
};

class ColiformesController {
    async crear(req, res) {
        try {
            const result = await coliformesService.crear(req.body, req.user);
            res.status(201).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtener(req, res) {
        try {
            const result = await coliformesService.obtener(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtenerPorAnalisis(req, res) {
        try {
            const result = await coliformesService.obtenerPorAnalisis(req.params.idAnalisis);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async guardarFase(req, res) {
        try {
            const result = await coliformesService.guardarFase(
                req.params.id,
                req.params.fase,
                req.body,
                req.expectedUpdatedAt,
                req.user
            );
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new ColiformesController();
