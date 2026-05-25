const reporteService = require('../services/reporte.service');

class ReporteController {
    async generar(req, res) {
        try {
            const { id } = req.params; // id_solicitud
            const result = await reporteService.generar(id, req.user);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'NOT_FOUND') return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
            if (error.message === 'ALREADY_GENERATED') return res.status(409).json({ mensaje: 'Reportes ya generados' });
            if (error.message === 'NO_ANALYSIS') return res.status(400).json({ mensaje: 'No hay análisis asignados' });
            if (error.message === 'NOT_ASSIGNED') return res.status(403).json({ mensaje: 'No está asignado a esta solicitud' });
            
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new ReporteController();
