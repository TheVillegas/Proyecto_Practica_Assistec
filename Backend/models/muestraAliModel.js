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

        // 0. Validar duplicados (Usando la misma conexión transaccional)
        const checkSql = 'SELECT codigo_ali FROM MUESTRAS_ALI WHERE codigo_ali = :codigo_ali';
        const checkResult = await connection.execute(checkSql, { codigo_ali });

        if (checkResult.rows && checkResult.rows.length > 0) {
            // Ya existe: liberamos conexión y retornamos error
            await connection.close(); // Importante cerrar antes de salir
            return callback(new Error(`El código ALI '${codigo_ali}' ya existe en el sistema.`));
        }

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
        // Siempre liberar la conexión al pool si sigue abierta
        // (Nota: oracledb suele manejar bien el close repetido o checkear isOpen, pero es buena práctica)
        if (connection) {
            try {
                // Verificar si la conexión sigue abierta podría depender de la librería, 
                // pero un close() extra en el finally es lo estándar para fuga de recursos.
                await connection.close();
            } catch (closeErr) {
                // Ignorar error si ya estaba cerrada
            }
        }
    }
};

MuestraALI.obtenerMuestraALI_porCodigoAli = (codigo_ali, callback) => {
    const sql = `
        SELECT m.*, 
               t.estado_actual as estado_tpa, 
               r.estado_ram as estado_ram 
        FROM MUESTRAS_ALI m
        LEFT JOIN TPA_REPORTE t ON m.codigo_ali = t.codigo_ali
        LEFT JOIN RAM_REPORTE r ON m.codigo_ali = r.codigo_ali
        WHERE m.codigo_ali = :codigo_ali
    `;
    db.execute(sql, { codigo_ali })
        .then(result => callback(null, result))
        .catch(err => callback(err));
};

MuestraALI.obtenerMuestrasALI = (callback) => {
    const sql = `
        SELECT m.*, 
               t.estado_actual as estado_tpa, 
               r.estado_ram as estado_ram 
        FROM MUESTRAS_ALI m
        LEFT JOIN TPA_REPORTE t ON m.codigo_ali = t.codigo_ali
        LEFT JOIN RAM_REPORTE r ON m.codigo_ali = r.codigo_ali
    `;
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
            -- 1. Borrar hijos de RAM_REPORTE
            -- Tablas de cálculo (Legacy y Actual)
            BEGIN EXECUTE IMMEDIATE 'DELETE FROM RAM_ETAPA7_FORMAS_CALCULO WHERE codigo_ali = :1' USING :codigo_ali; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN EXECUTE IMMEDIATE 'DELETE FROM RAM_FORMAS_CALCULO WHERE codigo_ali = :1' USING :codigo_ali; EXCEPTION WHEN OTHERS THEN NULL; END;

            -- Muestras y duplicados
            DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali;
            DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali;
            
            -- Finalmente el reporte
            DELETE FROM RAM_REPORTE WHERE codigo_ali = :codigo_ali;

            -- 2. Borrar sub-etapas de TPA_REPORTE
            -- Borramos recursivamente recursos, equipos y materiales por si no hay CASCADE
            DELETE FROM TPA_ETAPA5_RECURSOS WHERE id_siembra IN (SELECT id_siembra FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = :codigo_ali);
            DELETE FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = :codigo_ali;
            
            DELETE FROM TPA_ETAPA4_RETIRO WHERE codigo_ali = :codigo_ali;
            DELETE FROM TPA_ETAPA3_CHECKLIST WHERE codigo_ali = :codigo_ali;
            
            DELETE FROM TPA_ETAPA2_EQUIPOS WHERE id_sesion IN (SELECT id_sesion FROM TPA_ETAPA2_SESION WHERE codigo_ali = :codigo_ali);
            DELETE FROM TPA_ETAPA2_MATERIALES WHERE id_sesion IN (SELECT id_sesion FROM TPA_ETAPA2_SESION WHERE codigo_ali = :codigo_ali);
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
