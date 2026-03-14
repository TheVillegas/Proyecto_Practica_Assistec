const db = require('../config/DB.js');
const ReporteTPA = require('./reporteTPAModel.js');
const ReporteRAM = require('./reporteRAMModel.js');
const logger = require('../utils/logger');

const MuestraALI = {};

MuestraALI.crearMuestraALI = async (datos) => {
    const { codigo_ali, codigo_otros, observaciones_cliente, observaciones_generales } = datos;
    let client;

    try {
        client = await db.getConnection();
        await client.query('BEGIN');

        // 0. Validar duplicados
        const checkSql = 'SELECT codigo_ali FROM MUESTRAS_ALI WHERE codigo_ali = $1';
        const checkResult = await client.query(checkSql, [codigo_ali]);

        if (checkResult.rows && checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            throw new Error(`El código ALI '${codigo_ali}' ya existe en el sistema.`);
        }

        // 1. Crear la muestra ALI
        const sql = 'INSERT INTO MUESTRAS_ALI (codigo_ali, codigo_otros, observaciones_cliente, observaciones_generales) VALUES ($1, $2, $3, $4)';
        const result = await client.query(sql, [
            codigo_ali,
            codigo_otros,
            observaciones_cliente,
            observaciones_generales
        ]);

        // 2. Crear automáticamente el reporte TPA y RAM
        await ReporteTPA.crearReporteTPAInicial(codigo_ali, client);
        await ReporteRAM.crearReporteRAMInicial(codigo_ali, client);

        // 3. Commit
        await client.query('COMMIT');

        return result;

    } catch (err) {
        logger.error(`Error creando Muestra ALI ${codigo_ali}, realizando rollback`, { message: err.message });
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                logger.error('Error al hacer rollback en crearMuestraALI', { message: rollbackErr.message });
            }
        }
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
};

MuestraALI.obtenerMuestraALI_porCodigoAli = async (codigo_ali) => {
    const sql = `
        SELECT m.*, 
               t.estado_actual as estado_tpa, 
               r.estado_ram as estado_ram 
        FROM MUESTRAS_ALI m
        LEFT JOIN TPA_REPORTE t ON m.codigo_ali = t.codigo_ali
        LEFT JOIN RAM_REPORTE r ON m.codigo_ali = r.codigo_ali
        WHERE m.codigo_ali = $1
    `;
    return await db.execute(sql, [codigo_ali]);
};

MuestraALI.obtenerMuestrasALI = async () => {
    const sql = `
        SELECT m.*, 
               t.estado_actual as estado_tpa, 
               r.estado_ram as estado_ram 
        FROM MUESTRAS_ALI m
        LEFT JOIN TPA_REPORTE t ON m.codigo_ali = t.codigo_ali
        LEFT JOIN RAM_REPORTE r ON m.codigo_ali = r.codigo_ali
    `;
    return await db.execute(sql);
};

MuestraALI.actualizarObservacionesGenerales = async (codigo_ali, observaciones_generales) => {
    const sql = 'UPDATE MUESTRAS_ALI SET observaciones_generales = $1 WHERE codigo_ali = $2';
    return await db.execute(sql, [observaciones_generales, codigo_ali]);
};

MuestraALI.eliminarMuestraALI = async (codigo_ali) => {
    // Borrado simple confiando en ON DELETE CASCADE del schema PostgreSQL
    const sql = 'DELETE FROM MUESTRAS_ALI WHERE codigo_ali = $1';
    return await db.execute(sql, [codigo_ali]);
};

module.exports = MuestraALI;
