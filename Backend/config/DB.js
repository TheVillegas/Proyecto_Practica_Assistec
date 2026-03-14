require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../utils/logger');

// Validar variables de entorno
if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.NOMBRE_DB || !process.env.MI_CLAVE_POSTGRES || !process.env.DB_PORT) {
    logger.error('Faltan variables de entorno críticas para PostgreSQL. Verifica tu archivo .env');
    process.exit(1);
}

// Configuración de conexión para PostgreSQL
const pool = new Pool({
    user: String(process.env.DB_USER),
    host: String(process.env.DB_HOST),
    database: String(process.env.NOMBRE_DB),
    password: String(process.env.MI_CLAVE_POSTGRES),
    port: parseInt(process.env.DB_PORT, 10),
});

pool.on('error', (err, client) => {
    // Loguear el error pero NO matar el proceso — un error esporádico de pool
    // no debe derribar el servidor entero. Express seguirá sirviendo requests.
    logger.error('Error inesperado en el pool de PostgreSQL', { message: err.message });
});

//añadir delay para esperar a la base de datos
async function initialize() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 10000; // 10 segundos

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`Intento ${attempt}/${MAX_RETRIES} de conexión a PostgreSQL...`);

            const client = await pool.connect();
            logger.info('Conexión a PostgreSQL OK');
            client.release();
            return; // Salir si la conexión fue exitosa

        } catch (error) {
            logger.error(`Intento ${attempt} de conexión a PostgreSQL falló`, { message: error.message });

            if (attempt < MAX_RETRIES) {
                logger.info(`Reintentando en ${RETRY_DELAY / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                logger.error('CRÍTICO: No se pudo conectar a PostgreSQL después de todos los intentos');
                throw error;
            }
        }
    }
}

// Wrapper para ejecutar consultas
// Nota: Postgres usa $1, $2... no :named_param. Los modelos deben ser actualizados.
async function execute(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        // Adaptador para mantener cierta compatibilidad con el formato de retorno si es necesario
        // Oracle devolvía { rows: ... }
        // PG devuelve { rows: [], rowCount: ... }
        // Son compatibles en la propiedad .rows
        return res;
    } catch (err) {
        logger.error('Error ejecutando query', { text, message: err.message });
        throw err;
    }
}

// Wrapper para obtener un cliente del pool (para transacciones)
async function getConnection() {
    const client = await pool.connect();

    // Añadimos métodos auxiliares para simular la API de transacciones si es útil,
    // o simplemente retornamos el cliente nativo.
    // El modelo usará client.query('BEGIN'), client.query('COMMIT'), etc.

    // Monkey-patch execute para consistencia si es necesario, 
    // pero client.query es el estándar.
    client.execute = client.query;

    // Monkey-patch close para que maps a release
    client.close = client.release;

    return client;
}

module.exports = { initialize, execute, getConnection, pool };
