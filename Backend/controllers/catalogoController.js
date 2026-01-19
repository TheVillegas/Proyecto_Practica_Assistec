const Catalogo = require('../models/catalogoModel.js');
const { mapGeneric } = require('../utils/mappers');

// --- 1. LUGARES ALMACENAMIENTO ---
exports.listarLugaresAlmacenamiento = (req, res) => {
    Catalogo.obtenerLugaresAlmacenamiento((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los lugares de almacenamiento' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerLugarAlmacenamientoPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerLugarAlmacenamiento_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el lugar de almacenamiento' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Lugar de almacenamiento no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearLugarAlmacenamiento = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_lugar) {
        return res.status(400).json({ mensaje: 'El nombre del lugar es requerido' });
    }
    Catalogo.crearLugarAlmacenamiento(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el lugar de almacenamiento' });
        }
        res.status(201).json({ mensaje: 'Lugar de almacenamiento creado exitosamente', result });
    });
};

exports.actualizarLugarAlmacenamiento = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarLugarAlmacenamiento(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el lugar de almacenamiento' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Lugar de almacenamiento no encontrado' });
        }
        res.status(200).json({ mensaje: 'Lugar de almacenamiento actualizado exitosamente' });
    });
};

exports.eliminarLugarAlmacenamiento = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarLugarAlmacenamiento(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el lugar de almacenamiento' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Lugar de almacenamiento no encontrado' });
        }
        res.status(200).json({ mensaje: 'Lugar de almacenamiento eliminado exitosamente' });
    });
};

// --- 2. INSTRUMENTOS ---
exports.listarInstrumentos = (req, res) => {
    Catalogo.obtenerInstrumentos((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los instrumentos' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerInstrumentoPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerInstrumento_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el instrumento' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Instrumento no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearInstrumento = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_instrumento) {
        return res.status(400).json({ mensaje: 'El nombre del instrumento es requerido' });
    }
    Catalogo.crearInstrumento(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el instrumento' });
        }
        res.status(201).json({ mensaje: 'Instrumento creado exitosamente', result });
    });
};

exports.actualizarInstrumento = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarInstrumento(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el instrumento' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Instrumento no encontrado' });
        }
        res.status(200).json({ mensaje: 'Instrumento actualizado exitosamente' });
    });
};

exports.eliminarInstrumento = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarInstrumento(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el instrumento' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Instrumento no encontrado' });
        }
        res.status(200).json({ mensaje: 'Instrumento eliminado exitosamente' });
    });
};

// --- 3. MICROPIPETAS ---
exports.listarMicropipetas = (req, res) => {
    Catalogo.obtenerMicropipetas((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener las micropipetas' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerMicropipetaPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerMicropipeta_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener la micropipeta' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Micropipeta no encontrada' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearMicropipeta = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_pipeta || !datos.codigo_pipeta || !datos.capacidad) {
        return res.status(400).json({ mensaje: 'Nombre, código y capacidad son requeridos' });
    }
    Catalogo.crearMicropipeta(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear la micropipeta' });
        }
        res.status(201).json({ mensaje: 'Micropipeta creada exitosamente', result });
    });
};

exports.actualizarMicropipeta = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarMicropipeta(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar la micropipeta' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Micropipeta no encontrada' });
        }
        res.status(200).json({ mensaje: 'Micropipeta actualizada exitosamente' });
    });
};

exports.eliminarMicropipeta = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarMicropipeta(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar la micropipeta' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Micropipeta no encontrada' });
        }
        res.status(200).json({ mensaje: 'Micropipeta eliminada exitosamente' });
    });
};

// --- 4. EQUIPOS DE LABORATORIO ---
exports.listarEquiposLab = (req, res) => {
    Catalogo.obtenerEquiposLab((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los equipos de laboratorio' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerEquipoLabPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerEquipoLab_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el equipo de laboratorio' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Equipo de laboratorio no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearEquipoLab = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_equipo) {
        return res.status(400).json({ mensaje: 'El nombre del equipo es requerido' });
    }
    Catalogo.crearEquipoLab(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el equipo de laboratorio' });
        }
        res.status(201).json({ mensaje: 'Equipo de laboratorio creado exitosamente', result });
    });
};

