const ExcelJS = require('exceljs');
const { getObjectBuffer } = require('../utils/s3');

class ExcelRAMService {
    static async generarBuffer(datos) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Reporte RAM', {
            views: [{ showGridLines: false }]
        });

        // Configurar columnas
        sheet.columns = [
            { key: 'A', width: 18 }, // Etiquetas
            { key: 'B', width: 12 }, // Valores
            { key: 'C', width: 10 }, // C1
            { key: 'D', width: 10 }, // C2
            { key: 'E', width: 10 }, // ΣC
            { key: 'F', width: 8 },  // n1
            { key: 'G', width: 8 },  // n2
            { key: 'H', width: 8 },  // d
            { key: 'I', width: 20 }, // Resultado RAM
            { key: 'J', width: 15 }, // Resultado RPES (aumentado de 2 a 15)
            { key: 'K', width: 30 }, // Fórmulas/Observaciones
        ];

        // Estilos Base
        const titleStyle = {
            font: { bold: true, size: 12, name: 'Calibri' },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } }
        };
        const headerStyle = {
            font: { bold: true, name: 'Calibri' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        };
        const labelStyle = { font: { bold: true, name: 'Calibri' }, alignment: { vertical: 'top' } };
        const dataStyle = { font: { name: 'Calibri' }, alignment: { wrapText: true, vertical: 'top' } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // --- CABECERA ---
        sheet.mergeCells('A1:K1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'TRAZABILIDAD ANÁLISIS: ENUMERACIÓN DE AEROBIOS MESÓFILOS (NCh 2659.Of 2002)';
        titleCell.style = titleStyle;
        titleCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Fila 2: Código de norma | ALI | Código ALI
        sheet.mergeCells('A2:D2');
        const codigoNormaCell = sheet.getCell('A2');
        codigoNormaCell.value = 'R-PR-SVVM-M-4-11 / 15-02-23';
        codigoNormaCell.font = { size: 9, name: 'Calibri' };
        codigoNormaCell.alignment = { horizontal: 'left', vertical: 'middle' };
        codigoNormaCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        sheet.mergeCells('E2:G2');
        const aliHeaderCell = sheet.getCell('E2');
        aliHeaderCell.value = 'ALI';
        aliHeaderCell.font = { bold: true, size: 11, name: 'Calibri' };
        aliHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        aliHeaderCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        sheet.mergeCells('H2:K2');
        const codigoALIHeaderCell = sheet.getCell('H2');
        codigoALIHeaderCell.value = datos.codigoALI;
        codigoALIHeaderCell.font = { bold: true, size: 10, name: 'Calibri' };
        codigoALIHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        codigoALIHeaderCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        let currentRow = 4;



        // --- ETAPA 2: INCUBACIÓN ---
        const e2 = datos.etapa2 || {};

        // Fila 1: Fechas y horas
        const inicioInc = e2.fechaInicioIncubacion
            ? `${formatearFecha(e2.fechaInicioIncubacion)} ${e2.horaInicioIncubacion || ''}`
            : 'No registrado';

        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = `Inicio Incubación: ${inicioInc}`;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`A${currentRow}`).border = borderStyle;

        const finInc = e2.fechaFinIncubacion
            ? `${formatearFecha(e2.fechaFinIncubacion)} ${e2.horaFinIncubacion || ''}`
            : 'No registrado';

        sheet.mergeCells(`F${currentRow}:K${currentRow}`);
        sheet.getCell(`F${currentRow}`).value = `Término Análisis: ${finInc}`;
        sheet.getCell(`F${currentRow}`).font = { bold: true };
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        currentRow++;

        // Fila 2: Responsables (usar nombres en vez de IDs)
        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = `Responsable Incubación: ${e2.nombreResponsableIncubacion || 'N/A'}`;
        sheet.getCell(`A${currentRow}`).font = { italic: true, size: 9 };
        sheet.getCell(`A${currentRow}`).border = borderStyle;

        sheet.mergeCells(`F${currentRow}:K${currentRow}`);
        sheet.getCell(`F${currentRow}`).value = `Responsable Análisis: ${e2.nombreResponsableAnalisis || 'N/A'}`;
        sheet.getCell(`F${currentRow}`).font = { italic: true, size: 9 };
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        currentRow += 2;



        // --- ETAPA 1: DATOS DE SIEMBRA ---
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const etapa1Title = sheet.getCell(`A${currentRow}`);
        etapa1Title.value = 'DATOS DE SIEMBRA';
        etapa1Title.style = headerStyle;
        etapa1Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const e1 = datos.etapa1 || {};

        // Fila 1: Agar Plate Count | Equipo de Incubación | N Muestra 10gr/90ml
        sheet.getCell(`A${currentRow}`).value = 'Agar Plate Count:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.mergeCells(`B${currentRow}:C${currentRow}`);
        sheet.getCell(`B${currentRow}`).value = e1.agarPlateCount || 'N/A';
        sheet.getCell(`B${currentRow}`).border = borderStyle;

        sheet.mergeCells(`D${currentRow}:E${currentRow}`);
        sheet.getCell(`D${currentRow}`).value = 'Equipo de Incubación:';
        sheet.getCell(`D${currentRow}`).font = labelStyle;
        sheet.getCell(`D${currentRow}`).border = borderStyle;
        sheet.mergeCells(`F${currentRow}:H${currentRow}`);
        sheet.getCell(`F${currentRow}`).value = e1.nombreEquipoIncubacion || 'N/A';
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        sheet.mergeCells(`I${currentRow}:J${currentRow}`);
        sheet.getCell(`I${currentRow}`).value = 'N Muestra 10gr/90ml:';
        sheet.getCell(`I${currentRow}`).font = labelStyle;
        sheet.getCell(`I${currentRow}`).border = borderStyle;
        sheet.getCell(`K${currentRow}`).value = e1.nMuestra10gr || '0';
        sheet.getCell(`K${currentRow}`).border = borderStyle;

        currentRow++;

        // Fila 2: Micropipeta Utilizada | N Muestra 50gr/450ml
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Micropipeta Utilizada:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.mergeCells(`C${currentRow}:G${currentRow}`);
        sheet.getCell(`C${currentRow}`).value = e1.micropipetaUtilizada || 'N/A';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        sheet.mergeCells(`H${currentRow}:J${currentRow}`);
        sheet.getCell(`H${currentRow}`).value = 'N Muestra 50gr/450ml:';
        sheet.getCell(`H${currentRow}`).font = labelStyle;
        sheet.getCell(`H${currentRow}`).border = borderStyle;
        sheet.getCell(`K${currentRow}`).value = e1.nMuestra50gr || '0';
        sheet.getCell(`K${currentRow}`).border = borderStyle;

        currentRow++;

        // Fila 3: Hora Inicio Homogenizado | Hora Término Siembra | Tiempo < 20 min (CUMPLE en verde)
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Hora Inicio Homogenizado:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.mergeCells(`C${currentRow}:D${currentRow}`);
        sheet.getCell(`C${currentRow}`).value = e1.horaInicioHomogenizado || 'N/A';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        sheet.mergeCells(`E${currentRow}:F${currentRow}`);
        sheet.getCell(`E${currentRow}`).value = 'Hora Término Siembra:';
        sheet.getCell(`E${currentRow}`).font = labelStyle;
        sheet.getCell(`E${currentRow}`).border = borderStyle;
        sheet.mergeCells(`G${currentRow}:H${currentRow}`);
        sheet.getCell(`G${currentRow}`).value = e1.horaTerminoSiembra || 'N/A';
        sheet.getCell(`G${currentRow}`).border = borderStyle;

        // Calcular si cumple con < 20 minutos
        let cumpleTiempo = true; // Por defecto cumple
        if (e1.horaInicioHomogenizado && e1.horaTerminoSiembra) {
            try {
                const [horaIni, minIni] = e1.horaInicioHomogenizado.split(':').map(Number);
                const [horaFin, minFin] = e1.horaTerminoSiembra.split(':').map(Number);
                const minutosIni = horaIni * 60 + minIni;
                const minutosFin = horaFin * 60 + minFin;
                const diferencia = minutosFin - minutosIni;
                cumpleTiempo = diferencia <= 20 && diferencia >= 0;
            } catch (error) {
                // Si hay error en el parsing, asumimos que cumple
                cumpleTiempo = true;
            }
        }

        sheet.mergeCells(`I${currentRow}:J${currentRow}`);
        sheet.getCell(`I${currentRow}`).value = 'Tiempo <= 20 min:';
        sheet.getCell(`I${currentRow}`).font = labelStyle;
        sheet.getCell(`I${currentRow}`).border = borderStyle;
        sheet.getCell(`K${currentRow}`).value = cumpleTiempo ? '√' : 'X';
        sheet.getCell(`K${currentRow}`).border = borderStyle;
        sheet.getCell(`K${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: cumpleTiempo ? 'FF90EE90' : 'FFFFC7CE' }
        };
        sheet.getCell(`K${currentRow}`).font = {
            bold: true,
            size: 12,
            color: { argb: cumpleTiempo ? 'FF006400' : 'FFFF0000' }
        };
        sheet.getCell(`K${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

        currentRow += 2;

        // --- ETAPA 4: CONTROL/LECTURA ---
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const etapa4Title = sheet.getCell(`A${currentRow}`);
        etapa4Title.value = 'ETAPA 4: CONTROL';
        etapa4Title.style = headerStyle;
        etapa4Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const e4 = datos.etapa4 || {};

        // Fila 1: Control Pesado
        sheet.mergeCells(`A${currentRow}:C${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Temperatura del Control ambiental Pesado:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.getCell(`D${currentRow}`).value = e4.temperatura || 'N/A';
        sheet.getCell(`D${currentRow}`).border = borderStyle;

        sheet.mergeCells(`E${currentRow}:F${currentRow}`);
        sheet.getCell(`E${currentRow}`).value = 'Control Pesado UFC:';
        sheet.getCell(`E${currentRow}`).font = labelStyle;
        sheet.getCell(`E${currentRow}`).border = borderStyle;
        sheet.getCell(`G${currentRow}`).value = e4.ufcControlPesado || '0';
        sheet.getCell(`G${currentRow}`).border = borderStyle;

        currentRow++;

        // Fila 2: Control Ambiental
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Hora de Inicio:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.getCell(`C${currentRow}`).value = e4.horaInicio || 'N/A';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        sheet.mergeCells(`D${currentRow}:E${currentRow}`);
        sheet.getCell(`D${currentRow}`).value = 'Hora de Fin:';
        sheet.getCell(`D${currentRow}`).font = labelStyle;
        sheet.getCell(`D${currentRow}`).border = borderStyle;
        sheet.getCell(`F${currentRow}`).value = e4.horaFin || 'N/A';
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        sheet.getCell(`G${currentRow}`).value = 'Temperatura:';
        sheet.getCell(`G${currentRow}`).font = labelStyle;
        sheet.getCell(`G${currentRow}`).border = borderStyle;
        sheet.getCell(`H${currentRow}`).value = e4.temperatura || 'N/A';
        sheet.getCell(`H${currentRow}`).border = borderStyle;

        sheet.getCell(`I${currentRow}`).value = 'UFC:';
        sheet.getCell(`I${currentRow}`).font = labelStyle;
        sheet.getCell(`I${currentRow}`).border = borderStyle;
        sheet.getCell(`J${currentRow}`).value = e4.controlUfc || '0';
        sheet.getCell(`J${currentRow}`).border = borderStyle;

        currentRow++;

        // Fila 3: Controles adicionales
        sheet.mergeCells(`A${currentRow}:C${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Control de Siembra E.coli (UFC):';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.getCell(`D${currentRow}`).value = e4.controlSiembraEcoli || '0';
        sheet.getCell(`D${currentRow}`).border = borderStyle;

        sheet.mergeCells(`E${currentRow}:F${currentRow}`);
        sheet.getCell(`E${currentRow}`).value = 'Blanco UFC:';
        sheet.getCell(`E${currentRow}`).font = labelStyle;
        sheet.getCell(`E${currentRow}`).border = borderStyle;
        sheet.getCell(`G${currentRow}`).value = e4.blancoUfc || '0';
        sheet.getCell(`G${currentRow}`).border = borderStyle;

        currentRow += 2;

        // --- ETAPA 5: MANUAL DE INOCUIDAD (OPCIONAL) ---
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const etapa5Title = sheet.getCell(`A${currentRow}`);
        etapa5Title.value = 'ETAPA 5: MANUAL DE INOCUIDAD (OPCIONAL)';
        etapa5Title.style = headerStyle;
        etapa5Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const e5 = datos.etapa5 || {};

        sheet.getCell(`A${currentRow}`).value = 'Desfavorable:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        sheet.getCell(`B${currentRow}`).value = e5.desfavorable ? 'SI' : 'NO';
        sheet.getCell(`B${currentRow}`).border = borderStyle;

        sheet.getCell(`C${currentRow}`).value = 'Tabla/Página:';
        sheet.getCell(`C${currentRow}`).font = labelStyle;
        sheet.getCell(`C${currentRow}`).border = borderStyle;
        sheet.getCell(`D${currentRow}`).value = e5.tablaPagina || 'N/A';
        sheet.getCell(`D${currentRow}`).border = borderStyle;

        sheet.getCell(`E${currentRow}`).value = 'Límite:';
        sheet.getCell(`E${currentRow}`).font = labelStyle;
        sheet.getCell(`E${currentRow}`).border = borderStyle;
        sheet.getCell(`F${currentRow}`).value = e5.limite || 'N/A';
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        currentRow++;

        sheet.getCell(`A${currentRow}`).value = 'Fecha Entrega:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;
        const fechaEntrega = e5.fechaEntrega ? formatearFecha(e5.fechaEntrega) : 'N/A';
        sheet.getCell(`B${currentRow}`).value = fechaEntrega;
        sheet.getCell(`B${currentRow}`).border = borderStyle;

        sheet.getCell(`C${currentRow}`).value = 'Hora Entrega:';
        sheet.getCell(`C${currentRow}`).font = labelStyle;
        sheet.getCell(`C${currentRow}`).border = borderStyle;
        sheet.getCell(`D${currentRow}`).value = e5.horaEntrega || 'N/A';
        sheet.getCell(`D${currentRow}`).border = borderStyle;

        sheet.getCell(`E${currentRow}`).value = 'Mercado:';
        sheet.getCell(`E${currentRow}`).font = labelStyle;
        sheet.getCell(`E${currentRow}`).border = borderStyle;
        sheet.getCell(`F${currentRow}`).value = e5.mercado || 'N/A';
        sheet.getCell(`F${currentRow}`).border = borderStyle;

        // Insertar imagen del Manual de Inocuidad si existe
        // Insertar imagen del Manual de Inocuidad si existe
        if (e5.manualInocuidad) {
            try {
                // Si es una URL firmada, extraer la Key (uploads/...)
                let imageKey = e5.manualInocuidad;
                if (imageKey.includes('uploads/')) {
                    const parts = imageKey.split('uploads/');
                    // Tomar la parte después de uploads/ y quitar query params si existen
                    imageKey = 'uploads/' + parts[1].split('?')[0];
                }

                const imageBuffer = await getObjectBuffer(imageKey);
                const imageId = workbook.addImage({
                    buffer: imageBuffer,
                    extension: 'png',
                });

                // Posicionar imagen en columnas G-K, filas desde etapa5Title hasta currentRow
                const imageStartRow = currentRow - 2; // Fila donde comienza "Desfavorable"
                sheet.addImage(imageId, {
                    tl: { col: 6.2, row: imageStartRow - 0.2 }, // Top-left: columna G
                    br: { col: 10.8, row: currentRow + 0.8 }     // Bottom-right: columna K
                });
            } catch (error) {
                console.error('Error al insertar imagen Manual de Inocuidad:', error);
            }
        }

        currentRow += 2;

        // --- ETAPA 6: CONTROL DE CALIDAD ---
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const etapa6Title = sheet.getCell(`A${currentRow}`);
        etapa6Title.value = 'ETAPA 6: CONTROL DE CALIDAD';
        etapa6Title.style = headerStyle;
        etapa6Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const e6 = datos.etapa6 || {};

        // Función para aplicar formato de cumplimiento
        const aplicarFormatoCumplimiento = (cell, estado) => {
            const cumple = estado === 'CUMPLE' || estado === true;
            cell.value = cumple ? '√' : 'X';
            cell.font = { bold: true, size: 12, color: { argb: cumple ? 'FF006400' : 'FFFF0000' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cumple ? 'FF90EE90' : 'FFFFC7CE' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = borderStyle;
        };

        // Fila 1: Duplicado en ALI
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Duplicado en ALI:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;

        sheet.getCell(`C${currentRow}`).value = e6.duplicadoAli || '';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        sheet.getCell(`D${currentRow}`).value = 'Análisis:';
        sheet.getCell(`D${currentRow}`).font = labelStyle;
        sheet.getCell(`D${currentRow}`).border = borderStyle;

        sheet.getCell(`E${currentRow}`).value = e6.nombreAnalisis || 'RAM';
        sheet.getCell(`E${currentRow}`).border = borderStyle;

        aplicarFormatoCumplimiento(sheet.getCell(`F${currentRow}`), e6.duplicadoEstado || 'CUMPLE');

        currentRow++;

        // Fila 2: Control (+) y Blanco en ALI
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Control (+) y Blanco en ALI:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;

        sheet.getCell(`C${currentRow}`).value = e6.controlBlanco || '0';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        aplicarFormatoCumplimiento(sheet.getCell(`D${currentRow}`), e6.controlBlancoEstado || 'CUMPLE');

        currentRow++;

        // Fila 3: Control de Siembra en ALI
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Control de Siembra en ALI:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;
        sheet.getCell(`A${currentRow}`).border = borderStyle;

        sheet.getCell(`C${currentRow}`).value = e6.controlSiembra || '0';
        sheet.getCell(`C${currentRow}`).border = borderStyle;

        aplicarFormatoCumplimiento(sheet.getCell(`D${currentRow}`), e6.controlSiembraEstado || 'CUMPLE');

        currentRow += 2;

        // --- ETAPA 3: TABLA DE MUESTRAS Y CÁLCULOS ---
        sheet.mergeCells(`A${currentRow}:K${currentRow} `);
        const etapa3Title = sheet.getCell(`A${currentRow} `);
        etapa3Title.value = 'RESULTADOS Y CÁLCULOS';
        etapa3Title.style = headerStyle;
        etapa3Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const headerMuestras = [
            { col: 'A', text: 'Nº Muestra' },
            { col: 'B', text: 'Dilución' },
            { col: 'C', text: 'C1' },
            { col: 'D', text: 'C2' },
            { col: 'E', text: 'ΣC' },
            { col: 'F', text: 'n1' },
            { col: 'G', text: 'n2' },
            { col: 'H', text: 'd' },
            { col: 'I', text: 'Resultado RAM (UFC/g)' },
            { col: 'J', text: 'Resultado RPES' }
        ];

        headerMuestras.forEach(h => {
            const cell = sheet.getCell(`${h.col}${currentRow} `);
            cell.value = h.text;
            cell.style = headerStyle;
        });

        currentRow++;
        const repeticiones = datos.etapa3_repeticiones || [];

        repeticiones.forEach((rep) => {
            if (rep.diluciones && Array.isArray(rep.diluciones)) {
                rep.diluciones.forEach((dil, index) => {
                    const rowCells = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

                    sheet.getCell(`A${currentRow} `).value = index === 0 ? rep.numero_Muestra : '';
                    sheet.getCell(`B${currentRow} `).value = dil.dil; // Valor simple: 1, 2, etc.
                    sheet.getCell(`C${currentRow} `).value = dil.colonias ? dil.colonias[0] : '';
                    sheet.getCell(`D${currentRow} `).value = dil.colonias ? dil.colonias[1] : '';

                    if (index === 0) {
                        sheet.getCell(`E${currentRow} `).value = rep.sumaColonias;
                        sheet.getCell(`F${currentRow} `).value = rep.n1;
                        sheet.getCell(`G${currentRow} `).value = rep.n2;
                        sheet.getCell(`H${currentRow} `).value = rep.factorDilucion;
                        sheet.getCell(`I${currentRow} `).value = rep.resultado_ram;
                        sheet.getCell(`I${currentRow} `).font = { bold: true };
                        sheet.getCell(`J${currentRow} `).value = rep.resultado_rpes || '';
                        sheet.getCell(`J${currentRow} `).font = { bold: true };
                    }

                    rowCells.forEach(col => {
                        const cell = sheet.getCell(`${col}${currentRow} `);
                        cell.border = borderStyle;
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    });

                    currentRow++;
                });
            }

            // Duplicado (Completar todos los campos - MOSTRAR AMBAS DILUCIONES)
            if (rep.duplicado) {
                const dup = rep.duplicado;
                const rowCells = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

                // Dilución 1 del duplicado
                if (dup.dil01 !== null && dup.dil01 !== undefined) {
                    sheet.getCell(`A${currentRow}`).value = `${rep.numero_Muestra} (DUP)`;
                    sheet.getCell(`B${currentRow}`).value = dup.dil01;

                    const cDup = dup.numeroColonias || [];
                    sheet.getCell(`C${currentRow}`).value = cDup[0] || '';
                    sheet.getCell(`D${currentRow}`).value = cDup[1] || '';

                    // Solo en primera fila: ΣC, n1, n2, d, resultados
                    sheet.getCell(`E${currentRow}`).value = dup.sumaColonias || '';
                    sheet.getCell(`F${currentRow}`).value = dup.n1 || '';
                    sheet.getCell(`G${currentRow}`).value = dup.n2 || '';
                    sheet.getCell(`H${currentRow}`).value = dup.factorDilucion || '';
                    sheet.getCell(`I${currentRow}`).value = dup.resultado_ram || '';
                    sheet.getCell(`I${currentRow}`).font = { bold: true };
                    sheet.getCell(`J${currentRow}`).value = dup.resultado_rpes || '';
                    sheet.getCell(`J${currentRow}`).font = { bold: true };

                    rowCells.forEach(col => {
                        const cell = sheet.getCell(`${col}${currentRow}`);
                        cell.border = borderStyle;
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                    });

                    currentRow++;
                }

                // Dilución 2 del duplicado (si existe)
                if (dup.dil02 !== null && dup.dil02 !== undefined) {
                    sheet.getCell(`A${currentRow}`).value = ''; // Vacío, ya pusimos el número arriba
                    sheet.getCell(`B${currentRow}`).value = dup.dil02;

                    const cDup = dup.numeroColonias || [];
                    sheet.getCell(`C${currentRow}`).value = cDup[2] || ''; // c_dup_3
                    sheet.getCell(`D${currentRow}`).value = cDup[3] || ''; // c_dup_4

                    // Dejar vacías las columnas de cálculo (ya están en la primera fila)
                    sheet.getCell(`E${currentRow}`).value = '';
                    sheet.getCell(`F${currentRow}`).value = '';
                    sheet.getCell(`G${currentRow}`).value = '';
                    sheet.getCell(`H${currentRow}`).value = '';
                    sheet.getCell(`I${currentRow}`).value = '';
                    sheet.getCell(`J${currentRow}`).value = '';

                    rowCells.forEach(col => {
                        const cell = sheet.getCell(`${col}${currentRow}`);
                        cell.border = borderStyle;
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                    });

                    currentRow++;
                }
            }
        });

        currentRow += 2;

        // --- ETAPA 7: OBSERVACIONES ---
        sheet.mergeCells(`A${currentRow}:K${currentRow} `);
        const etapa7Title = sheet.getCell(`A${currentRow} `);
        etapa7Title.value = 'OBSERVACIONES';
        etapa7Title.style = headerStyle;
        etapa7Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        sheet.mergeCells(`A${currentRow}:K${currentRow + 2} `);
        const obs = (datos.etapa7 && datos.etapa7.observacionesFinales) ? datos.etapa7.observacionesFinales : 'Sin observaciones.';
        const obsCell = sheet.getCell(`A${currentRow} `);
        obsCell.value = obs;
        obsCell.alignment = { vertical: 'top', wrapText: true };
        obsCell.border = borderStyle;

        currentRow += 3;


        // --- FORMAS DE CÁLCULO ---
        // Backend devuelve formaCalculoAnalista y formaCalculoCoordinador planos en etapa7
        const formasAnalista = datos.etapa7 && datos.etapa7.formaCalculoAnalista ? datos.etapa7.formaCalculoAnalista : [];
        const formasCoordinador = datos.etapa7 && datos.etapa7.formaCalculoCoordinador ? datos.etapa7.formaCalculoCoordinador : [];

        const mapaFormas = {
            1: 'Calculadora',
            2: 'Plantillas Excel (Almacenar)',
            3: 'Software'
        };

        const obtenerSeleccionadas = (items) => {
            if (!items || items.length === 0) return 'Ninguna';
            return items.map(item => {
                // Manejar si viene como objeto {id: 1, ...} o como ID directo (1)
                const id = (typeof item === 'object' && item !== null) ? (item.id || item.idForma) : item;
                return `☑ ${mapaFormas[id] || 'Desconocido'}`;
            }).join('   ');
        };

        // Título Analista
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const titleAnalista = sheet.getCell(`A${currentRow}`);
        titleAnalista.value = 'Forma de Cálculo realizado por Analista';
        titleAnalista.font = { bold: true, color: { argb: 'FF002060' } };
        titleAnalista.alignment = { horizontal: 'center' };
        currentRow++;

        // Opciones Analista (Solo seleccionadas)
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = obtenerSeleccionadas(formasAnalista);
        sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

        currentRow += 2;

        // Título Coordinadora
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        const titleCoord = sheet.getCell(`A${currentRow}`);
        titleCoord.value = 'Forma de Cálculo realizado por Coordinadora';
        titleCoord.font = { bold: true, color: { argb: 'FF002060' } };
        titleCoord.alignment = { horizontal: 'center' };
        currentRow++;

        // Opciones Coordinadora (Solo seleccionadas)
        sheet.mergeCells(`A${currentRow}:K${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = obtenerSeleccionadas(formasCoordinador);
        sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

        currentRow += 3;

        // --- FIRMA COORDINADOR ---
        // Check if signature exists and is a URL (S3)
        const firmaUrl = datos.etapa7?.firmaCoordinador;
        let firmaInsertada = false;

        if (firmaUrl && typeof firmaUrl === 'string' && firmaUrl.includes('http')) {
            try {
                // Intentar extraer KEY: uploads/...
                // Formato esperado: https://BUCKET.s3.REGION.amazonaws.com/KEY
                // O: https://s3.REGION.amazonaws.com/BUCKET/KEY
                // Estrategia robusta: buscar "uploads/"
                const match = firmaUrl.match(/(uploads\/.*?)(\?|$)/);
                if (match && match[1]) {
                    const key = match[1];
                    const buffer = await getObjectBuffer(key);
                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: 'png', // Asumimos PNG por defecto si no podemos deducir
                    });

                    // AJUSTE DE POSICIÓN (Solicitud: Más arriba y a la derecha)
                    // Antes: col 8.75 -> 10.25 | row -1 -> +1
                    // Nuevo: col 9.2 -> 10.9 (Derecha) | row -1.3 -> +0.5 (Arriba)
                    sheet.addImage(imageId, {
                        tl: { col: 9.2, row: currentRow - 1.3 },
                        br: { col: 10.9, row: currentRow + 0.5 }
                    });
                    firmaInsertada = true;
                }
            } catch (e) {
                console.error('Error insertando firma coordinador S3:', e);
            }
        }

        sheet.mergeCells(`H${currentRow}:K${currentRow} `);
        const firmaLine = sheet.getCell(`H${currentRow} `);
        // Si hay imagen, quitamos la línea baja para que no se vea doble, o la dejamos como base. Dejémosla.
        firmaLine.value = '__________________________';
        firmaLine.alignment = { horizontal: 'center', vertical: 'bottom' };

        currentRow++;
        sheet.mergeCells(`H${currentRow}:K${currentRow} `);
        const firmaLabel = sheet.getCell(`H${currentRow} `);
        firmaLabel.value = 'Firma Coordinador';
        firmaLabel.alignment = { horizontal: 'center', vertical: 'top' };
        firmaLabel.font = { italic: true };

        currentRow += 2;

        // --- MANUAL DE INOCUIDAD (Etapa 5) ---
        // Insertar imagen si existe
        const manualUrl = datos.etapa5?.manualInocuidad || datos.etapa5?.imagenManual; // Fix: usar imagenManual que es lo que viene del front
        if (manualUrl && typeof manualUrl === 'string' && manualUrl.includes('http')) {
            sheet.mergeCells(`A${currentRow}:K${currentRow}`);
            const titleManual = sheet.getCell(`A${currentRow}`);
            titleManual.value = 'EVIDENCIA MANUAL INOCUIDAD (Etapa 5)';
            titleManual.style = headerStyle;
            titleManual.alignment = { horizontal: 'left', indent: 1 };
            currentRow++;

            try {
                const match = manualUrl.match(/(uploads\/.*?)(\?|$)/);
                if (match && match[1]) {
                    const key = match[1];
                    const buffer = await getObjectBuffer(key);
                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: 'png',
                    });

                    const startRow = currentRow;
                    const endRow = currentRow + 15;

                    sheet.addImage(imageId, {
                        tl: { col: 0, row: startRow },
                        br: { col: 10.9, row: endRow }
                    });

                    currentRow = endRow + 1;
                }
            } catch (e) {
                console.error('Error insertando manual inocuidad S3:', e);
                sheet.getCell(`A${currentRow}`).value = 'Error al cargar imagen del manual.';
                currentRow++;
            }
            currentRow += 2;
        }

        // --- ANEXOS VISUALES (ALI_IMAGENES) ---
        if (datos.imagenes && datos.imagenes.length > 0) {
            // Filtrar duplicados por s3_key
            const anexoKeysVistos = new Set();
            const anexosUnicos = [];
            for (const img of datos.imagenes) {
                if (img.s3_key && !anexoKeysVistos.has(img.s3_key)) {
                    anexoKeysVistos.add(img.s3_key);
                    anexosUnicos.push(img);
                }
            }

            if (anexosUnicos.length > 0) {
                sheet.mergeCells(`A${currentRow}:K${currentRow}`);
                const titleAnexos = sheet.getCell(`A${currentRow}`);
                titleAnexos.value = 'ANEXOS VISUALES (Observaciones)';
                titleAnexos.style = headerStyle;
                titleAnexos.alignment = { horizontal: 'left', indent: 1 };
                currentRow++;

                for (const imgMeta of anexosUnicos) {
                    try {
                        if (!imgMeta.s3_key) continue;

                        const buffer = await getObjectBuffer(imgMeta.s3_key);

                        // Determinar extensión simple
                        let ext = 'png';
                        const mime = (imgMeta.tipo_mime || '').toLowerCase();
                        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpeg';

                        const imageId = workbook.addImage({
                            buffer: buffer,
                            extension: ext,
                        });

                        // Insertar imagen ocupando aprox 15 filas
                        const startRow = currentRow;
                        const endRow = currentRow + 15;

                        sheet.addImage(imageId, {
                            tl: { col: 0, row: startRow },
                            br: { col: 10.9, row: endRow }
                        });

                        // Etiqueta abajo
                        sheet.mergeCells(`A${endRow + 1}:K${endRow + 1}`);
                        const labelCell = sheet.getCell(`A${endRow + 1}`);
                        labelCell.value = `Fig: ${imgMeta.nombre_archivo} (${formatearFecha(imgMeta.fecha_subida)})`;
                        labelCell.alignment = { horizontal: 'center', vertical: 'top' };
                        labelCell.font = { italic: true, size: 9 };

                        currentRow = endRow + 3; // Espacio para la siguiente imagen
                    } catch (error) {
                        console.error('Error incrustando imagen en Excel:', error);
                        sheet.getCell(`A${currentRow}`).value = `Error al cargar imagen: ${imgMeta.nombre_archivo}`;
                        currentRow += 2;
                    }
                }
            }
        }

        sheet.pageSetup.printArea = `A1:K${currentRow}`;

        return await workbook.xlsx.writeBuffer();
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d} -${m} -${y} `;
}

module.exports = ExcelRAMService;
