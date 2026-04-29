const { Router } = require('express');
const analisisController = require('../controllers/analisis.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');

// Este router se montará sobre /api/muestra/:id/analisis
const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', authorize([ROLES.INGRESO]), analisisController.asignar.bind(analisisController));

module.exports = router;