exports.actualizarEquipoLab = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarEquipoLab(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el equipo de laboratorio' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Equipo de laboratorio no encontrado' });
        }
        res.status(200).json({ mensaje: 'Equipo de laboratorio actualizado exitosamente' });
    });
};

exports.eliminarEquipoLab = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarEquipoLab(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el equipo de laboratorio' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Equipo de laboratorio no encontrado' });
        }
        res.status(200).json({ mensaje: 'Equipo de laboratorio eliminado exitosamente' });
    });
};

// --- 5. MATERIAL SIEMBRA ---
exports.listarMaterialSiembra = (req, res) => {
    Catalogo.obtenerMaterialSiembra((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el material de siembra' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerMaterialSiembraPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerMaterialSiembra_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el material de siembra' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Material de siembra no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearMaterialSiembra = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_material) {
        return res.status(400).json({ mensaje: 'El nombre del material es requerido' });
    }
    Catalogo.crearMaterialSiembra(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el material de siembra' });
        }
        res.status(201).json({ mensaje: 'Material de siembra creado exitosamente', result });
    });
};

exports.actualizarMaterialSiembra = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarMaterialSiembra(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el material de siembra' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Material de siembra no encontrado' });
        }
        res.status(200).json({ mensaje: 'Material de siembra actualizado exitosamente' });
    });
};

exports.eliminarMaterialSiembra = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarMaterialSiembra(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el material de siembra' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Material de siembra no encontrado' });
        }
        res.status(200).json({ mensaje: 'Material de siembra eliminado exitosamente' });
    });
};

// --- 6. DILUYENTES ---
exports.listarDiluyentes = (req, res) => {
    Catalogo.obtenerDiluyentes((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los diluyentes' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerDiluyentePorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerDiluyente_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el diluyente' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Diluyente no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearDiluyente = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_diluyente || !datos.mililitros) {
        return res.status(400).json({ mensaje: 'Nombre y mililitros son requeridos' });
    }
    Catalogo.crearDiluyente(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el diluyente' });
        }
        res.status(201).json({ mensaje: 'Diluyente creado exitosamente', result });
    });
};

exports.actualizarDiluyente = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarDiluyente(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el diluyente' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Diluyente no encontrado' });
        }
        res.status(200).json({ mensaje: 'Diluyente actualizado exitosamente' });
    });
};

exports.eliminarDiluyente = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarDiluyente(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el diluyente' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Diluyente no encontrado' });
        }
        res.status(200).json({ mensaje: 'Diluyente eliminado exitosamente' });
    });
};

// --- 7. EQUIPOS INCUBACION ---
exports.listarEquiposIncubacion = (req, res) => {
    Catalogo.obtenerEquiposIncubacion((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los equipos de incubación' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerEquipoIncubacionPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerEquipoIncubacion_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el equipo de incubación' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Equipo de incubación no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearEquipoIncubacion = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_equipo) {
        return res.status(400).json({ mensaje: 'El nombre del equipo es requerido' });
    }
    Catalogo.crearEquipoIncubacion(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el equipo de incubación' });
        }
        res.status(201).json({ mensaje: 'Equipo de incubación creado exitosamente', result });
    });
};

exports.actualizarEquipoIncubacion = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarEquipoIncubacion(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el equipo de incubación' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Equipo de incubación no encontrado' });
        }
        res.status(200).json({ mensaje: 'Equipo de incubación actualizado exitosamente' });
    });
};

exports.eliminarEquipoIncubacion = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarEquipoIncubacion(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el equipo de incubación' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Equipo de incubación no encontrado' });
        }
        res.status(200).json({ mensaje: 'Equipo de incubación eliminado exitosamente' });
    });
};

