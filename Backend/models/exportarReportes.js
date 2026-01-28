const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

/**
 * Normaliza texto para comparaciones flexibles
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().trim().toLowerCase();
}

/**
 * Formatea una fecha al formato DD-MM-YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '';

    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();

    return `${dia}-${mes}-${anio}`;
}

/**
 * Limpia un rango de celdas
 * @param {Object} worksheet - Hoja de Excel
 * @param {string} rangoInicio - Celda inicial (ej: 'F6')
 * @param {string} rangoFin - Celda final (ej: 'F9')
 */
function limpiarRango(worksheet, rangoInicio, rangoFin) {
    const [colInicio, filaInicio] = [rangoInicio.match(/[A-Z]+/)[0], parseInt(rangoInicio.match(/\d+/)[0])];
    const [colFin, filaFin] = [rangoFin.match(/[A-Z]+/)[0], parseInt(rangoFin.match(/\d+/)[0])];

    for (let fila = filaInicio; fila <= filaFin; fila++) {
        worksheet.getCell(`${colInicio}${fila}`).value = '';
    }
}

/**
 * Procesa la Etapa 1: Cabecera y Almacenamiento
 * @param {Object} worksheet - Hoja de Excel
 * @param {Object} etapa1 - Datos de la etapa 1
 */
function procesarEtapa1(worksheet, etapa1) {
    if (!etapa1) return;

    // Limpiar rango F6:F9
    limpiarRango(worksheet, 'F6', 'F9');

    // Buscar coincidencia en A6:A9
    const lugarNormalizado = normalizarTexto(etapa1.lugarAlmacenamiento);

    for (let fila = 6; fila <= 9; fila++) {
        const celda = worksheet.getCell(`A${fila}`);
        const textoExcel = normalizarTexto(celda.value);

        if (textoExcel.includes(lugarNormalizado) || lugarNormalizado.includes(textoExcel)) {
            // Marcar con √ en columna F (offset +5 desde A)
            worksheet.getCell(`F${fila}`).value = '√';
            break;
        }
    }

    // Escribir observaciones en H6
    if (etapa1.observaciones) {
        worksheet.getCell('H6').value = etapa1.observaciones;
    }
}

/**
 * Procesa la Etapa 2: Manipulación (Filas Dinámicas)
 * @param {Object} worksheet - Hoja de Excel
 * @param {Array} etapa2_manipulacion - Array de manipulaciones
 */
function procesarEtapa2(worksheet, etapa2_manipulacion) {
    if (!etapa2_manipulacion || !Array.isArray(etapa2_manipulacion)) return;

    const filaInicio = 13;
    const filaFin = 21;
    const maxFilas = filaFin - filaInicio + 1; // 9 filas máximo

    // Recopilar todos los equipos para el checklist global
    const equiposGlobales = new Set();

    etapa2_manipulacion.forEach((manipulacion, index) => {
        if (index >= maxFilas) return; // Máximo 9 filas

        const filaActual = filaInicio + index;

        // Tipo de Acción: Retiro (Col A) o Pesado (Col B)
        if (manipulacion.tipoAccion) {
            const tipoNormalizado = normalizarTexto(manipulacion.tipoAccion);
            if (tipoNormalizado === 'retiro') {
                worksheet.getCell(`A${filaActual}`).value = '√';
            } else if (tipoNormalizado === 'pesado') {
                worksheet.getCell(`B${filaActual}`).value = '√';
            }
        }

        // Materiales (Col C): Concatenar códigos o tipos
        if (manipulacion.listaMateriales && Array.isArray(manipulacion.listaMateriales)) {
            const materiales = manipulacion.listaMateriales
                .map(mat => mat.codigoMaterial || mat.tipoMaterial)
                .filter(Boolean)
                .join(', ');
            worksheet.getCell(`C${filaActual}`).value = materiales;
        }

        // Responsable (Col F)
        if (manipulacion.responsable) {
            worksheet.getCell(`F${filaActual}`).value = manipulacion.responsable;
        }

        // Fecha (Col H) - Formatear DD-MM-YYYY
        if (manipulacion.fechaPreparacion) {
            worksheet.getCell(`H${filaActual}`).value = formatearFecha(manipulacion.fechaPreparacion);
        }

        // Hora Inicio (Col J)
        if (manipulacion.horaInicio) {
            worksheet.getCell(`J${filaActual}`).value = manipulacion.horaInicio;
        }

        // Hora Pesado (Col L)
        if (manipulacion.horaPesado) {
            worksheet.getCell(`L${filaActual}`).value = manipulacion.horaPesado;
        }

        // Nº Muestras (Col O)
        if (manipulacion.numeroMuestras) {
            worksheet.getCell(`O${filaActual}`).value = manipulacion.numeroMuestras;
        }

        // Recopilar equipos para checklist global
        if (manipulacion.equiposSeleccionados && Array.isArray(manipulacion.equiposSeleccionados)) {
            manipulacion.equiposSeleccionados.forEach(equipo => {
                equiposGlobales.add(normalizarTexto(equipo));
            });
        }
    });

    // Procesar checklist global de equipos (Q13:Q21 -> marcar en R)
    procesarChecklistEquipos(worksheet, equiposGlobales);
}

