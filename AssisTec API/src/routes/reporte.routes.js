const { Router } = require('express');
const reporteController = require('../controllers/reporte.controller');
const { verifyToken, authorizeAny, requireActingRole } = require('../middleware/auth');
const ROLES = require('../config/roles');

// Este router se montará sobre /api/solicitud/:id/generar
const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', authorizeAny([ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ANALISTA, ROLES.ADMINISTRATOR]), requireActingRole(), reporteController.generar.bind(reporteController));

module.exports = router;
