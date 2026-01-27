const ExcelJS = require('exceljs');
const { getObjectBuffer } = require('../utils/s3');

class ExcelTPAService {
    static async generarBuffer(datos) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Reporte TPA', {
            views: [{ showGridLines: false }]
        });

        // Configurar columnas - Expandido para separar Materiales/Código y agregar Diluyentes
        sheet.columns = [
            { key: 'A', width: 20 }, // Etiquetas / Acción
            { key: 'B', width: 5 },  // Check
            { key: 'C', width: 20 }, // Responsable
            { key: 'D', width: 2 },  // Espacio
            { key: 'E', width: 12 }, // Fecha
            { key: 'F', width: 2 },  // Espacio
            { key: 'G', width: 8 },  // Hora Inicio
            { key: 'H', width: 2 },  // Espacio
            { key: 'I', width: 8 },  // Hora Termino
            { key: 'J', width: 2 },  // Espacio
            { key: 'K', width: 8 },  // Muestras
            { key: 'L', width: 2 },  // Espacio
            { key: 'M', width: 25 }, // Materiales (Nombre)
            { key: 'N', width: 15 }, // Código Material
            { key: 'O', width: 25 }, // Equipos
            { key: 'P', width: 20 }, // Diluyentes (para Etapa 5)
            { key: 'Q', width: 15 }, // Código Diluyente (para Etapa 5)
        ];

        // Estilos Base
        const titleStyle = { font: { bold: true, size: 14, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' } };
        const headerStyle = { font: { bold: true, name: 'Calibri' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } };
        const labelStyle = { font: { bold: true, name: 'Calibri' }, alignment: { vertical: 'top' } };
        const dataStyle = { font: { name: 'Calibri' }, alignment: { wrapText: true, vertical: 'top' } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // --- CABECERA ---
        // Fila 1: Título principal
        sheet.mergeCells('A1:Q1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'TRAZABILIDAD PESADO Y ANÁLISIS';
        titleCell.style = titleStyle;
        titleCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        // Fila 2: Código de norma | ALI | Código ALI
        sheet.mergeCells('A2:F2');
        const codigoNormaCell = sheet.getCell('A2');
        codigoNormaCell.value = 'R-INS-MM-M-1-15 /23-08-23';
        codigoNormaCell.font = { size: 9, name: 'Calibri' };
        codigoNormaCell.alignment = { horizontal: 'left', vertical: 'middle' };
        codigoNormaCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        sheet.mergeCells('G2:J2');
        const aliHeaderCell = sheet.getCell('G2');
        aliHeaderCell.value = 'ALI';
        aliHeaderCell.font = { bold: true, size: 11, name: 'Calibri' };
        aliHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        aliHeaderCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };

        sheet.mergeCells('K2:Q2');
        const codigoALIHeaderCell = sheet.getCell('K2');
        codigoALIHeaderCell.value = datos.codigoALI;
        codigoALIHeaderCell.font = { bold: true, size: 10, name: 'Calibri' };
        codigoALIHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        codigoALIHeaderCell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };


        // --- ETAPA 1: ALMACENAMIENTO ---
        let currentRow = 5;

        sheet.getCell(`A${currentRow}`).value = 'Lugar de almacenamiento de la muestra:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;

        sheet.mergeCells(`C${currentRow}:Q${currentRow}`);
        const lugarCell = sheet.getCell(`C${currentRow}`);
        lugarCell.value = datos.etapa1?.lugarAlmacenamiento || 'No registrado';
        lugarCell.alignment = { wrapText: true, vertical: 'top' };
        lugarCell.border = { bottom: { style: 'thin' } };

        currentRow++;
        sheet.getCell(`A${currentRow}`).value = 'Observaciones:';
        sheet.getCell(`A${currentRow}`).font = labelStyle;

        sheet.mergeCells(`C${currentRow}:Q${currentRow}`);
        const obsCell = sheet.getCell(`C${currentRow}`);
        obsCell.value = datos.etapa1?.observaciones || 'Sin observaciones';
        obsCell.alignment = { wrapText: true, vertical: 'top' };
        obsCell.border = { bottom: { style: 'thin' } };

        currentRow += 2;

        // --- ETAPA 2: MANIPULACIÓN (TABLA) ---
        sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
        const manipulateTitle = sheet.getCell(`A${currentRow}`);
        manipulateTitle.value = 'MANIPULACIÓN DE MUESTRAS (PESADO Y RETIRO)';
        manipulateTitle.style = headerStyle;
        manipulateTitle.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const headersEtapa2 = [
            { col: 'A', text: 'Acción' },
            { col: 'C', text: 'Responsable' },
            { col: 'E', text: 'Fecha' },
            { col: 'G', text: 'Inicio' },
            { col: 'I', text: 'Término' },
            { col: 'K', text: 'Muestras' },
            { col: 'M', text: 'Materiales' },
            { col: 'N', text: 'Código Material' },
            { col: 'O', text: 'Equipos' },
        ];

        headersEtapa2.forEach(h => {
            const cell = sheet.getCell(`${h.col}${currentRow}`);
            cell.value = h.text;
            cell.style = headerStyle;
        });

        currentRow++;
        const sesiones = datos.etapa2_manipulacion || [];

        if (sesiones.length === 0) {
            sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = 'No hay sesiones registradas';
            sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
            sheet.getCell(`A${currentRow}`).border = borderStyle;
            currentRow++;
        } else {
            sesiones.forEach(sesion => {
                const rowCells = ['A', 'C', 'E', 'G', 'I', 'K', 'M', 'N', 'O'];

                const fecha = sesion.fechaPreparacion ? new Date(sesion.fechaPreparacion).toLocaleDateString() : '';
                const materiales = (sesion.listaMateriales || [])
                    .map(m => `- ${m.tipoMaterial}`)
                    .join('\n');

                const codigosMateriales = (sesion.listaMateriales || [])
                    .map(m => m.codigoMaterial)
                    .join('\n');

                const equipos = (sesion.equiposSeleccionados || [])
                    .map(e => `- ${e}`)
                    .join('\n');

                sheet.getCell(`A${currentRow}`).value = sesion.tipoAccion;
                sheet.getCell(`C${currentRow}`).value = sesion.responsable;
                sheet.getCell(`E${currentRow}`).value = fecha;
                sheet.getCell(`G${currentRow}`).value = sesion.horaInicio;
                sheet.getCell(`I${currentRow}`).value = sesion.horaPesado;
                sheet.getCell(`K${currentRow}`).value = sesion.numeroMuestras;
                sheet.getCell(`M${currentRow}`).value = materiales;
                sheet.getCell(`N${currentRow}`).value = codigosMateriales;
                sheet.getCell(`O${currentRow}`).value = equipos;

                rowCells.forEach(col => {
                    const cell = sheet.getCell(`${col}${currentRow}`);
                    cell.style = dataStyle;
                    cell.border = borderStyle;
                });
                currentRow++;
            });
        }

        currentRow += 2;

        // --- ETAPA 3: LIMPIEZA (CHECKLIST) ---
        sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
        const limpiezaTitle = sheet.getCell(`A${currentRow}`);
        limpiezaTitle.value = 'LIMPIEZA Y DESINFECCIÓN';
        limpiezaTitle.style = headerStyle;
        limpiezaTitle.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Instrumento / Área';
        sheet.getCell(`A${currentRow}`).style = headerStyle;
        sheet.getCell(`C${currentRow}`).value = 'Estado';
        sheet.getCell(`C${currentRow}`).style = headerStyle;

        currentRow++;

        const checklist = (datos.etapa3_limpieza && datos.etapa3_limpieza.checklist) ? datos.etapa3_limpieza.checklist : [];
        if (checklist.length > 0) {
            checklist.forEach(item => {
                sheet.mergeCells(`A${currentRow}:B${currentRow}`);
                sheet.getCell(`A${currentRow}`).value = item.nombre;
                sheet.getCell(`A${currentRow}`).border = borderStyle;
                sheet.getCell(`A${currentRow}`).font = { name: 'Calibri' };

                sheet.getCell(`C${currentRow}`).value = item.seleccionado ? 'CUMPLE' : '-';
                sheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };
                sheet.getCell(`C${currentRow}`).border = borderStyle;
                if (item.seleccionado) {
                    sheet.getCell(`C${currentRow}`).font = { color: { argb: 'FF006100' }, bold: true };
                    sheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
                }
                currentRow++;
            });
        } else {
            sheet.mergeCells(`A${currentRow}:C${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = 'No aplica';
            currentRow++;
        }

        currentRow += 2;

        // --- ETAPA 4: RETIRO DE MUESTRAS ---
        sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
        const etapa4Title = sheet.getCell(`A${currentRow}`);
        etapa4Title.value = 'RETIRO DE MUESTRAS PESADAS';
        etapa4Title.style = headerStyle;
        etapa4Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        const headersEtapa4 = [
            { col: 'A', text: 'Responsable' },
            { col: 'E', text: 'Fecha' },
            { col: 'G', text: 'Hora Inicio' },
            { col: 'K', text: 'Análisis a Realizar' },
        ];

        headersEtapa4.forEach(h => {
            const cell = sheet.getCell(`${h.col}${currentRow}`);
            cell.value = h.text;
            cell.style = headerStyle;
        });
        sheet.mergeCells(`K${currentRow}:Q${currentRow}`);

        currentRow++;
        const retiros = datos.etapa4_retiro || [];

        if (retiros.length === 0) {
            sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = 'No hay retiros registrados';
            sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
            sheet.getCell(`A${currentRow}`).border = borderStyle;
            currentRow++;
        } else {
            retiros.forEach(retiro => {
                const fechaRetiro = retiro.fecha ? new Date(retiro.fecha).toLocaleDateString() : '';

                sheet.mergeCells(`A${currentRow}:D${currentRow}`);
                sheet.getCell(`A${currentRow}`).value = retiro.responsable;
                sheet.getCell(`A${currentRow}`).border = borderStyle;
                sheet.getCell(`A${currentRow}`).style = dataStyle;

                sheet.mergeCells(`E${currentRow}:F${currentRow}`);
                sheet.getCell(`E${currentRow}`).value = fechaRetiro;
                sheet.getCell(`E${currentRow}`).border = borderStyle;
                sheet.getCell(`E${currentRow}`).style = dataStyle;

                sheet.mergeCells(`G${currentRow}:J${currentRow}`);
                sheet.getCell(`G${currentRow}`).value = retiro.horaInicio;
                sheet.getCell(`G${currentRow}`).border = borderStyle;
                sheet.getCell(`G${currentRow}`).style = dataStyle;

                sheet.mergeCells(`K${currentRow}:Q${currentRow}`);
                sheet.getCell(`K${currentRow}`).value = retiro.analisisARealizar;
                sheet.getCell(`K${currentRow}`).border = borderStyle;
                sheet.getCell(`K${currentRow}`).style = dataStyle;

                currentRow++;
            });
        }

        currentRow += 2;

        // --- ETAPA 5: MATERIALES Y EQUIPOS DE SIEMBRA ---
        sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
        const etapa5Title = sheet.getCell(`A${currentRow}`);
        etapa5Title.value = 'MATERIALES Y EQUIPOS DE SIEMBRA';
        etapa5Title.style = headerStyle;
        etapa5Title.alignment = { horizontal: 'left', indent: 1 };

        currentRow++;
        // Headers: Material Usado | Código Material | Equipos | Diluyentes | Código Diluyente
        sheet.mergeCells(`A${currentRow}:C${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = 'Material Usado';
        sheet.getCell(`A${currentRow}`).style = headerStyle;

        sheet.mergeCells(`D${currentRow}:F${currentRow}`);
        sheet.getCell(`D${currentRow}`).value = 'Código Material';
        sheet.getCell(`D${currentRow}`).style = headerStyle;

        sheet.mergeCells(`G${currentRow}:J${currentRow}`);
        sheet.getCell(`G${currentRow}`).value = 'Equipos e Instrumentos';
        sheet.getCell(`G${currentRow}`).style = headerStyle;

        sheet.mergeCells(`K${currentRow}:N${currentRow}`);
        sheet.getCell(`K${currentRow}`).value = 'Diluyentes';
        sheet.getCell(`K${currentRow}`).style = headerStyle;

        sheet.mergeCells(`O${currentRow}:Q${currentRow}`);
        sheet.getCell(`O${currentRow}`).value = 'Código Diluyente';
        sheet.getCell(`O${currentRow}`).style = headerStyle;

        currentRow++;
        const e5 = datos.etapa5_siembra || {};
        const materialesSiembra = e5.materiales || [];
        const diluyentesSiembra = e5.diluyentes || [];
        const equiposSiembra = e5.equipos || [];
        const otrosEquipos = e5.otrosEquipos || '';

        const listaEquiposCompleta = [
            ...equiposSiembra.filter(e => e.seleccionado).map(e => e.nombre)
        ];
        if (otrosEquipos) listaEquiposCompleta.push(`Otros: ${otrosEquipos}`);

        const maxRows = Math.max(materialesSiembra.length, diluyentesSiembra.length, listaEquiposCompleta.length);

        if (maxRows === 0) {
            sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
            sheet.getCell(`A${currentRow}`).value = 'No hay recursos registrados';
            currentRow++;
        } else {
            for (let i = 0; i < maxRows; i++) {
                // Material Usado
                const mat = materialesSiembra[i];
                sheet.mergeCells(`A${currentRow}:C${currentRow}`);
                sheet.getCell(`A${currentRow}`).border = borderStyle;
                sheet.getCell(`A${currentRow}`).style = dataStyle;
                if (mat) {
                    sheet.getCell(`A${currentRow}`).value = mat.nombre;
                }

                // Código Material
                sheet.mergeCells(`D${currentRow}:F${currentRow}`);
                sheet.getCell(`D${currentRow}`).border = borderStyle;
                sheet.getCell(`D${currentRow}`).style = dataStyle;
                if (mat) {
                    sheet.getCell(`D${currentRow}`).value = mat.codigoMaterialSiembra || 'S/C';
                }

                // Equipos
                sheet.mergeCells(`G${currentRow}:J${currentRow}`);
                sheet.getCell(`G${currentRow}`).border = borderStyle;
                sheet.getCell(`G${currentRow}`).style = dataStyle;
                const eq = listaEquiposCompleta[i];
                if (eq) {
                    sheet.getCell(`G${currentRow}`).value = `- ${eq}`;
                }

                // Diluyentes
                const dil = diluyentesSiembra[i];
                sheet.mergeCells(`K${currentRow}:N${currentRow}`);
                sheet.getCell(`K${currentRow}`).border = borderStyle;
                sheet.getCell(`K${currentRow}`).style = dataStyle;
                if (dil) {
                    sheet.getCell(`K${currentRow}`).value = dil.nombre;
                }

                // Código Diluyente
                sheet.mergeCells(`O${currentRow}:Q${currentRow}`);
                sheet.getCell(`O${currentRow}`).border = borderStyle;
                sheet.getCell(`O${currentRow}`).style = dataStyle;
                if (dil) {
                    sheet.getCell(`O${currentRow}`).value = dil.codigoDiluyente || 'S/C';
                }

                currentRow++;
            }
        }

        // --- OBSERVACIONES FINALES ---
        sheet.mergeCells(`A${currentRow}:J${currentRow}`);
        const obsFinalTitle = sheet.getCell(`A${currentRow}`);
        obsFinalTitle.value = 'OBSERVACIONES FINALES:';
        obsFinalTitle.font = { bold: true };

        currentRow++;
        sheet.mergeCells(`A${currentRow}:K${currentRow + 1}`);

        //Estamos en TPA y las observaciones son de etapa 6 
        const obsFinal = (datos.etapa6 && datos.etapa6.observacionesFinales) ? datos.etapa6.observacionesFinales : 'Sin observaciones.';
        const obsFinalCell = sheet.getCell(`A${currentRow}`);
        obsFinalCell.value = obsFinal;
        obsFinalCell.alignment = { vertical: 'top', wrapText: true };
        obsFinalCell.border = borderStyle;

        currentRow += 3;

        // --- FIRMA COORDINADOR ---
        currentRow += 4;

        // S3 Signature Logic
        const firmaUrl = (datos.etapa6_cierre && datos.etapa6_cierre.firma) ? datos.etapa6_cierre.firma : null;

        if (firmaUrl && typeof firmaUrl === 'string' && firmaUrl.includes('http')) {
            try {
                const match = firmaUrl.match(/(uploads\/.*?)(\?|$)/);
                if (match && match[1]) {
                    const key = match[1];
                    const buffer = await getObjectBuffer(key);
                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: 'png',
                    });

                    // Insertar en columna N-O (Indices 13-15)
                    sheet.addImage(imageId, {
                        tl: { col: 13, row: currentRow - 2 }, // N
                        br: { col: 15, row: currentRow }      // O
                    });
                }
            } catch (e) {
                console.error('Error insertando firma coordinador TPA S3:', e);
            }
        }

        sheet.mergeCells(`L${currentRow}:Q${currentRow}`);
        const firmaLine = sheet.getCell(`L${currentRow}`);
        firmaLine.value = '__________________________';
        firmaLine.alignment = { horizontal: 'center', vertical: 'bottom' };

        currentRow++;
        sheet.mergeCells(`L${currentRow}:Q${currentRow}`);
        const firmaLabel = sheet.getCell(`L${currentRow}`);
        firmaLabel.value = 'Firma Coordinador';
        firmaLabel.alignment = { horizontal: 'center', vertical: 'top' };
        firmaLabel.font = { italic: true };

        // --- ANEXOS VISUALES (IMAGENES) ---
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
                currentRow += 2; // Espacio antes de los anexos
                sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
                const titleAnexos = sheet.getCell(`A${currentRow}`);
                titleAnexos.value = 'ANEXOS VISUALES';
                titleAnexos.style = headerStyle;
                titleAnexos.alignment = { horizontal: 'left', indent: 1 };
                currentRow++;

                for (const imgMeta of anexosUnicos) {
                    try {
                        if (!imgMeta.s3_key) continue;

                        const buffer = await getObjectBuffer(imgMeta.s3_key);

                        // Determinar extensión
                        let ext = 'png';
                        const mime = (imgMeta.tipo_mime || '').toLowerCase();
                        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpeg';

                        const imageId = workbook.addImage({
                            buffer: buffer,
                            extension: ext,
                        });

                        // Insertar imagen ocupando aprox 15 filas
                        // Tamaño solicitado igual al RAM: tl:0, br:10.9
                        const startRow = currentRow;
                        const endRow = currentRow + 15;

                        sheet.addImage(imageId, {
                            tl: { col: 0, row: startRow },
                            br: { col: 10.9, row: endRow }
                        });

                        // Etiqueta abajo
                        sheet.mergeCells(`A${endRow + 1}:Q${endRow + 1}`);
                        const labelCell = sheet.getCell(`A${endRow + 1}`);
                        labelCell.value = `Fig: ${imgMeta.nombre_archivo} (${formatearFecha(imgMeta.fecha_subida)})`;
                        labelCell.alignment = { horizontal: 'center', vertical: 'top' };
                        labelCell.font = { italic: true, size: 9 };

                        currentRow = endRow + 3; // Espacio para la siguiente imagen
                    } catch (error) {
                        console.error('Error incrustando imagen en Excel (TPA):', error);
                        // sheet.getCell(`A${currentRow}`).value = `Error al cargar imagen: ${imgMeta.nombre_archivo}`; // Silent fail
                        // currentRow += 2; // Do not advance row if failed
                    }
                }
            }
        }

        sheet.pageSetup.printArea = `A1:Q${currentRow}`;

        return await workbook.xlsx.writeBuffer();
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

module.exports = ExcelTPAService;
