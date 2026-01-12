const db = require('../config/DB.js');

const ReporteTPA = {};

/**
 * Crea un reporte TPA inicial cuando se crea una muestra ALI
 * Estado inicial: NO_REALIZADO
 * @param {number} codigoALI
 * @param {object} connection - Conexión transaccional compartida
 */
ReporteTPA.crearReporteTPAInicial = async (codigoALI, connection = null) => {
    try {
        const sql = 'INSERT INTO TPA_REPORTE (codigo_ali, estado_actual) VALUES (:codigo_ali, :estado_actual)';
        const binds = {
            codigo_ali: codigoALI,
            estado_actual: 'NO_REALIZADO'
        };

        if (connection) {
            // Si pasamos una conexión, ejecutamos sin autoCommit (la transacción la maneja el padre)
            return await connection.execute(sql, binds);
        } else {
            // Si no hay conexión, usamos el wrapper global con autoCommit
            return await db.execute(sql, binds, { autoCommit: true });
        }
    } catch (err) {
        console.error(`[ReporteTPA] Error al crear reporte inicial para ALI ${codigoALI}:`, err);
        throw err;
    }
};

/**
 * Obtiene el estado actual del reporte
 */
ReporteTPA.obtenerEstadoReporte = async (codigoALI) => {
    try {
        const sql = `
            SELECT estado_actual 
            FROM TPA_REPORTE 
            WHERE codigo_ali = :codigo_ali
        `;

        const result = await db.execute(sql, { codigo_ali: codigoALI });

        if (result.rows.length === 0) {
            return null;
        }

        // Al estar configurado oracledb.OUT_FORMAT_OBJECT en DB.js, las filas son objetos
        // Por defecto Oracle devuelve las llaves en MAYÚSCULAS
        return result.rows[0].ESTADO_ACTUAL;
    } catch (error) {
        console.error('Error al obtener estado del reporte:', error);
        throw error;
    }
};

/**
 * Obtiene el reporte TPA completo con todas sus etapas
 */
