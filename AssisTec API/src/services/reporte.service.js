const reporteRepository = require('../repositories/reporte.repository');
const solicitudRepository = require('../repositories/solicitud.repository');

class ReporteService {
    async generar(idSolicitud) {
        const solicitud = await solicitudRepository.findById(idSolicitud);
        
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        // Verificar si ya existen los reportes
        const existe = await reporteRepository.findByCodigoAli(solicitud.numeroAli);
        if (existe) {
            throw new Error('ALREADY_GENERATED');
        }

        let requiereTpa = false;
        let requiereRam = false;
        let tieneAnalisis = false;

        // Evaluar análisis para determinar qué reportes crear
        for (const muestra of solicitud.muestras) {
            if (muestra.analisis && muestra.analisis.length > 0) {
                tieneAnalisis = true;
                for (const analisis of muestra.analisis) {
                    if (analisis.formulario.generaTpaDefault) requiereTpa = true;
                    // Lógica para RAM puede depender del área o tipo de análisis (simplificado a true si no es TPA exclusivo)
                    requiereRam = true; 
                }
            }
        }

        if (!tieneAnalisis) {
            throw new Error('NO_ANALYSIS');
        }

        const res = await reporteRepository.crearBridge(
            solicitud.numeroAli,
            requiereTpa,
            requiereRam,
            solicitud.observacionesCliente,
            solicitud.observacionesGenerales
        );

        return {
            tpa_generado: !!res.tpa,
            ram_generado: !!res.ram
        };
    }
}

module.exports = new ReporteService();
