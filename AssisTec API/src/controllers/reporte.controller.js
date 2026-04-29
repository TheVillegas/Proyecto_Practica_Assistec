const reporteService = require('../services/reporte.service');

class ReporteController {
    async generar(req, res) {
        try {
            const { id } = req.params; // id_solicitud
            const result = await reporteService.generar(id);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'NOT_FOUND') return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
            if (error.message === 'ALREADY_GENERATED') return res.status(409).json({ mensaje: 'Reportes ya generados' });
            if (error.message === 'NO_ANALYSIS') return res.status(400).json({ mensaje: 'No hay análisis asignados' });
            
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new ReporteController();
