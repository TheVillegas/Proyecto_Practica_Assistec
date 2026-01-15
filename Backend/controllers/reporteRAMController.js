const ReporteRAM = require('../models/reporteRAMModel');

exports.obtenerEstadoRam = async (req, res) => {
    try {
        const { codigo_ali } = req.params;

        // Llamamos al método correcto del modelo (asegurarse de Mayúsculas/Minúsculas)
        const estado = await ReporteRAM.obtenerEstadoRAM(codigo_ali);

        if (!estado) {
            return res.status(404).json({ mensaje: 'Reporte RAM no encontrado' })
        }

        res.status(200).json({ estado });

    } catch (error) {
        console.error('Error al obtener estado RAM:', error);
        res.status(500).json({ mensaje: 'Error al obtener el estado del reporte RAM' });
    }
};

exports.obtenerReporteRAM = async (req, res) => {
    try {
        const { codigo_ali } = req.params;

        const reporte = await ReporteRAM.obtenerReporteRAM(codigo_ali);

        if (!reporte) {
            return res.status(404).json({ mensaje: 'Reporte RAM no encontrado' });
        }

        res.status(200).json(reporte);

    } catch (error) {
        console.error('Error al obtener reporte RAM:', error);
        res.status(500).json({ mensaje: 'Error al obtener el reporte RAM' });
    }
};

exports.guardarReporteRAM = async (req, res) => {
    try {
        const datos = req.body;

        if (!datos.codigo_ali) {
            return res.status(400).json({ mensaje: 'El codigo_ali es requerido' });
        }

        const result = await ReporteRAM.guardarReporteRAM(datos);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error al guardar reporte RAM:', error);
        res.status(500).json({ mensaje: 'Error al guardar el reporte RAM' });
    }


}

exports.previewCalculoRAM = async (req, res) => {
    try {
        const { volumen, diluciones } = req.body;

        // Validar que vengan los datos necesarios
        if (!diluciones || !Array.isArray(diluciones)) {
            return res.status(400).json({
                mensaje: 'Se requiere el array "diluciones" con formato: [{dil: -1, colonias: [305, "MNPC"]}, ...]'
            });
        }

        // Preparar datos para el nuevo algoritmo ISO 7218
        const datosCalculo = {
            volumen: volumen || 1,
            diluciones: diluciones
        };

        // Usar el nuevo algoritmo ISO 7218
        const resultado = ReporteRAM.calcularRecuentoColonias(datosCalculo);

        res.status(200).json({
            mensaje: "Cálculo realizado (Preview - ISO 7218)",
            resultado: resultado
        });

    } catch (error) {
        console.error('Error al calcular preview RAM:', error);
        res.status(500).json({
            mensaje: 'Error al calcular resultados RAM',
            error: error.message
        });
    }
}



