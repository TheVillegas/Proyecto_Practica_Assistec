/**
 * Logger centralizado — Winston
 *
 * En desarrollo (NODE_ENV != 'production'):
 *   - Salida en consola con colores y formato legible
 *   - Nivel: 'debug' (todo visible)
 *
 * En producción (NODE_ENV === 'production'):
 *   - Salida en consola en formato JSON (para recolectores como Datadog, CloudWatch, etc.)
 *   - Nivel: 'warn' (solo errores y advertencias)
 *   - NUNCA exponer stack traces al cliente — eso lo maneja el global error handler en app.js
 *
 * Uso:
 *   const logger = require('../utils/logger');
 *   logger.info('mensaje');
 *   logger.warn('advertencia');
 *   logger.error('error', { context: 'extra data' });
 */
const { createLogger, format, transports } = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = format;

const isProduction = process.env.NODE_ENV === 'production';

// Formato legible para desarrollo
const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return stack
            ? `${timestamp} [${level}]: ${message}\n${stack}${metaStr}`
            : `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Formato JSON para producción (ingestable por cualquier log aggregator)
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = createLogger({
    level: isProduction ? 'warn' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    transports: [
        new transports.Console()
    ]
});

module.exports = logger;
