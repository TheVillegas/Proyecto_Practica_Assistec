const db = require('../config/DB.js');
const ReporteTPA = require('./reporteTPAModel.js');
const ReporteRAM = require('./reporteRAMModel.js');

const MuestraALI = {};

MuestraALI.crearMuestraALI = async (datos, callback) => {
    const { codigo_ali, codigo_otros, observaciones_cliente, observaciones_generales } = datos;
    let connection;

    try {
        // Obtenemos una conexión nativa para manejar la transacción manualmente
        connection = await db.getConnection();

        // 1. Crear la muestra ALI (sin autoCommit)
        const sql = 'INSERT INTO MUESTRAS_ALI (codigo_ali, codigo_otros, observaciones_cliente, observaciones_generales) VALUES (:codigo_ali, :codigo_otros, :observaciones_cliente, :observaciones_generales)';

        const result = await connection.execute(sql, {
            codigo_ali,
            codigo_otros,
            observaciones_cliente,
            observaciones_generales
        }, { autoCommit: false });

        // 2. Crear automáticamente el reporte TPA (usando la misma conexión)
        await ReporteTPA.crearReporteTPAInicial(codigo_ali, connection);

        await ReporteRAM.crearReporteRAMInicial(codigo_ali, connection);

        // 3. Si todo salió bien, hacemos COMMIT de ambas operaciones
        await connection.commit();

        callback(null, result);

    } catch (err) {
        console.error(`Error creando Muestra ALI ${codigo_ali}, realizando rollback:`, err);
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Error al hacer rollback:", rollbackErr);
            }
        }
        callback(err);
    } finally {
        // Siempre liberar la conexión al pool
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error al cerrar conexión:", closeErr);
            }
        }
    }
};

MuestraALI.obtenerMuestraALI_porCodigoAli = (codigo_ali, callback) => {
    const sql = 'SELECT * FROM MUESTRAS_ALI WHERE codigo_ali = :codigo_ali';
    db.execute(sql, { codigo_ali })
        .then(result => callback(null, result))
        .catch(err => callback(err));
};

MuestraALI.obtenerMuestrasALI = (callback) => {
    const sql = 'SELECT * FROM MUESTRAS_ALI';
    db.execute(sql)
        .then(result => callback(null, result))
        .catch(err => callback(err));
};

MuestraALI.actualizarObservacionesGenerales = (codigo_ali, observaciones_generales, callback) => {
    const sql = 'UPDATE MUESTRAS_ALI SET observaciones_generales = :observaciones_generales WHERE codigo_ali = :codigo_ali';
    db.execute(sql, { codigo_ali, observaciones_generales }, { autoCommit: true })
        .then(result => callback(null, result))
        .catch(err => callback(err));
};

MuestraALI.eliminarMuestraALI = (codigo_ali, callback) => {
    // Bloque PL/SQL para borrar en cascada manual respetando las FKs
    const sql = `
        BEGIN
            -- 1. Borrar hijos de RAM_REPORTE (aunque tengan CASCADE, aseguramos)
            DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali;
            DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali;
            DELETE FROM RAM_REPORTE WHERE codigo_ali = :codigo_ali;

            -- 2. Borrar sub-etapas de TPA_REPORTE
            -- TPA_ETAPA5_RECURSOS tiene CASCADE desde TPA_ETAPA5_SIEMBRA
            DELETE FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = :codigo_ali;
            DELETE FROM TPA_ETAPA4_RETIRO WHERE codigo_ali = :codigo_ali;
            DELETE FROM TPA_ETAPA3_CHECKLIST WHERE codigo_ali = :codigo_ali;
            
            -- TPA_ETAPA2_EQUIPOS y MATERIALES tienen CASCADE desde TPA_ETAPA2_SESION
            DELETE FROM TPA_ETAPA2_SESION WHERE codigo_ali = :codigo_ali;

            -- 3. Borrar reporte TPA
            DELETE FROM TPA_REPORTE WHERE codigo_ali = :codigo_ali;

            -- 4. Borrar finalmente la muestra ALI
            DELETE FROM MUESTRAS_ALI WHERE codigo_ali = :codigo_ali;
        END;
    `;

    db.execute(sql, { codigo_ali }, { autoCommit: true })
        .then(result => callback(null, result))
        .catch(err => callback(err));
};

module.exports = MuestraALI;
