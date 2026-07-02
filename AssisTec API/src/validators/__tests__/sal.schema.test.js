const salSchema = require('../sal.schema');

const base = (overrides = {}) => ({
    updated_at: '2026-06-22T08:00:00.000Z',
    completada: true,
    ...overrides
});

describe('T-SAL-001: Salmonella Zod schemas (fase 1-10 via validateForm)', () => {
    describe('fase1Schema (SalFase1)', () => {
        it('acepta payload completo y no descarta los campos FK nuevos', () => {
            const payload = base({
                fase: {
                    fecha_hora_inicio_incubacion: '2026-06-22T08:00:00.000Z',
                    tipo_matriz: 'Polvo',
                    peso_muestra: '25g',
                    id_medio_caldo_homogeneizacion: 1,
                    hora_inicio_hidratacion: '2026-06-22T08:00:00.000Z',
                    hora_termino_hidratacion: '2026-06-22T08:10:00.000Z'
                }
            });

            const result = salSchema.fase1Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase.id_medio_caldo_homogeneizacion).toBe(1);
        });

        it('rechaza fase1 completada sin id_medio_caldo_homogeneizacion', () => {
            const payload = base({
                fase: { tipo_matriz: 'Polvo', peso_muestra: '25g' }
            });

            expect(salSchema.fase1Schema.safeParse(payload).success).toBe(false);
        });
    });

    describe('fase2Schema (SalFase2a)', () => {
        it('acepta body con clave fase2a (la que usa el service)', () => {
            const payload = base({
                fase2a: {
                    fecha_siembra: '2026-06-22T08:00:00.000Z',
                    hora_inicio_homo: '2026-06-22T08:00:00.000Z',
                    hora_termino_homo: '2026-06-22T08:00:00.000Z',
                    hora_ingreso_estufa: '2026-06-22T08:25:00.000Z',
                    rut_analista_responsable: '1-9'
                }
            });

            const result = salSchema.fase2Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase2a.rut_analista_responsable).toBe('1-9');
        });

        it('tambien acepta body con clave fase (fallback del service)', () => {
            const payload = base({
                fase: { hora_termino_homo: '2026-06-22T08:00:00.000Z', hora_ingreso_estufa: '2026-06-22T08:20:00.000Z' }
            });

            expect(salSchema.fase2Schema.safeParse(payload).success).toBe(true);
        });
    });

    describe('fase3Schema (SalFase2b)', () => {
        it('acepta id_medio_caldo/volumen_caldo/id_estufa/id_bano + arrays de insumos', () => {
            const payload = base({
                fase: {
                    id_medio_caldo: 5,
                    volumen_caldo: '225ml',
                    id_estufa: 2,
                    id_bano: 1
                },
                tween_pipetas: [{ id_material: 10 }],
                micropipetas: [{ id_pipeta: 20 }]
            });

            const result = salSchema.fase3Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase.id_medio_caldo).toBe(5);
            expect(result.data.fase.volumen_caldo).toBe('225ml');
            expect(result.data.fase.id_bano).toBe(1);
            expect(result.data.tween_pipetas[0].id_material).toBe(10);
            expect(result.data.micropipetas[0].id_pipeta).toBe(20);
        });
    });

    describe('fase4Schema (SalFase2c)', () => {
        it('acepta controles + desfavorable/tabla/limite/fecha_entrega', () => {
            const payload = base({
                fase: {
                    descripcion_ctrl_analisis: 'ok',
                    resultado_ctrl_analisis: true,
                    ctrl_positivo_blanco_ali: 'ok',
                    resultado_ctrl_positivo: true,
                    ctrl_siembra_ali: 'ok',
                    resultado_ctrl_siembra: true,
                    desfavorable: false,
                    tabla_pagina: 'Tabla 3',
                    limite: 'Ausencia/25g',
                    fecha_hora_entrega: '2026-06-25T08:00:00.000Z'
                }
            });

            const result = salSchema.fase4Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase.tabla_pagina).toBe('Tabla 3');
            expect(result.data.fase.limite).toBe('Ausencia/25g');
        });
    });

    describe('fase5Schema (SalFase3a)', () => {
        it('acepta campos de traspaso a enriquecimiento', () => {
            const payload = base({
                fase: {
                    fecha_traspaso: '2026-06-23T08:00:00.000Z',
                    hora_lectura_caldo_apt: '2026-06-23T08:00:00.000Z',
                    rut_analista_caldo_apt: '1-9',
                    hora_lectura_caldos_finales: '2026-06-23T08:00:00.000Z',
                    rut_analista_caldos_finales: '1-9'
                }
            });

            expect(salSchema.fase5Schema.safeParse(payload).success).toBe(true);
        });
    });

    describe('fase6Schema (SalFase3b)', () => {
        it('acepta selenito/rappaport estufa+bano independientes + arrays de insumos', () => {
            const payload = base({
                fase: {
                    id_estufa_selenito: 1,
                    id_bano_selenito: 2,
                    id_estufa_rappaport: 3,
                    id_bano_rappaport: 4
                },
                pipetas: [{ id_material: 10, tipo_material: 'punta' }],
                micropipetas: [{ id_pipeta: 20 }]
            });

            const result = salSchema.fase6Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase.id_bano_selenito).toBe(2);
            expect(result.data.fase.id_estufa_rappaport).toBe(3);
            expect(result.data.fase.id_bano_rappaport).toBe(4);
            expect(result.data.pipetas[0].tipo_material).toBe('punta');
        });
    });

    describe('fase7Schema (SalFase3cLectura — array de lecturas)', () => {
        it('acepta lecturas de caldo APT/selenito/rappaport + controles por muestra', () => {
            const payload = base({
                lecturas: [{
                    id_sal_muestra: '10',
                    resultado_caldo_apt: true,
                    resultado_selenito: false,
                    resultado_rappaport: true,
                    ctrl_positivo_s_enteritidis: true,
                    ctrl_negativo_k_pneumoniae: false,
                    ctrl_blanco: false
                }]
            });

            const result = salSchema.fase7Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.lecturas[0].id_sal_muestra).toBe('10');
            expect(result.data.lecturas[0].resultado_rappaport).toBe(true);
        });
    });

    describe('fase8Schema (SalFase4a)', () => {
        it('acepta id_medio_agar_xld/ss + id_bano_agares + lecturas 24h/48h', () => {
            const payload = base({
                fase: {
                    fecha_hora_traspaso_agares: '2026-06-24T08:00:00.000Z',
                    rut_analista_traspaso: '1-9',
                    id_medio_agar_xld: 6,
                    id_medio_agar_ss: 7,
                    id_estufa_agares: 2,
                    id_bano_agares: 1,
                    fecha_hora_lectura_24h: '2026-06-25T08:00:00.000Z',
                    rut_analista_lectura_24h: '1-9',
                    fecha_hora_lectura_48h: '2026-06-26T08:00:00.000Z',
                    rut_analista_lectura_48h: '1-9'
                }
            });

            const result = salSchema.fase8Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.fase.id_medio_agar_xld).toBe(6);
            expect(result.data.fase.id_medio_agar_ss).toBe(7);
            expect(result.data.fase.id_bano_agares).toBe(1);
        });
    });

    describe('fase9Schema (SalFase4bLectura — array de lecturas)', () => {
        it('acepta lecturas XLD/SS 24h/48h por selenito y rappaport + controles', () => {
            const payload = base({
                lecturas: [{
                    id_sal_muestra: '10',
                    id_sal_fase4a: '5',
                    res_xld_24h_selenito: 'tipico',
                    res_ss_24h_selenito: 'atipico',
                    res_xld_48h_selenito: 'sin_crecimiento',
                    res_ss_48h_selenito: 'atipico',
                    res_xld_24h_rappaport: 'atipico',
                    res_ss_24h_rappaport: 'sin_crecimiento',
                    res_xld_48h_rappaport: 'atipico',
                    res_ss_48h_rappaport: 'atipico',
                    ctrl_positivo_s_enteritidis: true,
                    ctrl_negativo_k_pneumoniae: false,
                    ctrl_blanco: false
                }]
            });

            const result = salSchema.fase9Schema.safeParse(payload);
            expect(result.success).toBe(true);
            expect(result.data.lecturas[0].id_sal_fase4a).toBe('5');
            expect(result.data.lecturas[0].res_xld_24h_selenito).toBe('tipico');
        });
    });

    describe('fase10Schema (SalFase5Resultado — calculado server-side)', () => {
        it('acepta el body minimo completada/updated_at', () => {
            const payload = base();
            expect(salSchema.fase10Schema.safeParse(payload).success).toBe(true);
        });
    });
});
