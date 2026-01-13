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
        const { etapa3_repeticiones } = req.body;

        if (!etapa3_repeticiones || !Array.isArray(etapa3_repeticiones)) {
            return res.status(400).json({ mensaje: 'Se requieren datos de etapa3_repeticiones para calcular' });
        }

        const resultados = ReporteRAM.calcularUFC(etapa3_repeticiones);

        res.status(200).json({
            mensaje: "Cálculo realizado (Preview)",
            resultados: resultados
        });

    } catch (error) {
        console.error('Error al calcular preview RAM:', error);
        res.status(500).json({ mensaje: 'Error al calcular resultados RAM' });
    }
}



