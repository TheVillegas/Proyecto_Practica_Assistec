const { Router } = require('express');
const coliController = require('../controllers/coliformes.controller');
const { verifyToken, authorizeAny } = require('../middleware/auth');
const optimisticLock = require('../middleware/optimisticLock');
const validateForm = require('../middleware/validateForm');
const ROLES = require('../config/roles');

const router = Router();

const READ_ROLES = [ROLES.ANALISTA, ROLES.COORDINADORA, ROLES.JEFE_AREA, ROLES.ADMINISTRATOR];
const WRITE_ROLES = [ROLES.ANALISTA, ROLES.ADMINISTRATOR];

router.use(verifyToken);

router.get('/por-analisis/:idAnalisis', authorizeAny(READ_ROLES), coliController.obtenerPorAnalisis.bind(coliController));
router.get('/:id', authorizeAny(READ_ROLES), coliController.obtener.bind(coliController));
router.post('/:id/calcular-nmp', authorizeAny(WRITE_ROLES), coliController.calcularNmp.bind(coliController));

// Validacion dinamica segun el numero de fase en la URL
router.put('/:id/fase/:fase', authorizeAny(WRITE_ROLES), optimisticLock, (req, res, next) => {
    const faseParam = req.params.fase;
    const faseNum = Number(faseParam);
    if (faseParam === '3.5') {
        const validator = validateForm('coli', 'fase3');
        return validator(req, res, next);
    }
    if (Number.isNaN(faseNum) || faseNum < 1 || faseNum > 4) {
        return res.status(400).json({ codigo: 'INVALID_FASE', mensaje: 'Fase no valida (use 1-4 o 3.5)' });
    }
    const validator = validateForm('coli', `fase${faseNum}`);
    return validator(req, res, next);
}, coliController.guardarFase.bind(coliController));

module.exports = router;
