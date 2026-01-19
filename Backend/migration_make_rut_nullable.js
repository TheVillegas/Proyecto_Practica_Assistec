const db = require('./config/DB');
const oracledb = require('oracledb');

async function runMigration() {
    let connection;
    try {
        await db.initialize();
        connection = await db.getConnection();
        console.log("Conectado a la BD...");

        // Permitir NULL en RUT_ANALISTA para TPA_ETAPA4_RETIRO
        try {
            console.log("Modificando TPA_ETAPA4_RETIRO...");
            await connection.execute(`ALTER TABLE TPA_ETAPA4_RETIRO MODIFY (RUT_ANALISTA NULL)`);
            console.log("TPA_ETAPA4_RETIRO modificado exitosamente.");
        } catch (err) {
            console.error("Error al modificar TPA_ETAPA4_RETIRO (quizás ya es nullable):", err.message);
        }

        // Permitir NULL en RUT_ANALISTA para TPA_ETAPA2_SESION (por consistencia)
        try {
            console.log("Modificando TPA_ETAPA2_SESION...");
            await connection.execute(`ALTER TABLE TPA_ETAPA2_SESION MODIFY (RUT_ANALISTA NULL)`);
            console.log("TPA_ETAPA2_SESION modificado exitosamente.");
        } catch (err) {
            console.error("Error al modificar TPA_ETAPA2_SESION (quizás ya es nullable):", err.message);
        }

        await connection.commit();
        console.log("Migración completada.");

    } catch (err) {
        console.error("Error durante la migración:", err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error al cerrar conexión:", err);
            }
        }
    }
}

runMigration();
