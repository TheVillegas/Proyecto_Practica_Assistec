const analisisService = require('../services/analisis.service');

class AnalisisController {
    async asignar(req, res) {
        try {
            const { id } = req.params; // id de muestra
            const result = await analisisService.asignar(id, req.body, req.user);
            res.status(201).json(result);
        } catch (error) {
            if (error.message === 'UNAUTHORIZED_ROLE') return res.status(401).json({ mensaje: 'Rol no autorizado' });
            
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new AnalisisController();
