const db = require('../config/DB.js');

const Analista = {};

Analista.crear = async (datos) => {
    const {
        rut_analista,
        nombre_apellido_analista,
        correo_analista,
        contrasena_analista,
    } = datos;

    const sql = 'INSERT INTO USUARIOS (rut_analista, nombre_apellido_analista, correo_analista, contrasena_analista, rol_analista) VALUES (:rut_analista, :nombre_apellido_analista, :correo_analista, :contrasena_analista, :rol_analista)';

    const binds = {
        rut_analista,
        nombre_apellido_analista,
        correo_analista,
        contrasena_analista,
        rol_analista: 0
    };

    return await db.execute(sql, binds, { autoCommit: true });
};

Analista.obtenerAnalistas = async () => {
    const sql = 'SELECT * FROM USUARIOS';
    return await db.execute(sql);
}

Analista.obtenerPorRut = async (rut) => {
    const sql = 'SELECT * FROM USUARIOS WHERE rut_analista = :rut';
    return await db.execute(sql, { rut });
}

Analista.obtenerPorCorreo = async (correo) => {
    try {
        const sql = `
            SELECT rut_analista 
            FROM USUARIOS 
            WHERE correo_analista = :correo
        `;

        const result = await db.execute(sql, { correo: correo });

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].RUT_ANALISTA;
    } catch (error) {
        console.error('Error al obtener rut por correo:', error);
        throw error;
    }
};

module.exports = Analista;
