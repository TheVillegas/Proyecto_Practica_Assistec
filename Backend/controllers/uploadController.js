const { uploadFile, getObjectSignedUrl } = require('../utils/s3');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se ha proporcionado ningún archivo.' });
        }

        const file = req.file;
        const key = await uploadFile(file.buffer, file.originalname, file.mimetype);

        // Generamos una URL firmada inmediatamente para que el frontend pueda previsualizar
        const signedUrl = await getObjectSignedUrl(key);

        return res.status(200).json({
            ok: true,
            mensaje: 'Imagen subida correctamente a S3',
            key: key,       // Guardar ESTO en la Base de Datos
            url: signedUrl  // Usar ESTO para mostrar en el Frontend temporalmente
        });

    } catch (error) {
        console.error('Error en uploadImage controller:', error);
        return res.status(500).json({
            mensaje: 'Error interno al procesar la imagen',
            error: error.message
        });
    }
};
