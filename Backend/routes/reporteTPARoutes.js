const express = require('express');
const router = express.Router();
const reporteTPAController = require('../controllers/reporteTPAController.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const validators = require('../middleware/validators.js');

// Aplicar middleware a todas las rutas (o selectivamente)
router.use(authMiddleware.verifyToken);

router.get('/:codigo_ali', reporteTPAController.obtenerReporteTPA);
router.get('/:codigo_ali/estado', reporteTPAController.obtenerEstadoReporte);
router.post('/generarReporte', validators.guardarReporteTPA, reporteTPAController.guardarReporteTPA);
router.put('/:codigo_ali/verificar', validators.verificarReporteTPA, reporteTPAController.verificarReporte);
module.exports = router;