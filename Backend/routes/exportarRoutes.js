const express = require('express');
const router = express.Router();
const exportarController = require('../controllers/exportarController');
const authMiddleware = require('../middleware/authMiddleware.js');

// Proteger rutas de exportación
router.use(authMiddleware.verifyToken);
/**
 * @route POST /api/exportar/tpa
 * @desc Genera y descarga un reporte TPA en formato Excel
 * @access Public (ajustar según middleware de autenticación)
 */
router.post('/tpa', exportarController.exportarReporteTPA);

/**
 * @route POST /api/exportar/ram
 * @desc Genera y descarga un reporte RAM en formato Excel
 * @access Public (ajustar según middleware de autenticación)
 */
router.post('/ram', exportarController.exportarReporteRAM);

/**
 * @route GET /api/exportar/listar
 * @desc Obtiene la lista de reportes generados
 * @access Public (ajustar según middleware de autenticación)
 */
router.get('/listar', exportarController.listarReportesGenerados);

module.exports = router;
