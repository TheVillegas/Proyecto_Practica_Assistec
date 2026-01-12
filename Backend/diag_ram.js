const db = require('./config/DB');

async function check() {
    try {
        await db.initialize();
        const result = await db.execute("SELECT * FROM RAM_REPORTE WHERE ROWNUM = 1");
        console.log("Columnas de RAM_REPORTE:", result.metaData.map(m => m.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
