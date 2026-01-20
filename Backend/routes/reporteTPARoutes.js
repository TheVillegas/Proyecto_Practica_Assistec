const express = require('express');
const router = express.Router();
const reporteTPAController = require('../controllers/reporteTPAController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Aplicar middleware a todas las rutas (o selectivamente)
router.use(authMiddleware.verifyToken);

router.get('/:codigo_ali', reporteTPAController.obtenerReporteTPA);
router.get('/:codigo_ali/estado', reporteTPAController.obtenerEstadoReporte);
router.post('/generarReporte', reporteTPAController.guardarReporteTPA);
router.put('/:codigo_ali/verificar', reporteTPAController.verificarReporte);
module.exports = router;