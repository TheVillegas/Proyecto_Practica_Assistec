const { Router } = require('express');
const reporteController = require('../controllers/reporte.controller');
const { verifyToken } = require('../middleware/auth');

// Este router se montará sobre /api/solicitud/:id/generar
const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', reporteController.generar.bind(reporteController));

module.exports = router;
