const { generarReporteTPA } = require('../models/exportarReportes');
const path = require('path');

/**
 * Controlador para exportar reporte TPA a Excel
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const exportarReporteTPA = async (req, res) => {
    try {
        const dataJson = req.body;

        // Validación básica de datos
        if (!dataJson || typeof dataJson !== 'object') {
            return res.status(400).json({
                error: 'Datos inválidos',
                mensaje: 'Se requiere un objeto JSON con los datos del reporte TPA'
            });
        }

        // Validar que tenga al menos el código ALI
        if (!dataJson.codigoALI) {
            return res.status(400).json({
                error: 'Código ALI requerido',
                mensaje: 'El reporte debe incluir el campo codigoALI'
            });
        }

        // Generar nombre del archivo basado en código ALI y timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const outputName = `Reporte_TPA_${dataJson.codigoALI}_${timestamp}`;



        // Generar el reporte
        const filePath = await generarReporteTPA(dataJson, outputName);

        // Enviar el archivo como descarga
        res.download(filePath, `${outputName}.xlsx`, (err) => {
            if (err) {
                console.error('Error al enviar el archivo:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Error al descargar el archivo',
                        mensaje: err.message
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error en exportarReporteTPA:', error);
        res.status(500).json({
            error: 'Error al generar el reporte',
            mensaje: error.message
        });
    }
};

/**
 * Controlador para obtener lista de reportes generados
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const listarReportesGenerados = async (req, res) => {
    try {
        const fs = require('fs').promises;
        const outputDir = path.join(__dirname, '..', 'outputs');

        // Verificar que existe el directorio
        try {
            await fs.access(outputDir);
        } catch (error) {
            return res.json({ reportes: [] });
        }

        // Leer archivos del directorio
        const archivos = await fs.readdir(outputDir);

        // Filtrar solo archivos Excel
        const reportes = archivos
            .filter(archivo => archivo.endsWith('.xlsx'))
            .map(archivo => ({
                nombre: archivo,
                ruta: path.join(outputDir, archivo)
            }));

        res.json({ reportes });

    } catch (error) {
        console.error('Error al listar reportes:', error);
        res.status(500).json({
            error: 'Error al listar reportes',
            mensaje: error.message
        });
    }
};

module.exports = {
    exportarReporteTPA,
    listarReportesGenerados
};
