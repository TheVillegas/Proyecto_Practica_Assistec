const catalogoService = require('../services/catalogo.service');

class CatalogoController {
    async listar(req, res) {
        try {
            const { tipo } = req.params;
            const result = await catalogoService.listar(tipo);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'INVALID_CATALOG_TYPE') {
                return res.status(400).json({ mensaje: 'Tipo de catálogo inválido' });
            }
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new CatalogoController();
