const winston = require('winston');
const enterobacteriasService = require('../services/enterobacterias.service');

const logger = winston.createLogger({
    level: 'error',
    transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

const ERROR_MAP = {
    NOT_FOUND: [404, 'Formulario no encontrado'],
    UNAUTHORIZED_ROLE: [403, 'Rol no autorizado'],
    CONCURRENCY_ERROR: [409, 'El registro fue modificado por otro usuario'],
    INVALID_STAGE_PROGRESSION: [409, 'Debe completar la etapa anterior antes de avanzar.'],
    INVALID_ETAPA: [400, 'Etapa no valida (use 1-3)'],
    MISSING_EXPECTED_UPDATED_AT: [400, 'Falta expectedUpdatedAt para optimistic locking'],
    INCUBATION_LOCKOUT: [422, 'Deben transcurrir 24 horas desde el inicio de incubacion']
};

function handleError(res, error) {
    if (ERROR_MAP[error.message]) {
        const [status, mensaje] = ERROR_MAP[error.message];
        const response = { codigo: error.message, mensaje };
        if (error.detalles) {
            response.detalles = error.detalles;
        }
        return res.status(status).json(response);
    }

    logger.error('Error no mapeado en EnterobacteriasController: ' + (error.message || 'Unknown') + ' | Stack: ' + (error.stack || 'N/A'));
    return res.status(500).json({ codigo: 'INTERNAL_ERROR', mensaje: 'Error interno del servidor' });
}

class EnterobacteriasController {
    async obtener(req, res) {
        try {
            const result = await enterobacteriasService.obtener(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtenerPorAnalisis(req, res) {
        try {
            const result = await enterobacteriasService.obtenerPorAnalisis(req.params.idAnalisis);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async guardarEtapa(req, res) {
        try {
            const result = await enterobacteriasService.guardarEtapa(
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

module.exports = new EnterobacteriasController();
