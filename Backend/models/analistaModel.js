const db = require('../config/DB.js');
const { getObjectSignedUrl } = require('../utils/s3');
const logger = require('../utils/logger');

const Analista = {};

Analista.crear = async (datos) => {
    const {
        rut_analista,
        nombre_apellido_analista,
        correo_analista,
        contrasena_analista,
    } = datos;

    const sql = 'INSERT INTO USUARIOS (rut_analista, nombre_apellido_analista, correo_analista, contrasena_analista, rol_analista) VALUES ($1, $2, $3, $4, $5)';

    const values = [
        rut_analista,
        nombre_apellido_analista,
        correo_analista,
        contrasena_analista,
        0 // rol default
    ];

    return await db.execute(sql, values);
};

Analista.obtenerAnalistas = async () => {
    const sql = 'SELECT * FROM USUARIOS';
    const result = await db.execute(sql);

    // Sign URLs
    for (const row of result.rows) {
        if (row.URL_FOTO && row.URL_FOTO.startsWith('uploads/')) {
            row.URL_FOTO = await getObjectSignedUrl(row.URL_FOTO);
        } else if (row.url_foto && row.url_foto.startsWith('uploads/')) {
            row.url_foto = await getObjectSignedUrl(row.url_foto);
        }
    }
    return result;
}

Analista.obtenerPorRut = async (rut) => {
    const sql = 'SELECT * FROM USUARIOS WHERE rut_analista = $1';
    const result = await db.execute(sql, [rut]);

    if (result.rows.length > 0) {
        const row = result.rows[0];
        if (row.URL_FOTO && row.URL_FOTO.startsWith('uploads/')) {
            row.URL_FOTO = await getObjectSignedUrl(row.URL_FOTO);
        } else if (row.url_foto && row.url_foto.startsWith('uploads/')) {
            row.url_foto = await getObjectSignedUrl(row.url_foto); // Case sensitive handling
        }
    }
    return result;
}

Analista.obtenerPorCorreo = async (correo) => {
    try {
        const sql = `
            SELECT rut_analista 
            FROM USUARIOS 
            WHERE correo_analista = $1
        `;

        const result = await db.execute(sql, [correo]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].rut_analista;
    } catch (error) {
        logger.error('Error al obtener rut por correo', { message: error.message });
        throw error;
    }
};

Analista.actualizarFoto = async (rut, urlFoto) => {
    const extractKey = (url) => {
        if (!url) return null;
        if (url.includes('uploads/')) {
            const part = url.split('uploads/')[1];
            return 'uploads/' + part.split('?')[0];
        }
        return url;
    };
    const key = extractKey(urlFoto);

    const sql = `UPDATE USUARIOS SET URL_FOTO = $1 WHERE RUT_ANALISTA = $2`;
    return await db.execute(sql, [key, rut]);
};

Analista.actualizarCorreo = async (rut, nuevoCorreo) => {
    const sql = 'UPDATE USUARIOS SET CORREO_ANALISTA = $1 WHERE RUT_ANALISTA = $2';
    return await db.execute(sql, [nuevoCorreo, rut]);
};

Analista.actualizarPassword = async (rut, nuevaPassword) => {
    const sql = 'UPDATE USUARIOS SET CONTRASENA_ANALISTA = $1 WHERE RUT_ANALISTA = $2';
    return await db.execute(sql, [nuevaPassword, rut]);
};

module.exports = Analista;
