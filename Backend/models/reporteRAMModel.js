const db = require('../config/DB.js');
// const oracledb = require('oracledb'); // Descomentar si necesitamos tipos específicos

const ReporteRAM = {};

/**
 * Crea el registro inicial del reporte RAM (Estado: NO_REALIZADO)
 * Se llama automáticamente cuando se crea una Muestra ALI.
 * @param {number} codigoALI
 * @param {object} connection - Conexión transaccional compartida
 */
ReporteRAM.crearReporteRAMInicial = async (codigoALI, connection) => {
    try {
        console.log(`Inicializando Reporte RAM para ALI: ${codigoALI}`);

        // RAM_REPORTE es una tabla plana, así que solo insertamos el ID y defaults
        const sql = `
            INSERT INTO RAM_REPORTE (
                codigo_ali, 
                estado_ram
            ) VALUES (
                :ali, 
                'NO_REALIZADO'
            )
        `;

        await connection.execute(sql, { ali: codigoALI });

    } catch (error) {
        console.error(`Error al crear reporte RAM inicial para ${codigoALI}:`, error);
        throw error; // Lanzamos el error para que MuestraALI haga rollback
    }
};

ReporteRAM.obtenerEstadoRAM = async (codigoALI) => {
    try {
        const sql = `
            SELECT 
                codigo_ali,
                estado_ram
            FROM RAM_REPORTE
            WHERE codigo_ali = :codigo_ali
        `;

        const result = await db.execute(sql, { codigo_ali: codigoALI });

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].ESTADO_RAM;
    } catch (error) {
        console.error(`Error al obtener estado reporte RAM para ${codigoALI}:`, error);
        throw error;
    }
};

ReporteRAM.obtenerReporteRAM = async (codigoALI) => {
    try {
        // 1. Obtener la cabecera con join para el nombre del equipo
        const sql = `
            SELECT r.*, e.nombre_equipo as nombre_equipo_incubacion
            FROM RAM_REPORTE r
            LEFT JOIN EQUIPOS_INCUBACION e ON r.id_equipo_incubacion = e.id_incubacion
            WHERE r.codigo_ali = :codigo_ali
        `;
        const result = await db.execute(sql, { codigo_ali: codigoALI });

        if (result.rows.length === 0) return null;

        const r = result.rows[0]; // Alias corto

        // 2. Obtener Etapa 3 - Muestras
        const sqlMuestras = `SELECT * FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali ORDER BY numero_muestra`;
        const resultMuestras = await db.execute(sqlMuestras, { codigo_ali: codigoALI });

        // 3. Obtener Etapa 3 - Duplicado
        const sqlDup = `SELECT * FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali`;
        const resultDup = await db.execute(sqlDup, { codigo_ali: codigoALI });
        const dupResult = resultDup.rows;

        // Mapeo directo de columnas DB a JSON (Sincronizado con estructura del frontend)
        const muestras = resultMuestras.rows.map(m => {
            const dup = dupResult.find(d => d.ID_MUESTRA_ORIGINAL === m.ID_MUESTRA);

            return {
                numeroMuestra: m.NUMERO_MUESTRA,
                disolucion: m.DISOLUCION_1,
                dil: m.DIL_1,
                disolucion2: m.DISOLUCION_2,
                dil2: m.DIL_2,
                numeroColonias: [m.C1, m.C2, m.C3, m.C4].filter(c => c !== null),
                duplicado: dup ? {
                    codigoALI: dup.CODIGO_ALI,
                    disolucion01: dup.DISOLUCION_DUP_1,
                    dil01: dup.DIL_DUP_1,
                    disolucion02: dup.DISOLUCION_DUP_2,
                    dil02: dup.DIL_DUP_2,
                    numeroColonias: [dup.C_DUP_1, dup.C_DUP_2, dup.C_DUP_3, dup.C_DUP_4].filter(c => c !== null)
                } : null
            };
        });

        return {
            codigoALI: r.CODIGO_ALI,
            estado: r.ESTADO_RAM,

            etapa1: {
                agarPlateCount: r.AGAR_PLATE_COUNT,
                nombre_equipo_incubacion: r.NOMBRE_EQUIPO_INCUBACION,
                equipoIncubacion: r.ID_EQUIPO_INCUBACION, // Mantenemos el ID por compatibilidad
                nMuestra10gr: r.N_MUESTRA_10GR,
                nMuestra50gr: r.N_MUESTRA_50GR,
                horaInicioHomogenizado: r.HORA_INICIO_HOMOGENIZADO,
                horaTerminoSiembra: r.HORA_TERMINO_SIEMBRA
            },

            etapa2: {
                responsableAnalisis: r.ID_RESPONSABLE_ANALISIS,
                responsableIncubacion: r.NOMBRE_RESPONSABLE_INCUBACION,
                fechaInicioIncubacion: r.FECHA_INICIO_INCUBACION,
                fechaFinIncubacion: r.FECHA_FIN_INCUBACION,
                horaInicioIncubacion: r.HORA_INICIO_INCUBACION,
                horaFinIncubacion: r.HORA_FIN_INCUBACION,
                micropipetaUtilizada: r.MICROPIPETA_UTILIZADA
            },

            etapa3_repeticiones: muestras,

            etapa4: {
                horaInicio: r.HORA_INICIO_LECTURA,
                horaFin: r.HORA_FIN_LECTURA,
                temperatura: r.TEMPERATURA,
                blancoUfc: r.BLANCO_UFC,
                controlUfc: r.CONTROL_UFC,
                controlSiembraEcoli: r.CONTROL_SIEMBRA_ECOLI,
                controlAmbientalPesado: r.CONTROL_AMBIENTAL_PESADO,
                ufc: r.UFC_FINAL_REPORTE
            },

            etapa5: {
                desfavorable: r.DESFAVORABLE,
                mercado: r.MERCADO,
                tablaPagina: r.TABLA_PAGINA,
                limite: r.LIMITE,
                fechaEntrega: r.FECHA_ENTREGA,
                horaEntrega: r.HORA_ENTREGA
            },

            etapa6: {
                analisis: r.ANALISIS_NOMBRE,
                controlBlanco: r.CONTROL_BLANCO_VAL,
                controlBlancoEstado: r.CONTROL_BLANCO_ESTADO,
                controlSiembra: r.CONTROL_SIEMBRA_VAL,
                controlSiembraEstado: r.CONTROL_SIEMBRA_ESTADO,
                duplicadoAli: r.DUPLICADO_ALI_VAL,
                duplicadoEstado: r.DUPLICADO_ESTADO
            },

            etapa7: {
                observacionesFinales: r.OBSERVACIONES_FINALES,
                formaCalculo: null, // No mapeado en DB aún
                firmaCoordinador: r.FIRMA_COORDINADOR,
                observaciones_finales_analistas: r.OBSERVACIONES_GENERALES_ANALISTA_RAM
            }

        };

    } catch (error) {
        console.error(`Error al obtener reporte RAM para ${codigoALI}:`, error);
        throw error;
    }
};

