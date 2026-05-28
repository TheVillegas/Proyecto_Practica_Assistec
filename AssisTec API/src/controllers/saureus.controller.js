const saureusService = require('../services/saureus.service');

const handleError = (res, error) => {
    const map = {
        NOT_FOUND: [404, 'Formulario no encontrado'],
        UNAUTHORIZED_ROLE: [403, 'Rol no autorizado'],
        CONCURRENCY_ERROR: [409, 'El registro fue modificado por otro usuario'],
        MISSING_SOLICITUD_ANALISIS: [400, 'Debe indicar id_solicitud_analisis'],
        MISSING_MUESTRAS: [400, 'Debe indicar al menos una muestra'],
        FORMULARIO_ALREADY_EXISTS: [409, 'Ya existe un formulario para este análisis'],
        INVALID_ETAPA: [400, 'Etapa no válida (use 1-6)']
    };

    if (map[error.message]) {
        const [status, mensaje] = map[error.message];
        return res.status(status).json({ mensaje });
    }

    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
};

class SaureusController {
    async crear(req, res) {
        try {
            const result = await saureusService.crear(req.body, req.user);
            res.status(201).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtener(req, res) {
        try {
            const result = await saureusService.obtener(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtenerPorAnalisis(req, res) {
        try {
            const result = await saureusService.obtenerPorAnalisis(req.params.idAnalisis);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async guardarEtapa(req, res) {
        try {
            const result = await saureusService.guardarEtapa(
                req.params.id,
                req.params.etapa,
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

module.exports = new SaureusController();