/**
 * Procesa el checklist global de equipos
 * @param {Object} worksheet - Hoja de Excel
 * @param {Set} equiposGlobales - Set de equipos normalizados
 */
function procesarChecklistEquipos(worksheet, equiposGlobales) {
    const filaInicio = 13;
    const filaFin = 21;

    // Limpiar columna R antes de marcar
    for (let fila = filaInicio; fila <= filaFin; fila++) {
        worksheet.getCell(`R${fila}`).value = '';
    }

    // Recorrer las celdas Q13:Q21 y comparar
    for (let fila = filaInicio; fila <= filaFin; fila++) {
        const celdaEquipo = worksheet.getCell(`Q${fila}`);
        const equipoExcel = normalizarTexto(celdaEquipo.value);

        if (!equipoExcel) continue;

        // Verificar si algún equipo del JSON coincide (parcial o total)
        for (const equipoJson of equiposGlobales) {
            if (equipoExcel.includes(equipoJson) || equipoJson.includes(equipoExcel)) {
                worksheet.getCell(`R${fila}`).value = '√';
                break;
            }
        }
    }
}

/**
 * Función principal: Genera el reporte TPA en Excel
 * @param {Object} dataJson - Objeto JSON con los datos del reporte TPA
 * @param {string} outputName - Nombre del archivo de salida (sin extensión)
 * @returns {Promise<string>} Ruta del archivo generado
 */
async function generarReporteTPA(dataJson, outputName = 'Reporte_TPA') {
    try {
        // Rutas
        const templatePath = path.join(__dirname, '..', 'templates', 'Plantilla_TPA_Clean.xlsx');
        const outputDir = path.join(__dirname, '..', 'outputs');
        const outputPath = path.join(outputDir, `${outputName}.xlsx`);

        // Verificar que existe el template
        try {
            await fs.access(templatePath);
        } catch (error) {
            throw new Error(`No se encontró la plantilla en: ${templatePath}`);
        }

        // Verificar que existe el directorio de salida
        try {
            await fs.access(outputDir);
        } catch (error) {
            // Crear directorio si no existe
            await fs.mkdir(outputDir, { recursive: true });
        }

        // Cargar el workbook desde la plantilla con opciones para preservar formato
        const workbook = new ExcelJS.Workbook();

        // Opciones de lectura para preservar el máximo de información
        const options = {
            ignoreNodes: [], // No ignorar ningún nodo XML
            map: function (value, index) { return value; } // Preservar valores tal cual
        };

        await workbook.xlsx.readFile(templatePath);

        // Obtener la primera hoja (o la hoja específica del reporte)
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            throw new Error('No se encontró ninguna hoja en la plantilla');
        }

        // Procesar cada etapa
        console.log('Procesando Etapa 1: Almacenamiento...');
        procesarEtapa1(worksheet, dataJson.etapa1);

        console.log('Procesando Etapa 2: Manipulación...');
        procesarEtapa2(worksheet, dataJson.etapa2_manipulacion);

        // TODO: Implementar etapas 3, 4, 5 y 6 según requerimientos adicionales

        // Guardar el archivo
        // console.log(`Guardando archivo en: ${outputPath}`);
        await workbook.xlsx.writeFile(outputPath);

        console.log('✓ Reporte TPA generado exitosamente');
        return outputPath;

    } catch (error) {
        console.error('Error al generar reporte TPA:', error);
        throw error;
    }
}

module.exports = {
    generarReporteTPA
};
