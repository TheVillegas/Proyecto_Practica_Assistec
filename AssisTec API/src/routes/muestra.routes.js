const { Router } = require('express');
const muestraController = require('../controllers/muestra.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const ROLES = require('../config/roles');

// Este router se montará sobre /api/solicitud/:id/muestra
const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', authorize([ROLES.INGRESO]), muestraController.crearBatch.bind(muestraController));
router.get('/', muestraController.listar.bind(muestraController));

module.exports = router;