ReporteTPA.obtenerReporteTPA = async (codigoALI) => {
    let connection;
    try {
        connection = await db.getConnection();

        // 1. Obtener datos principales del reporte
        const sqlReporte = `
            SELECT 
                r.codigo_ali,
                r.id_lugar,
                l.nombre_lugar as lugar_almacenamiento,
                r.observaciones_ingreso,
                r.estado_actual as estado,
                r.fecha_cierre,
                r.usuario_cierre,
                r.observaciones_finales,
                r.firma_digital,
                r.observaciones_generales_analistas
            FROM TPA_REPORTE r
            LEFT JOIN LUGARES_ALMACENAMIENTO l ON r.id_lugar = l.id_lugar
            WHERE r.codigo_ali = :codigo_ali
        `;
        const resultReporte = await connection.execute(sqlReporte, { codigo_ali: codigoALI });

        if (resultReporte.rows.length === 0) {
            return null;
        }

        const repData = resultReporte.rows[0];

        const reporte = {
            codigoALI: repData.CODIGO_ALI,
            estado: repData.ESTADO,
            etapa1: {
                lugarAlmacenamiento: repData.LUGAR_ALMACENAMIENTO,
                observaciones: repData.OBSERVACIONES_INGRESO
            },
            etapa2_manipulacion: [],
            etapa3_limpieza: { checklist: [] },
            etapa4_retiro: [],
            etapa5_siembra: {
                diluyentes: [],
                equipos: [],
                materiales: [],
                otrosEquipos: ''
            },
            etapa6_cierre: {
                observaciones: repData.OBSERVACIONES_FINALES,
                firma: repData.FIRMA_DIGITAL
            },
            // Agregamos campos faltantes que podrían servir
            observacionesGenerales: repData.OBSERVACIONES_GENERALES_ANALISTAS,
            fechaCierre: repData.FECHA_CIERRE,
            usuarioCierre: repData.USUARIO_CIERRE
        };

        // 2. Obtener sesiones de Etapa 2 (Manipulación)
        const sqlEtapa2 = `
            SELECT 
                s.id_sesion,
                s.rut_analista,
                u.nombre_apellido_analista as responsable,
                s.fecha_inicio,
                s.fecha_termino,
                s.numero_muestras,
                s.observaciones_sesion,
                s.retiro_pesado
            FROM TPA_ETAPA2_SESION s
            LEFT JOIN USUARIOS u ON s.rut_analista = u.rut_analista
            WHERE s.codigo_ali = :codigo_ali
            ORDER BY s.id_sesion
        `;
        const resultEtapa2 = await connection.execute(sqlEtapa2, { codigo_ali: codigoALI });

        for (const row of resultEtapa2.rows) {
            const idSesion = row.ID_SESION;

            // Obtener equipos de esta sesión
            const sqlEquipos = `
                SELECT e.nombre_equipo
                FROM TPA_ETAPA2_EQUIPOS eq
                JOIN EQUIPOS_LAB e ON eq.id_equipo = e.id_equipo
                WHERE eq.id_sesion = :id_sesion
            `;
            const resultEquipos = await connection.execute(sqlEquipos, { id_sesion: idSesion });

            // Obtener materiales de esta sesión
            const sqlMateriales = `
                SELECT 
                    m.tipo_material,
                    m.codigo_manual,
                    p.codigo_pipeta,
                    i.codigo_instrumento
                FROM TPA_ETAPA2_MATERIALES m
                LEFT JOIN MICROPIPETAS p ON m.id_pipeta = p.id_pipeta
                LEFT JOIN INSTRUMENTOS i ON m.id_instrumento = i.id_instrumento
                WHERE m.id_sesion = :id_sesion
            `;
            const resultMateriales = await connection.execute(sqlMateriales, { id_sesion: idSesion });

            reporte.etapa2_manipulacion.push({
                id: idSesion,
                responsable: row.RESPONSABLE,
                fechaPreparacion: row.FECHA_INICIO,
                horaInicio: row.FECHA_INICIO ? new Date(row.FECHA_INICIO).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
                horaPesado: row.FECHA_TERMINO ? new Date(row.FECHA_TERMINO).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
                numeroMuestras: row.NUMERO_MUESTRAS,
                observacionesEtapa2: row.OBSERVACIONES_SESION,
                tipoAccion: row.RETIRO_PESADO === 1 ? 'Pesado' : 'Retiro',
                equiposSeleccionados: resultEquipos.rows.map(e => e.NOMBRE_EQUIPO),
                listaMateriales: resultMateriales.rows.map((m, idx) => ({
                    id: idx,
                    tipoMaterial: m.TIPO_MATERIAL || '',
                    codigoMaterial: m.CODIGO_MANUAL || ''
                }))
            });
        }

        // 3. Obtener Etapa 3 (Checklist)
        const sqlEtapa3 = `
            SELECT 
                id_checklist,
                nombre_item,
                seleccionado,
                bloqueado
            FROM TPA_ETAPA3_CHECKLIST
            WHERE codigo_ali = :codigo_ali
        `;
        const resultEtapa3 = await connection.execute(sqlEtapa3, { codigo_ali: codigoALI });

        reporte.etapa3_limpieza.checklist = resultEtapa3.rows.map(r => ({
            nombre: r.NOMBRE_ITEM,
            seleccionado: r.SELECCIONADO === 1,
            bloqueado: r.BLOQUEADO === 1
        }));

        // 4. Obtener Etapa 4 (Retiro)
        const sqlEtapa4 = `
            SELECT 
                r.id_retiro,
                u.nombre_apellido_analista as responsable,
                r.fecha_retiro,
                r.accion_realizada
            FROM TPA_ETAPA4_RETIRO r
            LEFT JOIN USUARIOS u ON r.rut_analista = u.rut_analista
            WHERE r.codigo_ali = :codigo_ali
            ORDER BY r.id_retiro
        `;
        const resultEtapa4 = await connection.execute(sqlEtapa4, { codigo_ali: codigoALI });

        reporte.etapa4_retiro = resultEtapa4.rows.map(row => ({
            id: row.ID_RETIRO,
            responsable: row.RESPONSABLE,
            fecha: row.FECHA_RETIRO ? new Date(row.FECHA_RETIRO).toISOString().split('T')[0] : '',
            horaInicio: row.HORA_INICIO || '',
            accionRealizada: row.ACCION_REALIZADA
        }));

        // 5. Obtener Etapa 5 (Siembra)
        const sqlEtapa5 = `
            SELECT 
                id_siembra,
                observaciones_siembra,
                otros_equipos_texto
            FROM TPA_ETAPA5_SIEMBRA
            WHERE codigo_ali = :codigo_ali
        `;
        const resultEtapa5 = await connection.execute(sqlEtapa5, { codigo_ali: codigoALI });

        if (resultEtapa5.rows.length > 0) {
            const rowSiembra = resultEtapa5.rows[0];
            const idSiembra = rowSiembra.ID_SIEMBRA;
            reporte.etapa5_siembra.otrosEquipos = rowSiembra.OTROS_EQUIPOS_TEXTO || '';

            // Obtener recursos de siembra (diluyentes, equipos, materiales)
            const sqlRecursos = `
                SELECT 
                    r.categoria_recurso,
                    r.id_material_siembra,
                    r.codigo_material,
                    r.id_diluyente,
                    r.codigo_diluyente,
                    r.id_equipo,
                    r.seleccionado,
                    m.nombre_material,
                    d.nombre_diluyente,
                    e.nombre_equipo
                FROM TPA_ETAPA5_RECURSOS r
                LEFT JOIN MATERIAL_SIEMBRA m ON r.id_material_siembra = m.id_material_siembra
                LEFT JOIN DILUYENTES d ON r.id_diluyente = d.id_diluyente
                LEFT JOIN EQUIPOS_LAB e ON r.id_equipo = e.id_equipo
                WHERE r.id_siembra = :id_siembra
            `;
            const resultRecursos = await connection.execute(sqlRecursos, { id_siembra: idSiembra });

            resultRecursos.rows.forEach((row, idx) => {
                const categoria = row.CATEGORIA_RECURSO;
                if (categoria === 'DILUYENTE') {
                    reporte.etapa5_siembra.diluyentes.push({
                        id: idx,
                        nombre: row.NOMBRE_DILUYENTE,
                        codigoDiluyente: row.CODIGO_DILUYENTE
                    });
                } else if (categoria === 'EQUIPO') {
                    reporte.etapa5_siembra.equipos.push({
                        id: idx,
                        nombre: row.NOMBRE_EQUIPO,
                        seleccionado: row.SELECCIONADO === 1
                    });
                } else if (categoria === 'MATERIAL') {
                    reporte.etapa5_siembra.materiales.push({
                        id: idx,
                        nombre: row.NOMBRE_MATERIAL,
                        codigoMaterialSiembra: row.CODIGO_MATERIAL
                    });
                }
            });
        }

        return reporte;

    } catch (error) {
        console.error('Error al obtener reporte TPA:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar conexión:', err);
            }
        }
    }
};
/**
 * Guarda o actualiza el reporte TPA completo
 * Usa transacciones para garantizar consistencia
 */
