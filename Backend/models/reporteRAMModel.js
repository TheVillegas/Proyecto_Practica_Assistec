const db = require('../config/DB.js');

const ReporteRAM = {};

// Constantes ISO 7218
const MIN_CONTABLE = 25;
const MAX_CONTABLE = 250;
const AREA_PLACA = 57; // cm²
const LIMITE_SATURACION = 100; // ufc/cm²
const UMBRAL_MNPC = AREA_PLACA * LIMITE_SATURACION; // 5700

/**
 * Crea un reporte RAM inicial
 * @param {string} codigoALI 
 * @param {object} client - Cliente transaccional (opcional)
 */
ReporteRAM.crearReporteRAMInicial = async (codigoALI, client = null) => {
    try {
        const sql = 'INSERT INTO RAM_REPORTE (codigo_ali, estado_ram) VALUES ($1, $2)';
        const values = [codigoALI, 'NO_REALIZADO'];

        if (client) {
            return await client.query(sql, values);
        } else {
            return await db.execute(sql, values);
        }
    } catch (err) {
        console.error(`[ReporteRAM] Error creando reporte inicial para ALI ${codigoALI}:`, err);
        throw err;
    }
};

/**
 * Obtiene el estado actual del reporte RAM
 * @param {string} codigoALI
 */
ReporteRAM.obtenerEstadoRAM = async (codigoALI) => {
    try {
        const sql = 'SELECT estado_ram FROM RAM_REPORTE WHERE codigo_ali = $1';
        const result = await db.execute(sql, [codigoALI]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].estado_ram;
    } catch (err) {
        console.error("Error obteniendo estado RAM:", err);
        throw err;
    }
};

/**
 * Obtiene el reporte RAM completo, uniendo todas las tablas modulares
 */
