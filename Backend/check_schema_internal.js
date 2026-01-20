const db = require('./config/DB.js');

async function checkSchema() {
    try {
        await db.initialize();
        const connection = await db.getConnection();

        console.log("Querying MAESTRO_FORMAS_CALCULO...");
        const result = await connection.execute(`
            SELECT * FROM MAESTRO_FORMAS_CALCULO
        `);

        console.log("DATA_START");
        console.log(JSON.stringify(result.rows));
        console.log("DATA_END");

        await connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
