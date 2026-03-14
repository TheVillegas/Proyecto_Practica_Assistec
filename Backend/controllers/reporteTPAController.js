const ReporteTPA = require('../models/reporteTPAModel.js');
const logger = require('../utils/logger');

/**
 * Obtiene el reporte TPA completo por código ALI
 */
exports.obtenerReporteTPA = async (req, res) => {
    try {
        const { codigo_ali } = req.params;

        const reporte = await ReporteTPA.obtenerReporteTPA(codigo_ali);

        if (!reporte) {
            return res.status(404).json({ mensaje: 'Reporte TPA no encontrado' });
        }

        // --- FIRMAR URLS S3 PARA FRONTEND (TPA) ---
        const { getObjectSignedUrl } = require('../utils/s3');

        // 1. Firma Coordinador (Etapa 6 Cierre)
        if (reporte.etapa6_cierre?.firma && reporte.etapa6_cierre.firma.startsWith('uploads/')) {
            try {
                reporte.etapa6_cierre.firma = await getObjectSignedUrl(reporte.etapa6_cierre.firma);
            } catch (e) {
                logger.error('Error firmando firma coordinador TPA', { message: e.message });
            }
        }

        // 2. Anexos Visuales
        if (reporte.imagenes && Array.isArray(reporte.imagenes)) {
            for (let img of reporte.imagenes) {
                if (img.s3_key && img.s3_key.startsWith('uploads/')) {
                    try {
                        img.url = await getObjectSignedUrl(img.s3_key);
                    } catch (e) {
                        logger.error(`Error firmando anexo TPA ${img.nombre_archivo}`, { message: e.message });
                    }
                }
            }
        }
        // ------------------------------------

        res.status(200).json(reporte);
    } catch (error) {
        logger.error('Error al obtener reporte TPA', { message: error.message });
        res.status(500).json({ mensaje: 'Error al obtener el reporte TPA' });
    }
};

/**
 * Guarda o actualiza el reporte TPA completo
 */
exports.guardarReporteTPA = async (req, res) => {
    try {
        const datos = req.body;
        if (!datos.codigoALI) {
            return res.status(400).json({ mensaje: 'El código ALI es requerido' });
        }

        // Obtener estado y rol
        // Obtener estado y rol
        const estadoActual = await ReporteTPA.obtenerEstadoReporte(datos.codigoALI);
        const { rol } = req.user || { rol: 0 }; // Fallback a 0 si no hay middleware activo aún en pruebas



        // REGLA 1: Bloqueo TOTAL si está verificado, EXCEPTO para Rol 1 (Supervisor)
        // Usamos != para permitir coincidencia si rol viene como string o number
        if (estadoActual?.toUpperCase() === 'VERIFICADO' && rol != 1) {
            return res.status(403).json({
                mensaje: 'El reporte ya ha sido VERIFICADO y no puede modificarse.'
            });
        }

        // REGLA 2: Bloqueo a Analistas Junior (Rol 0) si está pendiente de revisión
        if (estadoActual === 'PENDIENTE' && rol === 0) {
            return res.status(403).json({
                mensaje: 'El reporte está en estado PENDIENTE de revisión por el supervisor.'
            });
        }

        // Si es Rol 1 o el estado es BORRADOR, permitimos continuar
        const rutUsuario = req.user?.rut || null;

        if (!rutUsuario) {
            return res.status(401).json({ mensaje: 'No se pudo identificar al usuario. Token inválido.' });
        }


        // REGLA 3: Seguridad - Prevenir que Rol 0 manipule el estado a VERIFICADO manual
        if (rol == 0 && (datos.estado === 'VERIFICADO')) {
            logger.warn(`Usuario Rol 0 intentó guardar TPA como 'VERIFICADO'. Forzando a 'PENDIENTE'.`);
            datos.estado = 'PENDIENTE';
        }

        const result = await ReporteTPA.guardarReporteCompleto(datos, rutUsuario);

        res.status(200).json(result);
    } catch (error) {
        logger.error('Error al guardar reporte TPA', { message: error.message });
        res.status(500).json({ mensaje: 'Error al guardar el reporte TPA' });
    }
};

exports.verificarReporte = async (req, res) => {
    try {
        const { codigo_ali } = req.params;
        // Obtenemos identidad estrictamente del middleware de autenticación
        const rut_usuario = req.user?.rut;
        const { observaciones_finales, firma } = req.body;

        if (!rut_usuario) {
            return res.status(401).json({ mensaje: 'No se pudo identificar al usuario. Token inválido.' });
        }

        const result = await ReporteTPA.verificarReporte(
            codigo_ali,
            rut_usuario,
            observaciones_finales,
            firma
        );

        res.status(200).json({
            mensaje: 'Reporte verificado exitosamente',
            ...result
        });
    } catch (error) {
        logger.error('Error al verificar reporte TPA', { message: error.message });
        res.status(500).json({ mensaje: 'Error al verificar el reporte' });
    }
};

/**
 * Obtiene el estado actual del reporte
 */
exports.obtenerEstadoReporte = async (req, res) => {
    try {
        const { codigo_ali } = req.params;

        const estado = await ReporteTPA.obtenerEstadoReporte(codigo_ali);

        if (!estado) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado' });
        }

        res.status(200).json({ estado });
    } catch (error) {
        logger.error('Error al obtener estado reporte TPA', { message: error.message });
        res.status(500).json({ mensaje: 'Error al obtener el estado del reporte' });
    }
};