ReporteTPA.guardarReporteCompleto = async (datos, rutUsuario = null) => {
    let connection;
    try {
        connection = await db.getConnection();

        // Iniciamos transacción mediante savepoint (opcional pero recomendado)
        await connection.execute('SAVEPOINT inicio_guardado');
        //Falta agregar el nombre de la persona que modifico el reporte.
        const sqlReporteGeneral = `
            UPDATE TPA_REPORTE SET
                estado_actual = :estado_actual,
                observaciones_finales = :obs_finales,
                firma_digital = :firma,
                usuario_ultima_modificacion = :rut_mod
            WHERE codigo_ali = :codigo_ali
        `;

        await connection.execute(sqlReporteGeneral, {
            codigo_ali: datos.codigoALI, // Sincronizado con JSON
            estado_actual: datos.estado,
            obs_finales: datos.etapa6_cierre?.observaciones || null,
            firma: datos.etapa6_cierre?.firma || 'Sin firma',
            rut_mod: rutUsuario
        });

        if (datos.etapa1 !== undefined) {
            console.log("Guardando datos Etapa 1...");
            const sqlLugar = `
                SELECT id_lugar
                FROM LUGARES_ALMACENAMIENTO
                WHERE nombre_lugar = :nombre_lugar
            `;
            const resultadoLugar = await connection.execute(sqlLugar, {
                nombre_lugar: datos.etapa1.lugarAlmacenamiento // Sincronizado con JSON
            });

            if (resultadoLugar.rows.length > 0) {
                const idLugarReal = resultadoLugar.rows[0].ID_LUGAR; // Oracle es sensible a MAYÚSCULAS
                await connection.execute(`
                    UPDATE TPA_REPORTE SET
                        id_lugar = :id_lugar,
                        observaciones_ingreso = :obs
                    WHERE codigo_ali = :codigo_ali
                `, {
                    id_lugar: idLugarReal,
                    codigo_ali: datos.codigoALI,
                    obs: datos.etapa1.observaciones // Sincronizado con JSON
                });
            }
        }
        // 2. Etapa 2: Manipulación (Sesiones, Equipos y Materiales)
        if (datos.etapa2_manipulacion !== undefined) {
            console.log("Guardando datos Etapa 2 (Manipulación)...");

            // Limpieza inicial para evitar duplicados
            await connection.execute(
                `DELETE FROM TPA_ETAPA2_SESION WHERE codigo_ali = :ali`,
                { ali: datos.codigoALI }
            );

            for (const sesion of datos.etapa2_manipulacion) {
                // a. Buscar RUT del responsable por su nombre (Tabla: USUARIOS)
                const resAnalista = await connection.execute(
                    `SELECT rut_analista FROM USUARIOS WHERE nombre_apellido_analista = :nombre`,
                    { nombre: sesion.responsable }
                );

                if (resAnalista.rows.length === 0) {
                    throw new Error(`Analista '${sesion.responsable}' no encontrado.`);
                }
                const rutReal = resAnalista.rows[0].RUT_ANALISTA;

                // b. Preparar fechas y horas (Combinando fecha + hora del JSON)
                let fechaInicio = null;
                let fechaTermino = null;

                if (sesion.fechaPreparacion) {
                    const baseDate = sesion.fechaPreparacion.includes('T')
                        ? sesion.fechaPreparacion.split('T')[0]
                        : sesion.fechaPreparacion;

                    if (sesion.horaInicio) {
                        fechaInicio = new Date(`${baseDate}T${sesion.horaInicio}:00`);
                    } else if (sesion.fechaPreparacion.includes('T')) {
                        fechaInicio = new Date(sesion.fechaPreparacion);
                    } else {
                        fechaInicio = new Date(baseDate);
                    }

                    if (sesion.horaPesado) {
                        fechaTermino = new Date(`${baseDate}T${sesion.horaPesado}:00`);
                    }
                }

                // c. Insertar Sesión principal
                const sqlSesion = `
                    INSERT INTO TPA_ETAPA2_SESION (
                        rut_analista,
                        fecha_inicio,
                        fecha_termino,
                        numero_muestras,
                        observaciones_sesion,
                        retiro_pesado,
                        codigo_ali
                    ) VALUES (
                        :rut, :f_ini, :f_ter, :num, :obs, :tipo, :ali
                    ) RETURNING id_sesion INTO :id_s
                `;

                const resInsertSesion = await connection.execute(sqlSesion, {
                    rut: rutReal,
                    f_ini: fechaInicio,
                    f_ter: fechaTermino,
                    num: sesion.numeroMuestras,
                    obs: sesion.observacionesEtapa2,
                    tipo: sesion.tipoAccion === 'Pesado' ? 1 : 0,
                    ali: datos.codigoALI,
                    id_s: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
                });

                const idSesionReal = resInsertSesion.outBinds.id_s[0];

                // d. Insertar Equipos Seleccionados (Relación Hijo 1)
                if (sesion.equiposSeleccionados && Array.isArray(sesion.equiposSeleccionados)) {
                    for (const nombreEquipo of sesion.equiposSeleccionados) {
                        const resEq = await connection.execute(
                            `SELECT id_equipo FROM EQUIPOS_LAB WHERE nombre_equipo = :nom`,
                            { nom: nombreEquipo }
                        );
                        if (resEq.rows.length > 0) {
                            await connection.execute(
                                `INSERT INTO TPA_ETAPA2_EQUIPOS (id_equipo, id_sesion) VALUES (:id_e, :id_s)`,
                                { id_e: resEq.rows[0].ID_EQUIPO, id_s: idSesionReal }
                            );
                        }
                    }
                }
                // e. Insertar Lista de Materiales (Relación Hijo 2)
                if (sesion.listaMateriales && Array.isArray(sesion.listaMateriales)) {
                    for (const mat of sesion.listaMateriales) {
                        await connection.execute(
                            `INSERT INTO TPA_ETAPA2_MATERIALES (id_sesion, tipo_material, codigo_manual) 
                             VALUES (:id_s, :tipo, :cod)`,
                            {
                                id_s: idSesionReal,
                                tipo: mat.tipoMaterial,
                                cod: mat.codigoMaterial
                            }
                        );
                    }
                }
            }
        }

        if (datos.etapa3_limpieza && Array.isArray(datos.etapa3_limpieza.checklist)) {
            console.log("Guardando datos Etapa 3 ...");


            await connection.execute(
                `DELETE FROM TPA_ETAPA3_CHECKLIST WHERE codigo_ali = :ali`,
                { ali: datos.codigoALI }
            );

            for (const item of datos.etapa3_limpieza.checklist) {
                // Validación opcional: Verificar si el ítem existe en el maestro
                const resItem = await connection.execute(
                    `SELECT id_item FROM MAESTRO_CHECKLIST_LIMPIEZA WHERE nombre_item = :nom`,
                    { nom: item.nombre }
                );

                if (resItem.rows.length === 0) {
                    throw new Error(`El item '${item.nombre}' no existe en el maestro de limpieza.`);
                }

                await connection.execute(`
                    INSERT INTO TPA_ETAPA3_CHECKLIST (codigo_ali, nombre_item, seleccionado, bloqueado)
                    VALUES (:ali, :nom_item, :sel, :blo)
                `,
                    {
                        ali: datos.codigoALI,
                        nom_item: item.nombre,
                        sel: item.seleccionado ? 1 : 0,
                        blo: item.bloqueado ? 1 : 0
                    }
                );
            }
        }

        if (datos.etapa4_retiro !== undefined) {
            console.log("Guardando datos Etapa 4 ... ");

            await connection.execute(
                `DELETE FROM TPA_ETAPA4_RETIRO WHERE codigo_ali = :ali`,
                { ali: datos.codigoALI }
            );

            for (const datosRetiro of datos.etapa4_retiro) {
                const resAnalista = await connection.execute(
                    `SELECT rut_analista FROM USUARIOS WHERE nombre_apellido_analista = :nom`,
                    { nom: datosRetiro.responsable }
                );

                if (resAnalista.rows.length === 0) {
                    throw new Error(`El analista '${datosRetiro.responsable}' no existe en la base de datos.`);
                }

                await connection.execute(
                    `INSERT INTO TPA_ETAPA4_RETIRO (
                        codigo_ali,
                        rut_analista,
                        fecha_retiro,
                        accion_realizada,
                        hora_inicio
                    ) VALUES (
                        :ali,
                        :rut,
                        :fecha,
                        :accion,
                        :hora_inicio
                    )`
                    , {
                        ali: datos.codigoALI,
                        rut: resAnalista.rows[0].RUT_ANALISTA,
                        fecha: new Date(datosRetiro.fecha), // Convertir a objeto Date para Oracle
                        accion: datosRetiro.analisisARealizar,
                        hora_inicio: datosRetiro.horaInicio
                    }
                );
            }
        }

        if (datos.etapa5_siembra !== undefined) {
            console.log("Guardando datos Etapa 5 (Siembra)... ");

            // 1. Limpieza incremental (Hijos primero, luego Maestro por constraint)
            await connection.execute(
                `DELETE FROM TPA_ETAPA5_RECURSOS 
                 WHERE id_siembra IN (SELECT id_siembra FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = :ali)`,
                { ali: datos.codigoALI }
            );
            await connection.execute(
                `DELETE FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = :ali`,
                { ali: datos.codigoALI }
            );

            // 2. Insertar en tabla Maestra (SIEMBRA)
            // No usamos bucle porque etapa5_siembra es un objeto {...}
            const resSiembra = await connection.execute(
                `INSERT INTO TPA_ETAPA5_SIEMBRA (codigo_ali, otros_equipos_texto) 
                 VALUES (:ali, :otros) 
                 RETURNING id_siembra INTO :id_s`,
                {
                    ali: datos.codigoALI,
                    otros: datos.etapa5_siembra.otrosEquipos || '',
                    id_s: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
                }
            );
            const idSiembraReal = resSiembra.outBinds.id_s[0];

            // 3. Procesar Listas Secuencialmente

            // --- DILUYENTES ---
            if (datos.etapa5_siembra.diluyentes && Array.isArray(datos.etapa5_siembra.diluyentes)) {
                for (const dil of datos.etapa5_siembra.diluyentes) {
                    const resMast = await connection.execute(
                        `SELECT id_diluyente FROM DILUYENTES WHERE nombre_diluyente = :nom`,
                        { nom: dil.nombre }
                    );
                    if (resMast.rows.length > 0) {
                        await connection.execute(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_diluyente, codigo_diluyente) 
                             VALUES (:id_s, 'DILUYENTE', :id_d, :cod)`,
                            {
                                id_s: idSiembraReal,
                                id_d: resMast.rows[0].ID_DILUYENTE,
                                cod: dil.codigoDiluyente
                            }
                        );
                    }
                }
            }

            // --- EQUIPOS (LAB) ---
            if (datos.etapa5_siembra.equipos && Array.isArray(datos.etapa5_siembra.equipos)) {
                for (const equipo of datos.etapa5_siembra.equipos) {
                    const equipoValido = await connection.execute(
                        `SELECT id_equipo FROM EQUIPOS_LAB WHERE nombre_equipo = :nom`,
                        { nom: equipo.nombre }
                    );


                    if (equipoValido.rows.length > 0) {
                        await connection.execute(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_equipo, seleccionado) 
                             VALUES (:id_s, 'EQUIPO', :id_e, :sel)`,
                            {
                                id_s: idSiembraReal,
                                id_e: equipoValido.rows[0].ID_EQUIPO,
                                sel: equipo.seleccionado ? 1 : 0
                            }
                        );
                    }
                }
            }

            // --- MATERIALES ---
            if (datos.etapa5_siembra.materiales && Array.isArray(datos.etapa5_siembra.materiales)) {
                for (const mat of datos.etapa5_siembra.materiales) {
                    const resMast = await connection.execute(
                        `SELECT id_material_siembra FROM MATERIAL_SIEMBRA WHERE nombre_material = :nom`,
                        { nom: mat.nombre }
                    );
                    if (resMast.rows.length > 0) {
                        await connection.execute(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_material_siembra, codigo_material) 
                             VALUES (:id_siembra, 'MATERIAL', :id_material_siembra, :codigo_material)`,
                            {
                                id_siembra: idSiembraReal,
                                id_material_siembra: resMast.rows[0].ID_MATERIAL_SIEMBRA,
                                codigo_material: mat.codigoMaterialSiembra
                            }
                        );
                    }
                }
            }
        }

        // Finalización exitosa
        await connection.commit();
        return { success: true, mensaje: "Reporte TPA guardado exitosamente" };

    } catch (error) {
        if (connection) {
            try {
                await connection.execute('ROLLBACK TO SAVEPOINT inicio_guardado');
            } catch (rbError) {
                console.error('Error al hacer rollback:', rbError);
            }
        }
        console.error('Error al guardar reporte TPA:', error);
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

/**
 * Verifica el reporte (marca como VERIFICADO y registra cierre)
 */
ReporteTPA.verificarReporte = async (codigoALI, rutUsuario, observacionesFinales, firma) => {
    try {
        const sql = `
            UPDATE TPA_REPORTE SET
                estado_actual = 'VERIFICADO',
                fecha_cierre = SYSDATE,
                usuario_cierre = :rut_usuario,
                observaciones_finales = :obs_finales,
                firma_digital = :firma
            WHERE codigo_ali = :codigo_ali
        `;

        const result = await db.execute(sql, {
            codigo_ali: codigoALI,
            rut_usuario: rutUsuario,
            obs_finales: observacionesFinales,
            firma: firma || 'Sin firma'
        }, { autoCommit: true });

        return { success: true, result };
    } catch (error) {
        console.error('Error al verificar reporte:', error);
        throw error;
    }
};

module.exports = ReporteTPA;