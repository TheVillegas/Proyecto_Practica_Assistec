const { etapa1Schema, etapa2Schema, etapa3Schema } = require('../ent.schema');

const base = (overrides = {}) => ({
    updated_at: '2026-06-22T08:00:00.000Z',
    completada: true,
    ...overrides
});

describe('T-ENT-001: Enterobacterias Zod schemas', () => {
    describe('etapa1Schema', () => {
        it('acepta payload completo con completada true', () => {
            const payload = base({
                etapa: {
                    codigo_ali: 'ALI-1234',
                    n_acta: 'ACTA-2025-001',
                    tipo_muestra: 'Homogénea',
                    id_balanza: 1,
                    fecha_inicio: '2026-06-22',
                    hora_inicio: '08:00',
                    rut_analista_inicio: '1-9',
                    fecha_homog: '2026-06-22',
                    hora_homog: '09:00',
                    rut_analista_homog: '1-9',
                    id_stomacher: 2,
                    tiempo_homogenizacion: 5,
                    id_lote_agar_vrbg_sembrado: 1,
                    id_estufa_sembrado: 3,
                    placas_sembrado: 2,
                    id_micropipeta: 4,
                    fecha_sembrado: '2026-06-22',
                    hora_sembrado: '10:00',
                    rut_analista_sembrado: '1-9',
                    id_estufa_incub: 3,
                    fecha_inicio_incubacion: '2026-06-22T10:00:00.000Z',
                    fecha_fin_incubacion: '2026-06-23T10:00:00.000Z',
                    rut_analista_incub: '1-9'
                }
            });

            expect(() => etapa1Schema.parse(payload)).not.toThrow();
        });

        it('permite borrador parcial con completada false', () => {
            const payload = base({
                completada: false,
                etapa: {
                    codigo_ali: 'ALI-1234',
                    rut_analista_inicio: '1-9'
                }
            });

            expect(() => etapa1Schema.parse(payload)).not.toThrow();
        });

        it('rechaza etapa1 completada sin campos obligatorios', () => {
            const payload = base({
                completada: true,
                etapa: {
                    codigo_ali: 'ALI-1234'
                }
            });

            expect(() => etapa1Schema.parse(payload)).toThrow();
        });
    });

    describe('etapa2Schema', () => {
        it('acepta lectura 24h completa', () => {
            const payload = base({
                etapa: {
                    fecha_lectura_24h: '2026-06-23T10:30:00.000Z',
                    hora_lectura_24h: '10:30',
                    rut_analista_lectura: '1-9',
                    id_equipo_cuenta_colonias: 5,
                    n_muestra_lectura: 1,
                    dilucion: 10,
                    colonias_contadas: 42
                }
            });

            expect(() => etapa2Schema.parse(payload)).not.toThrow();
        });

        it('rechaza etapa2 completada sin rut_analista_lectura', () => {
            const payload = base({
                etapa: {
                    colonias_contadas: 10
                }
            });

            expect(() => etapa2Schema.parse(payload)).toThrow();
        });
    });

    describe('etapa3Schema — reactivo oxidasa', () => {
        it('acepta formato valido R69-AA-NN (NN=01)', () => {
            const payload = base({
                etapa: {
                    fecha_traspaso: '2026-06-24',
                    hora_traspaso: '08:00',
                    rut_analista_traspaso: '1-9',
                    id_agar_nutritivo: 2,
                    id_estufa_conf: 3,
                    fecha_lect_conf: '2026-06-24',
                    hora_lect_conf: '09:00',
                    rut_analista_lect_conf: '1-9',
                    fecha_oxidasa: '2026-06-24',
                    hora_oxidasa: '10:00',
                    rut_analista_oxidasa: '1-9',
                    reactivo_oxidasa: 'R69-25-01',
                    desaireado_agar_glucosa: 'SI',
                    agar_glucosa: 'AGAR-GLU',
                    control_pos_ecoli: 'POS',
                    control_neg_paer: 'NEG',
                    blanco: 'OK'
                }
            });

            expect(() => etapa3Schema.parse(payload)).not.toThrow();
        });

        it('rechaza formato invalido R69-25-99', () => {
            const payload = base({
                etapa: {
                    reactivo_oxidasa: 'R69-25-99'
                }
            });

            expect(() => etapa3Schema.parse(payload)).toThrow(/reactivo_oxidasa/);
        });

        it('rechaza etapa3 completada sin reactivo_oxidasa', () => {
            const payload = base({
                etapa: {
                    fecha_traspaso: '2026-06-24',
                    hora_traspaso: '08:00',
                    rut_analista_traspaso: '1-9',
                    id_agar_nutritivo: 2,
                    id_estufa_conf: 3
                }
            });

            expect(() => etapa3Schema.parse(payload)).toThrow();
        });
    });
});
