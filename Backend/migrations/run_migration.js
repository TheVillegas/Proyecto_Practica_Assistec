const db = require('../config/DB');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await db.getConnection();

        const sqlPath = path.join(__dirname, 'alter_ram_etapa3_duplicado.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing migration...");
        console.log(sql);

        await connection.execute(sql);

        console.log("Migration executed successfully!");
        await connection.commit();
    } catch (err) {
        console.error("Error executing migration:", err);
        if (err.message.includes("ORA-01430")) {
            console.log("Column already exists, ignoring error.");
        }
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
}

runMigration();
