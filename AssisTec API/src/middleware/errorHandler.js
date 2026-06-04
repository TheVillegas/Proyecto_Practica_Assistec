const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    transports: [
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

const PRISMA_ERROR_MAP = {
    P2002: { status: 409, mensaje: 'El registro ya existe' },
    P2025: { status: 404, mensaje: 'No encontrado' },
    P2003: { status: 400, mensaje: 'Referencia invalida' },
    P2000: { status: 400, mensaje: 'Valor excede limite' },
    P2014: { status: 400, mensaje: 'Faltan datos relacionados' },
    P2017: { status: 400, mensaje: 'Relacion invalida' }
};

const DOMAIN_ERROR_MAP = {
    CONCURRENCY_ERROR: { status: 409, mensaje: 'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.' },
    INVALID_STAGE_PROGRESSION: { status: 409, mensaje: 'Debe completar la etapa anterior antes de avanzar.' },
    NOT_FOUND: { status: 404, mensaje: 'No encontrado' },
    UNAUTHORIZED_ROLE: { status: 403, mensaje: 'No autorizado' }
};

function errorHandler(err, req, res, _next, injectedLogger = logger) {
    // Log full error server-side
    injectedLogger.error('Error: ' + (err.message || 'Unknown') + ' | Stack: ' + (err.stack || 'N/A'));

    // Domain errors
    if (err.message && DOMAIN_ERROR_MAP[err.message]) {
        const mapped = DOMAIN_ERROR_MAP[err.message];
        return res.status(mapped.status).json({ codigo: err.message, mensaje: mapped.mensaje });
    }

    // Prisma errors
    if (err.code && err.code.startsWith('P')) {
        const mapped = PRISMA_ERROR_MAP[err.code] || { status: 500, mensaje: 'Error interno del servidor' };
        return res.status(mapped.status).json({ codigo: err.code, mensaje: mapped.mensaje });
    }

    // Fallback
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = errorHandler;
