const { z } = require('zod');

describe('T-005: Zod Schemas Base', () => {
    const baseSchema = require('../../src/validators/base.schema');
    const sauEtapa1 = require('../../src/validators/sau.schema').etapa1Schema;
    const coliFase1 = require('../../src/validators/coli.schema').fase1Schema;
    const salFase1 = require('../../src/validators/sal.schema').fase1Schema;

    it('base.schema exporta z.object con updated_at y completada', () => {
        expect(() => baseSchema.parse({ updated_at: '2024-01-01T00:00:00.000Z', completada: true })).not.toThrow();
    });

    it('sau etapa1 valida payload valido con completada true', () => {
        expect(() => sauEtapa1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: true,
            etapa: {
                fecha_inicio_incubacion: '2024-01-01T00:00:00.000Z',
                rut_analista_inicio: '1-9',
                codigo_agar_baird_parker: 'AGAR-1',
                peso_muestra_tipo: '25g',
                id_estufa: 1
            }
        })).not.toThrow();
    });

    it('sau etapa1 permite payload parcial con completada false (borrador)', () => {
        expect(() => sauEtapa1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: false,
            etapa: {
                rut_analista_inicio: '1-9'
            }
        })).not.toThrow();
    });

    it('sau etapa1 rechaza fecha invalida', () => {
        expect(() => sauEtapa1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: true,
            etapa: {
                fecha_inicio_incubacion: 'not-a-date',
                rut_analista_inicio: '1-9',
                codigo_agar_baird_parker: 'AGAR-1',
                peso_muestra_tipo: '25g',
                id_estufa: 1
            }
        })).toThrow();
    });

    it('coli fase1 valida payload valido con completada true', () => {
        expect(() => coliFase1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: true,
            fase: {
                fecha_inicio_incubacion: '2024-01-01T00:00:00.000Z',
                rut_analista_inicio: '1-9'
            }
        })).not.toThrow();
    });

    it('sal fase1 valida payload valido con completada true', () => {
        expect(() => salFase1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: true,
            fase: {
                fecha_hora_inicio_incubacion: '2024-01-01T00:00:00.000Z',
                tipo_matriz: 'polvo',
                peso_muestra: '25g',
                caldo_homogeneizacion: 'leche_descremada'
            }
        })).not.toThrow();
    });

    it('sau etapa1 rechaza campo obligatorio faltante con completada true', () => {
        expect(() => sauEtapa1.parse({
            updated_at: '2024-01-01T00:00:00.000Z',
            completada: true,
            etapa: {}
        })).toThrow();
    });

    it('updated_at debe ser datetime ISO-8601 valido', () => {
        expect(() => baseSchema.parse({ updated_at: 'not-a-date', completada: false })).toThrow();
    });
});
