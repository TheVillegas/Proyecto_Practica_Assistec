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

        const rutUsuario = req.user?.rut || null;

        if (!rutUsuario) {
            return res.status(401).json({ mensaje: 'No se pudo identificar al usuario. Token inválido.' });
        }

        // Obtener estado y rol para validaciones de seguridad
        const estadoActual = await ReporteRAM.obtenerEstadoRAM(datos.codigoALI);
        const { rol } = req.user || { rol: 0 };



        // REGLA 1: Bloqueo TOTAL si está verificado/finalizado, EXCEPTO para Rol 1 (Supervisor)
        if ((estadoActual?.toUpperCase() === 'VERIFICADO' || estadoActual?.toUpperCase() === 'FINALIZADO') && rol != 1) {
            return res.status(403).json({
                mensaje: 'El reporte ya ha sido VERIFICADO y no puede modificarse.'
            });
        }

        // REGLA 2: Bloqueo a Analistas Junior (Rol 0) si está pendiente de revisión (similar a TPA)
        // (Opcional, si aplica la misma lógica de negocio)
        if (estadoActual?.toUpperCase() === 'PENDIENTE' && rol == 0) {
            return res.status(403).json({
                mensaje: 'El reporte está PENDIENTE de revisión por el supervisor.'
            });
        }

        // REGLA 3: Seguridad - Prevenir que Rol 0 (Analista) finalice el reporte arbitrariamente
        // Si el usuario es Rol 0 y envía estado VERIFICADO o FINALIZADO, forzamos PENDIENTE o BORRADOR
        if (rol == 0 && (datos.estado === 'VERIFICADO' || datos.estado === 'FINALIZADO')) {
            console.warn(`Usuario Rol 0 intentó guardar RAM como '${datos.estado}'. Forzando a 'PENDIENTE'.`);
            datos.estado = 'PENDIENTE';
        }

        const result = await ReporteRAM.guardarReporteRAM(datos, rutUsuario);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error al guardar reporte RAM:', error);
        res.status(500).json({ mensaje: 'Error al guardar el reporte RAM: ' + error.message, error: error.message });
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



