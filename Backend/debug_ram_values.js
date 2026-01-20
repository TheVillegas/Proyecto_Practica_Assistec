const DB = require('./config/DB');

async function run() {
    try {
        await DB.initialize();

        const ali = '1255';
        console.log(`--- DATOS RAM_REPORTE PARA ALI ${ali} ---`);
        const result = await DB.execute(`
      SELECT 
        codigo_ali, 
        estado_ram,
        FECHA_ULTIMA_MODIFICACION, 
        USUARIO_ULTIMA_MODIFICACION,
        N_MUESTRA_10GR,
        N_MUESTRA_50GR
      FROM RAM_REPORTE 
      WHERE codigo_ali = :ali
    `, { ali });

        console.table(result.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
