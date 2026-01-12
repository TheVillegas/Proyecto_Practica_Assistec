const db = require('./config/DB');

async function check() {
    try {
        await db.initialize();
        const result = await db.execute("SELECT * FROM EQUIPOS_INCUBACION");
        console.log("Datos en EQUIPOS_INCUBACION:", JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
