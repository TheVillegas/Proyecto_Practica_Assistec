const winston = require('winston');
const salService = require('../services/salmonella.service');

const logger = winston.createLogger({
    level: 'error',
    transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

const ERROR_MAP = {
    NOT_FOUND: [404, 'Formulario no encontrado'],
    UNAUTHORIZED_ROLE: [403, 'Rol no autorizado'],
    CONCURRENCY_ERROR: [409, 'El registro fue modificado por otro usuario'],
    INVALID_STAGE_PROGRESSION: [409, 'Debe completar la etapa anterior antes de avanzar.'],
    INVALID_FASE: [400, 'Fase no valida (use 1-10)'],
    MISSING_EXPECTED_UPDATED_AT: [400, 'Falta expectedUpdatedAt para optimistic locking']
};

function handleError(res, error) {
    if (ERROR_MAP[error.message]) {
        const [status, mensaje] = ERROR_MAP[error.message];
        return res.status(status).json({ codigo: error.message, mensaje });
    }

    logger.error('Error no mapeado en SalController: ' + (error.message || 'Unknown') + ' | Stack: ' + (error.stack || 'N/A'));
    return res.status(500).json({ codigo: 'INTERNAL_ERROR', mensaje: 'Error interno del servidor' });
}

class SalController {
    async obtener(req, res) {
        try {
            const result = await salService.obtener(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async obtenerPorAnalisis(req, res) {
        try {
            const result = await salService.obtenerPorAnalisis(req.params.idAnalisis);
            res.status(200).json(result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async guardarFase(req, res) {
        try {
            const result = await salService.guardarFase(
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

module.exports = new SalController();
