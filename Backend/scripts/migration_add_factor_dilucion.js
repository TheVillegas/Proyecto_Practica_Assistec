require('dotenv').config({ path: '../.env' });
const oracledb = require('oracledb');

async function run() {
    let connection;

    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_CONNECT_STRING) {
        console.error('Error: DB credentials not found in environment variables.');
        console.log('Make sure you are running this script with the correct .env path.');
        return;
    }

    try {
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING
        });

        console.log('✅ Connected to database');

        // Add column to RAM_ETAPA3_MUESTRAS
        try {
            await connection.execute(`ALTER TABLE RAM_ETAPA3_MUESTRAS ADD FACTOR_DILUCION NUMBER`);
            console.log('✅ Added FACTOR_DILUCION to RAM_ETAPA3_MUESTRAS');
        } catch (e) {
            if (e.message.includes('ORA-01430')) {
                console.log('⚠️ Column FACTOR_DILUCION already exists in RAM_ETAPA3_MUESTRAS');
            } else {
                console.error('❌ Error adding column to RAM_ETAPA3_MUESTRAS:', e.message);
            }
        }

        // Add column to RAM_ETAPA3_DUPLICADO
        try {
            await connection.execute(`ALTER TABLE RAM_ETAPA3_DUPLICADO ADD FACTOR_DILUCION NUMBER`);
            console.log('✅ Added FACTOR_DILUCION to RAM_ETAPA3_DUPLICADO');
        } catch (e) {
            if (e.message.includes('ORA-01430')) {
                console.log('⚠️ Column FACTOR_DILUCION already exists in RAM_ETAPA3_DUPLICADO');
            } else {
                console.error('❌ Error adding column to RAM_ETAPA3_DUPLICADO:', e.message);
            }
        }

    } catch (err) {
        console.error('❌ Database connection error:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Database connection closed.');
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();
