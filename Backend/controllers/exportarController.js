const ReporteRAM = require('../models/reporteRAMModel');
const ReporteTPA = require('../models/reporteTPAModel');
const ExcelRAMService = require('../services/ExcelRAMService');
const ExcelTPAService = require('../services/ExcelTPAService');
const path = require('path');
const db = require('../config/DB.js');
const logger = require('../utils/logger');

/**
 * Controlador para exportar reporte RAM a Excel
 */
const exportarReporteRAM = async (req, res) => {
    try {
        const { codigoALI } = req.body; // Se espera { codigoALI: 12345 }

        if (!codigoALI) {
            return res.status(400).json({ error: 'Código ALI requerido' });
        }

        // Obtener datos frescos de la BD
        const datosRAM = await ReporteRAM.obtenerReporteRAM(codigoALI);

        if (!datosRAM) {
            return res.status(404).json({ error: 'Reporte RAM no encontrado' });
        }

        // Obtener imágenes adjuntas
        const imagenesQuery = await db.execute('SELECT * FROM ALI_IMAGENES WHERE CODIGO_ALI = $1', [codigoALI]);
        datosRAM.imagenes = imagenesQuery.rows;

        // Generar buffer
        const buffer = await ExcelRAMService.generarBuffer(datosRAM);

        // Configurar headers para descarga
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Reporte_RAM_ALI-${codigoALI}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        res.send(buffer);

    } catch (error) {
        logger.error('Error exportando RAM', { message: error.message });
        res.status(500).json({ error: 'Error al generar excel RAM' });
    }
};

/**
 * Controlador para exportar reporte TPA a Excel
 */
const exportarReporteTPA = async (req, res) => {
    try {
        const { codigoALI } = req.body;

        if (!codigoALI) {
            return res.status(400).json({ error: 'Código ALI requerido' });
        }

        // Obtener datos frescos
        const datosTPA = await ReporteTPA.obtenerReporteTPA(codigoALI);

        if (!datosTPA) {
            return res.status(404).json({ error: 'Reporte TPA no encontrado' });
        }

        // Obtener imágenes adjuntas (compartidas por ALI)
        const imagenesQuery = await db.execute('SELECT * FROM ALI_IMAGENES WHERE CODIGO_ALI = $1', [codigoALI]);
        datosTPA.imagenes = imagenesQuery.rows;

        // Generar buffer
        const buffer = await ExcelTPAService.generarBuffer(datosTPA);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Reporte_TPA_ALI-${codigoALI}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        res.send(buffer);

    } catch (error) {
        logger.error('Error exportando TPA', { message: error.message });
        res.status(500).json({ error: 'Error al generar el reporte' });
    }
};

/**
 * Controlador para obtener lista de reportes generados
 * (Mantenido por compatibilidad si se usa, pero la nueva lógica descarga directo)
 */
const listarReportesGenerados = async (req, res) => {
    // Esta función listaba archivos en disco. Con la nueva lógica de descarga directa (buffer),
    // no se guardan archivos en el servidor (a menos que lo queramos).
    // Devolveremos array vacío o implementación si se requiere historial.
    res.json({ reportes: [] });
};

module.exports = {
    exportarReporteRAM,
    exportarReporteTPA,
    listarReportesGenerados
};
