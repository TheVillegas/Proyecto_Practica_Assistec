const MuestraALI = require('../models/muestraAliModel.js');
const { mapMuestraALI } = require('../utils/mappers');
const logger = require('../utils/logger');


exports.crearMuestraALI = async (req, res) => {
    const datos = req.body;

    if (!datos.codigo_ali) {
        return res.status(400).json({ mensaje: 'El codigo_ali es requerido' });
    }

    try {
        const result = await MuestraALI.crearMuestraALI(datos);
        res.status(201).json({ mensaje: 'Muestra creada exitosamente' });
    } catch (err) {
        logger.error('Error al crear muestra ALI', { message: err.message });
        res.status(500).json({ mensaje: 'Error al crear la muestra' });
    }
};

exports.listarMuestrasALI = async (req, res) => {
    try {
        const result = await MuestraALI.obtenerMuestrasALI();
        const muestras = result.rows.map(mapMuestraALI);
        res.status(200).json(muestras);
    } catch (err) {
        logger.error('Error al listar muestras ALI', { message: err.message });
        res.status(500).json({ mensaje: 'Error al obtener las muestras' });
    }
};

exports.obtenerMuestraALI_porCodigoAli = async (req, res) => {
    const { codigo_ali } = req.params;
    try {
        const result = await MuestraALI.obtenerMuestraALI_porCodigoAli(codigo_ali);
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Muestra no encontrada' });
        }
        const muestra = mapMuestraALI(result.rows[0]);
        res.status(200).json(muestra);
    } catch (err) {
        logger.error('Error al obtener muestra ALI por código', { message: err.message });
        res.status(500).json({ mensaje: 'Error al obtener la muestra' });
    }
};

exports.actualizarObservacionesGenerales = async (req, res) => {
    const { codigo_ali, observaciones_generales } = req.body;
    try {
        const result = await MuestraALI.actualizarObservacionesGenerales(codigo_ali, observaciones_generales);
        if (result.rowCount === 0) {
            return res.status(404).json({ mensaje: 'Muestra no encontrada' });
        }
        res.status(200).json({ mensaje: 'Observacion general actualizada exitosamente' });
    } catch (err) {
        logger.error('Error al actualizar observaciones generales ALI', { message: err.message });
        res.status(500).json({ mensaje: 'Error al actualizar la observacion general' });
    }
};

exports.eliminarMuestraALI = async (req, res) => {
    const { codigo_ali } = req.params;
    try {
        await MuestraALI.eliminarMuestraALI(codigo_ali);
        res.status(200).json({ mensaje: 'Muestra y todos sus registros asociados eliminados exitosamente' });
    } catch (err) {
        logger.error('Error al eliminar muestra ALI', { message: err.message });
        res.status(500).json({ mensaje: 'Error al eliminar la muestra y sus registros asociados' });
    }
};