const muestraAliRepository = require('../repositories/muestraAli.repository');
const ROLES = require('../config/roles');

class MuestraAliController {
    async listarMuestras(req, res) {
        try {
            const muestras = await muestraAliRepository.findAll();
            const result = muestras.map(m => muestraAliRepository.toFrontendFormat(m));
            res.status(200).json(result);
        } catch (error) {
            console.error('[MuestraAli] Error al listar:', error);
            res.status(500).json({ mensaje: 'Error al obtener las muestras' });
        }
    }

    async obtenerPorCodigo(req, res) {
        try {
            const codigoAli = Number(req.params.codigo_ali);
            if (!codigoAli) {
                return res.status(400).json({ mensaje: 'Código ALI inválido' });
            }

            const muestra = await muestraAliRepository.findByCodigoAli(codigoAli);
            if (!muestra) {
                return res.status(404).json({ mensaje: 'Muestra no encontrada' });
            }

            res.status(200).json(muestraAliRepository.toFrontendFormat(muestra));
        } catch (error) {
            console.error('[MuestraAli] Error al obtener:', error);
            res.status(500).json({ mensaje: 'Error al obtener la muestra' });
        }
    }

    async actualizarObservaciones(req, res) {
        try {
            const { codigo_ali, observaciones_generales } = req.body;

            if (!codigo_ali || observaciones_generales === undefined) {
                return res.status(400).json({ mensaje: 'codigo_ali y observaciones_generales son requeridos' });
            }

            await muestraAliRepository.updateObservaciones(Number(codigo_ali), observaciones_generales);
            res.status(200).json({ mensaje: 'Observación general actualizada exitosamente' });
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ mensaje: 'Muestra no encontrada' });
            }
            console.error('[MuestraAli] Error al actualizar observaciones:', error);
            res.status(500).json({ mensaje: 'Error al actualizar la observación general' });
        }
    }

    async eliminar(req, res) {
        try {
            const codigoAli = Number(req.params.codigo_ali);
            if (!codigoAli) {
                return res.status(400).json({ mensaje: 'Código ALI inválido' });
            }

            await muestraAliRepository.delete(codigoAli);
            res.status(200).json({ mensaje: 'Muestra y todos sus registros asociados eliminados exitosamente' });
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ mensaje: 'Muestra no encontrada' });
            }
            console.error('[MuestraAli] Error al eliminar:', error);
            res.status(500).json({ mensaje: 'Error al eliminar la muestra' });
        }
    }
}

module.exports = new MuestraAliController();
