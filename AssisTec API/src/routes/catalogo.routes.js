const { Router } = require('express');
const catalogoController = require('../controllers/catalogo.controller');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/:tipo', catalogoController.listar.bind(catalogoController));

module.exports = router;
