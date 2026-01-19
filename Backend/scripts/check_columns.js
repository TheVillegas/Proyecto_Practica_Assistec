const db = require('../config/DB');

async function checkColumns() {
    let connection;
    try {
        await db.initialize();
        connection = await db.getConnection();

        const sql = `
            SELECT column_name, data_type 
            FROM user_tab_columns 
            WHERE table_name = 'RAM_ETAPA3_DUPLICADO'
        `;

        const result = await connection.execute(sql);
        console.log("Columns in RAM_ETAPA3_DUPLICADO:", result.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) await connection.close();
        try { await db.oracledb.getPool().close(0); } catch (e) { }
    }
}

checkColumns();
