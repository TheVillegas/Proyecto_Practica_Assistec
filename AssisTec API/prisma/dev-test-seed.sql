-- ============================================================
-- Dev Test — Seed Data for Test Analyst
-- ============================================================
-- Crea cliente + solicitud validada con los 4 formularios
-- microbiologicos para que el analista revise y aplique hotfixes.
-- Idempotente: omite si ya existe ALI-003/2026.
-- ============================================================
-- Uso: make dev-test
-- Analista: 0-0 (Analista Prueba)
-- NOTA: Este archivo NO es una migracion de Prisma.
--       Se carga manualmente via psql despues de migrate deploy
--       y run-seeds.js, usando el esquema ACTUAL (post-migraciones).
-- ============================================================

DO $$
DECLARE
    v_solicitud_id BIGINT;
    v_cliente_id   INT;
    v_direccion_id INT;
    v_muestra1_id  BIGINT;
    v_muestra2_id  BIGINT;
    v_muestra3_id  BIGINT;
    v_medio_vrbg   INT;
    v_medio_bp     INT;
    v_medio_apt    INT;
BEGIN
    -- ── Idempotencia ──
    IF EXISTS (SELECT 1 FROM solicitud_ingreso WHERE anio_ingreso = 2026 AND numero_ali = 3) THEN
        RAISE NOTICE 'Seed ya existe (solicitud #3/ALI-003/2026), omitiendo.';
        RETURN;
    END IF;

    -- ── Resolver IDs de medios_cultivos (sembrados por migraciones) ──
    SELECT id_medio_cultivo INTO v_medio_vrbg
        FROM medios_cultivos WHERE nombre = 'Agar VRBG';
    SELECT id_medio_cultivo INTO v_medio_bp
        FROM medios_cultivos WHERE nombre = 'Agar Baird Parker';
    SELECT id_medio_cultivo INTO v_medio_apt
        FROM medios_cultivos WHERE nombre = 'Caldo APT';

    IF v_medio_vrbg IS NULL THEN
        RAISE EXCEPTION 'medios_cultivos "Agar VRBG" no encontrado — ejecutar migrate deploy primero';
    END IF;
    IF v_medio_bp IS NULL THEN
        RAISE EXCEPTION 'medios_cultivos "Agar Baird Parker" no encontrado — ejecutar migrate deploy primero';
    END IF;
    IF v_medio_apt IS NULL THEN
        RAISE EXCEPTION 'medios_cultivos "Caldo APT" no encontrado — ejecutar migrate deploy primero';
    END IF;

    -- ═══════════════════════════════════════════════════════════════
    -- 0. CLIENTE + DIRECCION (si no existen)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO clientes (rut, nombre, email, telefono, activo)
    VALUES ('CL-TEST-01', 'Cliente Desarrollo Lab', 'cliente@devlab.cl', '+56 9 1234 5678', 'S')
    ON CONFLICT DO NOTHING
    RETURNING id_cliente INTO v_cliente_id;

    IF v_cliente_id IS NULL THEN
        SELECT id_cliente INTO v_cliente_id FROM clientes WHERE rut = 'CL-TEST-01';
    END IF;

    INSERT INTO direcciones_cliente (id_cliente, alias, direccion, solicitado_por_default, activo)
    VALUES (v_cliente_id, 'Laboratorio Central', 'Av. Desarrollo 1234, Lab Central', 'Analista Prueba', true)
    ON CONFLICT DO NOTHING
    RETURNING id_direccion INTO v_direccion_id;

    IF v_direccion_id IS NULL THEN
        SELECT id_direccion INTO v_direccion_id FROM direcciones_cliente WHERE id_cliente = v_cliente_id AND alias = 'Laboratorio Central';
    END IF;

    -- ═══════════════════════════════════════════════════════════════
    -- 1. SOLICITUD DE INGRESO
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO solicitud_ingreso (
        anio_ingreso, numero_ali, numero_acta, codigo_externo, codigo_equipo_manual,
        categoria, id_cliente, id_direccion, fecha_recepcion, temperatura_recepcion,
        id_termometro, fecha_inicio_muestreo, fecha_termino_muestreo,
        cantidad_muestras, cant_envases, responsable_muestreo, lugar_muestreo,
        instructivo_muestreo, envases_suministrados_por, id_lugar,
        muestra_compartida_quimica, observaciones_generales, observaciones_cliente,
        notas_del_cliente, estado, rut_responsable_ingreso, rut_jefa_area,
        rut_coordinarora_recepcion, fecha_envio_validacion,
        fecha_entrega_revision_jefe_lab, motivo_devolucion,
        fecha_hora_recepcion_coordinadora, fecha_entrega_resultado_negativo_micro,
        dias_habiles_resultado_negativo, fecha_entrega_resultado_positivo_micro,
        dias_habiles_resultado_positivo, fecha_hora_retiro_muestras_sala,
        fecha_recepcion_analista, fecha_solicitada_entrega_analista,
        fecha_envio_informe_positivo, fecha_envio_informe_negativo,
        created_at, updated_at, created_by
    ) VALUES (
        2026, 3, 'ACTA-DEVTEST-001', '', NULL,
        3, v_cliente_id, v_direccion_id,            -- cat=Alimento, cliente dinamico
        '2026-06-25 09:00:00', 4.50,
        1,                                          -- termometro=id_equipo 1
        '2026-06-24 08:00:00', '2026-06-24 10:00:00',
        3, 6,                                       -- 3 muestras, 6 envases
        'Analista Prueba', 'Planta Proceso A',
        'IT-001', 'Cliente', 1,                     -- Freezer 33-M
        false,
        'Solicitud de prueba — validar formularios microbiologicos',
        'Requiere analisis completo microbiologico', '',
        'validada',                                  -- Estado: formularios generables
        '3-3', '2-2', '1-1',                        -- Ingreso Prueba, Jefe Area, Coordinadora
        '2026-06-25 09:30:00', '2026-06-25 09:30:00', '',
        '2026-06-25 09:30:00',
        '2026-06-25 09:30:00', 5,                   -- 5 dias habiles resultado negativo
        '2026-06-25 09:30:00', 7,                   -- 7 dias habiles resultado positivo
        '2026-06-25 09:30:00',
        '2026-06-25 09:00:00', '2026-07-02',
        '2026-07-02', '2026-07-02',
        '2026-06-25', '2026-06-25', '3-3'
    )
    RETURNING id_solicitud INTO v_solicitud_id;

    -- ═══════════════════════════════════════════════════════════════
    -- 0b. LOTES REACTIVO (necesarios para datos legacy)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO lotes_reactivo (tipo, codigo_lote, fecha_vencimiento, activo)
    VALUES
        ('agar_vrbg', 'VRBG-DEV-001', '2026-12-31', true),
        ('agar_vrbg', 'VRBG-DEV-002', '2027-06-30', true),
        ('tween_80',  'TW80-DEV-001', '2026-08-31', true)
    ON CONFLICT (codigo_lote) DO NOTHING;

    -- ═══════════════════════════════════════════════════════════════
    -- 1b. REGISTRO LEGACY — muestras_ali
    -- Necesario para que el backend encuentre esta solicitud
    -- en el listado de busqueda ALI (muestraAli.findAll / findByCodigoAli)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO muestras_ali (codigo_ali, codigo_otros, observaciones_cliente, observaciones_generales)
    VALUES (3, 'TEST-DEV-003', 'Solicitud de prueba — 4 formularios microbiologicos', 'Datos generados por make dev-test')
    ON CONFLICT (codigo_ali) DO NOTHING;

    -- ═══════════════════════════════════════════════════════════════
    -- 2. MUESTRAS (3 muestras)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO solicitud_muestra (id_solicitud) VALUES (v_solicitud_id), (v_solicitud_id), (v_solicitud_id);
    -- Las muestras reciben id autoincremental (sequence)

    SELECT id INTO v_muestra1_id FROM (
        SELECT id_solicitud_muestra AS id
        FROM solicitud_muestra WHERE id_solicitud = v_solicitud_id
        ORDER BY id_solicitud_muestra LIMIT 1 OFFSET 0
    ) t;

    SELECT id INTO v_muestra2_id FROM (
        SELECT id_solicitud_muestra AS id
        FROM solicitud_muestra WHERE id_solicitud = v_solicitud_id
        ORDER BY id_solicitud_muestra LIMIT 1 OFFSET 1
    ) t;

    SELECT id INTO v_muestra3_id FROM (
        SELECT id_solicitud_muestra AS id
        FROM solicitud_muestra WHERE id_solicitud = v_solicitud_id
        ORDER BY id_solicitud_muestra LIMIT 1 OFFSET 2
    ) t;

    RAISE NOTICE 'Muestras creadas: id=%, id=%, id=%', v_muestra1_id, v_muestra2_id, v_muestra3_id;

    -- ═══════════════════════════════════════════════════════════════
    -- 3. SOLICITUDES DE ANALISIS
    -- ═══════════════════════════════════════════════════════════════
    -- Muestra 1 → Salmonella (7) + S. aureus (8) + Coliformes/E.coli (9)
    -- Muestra 2 → Enterobacterias (10)
    -- Muestra 3 → S. aureus duplicado (11) + Salmonella (12)

    INSERT INTO solicitud_analisis (id_solicitud_analisis, id_solicitud_muestra, id_alcance_acreditacion, id_formulario_analisis, acreditado, metodologia_norma)
    VALUES
        (7,  v_muestra1_id, 5,  9,  true, 'ISO 6579-1:2017'),                     -- Salmonella
        (8,  v_muestra1_id, 7,  5,  true, 'ISO 6888-3:2003 / GOST 31746-2012'),   -- S. aureus
        (9,  v_muestra1_id, 4,  11, true, 'NCh2635/1.Of2001'),                    -- Coliformes totales
        (10, v_muestra2_id, 15, 13, true, 'NCh2676.Of2002'),                      -- Enterobacterias
        (11, v_muestra3_id, 7,  5,  true, 'ISO 6888-3:2003'),                     -- S. aureus (duplicado)
        (12, v_muestra3_id, 5,  9,  true, 'ISO 6579-1:2017');                     -- Salmonella (duplicado)

    -- ═══════════════════════════════════════════════════════════════
    -- 4. S. AUREUS — Formulario 1 (Muestra 1)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO sau_formulario (id_sau_formulario, id_solicitud_analisis, etapa_actual, estado, rut_analista, created_at, updated_at)
    VALUES (2, 8, 1, 'en_proceso', '0-0', NOW(), NOW());

    INSERT INTO sau_muestra (id_sau_muestra, id_sau_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, orden)
    VALUES (2, 2, v_muestra1_id, 'DEV-M1-A', false, 1);

    INSERT INTO sau_etapa1 (
        id_sau_etapa1, id_sau_formulario, fecha_inicio_incubacion, rut_analista_inicio,
        id_medio_agar_baird_parker, peso_muestra_tipo, id_estufa, completada, updated_at
    ) VALUES (
        2, 2,
        NOW() - INTERVAL '2 days', '0-0',
        v_medio_bp,                                -- FK a medios_cultivos (Agar Baird Parker)
        '25g + 225ml', 1, true, NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- 5. SALMONELLA — Formulario 1 (Muestra 1)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO sal_formulario (id_sal_formulario, id_solicitud_analisis, fase_actual, estado, rut_analista, created_at, updated_at)
    VALUES (2, 7, 1, 'en_proceso', '0-0', NOW(), NOW());

    INSERT INTO sal_muestra (id_sal_muestra, id_sal_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, orden)
    VALUES (2, 2, v_muestra1_id, 'DEV-M1-A', false, 1);

    INSERT INTO sal_fase1 (
        id_sal_fase1, id_sal_formulario, fecha_hora_inicio_incubacion,
        tipo_matriz, peso_muestra, id_medio_caldo_homogeneizacion, completada, updated_at
    ) VALUES (
        2, 2,
        NOW() - INTERVAL '1 day', 'general', '25g', v_medio_apt, true, NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- 6. COLIFORMES / E. COLI — Formulario (Muestra 1)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO coli_formulario (id_coli_formulario, id_solicitud_analisis, fase_actual, estado, rut_analista, created_at, updated_at)
    VALUES (1, 9, 1, 'en_proceso', '0-0', NOW(), NOW());

    INSERT INTO coli_muestra (id_coli_muestra, id_coli_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, peso_muestra_tipo, orden)
    VALUES (1, 1, v_muestra1_id, 'DEV-M1-A', false, '25g + 225ml', 1);

    INSERT INTO coli_fase1 (
        id_coli_fase1, id_coli_formulario, fecha_inicio_incubacion,
        rut_analista_inicio, completada, updated_at
    ) VALUES (
        1, 1,
        NOW() - INTERVAL '1 day', '0-0', true, NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- 7. ENTEROBACTERIAS — Formulario (Muestra 2)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO ent_formulario (id_ent_formulario, id_solicitud_analisis, etapa_actual, subetapa_actual, estado, rut_analista, created_at, updated_at)
    VALUES (1, 10, 1, 1, 'en_proceso', '0-0', NOW(), NOW());

    INSERT INTO ent_muestra (id_ent_muestra, id_ent_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, orden)
    VALUES (1, 1, v_muestra2_id, 'DEV-M2-B', false, 1);

    INSERT INTO ent_etapa1 (
        id_ent_etapa1, id_ent_formulario, codigo_ali, n_acta,
        tipo_muestra, n_muestra_10g_90ml, n_muestra_50g_450ml,
        id_balanza,
        fecha_inicio, hora_inicio, rut_analista_inicio,
        fecha_homog, hora_homog, rut_analista_homog,
        id_stomacher, tiempo_homogenizacion,
        id_medio_agar_vrbg, id_estufa_sembrado, placas_sembrado, id_micropipeta,
        fecha_sembrado, hora_sembrado, rut_analista_sembrado,
        id_estufa_incub, fecha_inicio_incubacion, fecha_fin_incubacion, rut_analista_incub,
        completada, updated_at
    ) VALUES (
        1, 1, 'DEV-ALI-003', 'ACTA-DEVTEST-001',
        'Homogenea', 1, NULL,
        1,                                                          -- Balanza 1 (Cuchara)
        '2026-06-24', '09:00', '0-0',
        '2026-06-24', '09:05', '0-0',
        1, 2,                                                       -- Stomacher 1, 2 min
        v_medio_vrbg,                                               -- FK a medios_cultivos (Agar VRBG)
        1, 2, 1,                                                    -- Estufa 1, 2 placas, Pipeta 1
        '2026-06-24', '09:15', '0-0',
        1,                                                          -- Estufa incubacion 1
        NOW() - INTERVAL '1 day', NOW() + INTERVAL '23 hours', '0-0',
        true, NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- 8. S. AUREUS — Formulario 2 (Muestra 3, duplicado)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO sau_formulario (id_sau_formulario, id_solicitud_analisis, etapa_actual, estado, rut_analista, created_at, updated_at)
    VALUES (3, 11, 1, 'no_realizado', NULL, NOW(), NOW());

    INSERT INTO sau_muestra (id_sau_muestra, id_sau_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, orden)
    VALUES (3, 3, v_muestra3_id, 'DEV-M3-C', false, 1);

    -- ═══════════════════════════════════════════════════════════════
    -- 9. SALMONELLA — Formulario 2 (Muestra 3, duplicado)
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO sal_formulario (id_sal_formulario, id_solicitud_analisis, fase_actual, estado, rut_analista, created_at, updated_at)
    VALUES (3, 12, 1, 'no_realizado', NULL, NOW(), NOW());

    INSERT INTO sal_muestra (id_sal_muestra, id_sal_formulario, id_solicitud_muestra, numero_muestra, es_duplicado, orden)
    VALUES (3, 3, v_muestra3_id, 'DEV-M3-C', false, 1);

    RAISE NOTICE '✅ Seed completado: Solicitud #3 (2026/ALI-003) — 3 muestras, 6 analisis, formularios listos';
END $$;