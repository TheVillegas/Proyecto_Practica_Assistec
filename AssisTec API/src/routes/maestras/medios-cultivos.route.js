const { Router } = require('express');
const mediosCultivosController = require('../../controllers/maestras/medios-cultivos.controller');
const { verifyToken } = require('../../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/', mediosCultivosController.getAll.bind(mediosCultivosController));

module.exports = router;
