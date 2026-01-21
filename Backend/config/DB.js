require('dotenv').config();
const { Pool } = require('pg');

// Configuración de conexión para PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.NOMBRE_DB,
    password: process.env.MI_CLAVE_POSTGRES,
    port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

async function initialize() {
    try {
        const client = await pool.connect();
        console.log("Conexión a PostgreSQL exitosa");
        client.release();
    } catch (error) {
        console.error("Error al conectar con PostgreSQL:", error);
        // No lanzamos error fatal aquí para permitir reintentos si es necesario, 
        // pero en producción deberíamos asegurar la db.
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
        console.error('Error ejecutando query', { text, err });
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
