const express = require('express');
const router = express.Router();
const exportarController = require('../controllers/exportarController');

/**
 * @route POST /api/exportar/tpa
 * @desc Genera y descarga un reporte TPA en formato Excel
 * @access Public (ajustar según middleware de autenticación)
 */
router.post('/tpa', exportarController.exportarReporteTPA);

/**
 * @route GET /api/exportar/listar
 * @desc Obtiene la lista de reportes generados
 * @access Public (ajustar según middleware de autenticación)
 */
router.get('/listar', exportarController.listarReportesGenerados);

module.exports = router;
