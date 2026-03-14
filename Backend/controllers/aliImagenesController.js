const db = require('../config/DB.js');
const { getObjectSignedUrl } = require('../utils/s3');
const logger = require('../utils/logger');

exports.agregarImagen = async (req, res) => {
    const { codigo_ali, s3_key, nombre_archivo, tipo_mime, tamanio } = req.body;

    if (!codigo_ali || !s3_key) {
        return res.status(400).json({ mensaje: 'Faltan datos obligatorios (codigo_ali, s3_key)' });
    }

    try {
        const query = `
            INSERT INTO ALI_IMAGENES (CODIGO_ALI, S3_KEY, NOMBRE_ARCHIVO, TIPO_MIME, TAMANIO)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [codigo_ali, s3_key, nombre_archivo, tipo_mime, tamanio];
        const result = await db.execute(query, values);


        res.status(201).json({
            mensaje: 'Imagen registrada correctamente',
            imagen: result.rows[0]
        });
    } catch (error) {
        logger.error('Error al registrar imagen ALI', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

exports.obtenerImagenes = async (req, res) => {
    const { codigo_ali } = req.params;

    try {
        const query = `SELECT * FROM ALI_IMAGENES WHERE CODIGO_ALI = $1 ORDER BY FECHA_SUBIDA DESC`;
        const result = await db.execute(query, [codigo_ali]);

        // Generar URLs firmadas para cada imagen y mapear a camelCase
        const imagenes = await Promise.all(result.rows.map(async (img) => {
            const url = await getObjectSignedUrl(img.s3_key);
            return {
                id_imagen: img.id_imagen,
                nombre: img.nombre_archivo,
                tipo: img.tipo_mime,
                tamanio: parseInt(img.tamanio),
                s3_key: img.s3_key,
                url: url,
                fechaAdjunto: img.fecha_subida
            };
        }));

        res.status(200).json(imagenes);
    } catch (error) {
        logger.error('Error al obtener imágenes ALI', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

exports.eliminarImagen = async (req, res) => {
    const { id_imagen } = req.params;

    try {
        // Primero obtener la key para borrar de S3 (pendiente: implementar borrado S3 real si se desea)
        // Por ahora solo borramos de la DB
        const result = await db.execute('DELETE FROM ALI_IMAGENES WHERE ID_IMAGEN = $1 RETURNING *', [id_imagen]);

        if (result.rowCount === 0) {
            return res.status(404).json({ mensaje: 'Imagen no encontrada' });
        }

        res.status(200).json({ mensaje: 'Imagen eliminada correctamente', imagenEliminada: result.rows[0] });
    } catch (error) {
        logger.error('Error al eliminar imagen ALI', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
