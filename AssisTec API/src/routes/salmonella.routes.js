const { Router } = require('express');
const salController = require('../controllers/salmonella.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const validateForm = require('../middleware/validateForm');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), salController.obtenerPorAnalisis.bind(salController));
router.get('/:id', authorizeAny(READ_ROLES), salController.obtener.bind(salController));

// Validacion dinamica segun el numero de fase en la URL
router.put('/:id/fase/:fase', authorizeAny(WRITE_ROLES), optimisticLock, (req, res, next) => {
    const faseNum = Number(req.params.fase);
    if (Number.isNaN(faseNum) || faseNum < 1 || faseNum > 10) {
        return res.status(400).json({ codigo: 'INVALID_FASE', mensaje: 'Fase no valida (use 1-10)' });
    }
    const validator = validateForm('sal', `fase${faseNum}`);
    return validator(req, res, next);
}, salController.guardarFase.bind(salController));

module.exports = router;