ReporteRAM.obtenerReporteRAM = async (codigoALI) => {
    let client;
    try {
        client = await db.getConnection();

        // Query principal con JOINs a las nuevas tablas
        const sql = `
            SELECT 
                r.codigo_ali,
                r.estado_ram,
                r.ufc_final_reporte,
                r.fecha_ultima_modificacion,
                r.usuario_ultima_modificacion,
                
                -- Etapa 1: Siembra
                e1.agar_plate_count,
                e1.id_equipo_incubacion as id_equipo_siembra,
                e1.n_muestra_10gr,
                e1.n_muestra_50gr,
                e1.hora_inicio_homogenizado,
                e1.hora_termino_siembra,
                e1.micropipeta_utilizada,

                -- Etapa 2: Incubación
                e2.id_responsable_analisis,
                e2.id_responsable_incubacion,
                e2.fecha_inicio_incubacion,
                e2.hora_inicio_incubacion,
                e2.fecha_fin_incubacion,
                e2.hora_fin_incubacion,
                
                -- Etapa 4: Lectura (Antes Resultados)
                e4.temperatura as temperatura_ambiental,
                e4.blanco_ufc,
                e4.control_ufc, -- Verifica si es este o ufc_control_ambiental
                e4.control_siembra_ecoli,
                e4.ufc_control_pesado,
                e4.hora_inicio_lectura,
                e4.hora_fin_lectura,
                e4.control_ambiental_pesado,

                -- Etapa 5: Verificación (Antes Revisión)
                e5.limite,
                e5.mercado,
                e5.fecha_entrega,
                e5.hora_entrega,
                e5.tabla_pagina,
                e5.desfavorable,
                e5.manual_inocuidad,

                -- Etapa 6: Aseguramiento (Nuevo)
                e6.id_analisis_dupli,
                e6.control_blanco_val,
                e6.control_blanco_estado,
                e6.control_siembra_val,
                e6.control_siembra_estado,
                e6.duplicado_ali_val,
                e6.duplicado_estado,

                -- Etapa 7: Cierre
                e7c.observaciones_finales,
                e7c.observaciones_generales_analista_ram,
                r.firma_coordinador,

                -- Nombres descriptivos (Joins)
                u_mod.nombre_apellido_analista as nombre_usuario_modificacion,
                u_ana.nombre_apellido_analista as nombre_responsable_analisis,
                u_inc.nombre_apellido_analista as nombre_responsable_incubacion

            FROM RAM_REPORTE r
            LEFT JOIN RAM_ETAPA1_SIEMBRA e1 ON r.codigo_ali = e1.codigo_ali
            LEFT JOIN RAM_ETAPA2_INCUBACION e2 ON r.codigo_ali = e2.codigo_ali
            LEFT JOIN RAM_ETAPA4_LECTURA e4 ON r.codigo_ali = e4.codigo_ali
            LEFT JOIN RAM_ETAPA5_VERIFICACION e5 ON r.codigo_ali = e5.codigo_ali
            LEFT JOIN RAM_ETAPA6_ASEGURAMIENTO e6 ON r.codigo_ali = e6.codigo_ali
            LEFT JOIN RAM_ETAPA7_CIERRE e7c ON r.codigo_ali = e7c.codigo_ali
            LEFT JOIN USUARIOS u_mod ON r.usuario_ultima_modificacion = u_mod.rut_analista
            LEFT JOIN USUARIOS u_ana ON e2.id_responsable_analisis = u_ana.rut_analista
            LEFT JOIN USUARIOS u_inc ON e2.id_responsable_incubacion = u_inc.rut_analista

            WHERE r.codigo_ali = $1
        `;

        const result = await client.query(sql, [codigoALI]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        // Obtener Muestras (Etapa 3)
        const sqlMuestras = `
            SELECT * FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = $1 ORDER BY numero_muestra
        `;
        const resMuestras = await client.query(sqlMuestras, [codigoALI]);

        // Construir array de repeticiones estructurado (Nested) para el Adapter
        const muestras = await Promise.all(resMuestras.rows.map(async (m) => {
            // Buscar duplicado asociado
            const sqlDupli = `SELECT * FROM RAM_ETAPA3_DUPLICADO WHERE id_muestra_original = $1`;
            const resDupli = await client.query(sqlDupli, [m.id_muestra]);
            const duplicado = resDupli.rows.length > 0 ? resDupli.rows[0] : null;

            // Reconstruir estructura nested "diluciones" que espera el Adapter/Frontend
            const diluciones = [];

            // Dilución 1
            if (m.dil_1 !== null && m.dil_1 !== undefined) {
                diluciones.push({
                    dil: Number(m.dil_1),
                    colonias: [m.c1, m.c2]
                });
            }
            // Dilución 2
            if (m.dil_2 !== null && m.dil_2 !== undefined) {
                diluciones.push({
                    dil: Number(m.dil_2),
                    colonias: [m.c3, m.c4]
                });
            }

            // Reconstruir objeto duplicado nested
            let duplicadoObj = null;
            if (duplicado) {
                duplicadoObj = {
                    codigoALI: duplicado.codigo_ali,
                    dil01: duplicado.dil_dup_1 ? Number(duplicado.dil_dup_1) : null,
                    dil02: duplicado.dil_dup_2 ? Number(duplicado.dil_dup_2) : null,
                    numeroColonias: [
                        duplicado.c_dup_1, duplicado.c_dup_2,
                        duplicado.c_dup_3, duplicado.c_dup_4
                    ],
                    resultado_ram: duplicado.resultado_ram_dup,
                    resultado_rpes: duplicado.resultado_rpes_dup,
                    promedio: duplicado.promedio_colonias_duplicado,
                    sumaColonias: duplicado.sumatoria_colonias_duplicado,
                    n1: duplicado.n1_duplicado,
                    n2: duplicado.n2_duplicado,
                    factorDilucion: duplicado.factor_dilucion ? Number(duplicado.factor_dilucion) : null
                };
            }

            return {
                numero_Muestra: m.numero_muestra,
                diluciones: diluciones,
                resultado_ram: m.resultado_ram,
                resultado_rpes: m.resultado_rpes,
                promedio: m.promedio_colonias,
                sumaColonias: m.sumatoria_colonias,
                n1: m.n1,
                n2: m.n2,
                n1: m.n1,
                n2: m.n2,
                factorDilucion: m.factor_dilucion ? Number(m.factor_dilucion) : null,
                duplicado: duplicadoObj
            };
        }));

        // Armar objeto de respuesta final
        return {
            codigoALI: row.codigo_ali,
            estado: row.estado_ram,
            fechaUltimaModificacion: row.fecha_ultima_modificacion,
            usuarioUltimaModificacion: row.nombre_usuario_modificacion || row.usuario_ultima_modificacion,
            ufcFinalReporte: row.ufc_final_reporte,

            // Etapa 1
            etapa1: {
                agarPlateCount: row.agar_plate_count,
                equipoIncubacion: row.id_equipo_siembra,
                nMuestra10gr: row.n_muestra_10gr,
                nMuestra50gr: row.n_muestra_50gr,
                horaInicioHomogenizado: row.hora_inicio_homogenizado,
                horaTerminoSiembra: row.hora_termino_siembra,
                micropipetaUtilizada: row.micropipeta_utilizada
            },

            // Etapa 2
            // Etapa 2
            etapa2: {
                idResponsableAnalisis: row.id_responsable_analisis,
                idResponsableIncubacion: row.id_responsable_incubacion,
                fechaInicioIncubacion: row.fecha_inicio_incubacion,
                horaInicioIncubacion: row.hora_inicio_incubacion,
                fechaFinIncubacion: row.fecha_fin_incubacion,
                horaFinIncubacion: row.hora_fin_incubacion
            },

            // Etapa 3 (Ahora sí retornamos 'etapa3_repeticiones' con estructura correcta para Adapter)
            etapa3_repeticiones: muestras,
            // listaRepeticionesEtapa3: muestras, // Ya no necesario si el adapter usa la key de arriba


            // Etapa 4
            etapa4: {
                temperatura: row.temperatura_ambiental,
                blancoUfc: row.blanco_ufc,
                controlUfc: row.control_ufc,
                controlSiembraEcoli: row.control_siembra_ecoli,
                ufcControlPesado: row.ufc_control_pesado,
                controlAmbientalPesado: row.control_ambiental_pesado,
                horaInicio: row.hora_inicio_lectura,
                horaFin: row.hora_fin_lectura
            },

            // Etapa 5
            etapa5: {
                limite: row.limite,
                mercado: row.mercado,
                fechaEntrega: row.fecha_entrega,
                horaEntrega: row.hora_entrega,
                tablaPagina: row.tabla_pagina,
                desfavorable: row.desfavorable,
                manualInocuidad: row.manual_inocuidad
            },

            // Etapa 6
            etapa6: {
                duplicadoAli: row.duplicado_ali_val, // Nombre mapeado a prop
                analisis: row.id_analisis_dupli,
                duplicadoEstado: row.duplicado_estado,
                controlBlanco: row.control_blanco_val,
                controlBlancoEstado: row.control_blanco_estado,
                controlSiembra: row.control_siembra_val,
                controlSiembraEstado: row.control_siembra_estado
            },

            // Etapa 7
            etapa7: {
                observacionesFinales: row.observaciones_finales, // Viene de tabla CIERRE
                firmaCoordinador: row.firma_coordinador, // Viene de Header
                observacionesGeneralesAnalistaRam: row.observaciones_generales_analista_ram
                // Formas de cálculo se podrían cargar aparte si es necesario
            }
        };

    } catch (err) {
        console.error("Error obteniendo Reporte RAM:", err);
        throw err;
    } finally {
        if (client) client.release();
    }
};

/**
 * Guarda el reporte RAM (Upsert en tablas modulares)
 */
ReporteRAM.guardarReporteRAM = async (datos, rutUsuario) => {
    let client;
    try {
        client = await db.getConnection();
        await client.query('BEGIN');

        // Extraer codigoALI soportando camelCase y snake_case
        const codigoALI = datos.codigoALI || datos.codigo_ali;

        if (!codigoALI) {
            throw new Error("El código ALI es obligatorio para guardar el reporte.");
        }

        // 0. Update Header (RAM_REPORTE)
        // Nota: id_analisis_dupli ya no está en header, estpa en Etapa 6.
        // id_responsable_analisis y id_responsable_incubacion van en Etapa 2.
        const sqlHeader = `
            UPDATE RAM_REPORTE SET
                estado_ram = $1,
                usuario_ultima_modificacion = $2,
                fecha_ultima_modificacion = $6,
                ufc_final_reporte = $3,
                firma_coordinador = $4
            WHERE codigo_ali = $5
        `;
        // Usar fecha del frontend si viene, sino NOW()
        const fechaModificacion = datos.fechaUltimaModificacion ? new Date(datos.fechaUltimaModificacion) : new Date();

        await client.query(sqlHeader, [
            datos.estado,
            rutUsuario,
            datos.ufcFinalReporte || null,
            datos.etapa7?.firmaCoordinador || null,
            codigoALI,
            fechaModificacion
        ]);

        // 1. Etapa 1: Siembra (Upsert)
        // Datos vienen en datos.etapa1
        const e1 = datos.etapa1 || {};
        const sqlEtapa1 = `
            INSERT INTO RAM_ETAPA1_SIEMBRA (
                codigo_ali, agar_plate_count, id_equipo_incubacion, 
                n_muestra_10gr, n_muestra_50gr, 
                hora_inicio_homogenizado, hora_termino_siembra, micropipeta_utilizada
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                agar_plate_count = EXCLUDED.agar_plate_count,
                id_equipo_incubacion = EXCLUDED.id_equipo_incubacion,
                n_muestra_10gr = EXCLUDED.n_muestra_10gr,
                n_muestra_50gr = EXCLUDED.n_muestra_50gr,
                hora_inicio_homogenizado = EXCLUDED.hora_inicio_homogenizado,
                hora_termino_siembra = EXCLUDED.hora_termino_siembra,
                micropipeta_utilizada = EXCLUDED.micropipeta_utilizada
        `;
        await client.query(sqlEtapa1, [
            codigoALI,
            e1.agarPlateCount,
            e1.equipoIncubacion,
            e1.nMuestra10gr,
            e1.nMuestra50gr,
            e1.horaInicioHomogenizado,
            e1.horaTerminoSiembra,
            e1.micropipetaUtilizada // Asegurar que nombre coincida con frontend
        ]);

        // 2. Etapa 2: Incubación (Upsert)
        const e2 = datos.etapa2 || {};

        // Etapa 2: Responsables (IDs directos)
        const rutResponsableAnalisis = e2.responsableAnalisis || e2.idResponsableAnalisis;

        const rutResponsableIncubacion = e2.responsableIncubacion || e2.idResponsableIncubacion;

        const sqlEtapa2 = `
            INSERT INTO RAM_ETAPA2_INCUBACION (
                codigo_ali, id_responsable_analisis, id_responsable_incubacion,
                fecha_inicio_incubacion, hora_inicio_incubacion,
                fecha_fin_incubacion, hora_fin_incubacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                id_responsable_analisis = EXCLUDED.id_responsable_analisis,
                id_responsable_incubacion = EXCLUDED.id_responsable_incubacion,
                fecha_inicio_incubacion = EXCLUDED.fecha_inicio_incubacion,
                hora_inicio_incubacion = EXCLUDED.hora_inicio_incubacion,
                fecha_fin_incubacion = EXCLUDED.fecha_fin_incubacion,
                hora_fin_incubacion = EXCLUDED.hora_fin_incubacion
        `;
        await client.query(sqlEtapa2, [
            codigoALI,
            rutResponsableAnalisis,
            rutResponsableIncubacion,
            e2.fechaInicioIncubacion ? new Date(e2.fechaInicioIncubacion) : null,
            e2.horaInicioIncubacion,
            e2.fechaFinIncubacion ? new Date(e2.fechaFinIncubacion) : null,
            e2.horaFinIncubacion
        ]);

        // 2.5 Etapa 3: Muestras (Insertar lista nueva)
        // Datos vienen en 'etapa3_repeticiones' (si array)
        if (datos.etapa3_repeticiones && Array.isArray(datos.etapa3_repeticiones)) {
            // Borrar muestras existentes (y sus duplicados cascade si configurado, o manual)
            await client.query('DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = $1', [codigoALI]);
            await client.query('DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = $1', [codigoALI]);

            let orden = 1;
            for (const rep of datos.etapa3_repeticiones) {
                // Sacar diluciones del array 'diluciones' a columnas planas dil_1, dil_2
                const dil1Obj = rep.diluciones && rep.diluciones[0] ? rep.diluciones[0] : null;
                const dil2Obj = rep.diluciones && rep.diluciones[1] ? rep.diluciones[1] : null;

                const dil1 = dil1Obj ? dil1Obj.dil : null;
                const c1 = dil1Obj && dil1Obj.colonias ? dil1Obj.colonias[0] : null;
                const c2 = dil1Obj && dil1Obj.colonias ? dil1Obj.colonias[1] : null;

                const dil2 = dil2Obj ? dil2Obj.dil : null;
                const c3 = dil2Obj && dil2Obj.colonias ? dil2Obj.colonias[0] : null;
                const c4 = dil2Obj && dil2Obj.colonias ? dil2Obj.colonias[1] : null;

                const sqlMuestra = `
                    INSERT INTO RAM_ETAPA3_MUESTRAS (
                        codigo_ali, numero_muestra, dil_1, dil_2,
                        c1, c2, c3, c4,
                        resultado_ram, resultado_rpes, promedio_colonias,
                        n1, n2, sumatoria_colonias, factor_dilucion
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    RETURNING id_muestra
                `;

                const resMuestra = await client.query(sqlMuestra, [
                    codigoALI, orden++,
                    dil1, dil2,
                    c1, c2, c3, c4,
                    rep.resultado_ram, rep.resultado_rpes, rep.promedio,
                    rep.n1, rep.n2, rep.sumaColonias, rep.factorDilucion
                ]);

                const idMuestraPadre = resMuestra.rows[0].id_muestra;

                // Duplicado
                if (rep.duplicado) {
                    const dup = rep.duplicado;
                    const sqlDup = `
                        INSERT INTO RAM_ETAPA3_DUPLICADO (
                            codigo_ali, id_muestra_original, 
                            dil_dup_1, dil_dup_2,
                            c_dup_1, c_dup_2, c_dup_3, c_dup_4,
                            resultado_ram_dup, resultado_rpes_dup, promedio_colonias_duplicado,
                            n1_duplicado, n2_duplicado, sumatoria_colonias_duplicado, factor_dilucion
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    `;
                    // Parse colonies for duplicate
                    const c_dup_1 = dup.numeroColonias ? dup.numeroColonias[0] : null;
                    const c_dup_2 = dup.numeroColonias ? dup.numeroColonias[1] : null;
                    const c_dup_3 = dup.numeroColonias ? dup.numeroColonias[2] : null;
                    const c_dup_4 = dup.numeroColonias ? dup.numeroColonias[3] : null;

                    await client.query(sqlDup, [
                        codigoALI,
                        idMuestraPadre,
                        dup.dil01, dup.dil02,
                        c_dup_1, c_dup_2, c_dup_3, c_dup_4,
                        dup.resultado_ram, dup.resultado_rpes, dup.promedio,
                        dup.n1, dup.n2, dup.sumaColonias, dup.factorDilucion
                    ]);
                }
            }
        }

        // 3. Etapa 4: Lectura (Upsert) - ANTES RAM_ETAPA4_RESULTADOS
        const e4 = datos.etapa4 || {};
        const sqlEtapa4 = `
            INSERT INTO RAM_ETAPA4_LECTURA (
                codigo_ali, temperatura, ufc_control_pesado, control_ambiental_pesado, -- Ajuste: control_ambiental_pesado segun schema
                control_ufc, blanco_ufc, control_siembra_ecoli,
                hora_inicio_lectura, hora_fin_lectura
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                temperatura = EXCLUDED.temperatura,
                ufc_control_pesado = EXCLUDED.ufc_control_pesado,
                control_ambiental_pesado = EXCLUDED.control_ambiental_pesado, 
                control_ufc = EXCLUDED.control_ufc,
                blanco_ufc = EXCLUDED.blanco_ufc,
                control_siembra_ecoli = EXCLUDED.control_siembra_ecoli,
                hora_inicio_lectura = EXCLUDED.hora_inicio_lectura,
                hora_fin_lectura = EXCLUDED.hora_fin_lectura
        `;

        await client.query(sqlEtapa4, [
            codigoALI,
            e4.temperatura || e4.temperaturaAmbiental, // Fallback por si nombre prop cambia
            e4.ufcControlPesado,
            e4.controlAmbientalPesado,
            e4.controlUfc,
            e4.blancoUfc,
            e4.controlSiembraEcoli,
            e4.horaInicio, // ojo interfaz vs db
            e4.horaFin
        ]);


        // 4. Etapa 5: Verificación (Upsert) - ANTES RAM_ETAPA5_REVISION
        const e5 = datos.etapa5 || {};
        const sqlEtapa5 = `
            INSERT INTO RAM_ETAPA5_VERIFICACION (
                codigo_ali, limite, mercado, fecha_entrega, hora_entrega, tabla_pagina, desfavorable, manual_inocuidad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                limite = EXCLUDED.limite,
                mercado = EXCLUDED.mercado,
                fecha_entrega = EXCLUDED.fecha_entrega,
                hora_entrega = EXCLUDED.hora_entrega,
                tabla_pagina = EXCLUDED.tabla_pagina,
                desfavorable = EXCLUDED.desfavorable,
                manual_inocuidad = EXCLUDED.manual_inocuidad
        `;

        await client.query(sqlEtapa5, [
            codigoALI,
            e5.limite,
            e5.mercado,
            e5.fechaEntrega ? new Date(e5.fechaEntrega) : null,
            e5.horaEntrega,
            e5.tablaPagina,
            e5.desfavorable,
            e5.manualInocuidad // Base64
        ]);

        // 5. Etapa 6: Aseguramiento (Upsert) - ANTES RAM_ETAPA6_VERIF
        const e6 = datos.etapa6 || {};
        const sqlEtapa6 = `
            INSERT INTO RAM_ETAPA6_ASEGURAMIENTO (
                codigo_ali, id_analisis_dupli, 
                control_blanco_val, control_blanco_estado,
                control_siembra_val, control_siembra_estado,
                duplicado_ali_val, duplicado_estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                id_analisis_dupli = EXCLUDED.id_analisis_dupli,
                control_blanco_val = EXCLUDED.control_blanco_val,
                control_blanco_estado = EXCLUDED.control_blanco_estado,
                control_siembra_val = EXCLUDED.control_siembra_val,
                control_siembra_estado = EXCLUDED.control_siembra_estado,
                duplicado_ali_val = EXCLUDED.duplicado_ali_val,
                duplicado_estado = EXCLUDED.duplicado_estado
        `;
        await client.query(sqlEtapa6, [
            codigoALI,
            e6.analisis, // ID analisis
            e6.controlBlanco,
            e6.controlBlancoEstado,
            e6.controlSiembra,
            e6.controlSiembraEstado,
            e6.duplicadoAli,
            e6.duplicadoEstado
        ]);

        // 6. Etapa 7: Cierre (Upsert)
        const e7 = datos.etapa7 || {};
        const sqlEtapa7 = `
            INSERT INTO RAM_ETAPA7_CIERRE (
                codigo_ali, observaciones_finales, observaciones_generales_analista_ram
            ) VALUES ($1, $2, $3)
            ON CONFLICT (codigo_ali) DO UPDATE SET
                observaciones_finales = EXCLUDED.observaciones_finales,
                observaciones_generales_analista_ram = EXCLUDED.observaciones_generales_analista_ram
        `;
        await client.query(sqlEtapa7, [
            codigoALI,
            e7.observacionesFinales,
            e7.observacionesGeneralesAnalistaRam
        ]);

        await client.query('COMMIT');
        return { success: true, mensaje: 'Reporte RAM guardado correctamente' };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error("Error guardando RAM:", err);
        throw err;
    } finally {
        if (client) client.release();
    }
};

/**
 * Procesa y guarda la Etapa 3 (Muestras y Cálculos)
 * Borra y reinserta para simplicidad.
 */
ReporteRAM.procesarEtapa3RAM = async (datos) => {
    let client;
    try {
        client = await db.getConnection();
        await client.query('BEGIN');

        const { codigoALI, repeticiones } = datos;

        // 1. Borrar muestras existentes 
        // Primero borrar duplicados (hijos)
        await client.query('DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = $1', [codigoALI]);
        // Luego borrar muestras (padres)
        await client.query('DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = $1', [codigoALI]);

        // 2. Insertar nuevas muestras y duplicados
        let orden = 1;
        for (const rep of repeticiones) {
            // Insertar Muestra
            const sqlMuestra = `
                INSERT INTO RAM_ETAPA3_MUESTRAS (
                    codigo_ali, numero_muestra, dil_1, dil_2,
                    c1, c2, c3, c4,
                    resultado_ram, resultado_rpes, promedio_colonias,
                    n1, n2, sumatoria_colonias, factor_dilucion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id_muestra
            `;

            const resMuestra = await client.query(sqlMuestra, [
                codigoALI, orden++,
                rep.dil1, rep.dil2,
                rep.c1, rep.c2, rep.c3, rep.c4,
                rep.resultadoRAM, rep.resultadoRPES, rep.promedio,
                rep.n1, rep.n2, rep.sumaColonias, rep.factorDilucion
            ]);

            const idMuestraPadre = resMuestra.rows[0].id_muestra;

            // Insertar Duplicado si existe
            if (rep.duplicado) {
                const dup = rep.duplicado;
                const sqlDup = `
                    INSERT INTO RAM_ETAPA3_DUPLICADO (
                        codigo_ali, id_muestra_original, 
                        dil_dup_1, dil_dup_2,
                        c_dup_1, c_dup_2, c_dup_3, c_dup_4,
                        resultado_ram_dup, resultado_rpes_dup, promedio_colonias_duplicado,
                        n1_duplicado, n2_duplicado, sumatoria_colonias_duplicado, factor_dilucion
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (codigo_ali) DO UPDATE SET
                         id_muestra_original = EXCLUDED.id_muestra_original,
                         dil_dup_1 = EXCLUDED.dil_dup_1,
                         dil_dup_2 = EXCLUDED.dil_dup_2,
                         c_dup_1 = EXCLUDED.c_dup_1,
                         c_dup_2 = EXCLUDED.c_dup_2,
                         c_dup_3 = EXCLUDED.c_dup_3,
                         c_dup_4 = EXCLUDED.c_dup_4,
                         resultado_ram_dup = EXCLUDED.resultado_ram_dup,
                         resultado_rpes_dup = EXCLUDED.resultado_rpes_dup,
                         promedio_colonias_duplicado = EXCLUDED.promedio_colonias_duplicado,
                         n1_duplicado = EXCLUDED.n1_duplicado,
                         n2_duplicado = EXCLUDED.n2_duplicado,
                         sumatoria_colonias_duplicado = EXCLUDED.sumatoria_colonias_duplicado,
                         factor_dilucion = EXCLUDED.factor_dilucion
                `;
                await client.query(sqlDup, [
                    codigoALI,
                    idMuestraPadre,
                    dup.dil1, dup.dil2, // Frontend suele mandar 'dil1' también en duplicado obj
                    dup.c1, dup.c2, dup.c3, dup.c4,
                    dup.resultadoRAM, dup.resultadoRPES, dup.promedio,
                    dup.n1, dup.n2, dup.sumaColonias, dup.factorDilucion
                ]);
            }
        }

        await client.query('COMMIT');
        return { success: true };

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error("Error etapa 3 RAM:", err);
        throw err;
    } finally {
        if (client) client.release();
    }
};

// --- Utils de Cálculo ISO 7218 (Puras, sin cambios mayores excepto formateo si fuera necesario) ---

ReporteRAM.parsearColonias = (valor) => {
    if (valor === null || valor === '' || valor === undefined) return null;
    const vStr = String(valor).toUpperCase().trim();
    if (vStr === 'MNPC' || vStr === 'INCONTABLE') {
        return UMBRAL_MNPC;
    }
    const parsed = parseFloat(vStr);
    return isNaN(parsed) ? null : parsed;
};

ReporteRAM.clasificarDiluciones = (diluciones) => {
    return diluciones.map(d => {
        const coloniasParsed = d.colonias.map(c => ReporteRAM.parsearColonias(c));
        const optimas = [], bajas = [], exceso = [], sinCrecimiento = [];

        coloniasParsed.forEach(c => {
            if (c === null) return;
            if (c === 0) sinCrecimiento.push(c);
            else if (c >= MIN_CONTABLE && c <= MAX_CONTABLE) optimas.push(c);
            else if (c > 0 && c < MIN_CONTABLE) bajas.push(c);
            else if (c > MAX_CONTABLE) exceso.push(c);
        });

        let tipo;
        if (optimas.length > 0) tipo = 'RANGO_OPTIMO';
        else if (bajas.length > 0) tipo = 'RANGO_BAJO';
        else if (exceso.length > 0) tipo = 'RANGO_EXCESO';
        else tipo = 'RANGO_SIN_CRECIMIENTO';

        return { ...d, coloniasParsed, optimas, bajas, exceso, sinCrecimiento, tipo };
    });
};

ReporteRAM.calcularMediaPonderada = (diluciones, volumen) => {
    const ordenadas = [...diluciones].sort((a, b) => b.dil - a.dil);
    let dil1 = null, dil2 = null;

    for (let i = 0; i < ordenadas.length - 1; i++) {
        if (ordenadas[i].dil - 1 === ordenadas[i + 1].dil) {
            dil1 = ordenadas[i]; dil2 = ordenadas[i + 1]; break;
        }
    }
    if (!dil1) dil1 = ordenadas[0];

    let sumaC = 0, n1 = 0, n2 = 0;
    if (dil1) { sumaC += dil1.optimas.reduce((sum, c) => sum + c, 0); n1 = dil1.optimas.length; }
    if (dil2) { sumaC += dil2.optimas.reduce((sum, c) => sum + c, 0); n2 = dil2.optimas.length; }

    let promedio = 0;
    if (!dil2 && n1 > 0) promedio = sumaC / n1;

    const d = Math.pow(10, -Math.abs(dil1.dil));
    const denominador = volumen * (n1 + 0.1 * n2) * d;

    return denominador > 0
        ? { ufc: sumaC / denominador, sumaColonias: sumaC, promedio, n1, n2, dilucion: dil1.dil, factorDilucion: d }
        : { ufc: 0, sumaColonias: 0, promedio: 0, n1: 0, n2: 0, dilucion: null, factorDilucion: 0 };
};

ReporteRAM.formatearResultado = (ufc, operador, esEstimado) => {
    if (ufc === null || ufc === 0) return "0";
    const exp = ufc.toExponential(1);
    const [base, exponente] = exp.split('e');
    const expNum = parseInt(exponente, 10);
    const baseFormateado = base.replace('.', ',');
    let texto = `${baseFormateado} x 10^${expNum}`;
    if (operador === '<') texto = `< ${texto}`;
    else if (operador === '>') texto = `> ${texto}`;
    return texto;
};

ReporteRAM.calcularRecuentoColonias = (datos) => {
    try {
        const { volumen = 1, diluciones } = datos;
        if (!diluciones || diluciones.length === 0) {
            return { ufc: null, textoReporte: "Sin datos", operador: "=", esEstimado: false, casoAplicado: "SIN_DATOS" };
        }

        const dilucionesClasificadas = ReporteRAM.clasificarDiluciones(diluciones);

        // Prioridad 1
        const optimales = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_OPTIMO');
        if (optimales.length > 0) {
            const res = ReporteRAM.calcularMediaPonderada(optimales, volumen);
            return {
                ufc: res.ufc, sumaColonias: res.sumaColonias, promedio: res.promedio, n1: res.n1, n2: res.n2,
                dilucion: res.dilucion, factorDilucion: res.factorDilucion,
                textoReporte: ReporteRAM.formatearResultado(res.ufc, '=', false),
                operador: '=', esEstimado: false, casoAplicado: 'PRIORIDAD_1'
            };
        }

        // Prioridad 2
        const bajas = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_BAJO');
        if (bajas.length > 0) {
            const dilMenor = bajas.reduce((min, d) => d.dil > min.dil ? d : min, bajas[0]);
            const d = Math.pow(10, -Math.abs(dilMenor.dil));
            const resultado = 25 / (volumen * d);
            const sumaColonias = dilMenor.bajas.reduce((sum, c) => sum + c, 0);
            const n1 = dilMenor.bajas.length;
            return {
                ufc: resultado, sumaColonias, promedio: n1 > 0 ? sumaColonias / n1 : 0, n1, n2: 0,
                dilucion: dilMenor.dil, factorDilucion: d,
                textoReporte: ReporteRAM.formatearResultado(resultado, '<', false),
                textoRPES: `< ${Math.round(resultado)}`, operador: '<', esEstimado: false, casoAplicado: 'PRIORIDAD_2'
            };
        }

        // Prioridad 3
        const excesos = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_EXCESO');
        if (excesos.length > 0) {
            const dilMayor = excesos.reduce((max, d) => d.dil < max.dil ? d : max, excesos[0]);
            const colonias = dilMayor.coloniasParsed.filter(c => c !== null);
            const promedio = colonias.reduce((sum, c) => sum + c, 0) / colonias.length;
            const d = Math.pow(10, -Math.abs(dilMayor.dil));

            if (promedio < UMBRAL_MNPC) {
                const ufc = promedio / (volumen * d);
                return {
                    ufc, sumaColonias: colonias.reduce((sum, c) => sum + c, 0), promedio, n1: colonias.length, n2: 0,
                    dilucion: dilMayor.dil, factorDilucion: d,
                    textoReporte: ReporteRAM.formatearResultado(ufc, '=', true),
                    operador: '=', esEstimado: true, casoAplicado: 'PRIORIDAD_3A'
                };
            } else {
                const resultado = UMBRAL_MNPC / (volumen * d);
                return {
                    ufc: resultado, sumaColonias: colonias.reduce((sum, c) => sum + c, 0), promedio, n1: colonias.length, n2: 0,
                    dilucion: dilMayor.dil, factorDilucion: d,
                    textoReporte: ReporteRAM.formatearResultado(resultado, '>', false),
                    textoRPES: `> ${Math.round(resultado)}`, operador: '>', esEstimado: false, casoAplicado: 'PRIORIDAD_3B'
                };
            }
        }

        // Prioridad 4
        const sinCrecimiento = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_SIN_CRECIMIENTO');
        if (sinCrecimiento.length > 0) {
            const dilMenor = sinCrecimiento.reduce((min, d) => d.dil > min.dil ? d : min, sinCrecimiento[0]);
            const d = Math.pow(10, -Math.abs(dilMenor.dil));
            const resultado = 1 / (volumen * d);
            return {
                ufc: resultado, sumaColonias: 0, promedio: 0, n1: dilMenor.sinCrecimiento.length, n2: 0,
                dilucion: dilMenor.dil, factorDilucion: d,
                textoReporte: ReporteRAM.formatearResultado(resultado, '<', false),
                operador: '<', esEstimado: false, casoAplicado: 'PRIORIDAD_4'
            };
        }

        return { ufc: null, textoReporte: "Error en clasificación", operador: "=", esEstimado: false, casoAplicado: "ERROR" };
    } catch (error) {
        console.error("Error al calcular recuento:", error);
        return { ufc: null, textoReporte: "Error en cálculo", operador: "=", esEstimado: false, casoAplicado: "ERROR", error: error.message };
    }
};

module.exports = ReporteRAM;