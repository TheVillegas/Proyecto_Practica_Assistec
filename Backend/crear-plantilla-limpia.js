const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Script para crear una plantilla TPA limpia y compatible con exceljs
 */
async function crearPlantillaLimpia() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte TPA');

    // Configurar ancho de columnas
    worksheet.columns = [
        { width: 15 }, // A
        { width: 12 }, // B
        { width: 30 }, // C - Materiales
        { width: 10 }, // D
        { width: 10 }, // E
        { width: 15 }, // F - Responsable
        { width: 10 }, // G
        { width: 15 }, // H - Fecha
        { width: 10 }, // I
        { width: 12 }, // J - Hora Inicio
        { width: 10 }, // K
        { width: 12 }, // L - Hora Pesado
        { width: 10 }, // M
        { width: 10 }, // N
        { width: 15 }, // O - Nº Muestras
        { width: 10 }, // P
        { width: 25 }, // Q - Equipos
        { width: 10 }  // R - Check
    ];

    // ENCABEZADO
    worksheet.mergeCells('A1:R1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE TPA - TRAZABILIDAD PESADO Y ANÁLISIS';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    titleCell.font.color = { argb: 'FFFFFFFF' };

    // ETAPA 1: ALMACENAMIENTO (Filas 3-9)
    worksheet.getCell('A3').value = 'ETAPA 1: LUGAR DE ALMACENAMIENTO';
    worksheet.getCell('A3').font = { bold: true, size: 12 };
    worksheet.mergeCells('A3:E3');

    worksheet.getCell('H3').value = 'OBSERVACIONES';
    worksheet.getCell('H3').font = { bold: true };

    // Opciones de almacenamiento
    const opcionesAlmacenamiento = [
        'Mesón Siembra',
        'Cámara Fría',
        'Refrigerador',
        'Ambiente Controlado'
    ];

    opcionesAlmacenamiento.forEach((opcion, index) => {
        const fila = 6 + index;
        worksheet.getCell(`A${fila}`).value = opcion;
        worksheet.getCell(`F${fila}`).value = ''; // Espacio para marca √
    });

    // ETAPA 2: MANIPULACIÓN (Filas 11-21)
    worksheet.getCell('A11').value = 'ETAPA 2: MANIPULACIÓN';
    worksheet.getCell('A11').font = { bold: true, size: 12 };
    worksheet.mergeCells('A11:R11');

    // Encabezados de tabla
    const headers = [
        'Retiro', 'Pesado', 'Materiales', '', '', 'Responsable',
        '', 'Fecha', '', 'Hora Inicio', '', 'Hora Pesado',
        '', '', 'Nº Muestras', '', 'Equipo', '✓'
    ];

    headers.forEach((header, index) => {
        const cell = worksheet.getCell(12, index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Filas de datos (13-21)
    for (let fila = 13; fila <= 21; fila++) {
        for (let col = 1; col <= 18; col++) {
            const cell = worksheet.getCell(fila, col);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }
    }

    // Lista de equipos en columna Q
    const equipos = [
        'Cámara Flujo laminar 8-M',
        'Mesón de Transpaso',
        'Balanza 6-M',
        'Balanza 74-M',
        'Homogenizador',
        'Baño María',
        'Autoclave',
        'Incubadora',
        'Centrífuga'
    ];

    equipos.forEach((equipo, index) => {
        if (index < 9) {
            worksheet.getCell(`Q${13 + index}`).value = equipo;
        }
    });

    // Guardar archivo
    const outputPath = path.join(__dirname, 'templates', 'Plantilla_TPA_Clean.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    console.log('✓ Plantilla limpia creada exitosamente en:', outputPath);
}

// Ejecutar
crearPlantillaLimpia().catch(console.error);