ReporteRAM.guardarReporteRAM = async (datos) => {
    let connection;
    try {
        connection = await db.getConnection();

        // 1. Crear SAVEPOINT para transaccionalidad
        await connection.execute('SAVEPOINT inicio_guardado');

        // 2. Actualizar Estado (Obligatorio si viene en el JSON)
        const sqlEstado = `UPDATE RAM_REPORTE
                           SET estado_ram = :estado
                           WHERE codigo_ali = :codigo_ali`;

        const resultEstado = await connection.execute(sqlEstado, {
            estado: datos.estado,
            codigo_ali: datos.codigo_ali || datos.codigoALI
        });

        if (resultEstado.rowsAffected === 0) {
            throw new Error('No se encontró el reporte RAM para actualizar');
        }

        // 3. Procesar Etapa 1 (Opcional)
        if (datos.etapa1) {
            console.log("Procesando Etapa 1 para RAM...");

            // Búsqueda flexible (insensible a mayúsculas)
            const equipoValid = await connection.execute(`
                SELECT id_incubacion
                FROM EQUIPOS_INCUBACION
                WHERE UPPER(nombre_equipo) = UPPER(:equipo_incubacion)
            `, {
                equipo_incubacion: datos.etapa1.nombre_equipo_incubacion || ''
            });

            if (equipoValid.rows.length === 0) {
                throw new Error(`El equipo '${datos.etapa1.nombre_equipo_incubacion}' no existe en el catálogo.`);
            }

            const sqlEtapa1 = `
                UPDATE RAM_REPORTE
                SET agar_plate_count = :agar_plate_count,
                    id_equipo_incubacion = :equipo_incubacion,
                    n_muestra_10gr = :n_muestra_10gr,
                    n_muestra_50gr = :n_muestra_50gr,
                    hora_inicio_homogenizado = :hora_inicio_homogenizado,
                    hora_termino_siembra = :hora_termino_siembra
                WHERE codigo_ali = :codigo_ali
            `;

            await connection.execute(sqlEtapa1, {
                agar_plate_count: datos.etapa1.agar_plate_count || null,
                equipo_incubacion: equipoValid.rows[0].ID_INCUBACION,
                n_muestra_10gr: datos.etapa1.n_muestra_10gr || null,
                n_muestra_50gr: datos.etapa1.n_muestra_50gr || null,
                hora_inicio_homogenizado: datos.etapa1.hora_inicio_homogenizado || null,
                hora_termino_siembra: datos.etapa1.hora_termino_siembra || null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // 4. Finalización exitosa
        await connection.commit();
        return { success: true, mensaje: "Reporte RAM guardado exitosamente" };

    } catch (error) {
        if (connection) {
            try {
                console.log("Ejecutando Rollback debido a error...");
                await connection.execute('ROLLBACK TO SAVEPOINT inicio_guardado');
            } catch (rbError) {
                console.error('Error al hacer rollback:', rbError);
            }
        }
        console.error('Error al guardar reporte RAM:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error('Error al cerrar conexión:', error);
            }
        }
    }
};

module.exports = ReporteRAM;