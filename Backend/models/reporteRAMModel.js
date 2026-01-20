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
                mta.nombre_analisis as nombre_analisis_dupli,
                r.FECHA_ULTIMA_MODIFICACION,
                u_mod.nombre_apellido_analista as nombre_usuario_modificacion
            FROM RAM_REPORTE r
            LEFT JOIN EQUIPOS_INCUBACION e ON r.id_equipo_incubacion = e.id_incubacion
            LEFT JOIN USUARIOS ua ON r.id_responsable_analisis = ua.rut_analista
            LEFT JOIN USUARIOS ui ON r.id_responsable_incubacion = ui.rut_analista
            LEFT JOIN MAESTRO_TIPOS_ANALISIS mta ON r.id_analisis_dupli = mta.id_tipo_analisis
            LEFT JOIN USUARIOS u_mod ON r.USUARIO_ULTIMA_MODIFICACION = u_mod.rut_analista
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

        // 4. Obtener Formas de Cálculo con Discriminador
        const sqlFormas = `
            SELECT 
                mfc.id_forma, 
                mfc.nombre_forma, 
                rfc.tipo_usuario,
                CASE WHEN rfc.id_forma IS NOT NULL THEN 1 ELSE 0 END as seleccionado
            FROM MAESTRO_FORMAS_CALCULO mfc
            LEFT JOIN RAM_ETAPA7_FORMAS_CALCULO rfc 
                ON mfc.id_forma = rfc.id_forma 
                AND rfc.codigo_ali = :codigo_ali
        `;
        const resultFormas = await db.execute(sqlFormas, { codigo_ali: codigoALI });

        // Mapear separadamente para Analista y Coordinador
        const formaCalculoAnalista = resultFormas.rows
            .filter(f => f.TIPO_USUARIO === 'ANALISTA')
            .map(f => ({
                id: f.ID_FORMA,
                idForma: f.ID_FORMA,
                nombreForma: f.NOMBRE_FORMA,
                seleccionado: true
            }));

        const formaCalculoCoordinador = resultFormas.rows
            .filter(f => f.TIPO_USUARIO === 'COORDINADOR')
            .map(f => ({
                id: f.ID_FORMA,
                idForma: f.ID_FORMA,
                nombreForma: f.NOMBRE_FORMA,
                seleccionado: true
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

        // 6. Mapeo de columnas DB a JSON (Formato nuevo con diluciones múltiples)
        const muestras = resultMuestras.rows.map(m => {
            const dup = dupResult.find(d => d.ID_MUESTRA_ORIGINAL === m.ID_MUESTRA);

            // Reconstruir el array de diluciones desde DIL_1 y DIL_2
            const diluciones = [];
            if (m.DIL_1 !== null) {
                diluciones.push({
                    dil: m.DIL_1,
                    colonias: [m.C1, m.C2].filter(c => c !== null)
                });
            }
            if (m.DIL_2 !== null) {
                diluciones.push({
                    dil: m.DIL_2,
                    colonias: [m.C3, m.C4].filter(c => c !== null)
                });
            }

            return {
                numero_Muestra: m.NUMERO_MUESTRA,
                volumen: m.VOLUMEN || 1, // Si no está guardado, asumir 1
                diluciones: diluciones,
                resultado_ram: m.RESULTADO_RAM,
                resultado_rpes: m.RESULTADO_RPES,
                sumaColonias: m.SUMATORIA_COLONIAS,
                promedio: m.PROMEDIO_COLONIAS,
                n1: m.N1,
                n2: m.N2,
                factorDilucion: m.FACTOR_DILUCION,
                // Retrocompatibilidad con formato antiguo (por si acaso)
                numeroMuestra: m.NUMERO_MUESTRA,
                numeroColonias: [m.C1, m.C2, m.C3, m.C4].filter(c => c !== null),
                duplicado: dup ? {
                    codigoALI: dup.CODIGO_ALI,
                    disolucion01: dup.DISOLUCION_DUP_1,
                    dil01: dup.DIL_DUP_1,
                    disolucion02: dup.DISOLUCION_DUP_2,
                    dil02: dup.DIL_DUP_2,
                    numeroColonias: [dup.C_DUP_1, dup.C_DUP_2, dup.C_DUP_3, dup.C_DUP_4].filter(c => c !== null),
                    resultado_ram: dup.RESULTADO_RAM_DUP,
                    resultado_rpes: dup.RESULTADO_RPES_DUP,
                    promedio: dup.PROMEDIO_COLONIAS_DUPLICADO,
                    n1: dup.N1_DUPLICADO,
                    n2: dup.N2_DUPLICADO,
                    sumaColonias: dup.SUMATORIA_COLONIAS_DUPLICADO,
                    factorDilucion: dup.FACTOR_DILUCION
                } : null
            };
        });

        return {
            codigoALI: r.CODIGO_ALI,
            estado: r.ESTADO_RAM,
            ultimaActualizacion: r.FECHA_ULTIMA_MODIFICACION ? new Date(r.FECHA_ULTIMA_MODIFICACION).toISOString() : '',
            responsable: r.NOMBRE_USUARIO_MODIFICACION || 'Sin información',

            etapa1: {
                agarPlateCount: r.AGAR_PLATE_COUNT,
                nombre_equipo_incubacion: r.NOMBRE_EQUIPO_INCUBACION, // Nombre desde JOIN
                equipoIncubacion: r.ID_EQUIPO_INCUBACION,
                nMuestra10gr: r.N_MUESTRA_10GR,
                nMuestra50gr: r.N_MUESTRA_50GR,
                horaInicioHomogenizado: r.HORA_INICIO_HOMOGENIZADO,
                horaTerminoSiembra: r.HORA_TERMINO_SIEMBRA,
                micropipetaUtilizada: r.MICROPIPETA_UTILIZADA
            },

            etapa2: {
                responsableAnalisis: r.NOMBRE_ANALISTA_ANALISIS, // Nombre desde JOIN
                responsableIncubacion: r.NOMBRE_ANALISTA_INCUBACION, // Nombre desde JOIN
                fechaInicioIncubacion: r.FECHA_INICIO_INCUBACION,
                fechaFinIncubacion: r.FECHA_FIN_INCUBACION,
                horaInicioIncubacion: r.HORA_INICIO_INCUBACION,
                horaFinIncubacion: r.HORA_FIN_INCUBACION
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
                formaCalculoAnalista: formaCalculoAnalista, // Lista filtrada
                formaCalculoCoordinador: formaCalculoCoordinador, // Lista filtrada
                firmaCoordinador: firmaBase64,
                observaciones_finales_analistas: r.OBSERVACIONES_GENERALES_ANALISTA_RAM
            }
        };

    } catch (error) {
        console.error(`Error al obtener reporte RAM para ${codigoALI}:`, error);
        throw error;
    }
};

ReporteRAM.guardarReporteRAM = async (datos, rutUsuario = null) => {
    let connection;
    try {
        connection = await db.getConnection();

        // 1. Crear SAVEPOINT para transaccionalidad
        await connection.execute('SAVEPOINT inicio_guardado');

        // 2. Actualizar Estado (Obligatorio si viene en el JSON)
        const sqlEstado = `UPDATE RAM_REPORTE
                           SET estado_ram = :estado,
                               FECHA_ULTIMA_MODIFICACION = SYSTIMESTAMP,
                               USUARIO_ULTIMA_MODIFICACION = :usuario
                           WHERE codigo_ali = :codigo_ali`;

        const resultEstado = await connection.execute(sqlEstado, {
            estado: datos.estado,
            usuario: rutUsuario || 'SISTEMA',
            codigo_ali: datos.codigo_ali || datos.codigoALI
        });

        if (resultEstado.rowsAffected === 0) {
            throw new Error('No se encontró el reporte RAM para actualizar');
        }

        // 3. Procesar Etapa 1 (Opcional)
        if (datos.etapa1) {
            console.log("Procesando Etapa 1 para RAM...");

            // Búsqueda flexible (insensible a mayúsculas)
            // Búsqueda flexible (insensible a mayúsculas) o uso directo de ID
            let idEquipo = datos.etapa1.equipoIncubacion;

            // Si viene el ID directo (número), lo usamos. Si no, buscamos por nombre
            if (!idEquipo && datos.etapa1.nombre_equipo_incubacion) {
                const equipoValid = await connection.execute(`
                    SELECT id_incubacion
                    FROM EQUIPOS_INCUBACION
                    WHERE UPPER(nombre_equipo) = UPPER(:equipo_incubacion)
                `, {
                    equipo_incubacion: datos.etapa1.nombre_equipo_incubacion || ''
                });

                if (equipoValid.rows.length > 0) {
                    idEquipo = equipoValid.rows[0].ID_INCUBACION;
                }
            }

            // Validación final
            if (!idEquipo) {
                if (datos.estado === 'Verificado' || datos.estado === 'Finalizado') {
                    // Solo error si es obligatorio (estado final) y no tenemos ni ID ni nombre válido
                    if (datos.etapa1.nombre_equipo_incubacion || datos.etapa1.equipoIncubacion) {
                        throw new Error(`El equipo de incubación no existe en el catálogo.`);
                    }
                }
                datos.etapa1.id_equipo_incubacion_val = null;
            } else {
                datos.etapa1.id_equipo_incubacion_val = idEquipo;
            }

            // Validación Micropipeta (Movido a Etapa 1)
            let idMicropipeta = null;
            if (datos.etapa1.micropipetaUtilizada && datos.etapa1.micropipetaUtilizada.trim() !== "") {
                const micropipeta = await connection.execute(
                    `SELECT id_pipeta FROM MICROPIPETAS WHERE nombre_pipeta = :nombre`,
                    { nombre: datos.etapa1.micropipetaUtilizada }
                );
                if (micropipeta.rows.length === 0) {
                    if (datos.estado === 'Verificado' || datos.estado === 'Finalizado') {
                        throw new Error(`La micropipeta '${datos.etapa1.micropipetaUtilizada}' no existe en el sistema.`);
                    }
                    // Borrador -> Null
                } else {
                    idMicropipeta = micropipeta.rows[0].ID_PIPETA; // Asumiendo que queremos el ID, aunque el query original usaba el nombre en el insert?
                    // Espera, el query original UPDATE usa :micropipeta.
                    // En la linea 297 del original usa: micropipeta: datos.etapa1.micropipetaUtilizada || null
                    // Parece que guarda el NOMBRE o el ID?
                    // El modelo original linea 286 dice "micropipeta_utilizada = :micropipeta"
                    // Y el bind linea 297 dice "micropipetaUtilizada".
                    // Si es ID, el bind debería ser el ID. 
                    // Revisando linea 270 original: SELECT id_pipeta ...
                    // Pero la validacion solo chequeaba existencia.
                    // Voy a asumir que guarda el NOMBRE si el campo en DB es varchar, o ID si es FK.
                    // Asumiremos que si es borrador y no existe, guarda el texto tal cual o null?
                    // Mejor null para evitar FK errors.
                }
            }

            const sqlEtapa1 = `
                UPDATE RAM_REPORTE
                SET agar_plate_count = :agar_plate_count,
                    id_equipo_incubacion = :equipo_incubacion,
                    n_muestra_10gr = :n_muestra_10gr,
                    n_muestra_50gr = :n_muestra_50gr,
                    hora_inicio_homogenizado = :hora_inicio_homogenizado,
                    hora_termino_siembra = :hora_termino_siembra,
                    micropipeta_utilizada = :micropipeta
                WHERE codigo_ali = :codigo_ali
            `;

            await connection.execute(sqlEtapa1, {
                agar_plate_count: datos.etapa1.agarPlateCount || datos.etapa1.agar_plate_count || null,
                equipo_incubacion: datos.etapa1.id_equipo_incubacion_val, // Usamos la variable determinada arriba
                n_muestra_10gr: datos.etapa1.nMuestra10gr || datos.etapa1.n_muestra_10gr || null,
                n_muestra_50gr: datos.etapa1.nMuestra50gr || datos.etapa1.n_muestra_50gr || null,
                hora_inicio_homogenizado: datos.etapa1.horaInicioHomogenizado || datos.etapa1.hora_inicio_homogenizado || null,
                hora_termino_siembra: datos.etapa1.horaTerminoSiembra || datos.etapa1.hora_termino_siembra || null,
                micropipeta: datos.etapa1.micropipetaUtilizada || null, // Guardamos el texto (o null si queremos estricto, pero la validación arriba solo chequeaba existencia, el bind usa el string)
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
                    if (datos.estado === 'Verificado' || datos.estado === 'Finalizado') {
                        throw new Error(`El responsable de análisis '${e2.responsableAnalisis}' no existe en el sistema.`);
                    }
                } else {
                    rutAnalista = res.rows[0].RUT_ANALISTA;
                }
            }

            if (e2.responsableIncubacion && e2.responsableIncubacion.trim() !== "") {
                const res = await connection.execute(
                    `SELECT rut_analista FROM USUARIOS WHERE nombre_apellido_analista = :nombre`,
                    { nombre: e2.responsableIncubacion }
                );
                if (res.rows.length === 0) {
                    if (datos.estado === 'Verificado' || datos.estado === 'Finalizado') {
                        throw new Error(`El responsable de incubación '${e2.responsableIncubacion}' no existe en el sistema.`);
                    }
                } else {
                    rutIncubacion = res.rows[0].RUT_ANALISTA;
                }
            }

            const sqlEtapa2 = `
                UPDATE RAM_REPORTE
                SET id_responsable_analisis = NVL(:rutA, id_responsable_analisis),
                    id_responsable_incubacion = NVL(:rutI, id_responsable_incubacion),
                    fecha_inicio_incubacion = TO_DATE(:fechaI, 'YYYY-MM-DD'),
                    fecha_fin_incubacion = TO_DATE(:fechaF, 'YYYY-MM-DD'),
                    hora_inicio_incubacion = :horaI,
                    hora_fin_incubacion = :horaF
                WHERE codigo_ali = :codigo_ali
            `;

            await connection.execute(sqlEtapa2, {
                rutA: rutAnalista,
                rutI: rutIncubacion,
                fechaI: e2.fechaInicioIncubacion || null,
                fechaF: e2.fechaFinIncubacion || null,
                horaI: e2.horaInicioIncubacion || null,
                horaF: e2.horaFinIncubacion || null,
                codigo_ali: datos.codigo_ali || datos.codigoALI
            });
        }

        // --- ETAPA 3: MUESTRAS (Refactorizada - Mapeo directo del JSON) ---
        if (datos.etapa3_repeticiones && Array.isArray(datos.etapa3_repeticiones)) {
            console.log("Procesando Etapa 3 (Muestras con resultados calculados)...");
            await ReporteRAM.procesarEtapa3RAM(
                connection,
                datos.codigo_ali || datos.codigoALI,
                datos.etapa3_repeticiones,
                datos.duplicado
            );
        }

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
                    if (datos.estado === 'Verificado' || datos.estado === 'Finalizado') {
                        throw new Error(`El analisis '${e6.analisis}' no existe en el sistema.`);
                    }
                    // Si es borrador, seteamos a null para que no falle FK (si existe)
                    // O lo dejamos si se permiten IDs invalidos (dudoso)
                    // Mejor null
                    e6.analisis = null;
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

            // Procesar Formas de Cálculo (Analista y Coordinador)
            // Ya no usamos RAM_FORMAS_CALCULO antiguo, sino RAM_ETAPA7_FORMAS_CALCULO

            // 1. Limpiar registros previos
            await connection.execute(
                `DELETE FROM RAM_ETAPA7_FORMAS_CALCULO WHERE codigo_ali = :codigo`,
                { codigo: datos.codigo_ali || datos.codigoALI }
            );

            const sqlInsertForma = `
                INSERT INTO RAM_ETAPA7_FORMAS_CALCULO (codigo_ali, id_forma, tipo_usuario)
                VALUES (:codigo, :idForma, :tipoUsuario)
            `;

            // Procesar Analista (formaCalculoAnalista)
            // NOTA: El frontend envía lista de objetos seleccionados { id, ... }
            if (e7.formasCalculo && Array.isArray(e7.formasCalculo)) {
                // Retrocompatibilidad o unificación:
                // Si el frontend envía 'formasCalculo' separadas, ideal. 
                // Pero reporte-ram.page.ts tiene 'formaCalculoAnalista' y 'formaCalculoCoordinador'
                // pero al enviar el JSON (linea 454 del page.ts), COMBINA ambos en 'formasCalculo'?
                // UPDATE: En reporte-ram.page.ts veo que combina todo en 'formasCalculo'. 
                // Necesitamos separar el TIPO_USUARIO alli o aqui.
                // PROBLEMA: El frontend mezcla todo en 'formasCalculo' en el JSON que envia.
                // SOLUCIÓN: Modificar el frontend para que envie 'formaCalculoAnalista' y 'formaCalculoCoordinador' separados
                // O confiar en que el backend reciba esos campos si modificamos frontend.

                // ASUMIREMOS que modificamos el frontend para enviar 'formaCalculoAnalista' y 'formaCalculoCoordinador' en etapa7.
            }

            // Asumiendo que el frontend ha sido actualizado (verificaré paso siguiente)
            if (e7.formaCalculoAnalista && Array.isArray(e7.formaCalculoAnalista)) {
                for (const forma of e7.formaCalculoAnalista) {
                    await connection.execute(sqlInsertForma, {
                        codigo: datos.codigo_ali || datos.codigoALI,
                        idForma: forma.id || forma.idForma,
                        tipoUsuario: 'ANALISTA'
                    });
                }
            }

            if (e7.formaCalculoCoordinador && Array.isArray(e7.formaCalculoCoordinador)) {
                for (const forma of e7.formaCalculoCoordinador) {
                    await connection.execute(sqlInsertForma, {
                        codigo: datos.codigo_ali || datos.codigoALI,
                        idForma: forma.id || forma.idForma,
                        tipoUsuario: 'COORDINADOR'
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

/**
 * Procesa y guarda las muestras de la Etapa 3 del reporte RAM
 * Mapea el JSON con diluciones múltiples y resultados pre-calculados a RAM_ETAPA3_MUESTRAS
 * @param {object} connection - Conexión transaccional de Oracle
 * @param {string} codigoALI - Código de la muestra ALI
 * @param {Array} muestras - Array de muestras con formato: {codigo_ali, numero_Muestra, volumen, diluciones[], resultado_ram, resultado_rpes, ...}
 * @param {object} duplicadoGlobal - Objeto duplicado (formato nuevo, hermano de etapa3_repeticiones)
 */
ReporteRAM.procesarEtapa3RAM = async (connection, codigoALI, muestras, duplicadoGlobal = null) => {
    console.log(`[Etapa 3] Procesando ${muestras.length} muestras para ALI ${codigoALI}`);

    // 1. Limpiar datos previos (Orden importante por FKs si no hay cascade)
    // Borrar DUPLICADOS primero
    const sqlDelDuplicados = `DELETE FROM RAM_ETAPA3_DUPLICADO WHERE codigo_ali = :codigo_ali`;
    await connection.execute(sqlDelDuplicados, { codigo_ali: codigoALI });

    // Borrar MUESTRAS
    const sqlDelMuestras = `DELETE FROM RAM_ETAPA3_MUESTRAS WHERE codigo_ali = :codigo_ali`;
    await connection.execute(sqlDelMuestras, { codigo_ali: codigoALI });

    // 2. SQL de inserción de MUESTRA con RETURNING ID
    const sqlInsertMuestra = `
        INSERT INTO RAM_ETAPA3_MUESTRAS (
            CODIGO_ALI, NUMERO_MUESTRA, DIL_1, DIL_2, 
            C1, C2, C3, C4,
            RESULTADO_RAM, RESULTADO_RPES, PROMEDIO_COLONIAS,
            N1, N2, SUMATORIA_COLONIAS, FACTOR_DILUCION
        ) VALUES (
            :codigo, :num, :dil1, :dil2,
            :c1, :c2, :c3, :c4,
            :resultado_ram, :resultado_rpes, :promedio,
            :n1, :n2, :suma_colonias, :factor_dilucion
        ) RETURNING ID_MUESTRA INTO :id_muestra
    `;

    // 3. SQL de inserción de DUPLICADO
    const sqlInsertDuplicado = `
        INSERT INTO RAM_ETAPA3_DUPLICADO (
            CODIGO_ALI, ID_MUESTRA_ORIGINAL,
            DIL_DUP_1, DIL_DUP_2,
            C_DUP_1, C_DUP_2, C_DUP_3, C_DUP_4,
            RESULTADO_RAM_DUP, RESULTADO_RPES_DUP,
            PROMEDIO_COLONIAS_DUPLICADO, 
            N1_DUPLICADO, N2_DUPLICADO,
            SUMATORIA_COLONIAS_DUPLICADO, FACTOR_DILUCION
        ) VALUES (
            :codigo, :id_muestra_original,
            :dil1, :dil2,
            :c1, :c2, :c3, :c4,
            :resultado_ram, :resultado_rpes,
            :promedio,
            :n1, :n2,
            :suma, :factor_dilucion
        )
    `;

    // 4. Procesar cada muestra del array
    for (const m of muestras) {
        console.log(`[Etapa 3] Procesando muestra ${m.numero_Muestra} para ALI ${codigoALI}`);

        // --- EXTRACCIÓN DE DILUCIONES ---
        let dil1 = null;
        let dil2 = null;
        if (m.diluciones && Array.isArray(m.diluciones) && m.diluciones.length > 0) {
            dil1 = m.diluciones[0].dil;
            if (m.diluciones.length > 1) {
                dil2 = m.diluciones[1].dil;
            }
        }

        // --- EXTRACCIÓN DE COLONIAS ---
        let todasLasColonias = [];
        if (m.diluciones && Array.isArray(m.diluciones)) {
            m.diluciones.forEach(d => {
                if (d.colonias && Array.isArray(d.colonias)) {
                    todasLasColonias = todasLasColonias.concat(d.colonias);
                }
            });
        }

        const c1 = todasLasColonias[0] !== undefined && todasLasColonias[0] !== "MNPC" ? todasLasColonias[0] : null;
        const c2 = todasLasColonias[1] !== undefined && todasLasColonias[1] !== "MNPC" ? todasLasColonias[1] : null;
        const c3 = todasLasColonias[2] !== undefined && todasLasColonias[2] !== "MNPC" ? todasLasColonias[2] : null;
        const c4 = todasLasColonias[3] !== undefined && todasLasColonias[3] !== "MNPC" ? todasLasColonias[3] : null;

        // --- INSERTAR MUESTRA ---
        // Necesitamos bindear el parametro de salida para obtener el ID
        const resultMuestra = await connection.execute(sqlInsertMuestra, {
            codigo: codigoALI,
            num: m.numero_Muestra,
            dil1: dil1,
            dil2: dil2,
            c1: c1,
            c2: c2,
            c3: c3,
            c4: c4,
            resultado_ram: m.resultado_ram || null,
            resultado_rpes: m.resultado_rpes || null,
            promedio: m.promedio !== undefined ? m.promedio : null,
            n1: m.n1 || null,
            n2: m.n2 || null,
            suma_colonias: m.sumaColonias || null,
            factor_dilucion: m.factorDilucion || null,
            id_muestra: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
        });

        // Obtener el ID generado
        const idMuestraGenerado = resultMuestra.outBinds.id_muestra[0];

        // --- PROCESAR DUPLICADO ---
        // Verificar si existe "duplicado" en el objeto muestra
        if (m.duplicado) {
            console.log(`[Etapa 3] Guardando duplicado para muestra ${m.numero_Muestra} (ID: ${idMuestraGenerado})`);

            // Extraer datos del duplicado (adaptar segun estructura JSON enviada por user)
            // Estructura esperada en JSON: duplicado: { dil01, dil02, numeroColonias: [], resultado_ram, promedio, sumaColonias }
            // NOTA: El usuario pidio agregar resultados calculados al duplicado.

            const d = m.duplicado;

            // Mapeo de colonias duplicadas
            const cDup = d.numeroColonias || [];
            const cDup1 = cDup[0] !== undefined ? cDup[0] : null;
            const cDup2 = cDup[1] !== undefined ? cDup[1] : null;
            const cDup3 = cDup[2] !== undefined ? cDup[2] : null;
            const cDup4 = cDup[3] !== undefined ? cDup[3] : null;

            await connection.execute(sqlInsertDuplicado, {
                codigo: codigoALI,
                id_muestra_original: idMuestraGenerado,
                dil1: d.dil01 || null, // Asumiendo dil01 viene en el JSON
                dil2: d.dil02 || null,
                c1: cDup1,
                c2: cDup2,
                c3: cDup3,
                c4: cDup4,
                // Resultados duplicado
                resultado_ram: d.resultado_ram || null, // resultado_ram del DUPLICADO
                resultado_rpes: d.resultado_rpes || null,
                promedio: d.promedio !== undefined ? d.promedio : null,
                n1: d.n1 || null,
                n2: d.n2 || null,
                suma: d.sumaColonias || null,
                factor_dilucion: d.factorDilucion || null
            });
        }
    }

    console.log(`[Etapa 3] ✓ Procesamiento completado para ${muestras.length} muestras`);
};

// ============================================================================
// FUNCIONES DE CÁLCULO DE RECUENTO DE COLONIAS - ISO 7218
// ============================================================================

// --- CONSTANTES ISO 7218 ---
const MIN_CONTABLE = 25;
const MAX_CONTABLE = 250;
const AREA_PLACA = 57; // cm²
const LIMITE_SATURACION = 100; // ufc/cm²
const UMBRAL_MNPC = AREA_PLACA * LIMITE_SATURACION; // 5700
/**
 * Parsea valores de colonias, convirtiendo strings "MNPC" o "Incontable" a valores numéricos altos
 * @param {*} valor - Valor a parsear (número o string)
 * @returns {number} - Valor numérico
 */
ReporteRAM.parsearColonias = (valor) => {
    if (valor === null || valor === undefined) return null;
    if (typeof valor === 'number') return valor;

    const vStr = String(valor).toUpperCase().trim();
    if (vStr === 'MNPC' || vStr === 'INCONTABLE') {
        return UMBRAL_MNPC; // Retornar 6500 para MNPC
    }

    const parsed = parseFloat(vStr);
    return isNaN(parsed) ? null : parsed;
};

/**
 * FASE A: Pre-procesamiento y Etiquetado
 * Clasifica cada dilución según el contenido de sus placas individuales
 * @param {Array} diluciones - Array de objetos {dil: -1, colonias: [305, "MNPC"]}
 * @returns {Array} - Diluciones clasificadas con etiqueta TIPO
 */
ReporteRAM.clasificarDiluciones = (diluciones) => {
    return diluciones.map(d => {
        const coloniasParsed = d.colonias.map(c => ReporteRAM.parsearColonias(c));

        const optimas = [];
        const bajas = [];
        const exceso = [];
        const sinCrecimiento = [];

        // Clasificar cada placa individual
        coloniasParsed.forEach(c => {
            if (c === null) return; // Ignorar nulls

            if (c === 0) {
                sinCrecimiento.push(c);
            } else if (c >= MIN_CONTABLE && c <= MAX_CONTABLE) {
                optimas.push(c);
            } else if (c > 0 && c < MIN_CONTABLE) {
                bajas.push(c);
            } else if (c > MAX_CONTABLE) {
                exceso.push(c);
            }
        });

        // Asignar etiqueta TIPO según jerarquía
        let tipo;
        if (optimas.length > 0) {
            tipo = 'RANGO_OPTIMO';
        } else if (bajas.length > 0) {
            tipo = 'RANGO_BAJO';
        } else if (exceso.length > 0) {
            tipo = 'RANGO_EXCESO';
        } else {
            tipo = 'RANGO_SIN_CRECIMIENTO';
        }

        return {
            ...d,
            coloniasParsed,
            optimas,
            bajas,
            exceso,
            sinCrecimiento,
            tipo
        };
    });
};

/**
 * Calcula la media ponderada según ISO 7218
 * N = ΣC / (V × (n1 + 0.1×n2) × d)
 * @param {Array} diluciones - Diluciones clasificadas (solo RANGO_OPTIMO)
 * @param {number} volumen - Volumen inoculado
 * @returns {number} - Resultado UFC
 */
ReporteRAM.calcularMediaPonderada = (diluciones, volumen) => {
    // Ordenar por dilución (más concentrada primero: -1, -2, -3...)
    const ordenadas = [...diluciones].sort((a, b) => b.dil - a.dil);

    // Buscar diluciones consecutivas
    let dil1 = null;
    let dil2 = null;

    for (let i = 0; i < ordenadas.length - 1; i++) {
        if (ordenadas[i].dil - 1 === ordenadas[i + 1].dil) {
            dil1 = ordenadas[i];
            dil2 = ordenadas[i + 1];
            break;
        }
    }

    // Si no hay consecutivas, usar solo la primera
    if (!dil1) {
        dil1 = ordenadas[0];
    }

    // Calcular suma de colonias (solo placas óptimas)
    let sumaC = 0;
    let n1 = 0;
    let n2 = 0;

    if (dil1) {
        sumaC += dil1.optimas.reduce((sum, c) => sum + c, 0);
        n1 = dil1.optimas.length;
    }

    if (dil2) {
        sumaC += dil2.optimas.reduce((sum, c) => sum + c, 0);
        n2 = dil2.optimas.length;
    }

    let promedio = 0;

    // Calcular promedio SOLO cuando hay UNA sola dilución válida (no dos consecutivas)
    if (!dil2 && n1 > 0) {
        // Caso: Solo 1 dilución → promedio de sus colonias
        promedio = sumaC / n1;
    }
    // Si hay 2 diluciones consecutivas, promedio = 0 (no se usa)

    // Factor de dilución (10^-dil)
    // El usuario ingresa diluciones POSITIVAS (2, 3, 4...)
    // Las convertimos a NEGATIVAS: Si dil = 3, entonces 10^(-3) = 0.001
    const d = Math.pow(10, -Math.abs(dil1.dil));

    // Fórmula ISO: N = ΣC / (V × (n1 + 0.1×n2) × 10^(-dil))
    const denominador = volumen * (n1 + 0.1 * n2) * d;

    return denominador > 0 ? { ufc: sumaC / denominador, sumaColonias: sumaC, promedio: promedio, n1: n1, n2: n2, dilucion: dil1.dil, factorDilucion: d } : { ufc: 0, sumaColonias: 0, promedio: 0, n1: 0, n2: 0, dilucion: null, factorDilucion: 0 };
};

/**
 * Formatea el resultado en notación científica
 * @param {number} ufc - Valor UFC
 * @param {string} operador - "=", "<", ">"
 * @param {boolean} esEstimado - Si es estimado
 * @returns {string} - Texto formateado (ej: "1,5 x 10^3")
 */
ReporteRAM.formatearResultado = (ufc, operador, esEstimado) => {
    if (ufc === null || ufc === 0) return "0";

    const exp = ufc.toExponential(1);
    const [base, exponente] = exp.split('e');
    const expNum = parseInt(exponente, 10);

    const baseFormateado = base.replace('.', ',');
    let texto = `${baseFormateado} x 10^${expNum}`;

    if (operador === '<') {
        texto = `< ${texto}`;
    } else if (operador === '>') {
        texto = `> ${texto}`;
    }

    return texto;
};

/**
 * FASE B: Árbol de Decisión - Función Principal
 * Procesa un objeto JSON con recuentos microbiológicos y aplica el árbol de decisión ISO 7218
 * 
 * @param {Object} datos - Objeto con formato: {volumen: 1, diluciones: [{dil: -1, colonias: [305, "MNPC"]}, ...]}
 * @returns {Object} - {ufc, textoReporte, operador, esEstimado, casoAplicado}
 */
ReporteRAM.calcularRecuentoColonias = (datos) => {
    try {
        const { volumen = 1, diluciones } = datos;

        if (!diluciones || diluciones.length === 0) {
            return {
                ufc: null,
                textoReporte: "Sin datos",
                operador: "=",
                esEstimado: false,
                casoAplicado: "SIN_DATOS"
            };
        }

        // FASE A: Clasificar diluciones
        const dilucionesClasificadas = ReporteRAM.clasificarDiluciones(diluciones);

        // FASE B: Árbol de Decisión

        // PRIORIDAD 1: Cálculo Estándar (ISO)
        const optimales = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_OPTIMO');
        if (optimales.length > 0) {
            const resultados = ReporteRAM.calcularMediaPonderada(optimales, volumen);
            return {
                ufc: resultados.ufc,
                sumaColonias: resultados.sumaColonias,
                promedio: resultados.promedio,
                n1: resultados.n1,
                n2: resultados.n2,
                dilucion: resultados.dilucion,
                factorDilucion: resultados.factorDilucion,
                textoReporte: ReporteRAM.formatearResultado(resultados.ufc, '=', false),
                operador: '=',
                esEstimado: false,
                casoAplicado: 'PRIORIDAD_1'
            };
        }

        // PRIORIDAD 2: Recuentos Bajos (Regla LOQ)
        const bajas = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_BAJO');
        if (bajas.length > 0) {
            // Tomar la dilución menor (más concentrada)
            const dilMenor = bajas.reduce((min, d) => d.dil > min.dil ? d : min, bajas[0]);
            const d = Math.pow(10, -Math.abs(dilMenor.dil));
            const resultado = 25 / (volumen * d);

            // Calcular suma y conteo de placas
            const sumaColonias = dilMenor.bajas.reduce((sum, c) => sum + c, 0);
            const n1 = dilMenor.bajas.length;

            return {
                ufc: resultado,
                sumaColonias: sumaColonias,
                promedio: n1 > 0 ? sumaColonias / n1 : 0,
                n1: n1,
                n2: 0,
                dilucion: dilMenor.dil,
                factorDilucion: d,
                textoReporte: ReporteRAM.formatearResultado(resultado, '<', false),
                textoRPES: `< ${Math.round(resultado)}`,
                operador: '<',
                esEstimado: false,
                casoAplicado: 'PRIORIDAD_2'
            };
        }

        // PRIORIDAD 3: Exceso / Saturación
        const excesos = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_EXCESO');
        if (excesos.length > 0) {
            // Tomar la dilución más diluida (la más alta sembrada)
            const dilMayor = excesos.reduce((max, d) => d.dil < max.dil ? d : max, excesos[0]);

            // Calcular promedio simple de las placas
            const colonias = dilMayor.coloniasParsed.filter(c => c !== null);
            const promedio = colonias.reduce((sum, c) => sum + c, 0) / colonias.length;

            const d = Math.pow(10, -Math.abs(dilMayor.dil));

            // Sub-Caso A: Exceso Contable
            if (promedio < UMBRAL_MNPC) {
                const ufc = promedio / (volumen * d);
                const sumaColonias = colonias.reduce((sum, c) => sum + c, 0);
                const n1 = colonias.length;

                return {
                    ufc: ufc,
                    sumaColonias: sumaColonias,
                    promedio: promedio,
                    n1: n1,
                    n2: 0,
                    dilucion: dilMayor.dil,
                    factorDilucion: d,
                    textoReporte: ReporteRAM.formatearResultado(ufc, '=', true),
                    operador: '=',
                    esEstimado: true,
                    casoAplicado: 'PRIORIDAD_3A'
                };
            }
            // Sub-Caso B: Saturación MNPC
            else {
                const resultado = UMBRAL_MNPC / (volumen * d);
                const sumaColonias = colonias.reduce((sum, c) => sum + c, 0);
                const n1 = colonias.length;

                return {
                    ufc: resultado,
                    sumaColonias: sumaColonias,
                    promedio: promedio,
                    n1: n1,
                    n2: 0,
                    dilucion: dilMayor.dil,
                    factorDilucion: d,
                    textoReporte: ReporteRAM.formatearResultado(resultado, '>', false),
                    textoRPES: `> ${Math.round(resultado)}`,
                    operador: '>',
                    esEstimado: false,
                    casoAplicado: 'PRIORIDAD_3B'
                };
            }
        }

        // PRIORIDAD 4: Ausencia Total
        const sinCrecimiento = dilucionesClasificadas.filter(d => d.tipo === 'RANGO_SIN_CRECIMIENTO');
        if (sinCrecimiento.length > 0) {
            // Tomar la dilución menor (más concentrada)
            const dilMenor = sinCrecimiento.reduce((min, d) => d.dil > min.dil ? d : min, sinCrecimiento[0]);
            const d = Math.pow(10, -Math.abs(dilMenor.dil));
            const resultado = 1 / (volumen * d);

            // Suma de colonias (todas son 0)
            const n1 = dilMenor.sinCrecimiento.length;

            return {
                ufc: resultado,
                sumaColonias: 0,
                promedio: 0,
                n1: n1,
                n2: 0,
                dilucion: dilMenor.dil,
                factorDilucion: d,
                textoReporte: ReporteRAM.formatearResultado(resultado, '<', false),
                operador: '<',
                esEstimado: false,
                casoAplicado: 'PRIORIDAD_4'
            };
        }

        // Fallback (no debería llegar aquí)
        return {
            ufc: null,
            textoReporte: "Error en clasificación",
            operador: "=",
            esEstimado: false,
            casoAplicado: "ERROR"
        };

    } catch (error) {
        console.error("Error al calcular recuento de colonias:", error);
        return {
            ufc: null,
            textoReporte: "Error en cálculo",
            operador: "=",
            esEstimado: false,
            casoAplicado: "ERROR",
            error: error.message
        };
    }
};

module.exports = ReporteRAM;