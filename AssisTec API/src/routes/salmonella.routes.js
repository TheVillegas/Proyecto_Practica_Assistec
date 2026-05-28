const { Router } = require('express');
const salmonellaController = require('../controllers/salmonella.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.post('/', authorizeAny(WRITE_ROLES), salmonellaController.crear.bind(salmonellaController));
router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), salmonellaController.obtenerPorAnalisis.bind(salmonellaController));
router.get('/:id', authorizeAny(READ_ROLES), salmonellaController.obtener.bind(salmonellaController));
router.put('/:id/fase/:fase', authorizeAny(WRITE_ROLES), optimisticLock, salmonellaController.guardarFase.bind(salmonellaController));

module.exports = router;
