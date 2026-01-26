const db = require('../config/DB.js');
const { getObjectSignedUrl } = require('../utils/s3');

const ReporteTPA = {};

/**
 * Crea un reporte TPA inicial cuando se crea una muestra ALI
 * Estado inicial: NO_REALIZADO
 * @param {number} codigoALI
 * @param {object} client - Cliente transaccional compartido (Postgres Client)
 */
ReporteTPA.crearReporteTPAInicial = async (codigoALI, client = null) => {
    try {
        const sql = 'INSERT INTO TPA_REPORTE (codigo_ali, estado_actual) VALUES ($1, $2)';
        const values = [codigoALI, 'NO_REALIZADO'];

        if (client) {
            return await client.query(sql, values);
        } else {
            return await db.execute(sql, values);
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
            WHERE codigo_ali = $1
        `;

        const result = await db.execute(sql, [codigoALI]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].estado_actual;
    } catch (error) {
        console.error('Error al obtener estado del reporte:', error);
        throw error;
    }
};

/**
 * Obtiene el reporte TPA completo con todas sus etapas
 */
ReporteTPA.obtenerReporteTPA = async (codigoALI) => {
    let client;
    try {
        // Usamos un cliente para garantizar lectura consistente si se quisiera,
        // aunque para lectura simple db.execute basta. Usaré db.execute para consistencia con DB.js
        // Pero el codigo original usaba getConnection. Mantendré getConnection si hay multiples queries para usar la misma conexión del pool.
        client = await db.getConnection();

        // 1. Obtener datos principales del reporte
        const sqlReporte = `
            SELECT 
                r.codigo_ali,
                r.id_lugar,
                l.nombre_lugar as lugar_almacenamiento,
                r.observaciones_ingreso,
                r.estado_actual as estado,
                r.fecha_ultima_modificacion,
                u_mod.nombre_apellido_analista as usuario_modificacion,
                r.observaciones_finales,
                r.firma_digital,
                r.observaciones_generales_analistas
            FROM TPA_REPORTE r
            LEFT JOIN LUGARES_ALMACENAMIENTO l ON r.id_lugar = l.id_lugar
            LEFT JOIN USUARIOS u_mod ON r.usuario_ultima_modificacion = u_mod.rut_analista
            WHERE r.codigo_ali = $1
        `;
        const resultReporte = await client.query(sqlReporte, [codigoALI]);

        if (resultReporte.rows.length === 0) {
            return null;
        }

        const repData = resultReporte.rows[0];

        // --- S3 SIGNING ---
        let firmaUrl = repData.firma_digital;
        if (firmaUrl && firmaUrl.startsWith('uploads/')) {
            firmaUrl = await getObjectSignedUrl(firmaUrl);
        }

        const reporte = {
            codigoALI: repData.codigo_ali, // Postgres devuelve lowercase
            estado: repData.estado,
            etapa1: {
                lugarAlmacenamiento: repData.lugar_almacenamiento,
                observaciones: repData.observaciones_ingreso
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
                observaciones: repData.observaciones_finales,
                firma: firmaUrl // USAR URL FIRMADA
            },
            observacionesGenerales: repData.observaciones_generales_analistas,
            fechaCierre: repData.fecha_ultima_modificacion ? new Date(repData.fecha_ultima_modificacion).toISOString() : '',
            usuarioCierre: repData.usuario_modificacion || 'Sin información'
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
                s.retiro_pesado,
                s.lugar_almacenamiento
            FROM TPA_ETAPA2_SESION s
            LEFT JOIN USUARIOS u ON s.rut_analista = u.rut_analista
            WHERE s.codigo_ali = $1
            ORDER BY s.id_sesion
        `;
        const resultEtapa2 = await client.query(sqlEtapa2, [codigoALI]);

        for (const row of resultEtapa2.rows) {
            const idSesion = row.id_sesion;

            // Obtener equipos de esta sesión
            const sqlEquipos = `
                SELECT e.nombre_equipo
                FROM TPA_ETAPA2_EQUIPOS eq
                JOIN EQUIPOS_LAB e ON eq.id_equipo = e.id_equipo
                WHERE eq.id_sesion = $1
            `;
            const resultEquipos = await client.query(sqlEquipos, [idSesion]);

            // Obtener materiales de esta sesión
            const sqlMateriales = `
                SELECT 
                    m.tipo_material,
                    m.codigo_manual,
                    COALESCE(
                        p.nombre_pipeta, 
                        i.nombre_instrumento, 
                        p_code.nombre_pipeta, 
                        i_code.nombre_instrumento, 
                        m.tipo_material
                    ) as nombre_material
                FROM TPA_ETAPA2_MATERIALES m
                LEFT JOIN MICROPIPETAS p ON m.id_pipeta = p.id_pipeta
                LEFT JOIN INSTRUMENTOS i ON m.id_instrumento = i.id_instrumento
                LEFT JOIN MICROPIPETAS p_code ON m.tipo_material = p_code.codigo_pipeta
                LEFT JOIN INSTRUMENTOS i_code ON m.tipo_material = i_code.codigo_instrumento
                WHERE m.id_sesion = $1
            `;
            const resultMateriales = await client.query(sqlMateriales, [idSesion]);

            reporte.etapa2_manipulacion.push({
                id: idSesion,
                responsable: row.responsable,
                lugarAlmacenamiento: row.lugar_almacenamiento || '',
                fechaPreparacion: row.fecha_inicio ? new Date(row.fecha_inicio).toISOString().split('T')[0] : '',
                horaInicio: row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                horaPesado: row.fecha_termino ? new Date(row.fecha_termino).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                numeroMuestras: row.numero_muestras,
                observacionesEtapa2: row.observaciones_sesion,
                tipoAccion: row.retiro_pesado === 1 ? 'Pesado' : 'Retiro',
                equiposSeleccionados: resultEquipos.rows.map(e => e.nombre_equipo),
                listaMateriales: resultMateriales.rows.map((m, idx) => ({
                    id: idx,
                    tipoMaterial: m.nombre_material || m.tipo_material || '',
                    codigoMaterial: m.codigo_manual || ''
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
            WHERE codigo_ali = $1
        `;
        const resultEtapa3 = await client.query(sqlEtapa3, [codigoALI]);

        reporte.etapa3_limpieza.checklist = resultEtapa3.rows.map(r => ({
            nombre: r.nombre_item,
            seleccionado: r.seleccionado === 1,
            bloqueado: r.bloqueado === 1
        }));

        // 4. Obtener Etapa 4 (Retiro)
        const sqlEtapa4 = `
            SELECT 
                r.id_retiro,
                u.nombre_apellido_analista as responsable,
                r.fecha_retiro,
                r.hora_inicio,
                r.accion_realizada
            FROM TPA_ETAPA4_RETIRO r
            LEFT JOIN USUARIOS u ON r.rut_analista = u.rut_analista
            WHERE r.codigo_ali = $1
            ORDER BY r.id_retiro
        `;
        const resultEtapa4 = await client.query(sqlEtapa4, [codigoALI]);

        reporte.etapa4_retiro = resultEtapa4.rows.map(row => ({
            id: row.id_retiro,
            responsable: row.responsable,
            fecha: row.fecha_retiro ? new Date(row.fecha_retiro).toISOString().split('T')[0] : '',
            horaInicio: row.hora_inicio || '',
            analisisARealizar: row.accion_realizada
        }));

        // 5. Obtener Etapa 5 (Siembra)
        const sqlEtapa5 = `
            SELECT 
                id_siembra,
                observaciones_siembra,
                otros_equipos_texto
            FROM TPA_ETAPA5_SIEMBRA
            WHERE codigo_ali = $1
        `;
        const resultEtapa5 = await client.query(sqlEtapa5, [codigoALI]);

        if (resultEtapa5.rows.length > 0) {
            const rowSiembra = resultEtapa5.rows[0];
            const idSiembra = rowSiembra.id_siembra;
            reporte.etapa5_siembra.otrosEquipos = rowSiembra.otros_equipos_texto || '';

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
                WHERE r.id_siembra = $1
            `;
            const resultRecursos = await client.query(sqlRecursos, [idSiembra]);

            resultRecursos.rows.forEach((row, idx) => {
                const categoria = row.categoria_recurso;
                if (categoria === 'DILUYENTE') {
                    reporte.etapa5_siembra.diluyentes.push({
                        id: idx,
                        nombre: row.nombre_diluyente,
                        codigoDiluyente: row.codigo_diluyente
                    });
                } else if (categoria === 'EQUIPO') {
                    reporte.etapa5_siembra.equipos.push({
                        id: idx,
                        nombre: row.nombre_equipo,
                        seleccionado: row.seleccionado === 1
                    });
                } else if (categoria === 'MATERIAL') {
                    reporte.etapa5_siembra.materiales.push({
                        id: idx,
                        nombre: row.nombre_material,
                        codigoMaterialSiembra: row.codigo_material
                    });
                }
            });
        }

        return reporte;

    } catch (error) {
        console.error('Error al obtener reporte TPA:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

/**
 * Guarda o actualiza el reporte TPA completo
 * Usa transacciones para garantizar consistencia
 */
ReporteTPA.guardarReporteCompleto = async (datos, rutUsuario = null) => {
    let client;
    try {
        client = await db.getConnection();
        await client.query('BEGIN');

        const sqlReporteGeneral = `
            UPDATE TPA_REPORTE SET
                estado_actual = $1,
                observaciones_finales = $2,
                firma_digital = $3,
                usuario_ultima_modificacion = $4,
                fecha_ultima_modificacion = $6
            WHERE codigo_ali = $5
        `;

        await client.query(sqlReporteGeneral, [
            datos.estado,
            datos.etapa6_cierre?.observaciones || null,
            datos.etapa6_cierre?.firma || 'Sin firma',
            rutUsuario,
            datos.codigoALI,
            datos.fechaUltimaModificacion ? new Date(datos.fechaUltimaModificacion) : new Date()
        ]);

        if (datos.etapa1 !== undefined) {
            console.log("Guardando datos Etapa 1...");
            const sqlLugar = `
                SELECT id_lugar
                FROM LUGARES_ALMACENAMIENTO
                WHERE UPPER(nombre_lugar) = UPPER($1)
            `;
            const resultadoLugar = await client.query(sqlLugar, [datos.etapa1.lugarAlmacenamiento]);

            if (resultadoLugar.rows.length > 0) {
                const idLugarReal = resultadoLugar.rows[0].id_lugar;
                await client.query(`
                    UPDATE TPA_REPORTE SET
                        id_lugar = $1,
                        observaciones_ingreso = $2
                    WHERE codigo_ali = $3
                `, [
                    idLugarReal,
                    datos.etapa1.observaciones,
                    datos.codigoALI
                ]);
            }
        }

        // 2. Etapa 2: Manipulación
        if (datos.etapa2_manipulacion !== undefined) {
            console.log("Guardando datos Etapa 2 (Manipulación)...");

            await client.query(
                'DELETE FROM TPA_ETAPA2_SESION WHERE codigo_ali = $1',
                [datos.codigoALI]
            );

            for (const sesion of datos.etapa2_manipulacion) {
                let rutReal = null;
                if (!sesion.responsable || !sesion.responsable.trim()) {
                    if (datos.estado === 'Verificado') {
                        throw new Error(`El responsable es obligatorio en Etapa 2 para finalizar el reporte.`);
                    }
                } else {
                    const resAnalista = await client.query(
                        'SELECT rut_analista FROM USUARIOS WHERE UPPER(nombre_apellido_analista) = UPPER($1)',
                        [sesion.responsable]
                    );

                    if (resAnalista.rows.length === 0) {
                        throw new Error(`Analista '${sesion.responsable}' no encontrado.`);
                    }
                    rutReal = resAnalista.rows[0].rut_analista;
                }

                let fechaInicio = null;
                let fechaTermino = null;

                if (sesion.fechaPreparacion) {
                    const baseDate = sesion.fechaPreparacion.includes('T')
                        ? sesion.fechaPreparacion.split('T')[0]
                        : sesion.fechaPreparacion;

                    // Calcular fechaInicio
                    let dInicio = null;
                    if (sesion.horaInicio) {
                        const rawHora = sesion.horaInicio;
                        const cleanHora = rawHora.includes('T') ? rawHora.split('T')[1].substring(0, 5) : rawHora.substring(0, 5);
                        dInicio = new Date(`${baseDate}T${cleanHora}:00`);
                    } else if (sesion.fechaPreparacion.includes('T')) {
                        dInicio = new Date(sesion.fechaPreparacion);
                    } else {
                        dInicio = new Date(baseDate);
                    }
                    if (dInicio && !isNaN(dInicio.getTime())) {
                        fechaInicio = dInicio;
                    }

                    // Calcular fechaTermino (horaPesado)
                    if (sesion.horaPesado) {
                        const rawHora = sesion.horaPesado;
                        const cleanHora = rawHora.includes('T') ? rawHora.split('T')[1].substring(0, 5) : rawHora.substring(0, 5);
                        const dTermino = new Date(`${baseDate}T${cleanHora}:00`);
                        if (dTermino && !isNaN(dTermino.getTime())) {
                            fechaTermino = dTermino;
                        }
                    }
                }

                const sqlSesion = `
                    INSERT INTO TPA_ETAPA2_SESION (
                        rut_analista,
                        fecha_inicio,
                        fecha_termino,
                        numero_muestras,
                        observaciones_sesion,
                        retiro_pesado,
                        codigo_ali,
                        lugar_almacenamiento
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                    RETURNING id_sesion
                `;

                const resInsertSesion = await client.query(sqlSesion, [
                    rutReal,
                    fechaInicio,
                    fechaTermino,
                    sesion.numeroMuestras,
                    sesion.observacionesEtapa2,
                    sesion.tipoAccion === 'Pesado' ? 1 : 0,
                    datos.codigoALI,
                    sesion.lugarAlmacenamiento || ''
                ]);

                const idSesionReal = resInsertSesion.rows[0].id_sesion;

                if (sesion.equiposSeleccionados && Array.isArray(sesion.equiposSeleccionados)) {
                    for (const nombreEquipo of sesion.equiposSeleccionados) {
                        const resEq = await client.query(
                            'SELECT id_equipo FROM EQUIPOS_LAB WHERE UPPER(nombre_equipo) = UPPER($1)',
                            [nombreEquipo]
                        );
                        if (resEq.rows.length > 0) {
                            await client.query(
                                'INSERT INTO TPA_ETAPA2_EQUIPOS (id_equipo, id_sesion) VALUES ($1, $2)',
                                [resEq.rows[0].id_equipo, idSesionReal]
                            );
                        }
                    }
                }

                if (sesion.listaMateriales && Array.isArray(sesion.listaMateriales)) {
                    for (const mat of sesion.listaMateriales) {
                        if (!mat.tipoMaterial) {
                            if (datos.estado === 'Verificado') {
                                throw new Error(`El tipo de material es obligatorio en Etapa 2 para finalizar.`);
                            }
                            continue;
                        }

                        let idPipeta = null;
                        let idInstrumento = null;

                        const resPipeta = await client.query(
                            'SELECT id_pipeta FROM MICROPIPETAS WHERE codigo_pipeta = $1',
                            [mat.tipoMaterial]
                        );

                        if (resPipeta.rows.length > 0) {
                            idPipeta = resPipeta.rows[0].id_pipeta;
                        } else {
                            const resInstr = await client.query(
                                'SELECT id_instrumento FROM INSTRUMENTOS WHERE codigo_instrumento = $1',
                                [mat.tipoMaterial]
                            );
                            if (resInstr.rows.length > 0) {
                                idInstrumento = resInstr.rows[0].id_instrumento;
                            }
                        }

                        await client.query(
                            `INSERT INTO TPA_ETAPA2_MATERIALES (id_sesion, tipo_material, codigo_manual, id_pipeta, id_instrumento) 
                             VALUES ($1, $2, $3, $4, $5)`,
                            [
                                idSesionReal,
                                mat.tipoMaterial,
                                mat.codigoMaterial,
                                idPipeta,
                                idInstrumento
                            ]
                        );
                    }
                }
            }
        }

        if (datos.etapa3_limpieza && Array.isArray(datos.etapa3_limpieza.checklist)) {
            console.log("Guardando datos Etapa 3 ...");

            await client.query(
                'DELETE FROM TPA_ETAPA3_CHECKLIST WHERE codigo_ali = $1',
                [datos.codigoALI]
            );

            for (const item of datos.etapa3_limpieza.checklist) {
                const nombreItem = item.nombre || item.nombreItem;
                const resItem = await client.query(
                    'SELECT id_item FROM MAESTRO_CHECKLIST_LIMPIEZA WHERE UPPER(nombre_item) = UPPER($1)',
                    [nombreItem]
                );

                if (resItem.rows.length === 0) {
                    throw new Error(`El item '${nombreItem}' no existe en el maestro de limpieza.`);
                }

                await client.query(`
                    INSERT INTO TPA_ETAPA3_CHECKLIST (codigo_ali, nombre_item, seleccionado, bloqueado)
                    VALUES ($1, $2, $3, $4)
                `, [
                    datos.codigoALI,
                    nombreItem,
                    item.seleccionado ? 1 : 0,
                    item.bloqueado ? 1 : 0
                ]);
            }
        }

        if (datos.etapa4_retiro !== undefined) {
            console.log("Guardando datos Etapa 4 ... ");

            await client.query(
                'DELETE FROM TPA_ETAPA4_RETIRO WHERE codigo_ali = $1',
                [datos.codigoALI]
            );

            for (const datosRetiro of datos.etapa4_retiro) {
                let rutReal = null;
                if (!datosRetiro.responsable || !datosRetiro.responsable.trim()) {
                    if (datos.estado === 'Verificado') {
                        throw new Error(`El responsable es obligatorio en Etapa 4 para finalizar el reporte.`);
                    }
                } else {
                    const resAnalista = await client.query(
                        'SELECT rut_analista FROM USUARIOS WHERE UPPER(nombre_apellido_analista) = UPPER($1)',
                        [datosRetiro.responsable]
                    );

                    if (resAnalista.rows.length === 0) {
                        throw new Error(`El analista '${datosRetiro.responsable}' no existe en la base de datos.`);
                    }
                    rutReal = resAnalista.rows[0].rut_analista;
                }

                // Validar fecha retiro
                let fechaRetiro = null;
                if (datosRetiro.fecha) {
                    const d = new Date(datosRetiro.fecha);
                    if (!isNaN(d.getTime())) {
                        fechaRetiro = d;
                    }
                }

                await client.query(
                    `INSERT INTO TPA_ETAPA4_RETIRO (
                        codigo_ali,
                        rut_analista,
                        fecha_retiro,
                        accion_realizada,
                        hora_inicio
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    [
                        datos.codigoALI,
                        rutReal,
                        fechaRetiro,
                        datosRetiro.analisisARealizar || datosRetiro.accionRealizada,
                        (datosRetiro.horaInicio && datosRetiro.horaInicio.includes('T'))
                            ? datosRetiro.horaInicio.split('T')[1].substring(0, 5)
                            : (datosRetiro.horaInicio ? datosRetiro.horaInicio.substring(0, 5) : null)
                    ]
                );
            }
        }

        if (datos.etapa5_siembra !== undefined) {
            console.log("Guardando datos Etapa 5 (Siembra)... ");

            // Limpiar
            const deleteRecursosSql = `DELETE FROM TPA_ETAPA5_RECURSOS 
                 WHERE id_siembra IN (SELECT id_siembra FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = $1)`;
            await client.query(deleteRecursosSql, [datos.codigoALI]);

            await client.query(
                'DELETE FROM TPA_ETAPA5_SIEMBRA WHERE codigo_ali = $1',
                [datos.codigoALI]
            );

            const resSiembra = await client.query(
                `INSERT INTO TPA_ETAPA5_SIEMBRA (codigo_ali, otros_equipos_texto) 
                 VALUES ($1, $2) 
                 RETURNING id_siembra`,
                [
                    datos.codigoALI,
                    datos.etapa5_siembra.otrosEquipos || ''
                ]
            );
            const idSiembraReal = resSiembra.rows[0].id_siembra;

            // DILUYENTES
            if (datos.etapa5_siembra.diluyentes && Array.isArray(datos.etapa5_siembra.diluyentes)) {
                for (const dil of datos.etapa5_siembra.diluyentes) {
                    const resMast = await client.query(
                        'SELECT id_diluyente FROM DILUYENTES WHERE UPPER(nombre_diluyente) = UPPER($1)',
                        [dil.nombre]
                    );
                    if (resMast.rows.length > 0) {
                        await client.query(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_diluyente, codigo_diluyente) 
                             VALUES ($1, 'DILUYENTE', $2, $3)`,
                            [
                                idSiembraReal,
                                resMast.rows[0].id_diluyente,
                                dil.codigoDiluyente
                            ]
                        );
                    }
                }
            }

            // EQUIPOS
            if (datos.etapa5_siembra.equipos && Array.isArray(datos.etapa5_siembra.equipos)) {
                for (const equipo of datos.etapa5_siembra.equipos) {
                    const nombreEquipo = equipo.nombre || equipo.nombreEquipo;

                    if (!nombreEquipo) {
                        if (datos.estado === 'Verificado') {
                            throw new Error(`El nombre del equipo es obligatorio en Etapa 5 para finalizar.`);
                        }
                        continue;
                    }

                    const equipoValido = await client.query(
                        'SELECT id_equipo FROM EQUIPOS_LAB WHERE UPPER(nombre_equipo) = UPPER($1)',
                        [nombreEquipo]
                    );

                    if (equipoValido.rows.length > 0) {
                        await client.query(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_equipo, seleccionado) 
                             VALUES ($1, 'EQUIPO', $2, $3)`,
                            [
                                idSiembraReal,
                                equipoValido.rows[0].id_equipo,
                                equipo.seleccionado ? 1 : 0
                            ]
                        );
                    }
                }
            }

            // MATERIALES
            if (datos.etapa5_siembra.materiales && Array.isArray(datos.etapa5_siembra.materiales)) {
                for (const mat of datos.etapa5_siembra.materiales) {
                    const resMast = await client.query(
                        'SELECT id_material_siembra FROM MATERIAL_SIEMBRA WHERE UPPER(nombre_material) = UPPER($1)',
                        [mat.nombre]
                    );
                    if (resMast.rows.length > 0) {
                        await client.query(
                            `INSERT INTO TPA_ETAPA5_RECURSOS (id_siembra, categoria_recurso, id_material_siembra, codigo_material) 
                             VALUES ($1, 'MATERIAL', $2, $3)`,
                            [
                                idSiembraReal,
                                resMast.rows[0].id_material_siembra,
                                mat.codigoMaterialSiembra
                            ]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        return { success: true, mensaje: "Reporte TPA guardado exitosamente" };

    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rbError) {
                console.error('Error al hacer rollback:', rbError);
            }
        }
        console.error('Error al guardar reporte TPA:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
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
                fecha_cierre = NOW(),
                usuario_cierre = $1,
                observaciones_finales = $2,
                firma_digital = $3
            WHERE codigo_ali = $4
        `;

        const result = await db.execute(sql, [
            rutUsuario,
            observacionesFinales,
            firma || 'Sin firma',
            codigoALI
        ]);

        return { success: true, result };
    } catch (error) {
        console.error('Error al verificar reporte:', error);
        throw error;
    }
};

module.exports = ReporteTPA;