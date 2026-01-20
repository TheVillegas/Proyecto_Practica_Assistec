const DB = require('./config/DB');
const ReporteRAM = require('./models/reporteRAMModel');

async function run() {
    try {
        await DB.initialize();
        console.log("Fetching Reporte RAM 1255...");

        // 1. Check Raw DB Row properties first
        const connection = await DB.getConnection();
        const rawCheck = await connection.execute(`
            SELECT 
                r.FECHA_ULTIMA_MODIFICACION, 
                r.USUARIO_ULTIMA_MODIFICACION,
                u.NOMBRE_APELLIDO_ANALISTA as NOMBRE_JOINED
            FROM RAM_REPORTE r
            LEFT JOIN USUARIOS u ON r.USUARIO_ULTIMA_MODIFICACION = u.RUT_ANALISTA
            WHERE CODIGO_ALI = '1255'
        `);
        console.log("--- RAW DB RESULT ---");
        console.log("Keys:", Object.keys(rawCheck.rows[0] || {}));
        console.log("Values:", rawCheck.rows[0]);

        // 2. Check Model Logic
        const reporte = await ReporteRAM.obtenerReporteRAM('1255');
        console.log("\n--- MODEL RESULT ---");
        console.log("ultimaActualizacion:", reporte.ultimaActualizacion);
        console.log("responsable:", reporte.responsable);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
