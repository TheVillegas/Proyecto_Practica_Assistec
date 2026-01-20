const DB = require('./config/DB');

async function run() {
    let connection;
    try {
        await DB.initialize();
        connection = await DB.getConnection();

        const ali = '1255';
        const usuario = 'DEBUG_TEST';

        console.log(`--- TESTING UPDATE FOR ALI ${ali} ---`);
        const sql = `
      UPDATE RAM_REPORTE 
      SET FECHA_ULTIMA_MODIFICACION = SYSTIMESTAMP,
          USUARIO_ULTIMA_MODIFICACION = :usuario
      WHERE codigo_ali = :ali
    `;

        const result = await connection.execute(sql, { usuario, ali });
        console.log('Rows affected:', result.rowsAffected);

        await connection.commit();

        const check = await connection.execute(`
      SELECT FECHA_ULTIMA_MODIFICACION, USUARIO_ULTIMA_MODIFICACION 
      FROM RAM_REPORTE WHERE codigo_ali = :ali
    `, { ali });
        console.table(check.rows);

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.close();
        process.exit(0);
    }
}

run();
