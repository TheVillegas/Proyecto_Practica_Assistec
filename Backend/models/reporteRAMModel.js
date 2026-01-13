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
        // 1. Obtener la cabecera con joins para nombres
        const sql = `
            SELECT 
                r.*, 
                e.nombre_equipo as nombre_equipo_incubacion,
                ua.nombre_apellido_analista as nombre_analista_analisis,
                ui.nombre_apellido_analista as nombre_analista_incubacion,
                mta.nombre_analisis as nombre_analisis_dupli
            FROM RAM_REPORTE r
            LEFT JOIN EQUIPOS_INCUBACION e ON r.id_equipo_incubacion = e.id_incubacion
            LEFT JOIN USUARIOS ua ON r.id_responsable_analisis = ua.rut_analista
            LEFT JOIN USUARIOS ui ON r.id_responsable_incubacion = ui.rut_analista
            LEFT JOIN MAESTRO_TIPOS_ANALISIS mta ON r.id_analisis_dupli = mta.id_tipo_analisis
            WHERE r.codigo_ali = :codigo_ali
        `;
        const result = await db.execute(sql, { codigo_ali: codigoALI });

        if (result.rows.length === 0) return null;

        const r = result.rows[0];

        // 2. Obtener Etapa 3 - Muestras
        const sqlMuestras = `SELECT * FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali ORDER BY numero_muestra`;
        const resultMuestras = await db.execute(sqlMuestras, { codigo_ali: codigoALI });

        // 3. Obtener Etapa 3 - Duplicado
        const sqlDup = `SELECT * FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali`;
        const resultDup = await db.execute(sqlDup, { codigo_ali: codigoALI });
        const dupResult = resultDup.rows;

        // 4. Obtener Formas de Cálculo con Nombre
        const sqlFormas = `
            SELECT rfc.id_forma, rfc.seleccionado, mfc.nombre_forma
            FROM RAM_FORMAS_CALCULO rfc
            LEFT JOIN MAESTRO_FORMAS_CALCULO mfc ON rfc.id_forma = mfc.id_forma
            WHERE rfc.codigo_ali = :codigo_ali
        `;
        const resultFormas = await db.execute(sqlFormas, { codigo_ali: codigoALI });
        const formasCalculo = resultFormas.rows.map(f => ({
            id: f.ID_FORMA,
            nombre: f.NOMBRE_FORMA,
            seleccionado: f.SELECCIONADO === 1
        }));

        // 5. Procesar Firma (Buffer -> Base64 String)
        let firmaBase64 = null;
        if (r.FIRMA_COORDINADOR) {
            if (Buffer.isBuffer(r.FIRMA_COORDINADOR)) {
                firmaBase64 = `data:image/png;base64,${r.FIRMA_COORDINADOR.toString('base64')}`;
            } else {
                firmaBase64 = r.FIRMA_COORDINADOR; // Fallback si ya es string
            }
        }

        // Mapeo directo de columnas DB a JSON
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
                nombre_equipo_incubacion: r.NOMBRE_EQUIPO_INCUBACION, // Nombre desde JOIN
                equipoIncubacion: r.ID_EQUIPO_INCUBACION,
                nMuestra10gr: r.N_MUESTRA_10GR,
                nMuestra50gr: r.N_MUESTRA_50GR,
                horaInicioHomogenizado: r.HORA_INICIO_HOMOGENIZADO,
                horaTerminoSiembra: r.HORA_TERMINO_SIEMBRA
            },

            etapa2: {
                responsableAnalisis: r.NOMBRE_ANALISTA_ANALISIS, // Nombre desde JOIN
                responsableIncubacion: r.NOMBRE_ANALISTA_INCUBACION, // Nombre desde JOIN
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
                controlAmbientalPesado: r.TEMPERATURA_AMBIENTAL_PESADO,
                ufc: r.UFC_CONTROL_PESADO
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
                analisis: r.ID_ANALISIS_DUPLI, // ID del análisis (Para selects)
                nombreAnalisis: r.NOMBRE_ANALISIS_DUPLI, // Nombre para mostrar texto
                controlBlanco: r.CONTROL_BLANCO_VAL,
                controlBlancoEstado: r.CONTROL_BLANCO_ESTADO,
                controlSiembra: r.CONTROL_SIEMBRA_VAL,
                controlSiembraEstado: r.CONTROL_SIEMBRA_ESTADO,
                duplicadoAli: r.DUPLICADO_ALI_VAL,
                duplicadoEstado: r.DUPLICADO_ESTADO
            },

            etapa7: {
                observacionesFinales: r.OBSERVACIONES_FINALES,
                formasCalculo: formasCalculo,
                firmaCoordinador: firmaBase64,
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

        if (datos.etapa2) {
            console.log("Procesando Etapa 2 para RAM...");
            const e2 = datos.etapa2;
            let rutAnalista = null;
            let rutIncubacion = null;

            // Validación flexible: solo buscamos si el campo trae datos
            if (e2.responsableAnalisis && e2.responsableAnalisis.trim() !== "") {
                const res = await connection.execute(
                    `SELECT rut_analista FROM USUARIOS WHERE nombre_apellido_analista = :nombre`,
                    { nombre: e2.responsableAnalisis }
                );
                if (res.rows.length === 0) {
                    throw new Error(`El responsable de análisis '${e2.responsableAnalisis}' no existe en el sistema.`);
                }
                rutAnalista = res.rows[0].RUT_ANALISTA;
            }

            if (e2.responsableIncubacion && e2.responsableIncubacion.trim() !== "") {
                const res = await connection.execute(
                    `SELECT rut_analista FROM USUARIOS WHERE nombre_apellido_analista = :nombre`,
                    { nombre: e2.responsableIncubacion }
                );
                if (res.rows.length === 0) {
                    throw new Error(`El responsable de incubación '${e2.responsableIncubacion}' no existe en el sistema.`);
                }
                rutIncubacion = res.rows[0].RUT_ANALISTA;
            }

            if (e2.micropipetaUtilizada && e2.micropipetaUtilizada.trim() !== "") {
                const micropipeta = await connection.execute(
                    `SELECT id_pipeta FROM MICROPIPETAS WHERE nombre_pipeta = :nombre`,
                    { nombre: e2.micropipetaUtilizada }
                );
                if (micropipeta.rows.length === 0) {
                    throw new Error(`La micropipeta '${e2.micropipetaUtilizada}' no existe en el sistema.`);
                }
            }

            const sqlEtapa2 = `
                UPDATE RAM_REPORTE
                SET id_responsable_analisis = NVL(:rutA, id_responsable_analisis),
                    id_responsable_incubacion = NVL(:rutI, id_responsable_incubacion),
                    fecha_inicio_incubacion = TO_DATE(:fechaI, 'YYYY-MM-DD'),
                    fecha_fin_incubacion = TO_DATE(:fechaF, 'YYYY-MM-DD'),
                    hora_inicio_incubacion = :horaI,
                    hora_fin_incubacion = :horaF,
                    micropipeta_utilizada = :micro
                WHERE codigo_ali = :codigo_ali
            `;

            await connection.execute(sqlEtapa2, {
                rutA: rutAnalista,
                rutI: rutIncubacion,
                fechaI: e2.fechaInicioIncubacion || null,
                fechaF: e2.fechaFinIncubacion || null,
                horaI: e2.horaInicioIncubacion || null,
                horaF: e2.horaFinIncubacion || null,
                micro: e2.micropipetaUtilizada || null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // --- ETAPA 3: MUESTRAS (Compleja - Función Auxiliar) ---
        if (datos.etapa3_repeticiones && Array.isArray(datos.etapa3_repeticiones)) {
            console.log("Procesando Etapa 3 (Muestras)...");
            await ReporteRAM.procesarEtapa3RAM(connection, datos.codigo_ali || datos.codigoALI, datos.etapa3_repeticiones);
        }

        // --- ETAPA 4: LECTURA ---
        if (datos.etapa4) {
            console.log("Procesando Etapa 4 (Lectura)...");
            const e4 = datos.etapa4;
            const sqlEtapa4 = `
                UPDATE RAM_REPORTE
                SET hora_inicio_lectura = :horaInicio,
                    hora_fin_lectura = :horaFin,
                    temperatura = :temp,
                    blanco_ufc = :blanco,
                    control_ufc = :control,
                    control_siembra_ecoli = :controlEcoli,
                    temperatura_ambiental_pesado = :ambiental,
                    ufc_control_pesado = :ufc
                WHERE codigo_ali = :codigo_ali
            `;
            await connection.execute(sqlEtapa4, {
                horaInicio: e4.horaInicio ?? null,
                horaFin: e4.horaFin ?? null,
                temp: e4.temperatura ?? null,
                blanco: e4.blancoUfc ?? null,
                control: e4.controlUfc ?? null,
                controlEcoli: e4.controlSiembraEcoli ?? null,
                ambiental: e4.controlAmbientalPesado ?? null,
                ufc: e4.ufc ?? null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // --- ETAPA 5: VERIFICACIÓN ---
        if (datos.etapa5) {
            console.log("Procesando Etapa 5 (Verificación)...");
            const e5 = datos.etapa5;
            const sqlEtapa5 = `
                UPDATE RAM_REPORTE
                SET desfavorable = :desf,
                    mercado = :merc,
                    tabla_pagina = :tabla,
                    limite = :lim,
                    fecha_entrega = TO_DATE(:fechaE, 'YYYY-MM-DD'),
                    hora_entrega = :horaE
                WHERE codigo_ali = :codigo_ali
            `;
            await connection.execute(sqlEtapa5, {
                desf: e5.desfavorable ?? null,
                merc: e5.mercado ?? null,
                tabla: e5.tablaPagina ?? null,
                lim: e5.limite ?? null,
                fechaE: e5.fechaEntrega ?? null,
                horaE: e5.horaEntrega ?? null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // --- ETAPA 6: ASEGURAMIENTO ---
        if (datos.etapa6) {
            console.log("Procesando Etapa 6 (Aseguramiento)...");
            const e6 = datos.etapa6;

            if (e6.analisis !== null && e6.analisis !== undefined) {
                const analisisValid = await connection.execute(sqlValid = `SELECT id_tipo_analisis FROM MAESTRO_TIPOS_ANALISIS WHERE id_tipo_analisis = :analisis`, { analisis: e6.analisis });
                if (analisisValid.rows.length === 0) {
                    throw new Error(`El analisis '${e6.analisis}' no existe en el sistema.`);
                }
            }
            const sqlEtapa6 = `
                UPDATE RAM_REPORTE
                SET duplicado_ali_val = :dupVal,
                    duplicado_estado = :dupEst,
                    id_analisis_dupli = :analisis,
                    control_blanco_val = :cbVal,
                    control_blanco_estado = :cbEst,
                    control_siembra_val = :csVal,
                    control_siembra_estado = :csEst
                WHERE codigo_ali = :codigo_ali
            `;
            await connection.execute(sqlEtapa6, {
                analisis: e6.analisis ?? null,
                cbVal: e6.controlBlanco ?? null,
                cbEst: e6.controlBlancoEstado ?? null,
                csVal: e6.controlSiembra ?? null,
                csEst: e6.controlSiembraEstado ?? null,
                dupVal: e6.duplicadoAli ?? null,
                dupEst: e6.duplicadoEstado ?? null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // --- ETAPA 7: CIERRE ---
        if (datos.etapa7) {
            //Falta implementar la firma
            console.log("Procesando Etapa 7 (Cierre)...");
            const e7 = datos.etapa7;
            const sqlEtapa7 = `
                UPDATE RAM_REPORTE
                SET observaciones_finales = :obsFinal,
                    firma_coordinador = :firma,
                    observaciones_generales_analista_ram = :obsAnalista
                WHERE codigo_ali = :codigo_ali
            `;
            await connection.execute(sqlEtapa7, {
                obsFinal: e7.observacionesFinales || null,
                firma: e7.firmaCoordinador || null,
                obsAnalista: e7.observaciones_finales_analistas || null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });

            // Procesar Formas de Cálculo (Checklist)
            if (e7.formasCalculo && Array.isArray(e7.formasCalculo)) {
                console.log("Procesando Formas de Cálculo...");

                // 1. Limpiar registros previos
                await connection.execute(
                    `DELETE FROM RAM_FORMAS_CALCULO WHERE codigo_ali = :codigo`,
                    { codigo: datos.codigo_ali || datos.codigoALI }
                );

                // 2. Insertar nuevos registros
                const sqlInsertForma = `
                    INSERT INTO RAM_FORMAS_CALCULO (codigo_ali, id_forma, seleccionado)
                    VALUES (:codigo, :idForma, :seleccionado)
                `;

                for (const forma of e7.formasCalculo) {
                    await connection.execute(sqlInsertForma, {
                        codigo: datos.codigo_ali || datos.codigoALI,
                        idForma: forma.id,
                        seleccionado: forma.seleccionado ? 1 : 0
                    });
                }
            }
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

ReporteRAM.procesarEtapa3RAM = async (connection, codigoALI, muestras) => {
    // 1. Limpiar datos previos (Delete Cascade manual si no está configurado en BD)
    // Primero duplicados (Hija)
    const sqlDelDup = `DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali`;
    await connection.execute(sqlDelDup, { codigo_ali: codigoALI });

    // Segundo muestras (Padre de duplicados)
    const sqlDelMuestras = `DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali`;
    await connection.execute(sqlDelMuestras, { codigo_ali: codigoALI });

    // 2. Insertar nuevas muestras
    const sqlInsertMuestra = `
        INSERT INTO RAM_ETAPA3_MUESTRAS (
            CODIGO_ALI, NUMERO_MUESTRA, DISOLUCION_1, DIL_1, 
            DISOLUCION_2, DIL_2, C1, C2, C3, C4
        ) VALUES (
            :codigo, :num, :dis1, :dil1,
            :dis2, :dil2, :c1, :c2, :c3, :c4
        ) returning ID_MUESTRA into :id_muestra_out
    `;

    const sqlInsertDup = `
        INSERT INTO RAM_ETAPA3_DUPLICADO (
            CODIGO_ALI, ID_MUESTRA_ORIGINAL, 
            DISOLUCION_DUP_1, DIL_DUP_1, DISOLUCION_DUP_2, DIL_DUP_2,
            C_DUP_1, C_DUP_2, C_DUP_3, C_DUP_4
        ) VALUES (
            :codigo, :id_orig,
            :dis1, :dil1, :dis2, :dil2,
            :c1, :c2, :c3, :c4
        )
    `;

    for (const m of muestras) {
        // Insertar Muestra
        // NOTA DE CAMBIO: dis1/dis2 ahora se usan para guardar 'suspension_inicial' y 'volumen' si es necesario, 
        // o asumimos que disolucion_1/2 en BD se reutilizan para estos nuevos conceptos.
        const resultMuestra = await connection.execute(sqlInsertMuestra, {
            codigo: codigoALI,
            num: m.numeroMuestra,
            dis1: m.suspensionInicial || m.suspension_inicial || null, // Antes disolucion_1
            dil1: m.dil || m.dil_1 || null,
            dis2: m.volumen || m.volumen_concentrado || null,          // Antes disolucion_2 (Reutilizada para volumen)
            dil2: m.dil2 || m.dil_2 || null,
            c1: m.numeroColonias ? m.numeroColonias[0] : null,
            c2: m.numeroColonias ? m.numeroColonias[1] : null,
            c3: m.numeroColonias ? m.numeroColonias[2] : null,
            c4: m.numeroColonias ? m.numeroColonias[3] : null,
            id_muestra_out: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
        });

        const idMuestraGenerado = resultMuestra.outBinds.id_muestra_out[0];

        // Insertar Duplicado si existe
        if (m.duplicado) {
            await connection.execute(sqlInsertDup, {
                codigo: codigoALI,
                id_orig: idMuestraGenerado,
                dis1: m.duplicado.suspensionInicial || m.duplicado.suspension_inicial || null,
                dil1: m.duplicado.dil01 || m.duplicado.dil_1 || m.duplicado.dil || null,
                dis2: m.duplicado.volumen || m.duplicado.volumen_concentrado || null,
                dil2: m.duplicado.dil02 || m.duplicado.dil_2 || m.duplicado.dil2 || null,
                c1: m.duplicado.numeroColonias ? m.duplicado.numeroColonias[0] : null,
                c2: m.duplicado.numeroColonias ? m.duplicado.numeroColonias[1] : null,
                c3: m.duplicado.numeroColonias ? m.duplicado.numeroColonias[2] : null,
                c4: m.duplicado.numeroColonias ? m.duplicado.numeroColonias[3] : null
            });
        }
    }
};

// --- FUNCIONES AUXILIARES DE CÁLCULO ---
/**
 * Calcula el resultado UFC basado en los conteos de colonias y diluciones.
 * Fórmula Estándar ISO 7218: N = Suma(C) / (V * (n1 + 0.1*n2) * d)
 * Donde:
 * - Suma(C): Suma de colonias en todas las placas contadas.
 * - V: Volumen inoculado (usualmente 1ml).
 * - n1: Número de placas en la primera dilución retenida.
 * - n2: Número de placas en la segunda dilución retenida.
 * - d: Factor de dilución de la primera dilución retenida.
 */
ReporteRAM.calcularUFC = (muestras) => {
    try {
        return ReporteRAM.calcularItemIndividual(muestras);
    } catch (error) {
        console.error("Error al calcular UFC:", error);
        return { ufc: 0 };
    }
};

/**
 * Función interna para calcular y formatear un set de muestras/duplicados
 */
ReporteRAM.calcularItemIndividual = (muestras) => {
    const resultados = [];

    for (const m of muestras) {
        // Obtenemos el exponente principal para el cálculo (preferencia: dil > disolucion)
        const dilucionInput = m.dil || m.dil_1;
        const volumenInput = m.volumen || m.volumen_concentrado || 1; // Default 1 ml

        const resMuestra = ReporteRAM.calcularFormulaISO(m.numeroColonias, dilucionInput, volumenInput);

        let resDuplicado = null;
        if (m.duplicado) {
            const dilDup = m.duplicado.dil || m.duplicado.dil01 || m.duplicado.dil_1;
            const volDup = m.duplicado.volumen || m.duplicado.volumen_concentrado || 1;

            resDuplicado = ReporteRAM.calcularFormulaISO(
                m.duplicado.numeroColonias,
                dilDup,
                volDup
            );
        }

        resultados.push({
            numeroMuestra: m.numeroMuestra,
            muestra: {
                valor: resMuestra,
                resultadoRAM: ReporteRAM.formatoCientifico(resMuestra),
                resultadoRPES: Math.round(resMuestra)
            },
            duplicado: resDuplicado !== null ? {
                valor: resDuplicado,
                resultadoRAM: ReporteRAM.formatoCientifico(resDuplicado),
                resultadoRPES: Math.round(resDuplicado)
            } : null,
            // Valor consolidado para guardar en etapa4 (UFC final) - Usamos muestra 1 por defecto o promedio?
            // Por ahora devolvemos la muestra 1 como principal para compatibilidad
            ufc: Math.round(resMuestra)
        });
    }
    // Si solo hay 1 muestra, devolvemos objeto plano con propiedad ufc para compatibilidad, 
    // pero también el detalle 'resultados' para el frontend.
    return {
        ufc: resultados.length > 0 ? resultados[0].muestra.resultadoRPES : 0,
        detalle: resultados
    };
};

ReporteRAM.calcularFormulaISO = (colonias, dilucionInput, volumenInput = 1) => {
    if (!colonias || colonias.length === 0) return 0;

    let sumaColonias = 0;
    let n1 = 0;
    let n2 = 0;

    // Placas 1 y 2 (Dilución 1)
    if (colonias[0] !== null && colonias[0] !== undefined) { sumaColonias += colonias[0]; n1++; }
    if (colonias[1] !== null && colonias[1] !== undefined) { sumaColonias += colonias[1]; n1++; }

    // Placas 3 y 4 (Dilución 2)
    if (colonias[2] !== null && colonias[2] !== undefined) { sumaColonias += colonias[2]; n2++; }
    if (colonias[3] !== null && colonias[3] !== undefined) { sumaColonias += colonias[3]; n2++; }

    if ((n1 + n2) === 0) return 0;

    const d = parseFloat(dilucionInput || -1); // Default -1 si no hay dilución
    const v = parseFloat(volumenInput);
    const factorDilucion = Math.pow(10, d);

    // Fórmula: SumaC / (V * (n1 + 0.1*n2) * d)
    const denominador = v * (n1 + (0.1 * n2)) * factorDilucion;
    if (denominador === 0) return 0;

    return sumaColonias / denominador;
};

ReporteRAM.formatoCientifico = (valor) => {
    if (!valor || valor === 0) return "0";
    const exp = valor.toExponential(1); // "1.5e+1"
    const [base, exponente] = exp.split('e');
    const expNum = parseInt(exponente, 10);
    // Cambiar punto por coma y formato " * 10^"
    return `${base.replace('.', ',')} * 10^${expNum}`;
};

module.exports = ReporteRAM;