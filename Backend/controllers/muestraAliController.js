const MuestraALI = require('../models/muestraAliModel.js');
const { mapMuestraALI } = require('../utils/mappers');


exports.crearMuestraALI = (req, res) => {
    const datos = req.body;

    if (!datos.codigo_ali) {
        return res.status(400).json({ mensaje: 'El codigo_ali es requerido' });
    }

    MuestraALI.crearMuestraALI(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear la muestra' });
        }
        res.status(201).json({ mensaje: 'Muestra creada exitosamente' });
    })
}

exports.listarMuestrasALI = (req, res) => {
    MuestraALI.obtenerMuestrasALI((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener las muestras' });
        }
        // Aplicar mapper
        const muestras = result.rows.map(mapMuestraALI);
        res.status(200).json(muestras);
    })
}

exports.obtenerMuestraALI_porCodigoAli = (req, res) => {
    const { codigo_ali } = req.params;
    MuestraALI.obtenerMuestraALI_porCodigoAli(codigo_ali, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener la muestra' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Muestra no encontrada' });
        }
        const muestra = mapMuestraALI(result.rows[0]);
        res.status(200).json(muestra);
    })
}

exports.actualizarObservacionesGenerales = (req, res) => {
    const { codigo_ali, observaciones_generales } = req.body;
    MuestraALI.actualizarObservacionesGenerales(codigo_ali, observaciones_generales, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar la observacion general' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Muestra no encontrada' });
        }
        res.status(200).json({ mensaje: 'Observacion general actualizada exitosamente' });
    })
}

exports.eliminarMuestraALI = (req, res) => {
    const { codigo_ali } = req.params;
    MuestraALI.eliminarMuestraALI(codigo_ali, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar la muestra y sus registros asociados' });
        }
        res.status(200).json({ mensaje: 'Muestra y todos sus registros asociados eliminados exitosamente' });
    });
};