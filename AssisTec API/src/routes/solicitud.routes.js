const { Router } = require('express');
const solicitudController = require('../controllers/solicitud.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const ROLES = require('../config/roles');

const router = Router();

// Todas las rutas requieren JWT
router.use(verifyToken);

router.post('/', authorize([ROLES.INGRESO]), solicitudController.crear.bind(solicitudController));
router.get('/', solicitudController.listar.bind(solicitudController));
router.get('/:id', solicitudController.obtener.bind(solicitudController));
router.put('/:id', optimisticLock, solicitudController.editar.bind(solicitudController));
router.post('/:id/enviar-validacion', optimisticLock, authorize([ROLES.INGRESO]), solicitudController.enviarValidacion.bind(solicitudController));
router.post('/:id/validar', optimisticLock, authorize([ROLES.COORDINADORA, ROLES.JEFE_AREA]), solicitudController.validar.bind(solicitudController));

module.exports = router;
