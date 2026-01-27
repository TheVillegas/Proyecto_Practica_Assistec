require('dotenv').config();
const { Pool } = require('pg');


// Validar variables de entorno
if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.NOMBRE_DB || !process.env.MI_CLAVE_POSTGRES || !process.env.DB_PORT) {
    console.error('🚨 ERROR: Faltan variables de entorno críticas para PostgreSQL');
    console.error('Verifica tu archivo .env');
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
    console.error('Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

//añadir delay para esperar a la base de datos
async function initialize() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 10000; // 10 segundos

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🔄 Intento ${attempt}/${MAX_RETRIES} de conexión a PostgreSQL...`);

            const client = await pool.connect();
            console.log("✅ Conexión a PostgreSQL OK");
            client.release();
            return; // Salir si la conexión fue exitosa

        } catch (error) {
            console.error(`❌ Intento ${attempt} falló:`, error.message);

            if (attempt < MAX_RETRIES) {
                console.log(`⏳ Reintentando en ${RETRY_DELAY / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error("🚨 CRÍTICO: No se pudo conectar a PostgreSQL después de todos los intentos");
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