// --- 8. MAESTRO CHECKLIST LIMPIEZA ---
exports.listarMaestroChecklistLimpieza = (req, res) => {
    Catalogo.obtenerMaestroChecklistLimpieza((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el checklist de limpieza' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerMaestroChecklistLimpiezaPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerMaestroChecklistLimpieza_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el item del checklist' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearMaestroChecklistLimpieza = (req, res) => {
    const datos = req.body;
    if (!datos.id_item || !datos.nombre_item) {
        return res.status(400).json({ mensaje: 'ID y nombre del item son requeridos' });
    }
    Catalogo.crearMaestroChecklistLimpieza(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el item del checklist' });
        }
        res.status(201).json({ mensaje: 'Item creado exitosamente', result });
    });
};

exports.actualizarMaestroChecklistLimpieza = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarMaestroChecklistLimpieza(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el item del checklist' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }
        res.status(200).json({ mensaje: 'Item actualizado exitosamente' });
    });
};

exports.eliminarMaestroChecklistLimpieza = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarMaestroChecklistLimpieza(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el item del checklist' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }
        res.status(200).json({ mensaje: 'Item eliminado exitosamente' });
    });
};

// --- 9. MAESTRO TIPOS ANALISIS ---
exports.listarMaestroTiposAnalisis = (req, res) => {
    Catalogo.obtenerMaestroTiposAnalisis((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los tipos de análisis' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerMaestroTipoAnalisisPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerMaestroTiposAnalisis_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener el tipo de análisis' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Tipo de análisis no encontrado' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearMaestroTipoAnalisis = (req, res) => {
    const datos = req.body;
    if (!datos.nombre_analisis) {
        return res.status(400).json({ mensaje: 'El nombre del análisis es requerido' });
    }
    Catalogo.crearMaestroTipoAnalisis(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear el tipo de análisis' });
        }
        res.status(201).json({ mensaje: 'Tipo de análisis creado exitosamente', result });
    });
};

exports.actualizarMaestroTipoAnalisis = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarMaestroTipoAnalisis(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar el tipo de análisis' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Tipo de análisis no encontrado' });
        }
        res.status(200).json({ mensaje: 'Tipo de análisis actualizado exitosamente' });
    });
};

exports.eliminarMaestroTipoAnalisis = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarMaestroTipoAnalisis(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar el tipo de análisis' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Tipo de análisis no encontrado' });
        }
        res.status(200).json({ mensaje: 'Tipo de análisis eliminado exitosamente' });
    });
};

// --- 10. MAESTRO FORMAS CALCULO ---
exports.listarMaestroFormasCalculo = (req, res) => {
    Catalogo.obtenerMaestroFormasCalculo((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener las formas de cálculo' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};

exports.obtenerMaestroFormaCalculoPorId = (req, res) => {
    const { id } = req.params;
    Catalogo.obtenerMaestroFormasCalculo_porID(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener la forma de cálculo' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Forma de cálculo no encontrada' });
        }
        res.status(200).json(mapGeneric(result.rows[0]));
    });
};

exports.crearMaestroFormaCalculo = (req, res) => {
    const datos = req.body;
    if (!datos.id_forma || !datos.nombre_forma) {
        return res.status(400).json({ mensaje: 'ID y nombre de la forma son requeridos' });
    }
    Catalogo.crearMaestroFormaCalculo(datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al crear la forma de cálculo' });
        }
        res.status(201).json({ mensaje: 'Forma de cálculo creada exitosamente', result });
    });
};

exports.actualizarMaestroFormaCalculo = (req, res) => {
    const { id } = req.params;
    const datos = req.body;
    Catalogo.actualizarMaestroFormaCalculo(id, datos, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al actualizar la forma de cálculo' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Forma de cálculo no encontrada' });
        }
        res.status(200).json({ mensaje: 'Forma de cálculo actualizada exitosamente' });
    });
};

exports.eliminarMaestroFormaCalculo = (req, res) => {
    const { id } = req.params;
    Catalogo.eliminarMaestroFormaCalculo(id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al eliminar la forma de cálculo' });
        }
        if (result.rowsAffected === 0) {
            return res.status(404).json({ mensaje: 'Forma de cálculo no encontrada' });
        }
        res.status(200).json({ mensaje: 'Forma de cálculo eliminada exitosamente' });
    });
};

// --- VISTA UNIFICADA ---
exports.getMaterialesPesado = (req, res) => {
    Catalogo.getMaterialesPesado((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener los materiales pesados' });
        }
        res.status(200).json(result.rows.map(mapGeneric));
    });
};
