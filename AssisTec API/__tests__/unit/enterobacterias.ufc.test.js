const EnterobacteriasService = require('../../src/services/enterobacterias.service');
const enterobacteriasRepository = require('../../src/repositories/enterobacterias.repository');
const ROLES = require('../../src/config/roles');

jest.mock('../../src/repositories/enterobacterias.repository', () => ({
    findById: jest.fn(),
    findBySolicitudAnalisis: jest.fn(),
    create: jest.fn(),
    upsertEtapa1: jest.fn(),
    upsertEtapa2: jest.fn(),
    upsertEtapa3: jest.fn()
}));

describe('T-ECB-008: Enterobacterias UFC/g wiring', () => {
    const usuarioAnalista = { id: '1-9', roles: [ROLES.ANALISTA] };

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.ENT_UFC_CALC_ENABLED;
    });

    describe('_adaptarParaUfcEnt', () => {
        it('convierte dilucion/colonias al formato de calcularUfcEnt', () => {
            const result = EnterobacteriasService._adaptarParaUfcEnt({
                dilucion: 1,
                coloniasContadas: 50
            });

            expect(result).toEqual({
                volumen: 1,
                diluciones: [{ dil: 0, colonias: [50, 50] }]
            });
        });

        it('usa Math.log10 para diluciones fraccionarias', () => {
            const result = EnterobacteriasService._adaptarParaUfcEnt({
                dilucion: 0.1,
                coloniasContadas: 50
            });

            expect(result.diluciones[0].dil).toBe(-1);
        });

        it('retorna diluciones vacias cuando faltan datos', () => {
            const result = EnterobacteriasService._adaptarParaUfcEnt({
                dilucion: null,
                coloniasContadas: 0
            });

            expect(result.diluciones).toEqual([]);
        });
    });

    describe('guardarEtapa - UFC calculation', () => {
        const baseForm = {
            idEntFormulario: 1n,
            etapa1: { completada: true, fechaInicioIncubacion: new Date('2024-01-01T00:00:00.000Z') },
            etapa2: null,
            updatedAt: new Date()
        };

        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-02T01:00:00.000Z').getTime());
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('calcula ufcPorG cuando completada=true', async () => {
            enterobacteriasRepository.findById.mockResolvedValue(baseForm);
            enterobacteriasRepository.upsertEtapa2.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                etapa2: { dilucion: 1, coloniasContadas: 100 },
                muestras: []
            });

            await EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {
                    fecha_lectura_24h: '2024-01-02T01:00:00.000Z',
                    hora_lectura_24h: '01:00',
                    rut_analista_lectura: '1-9',
                    id_equipo_cuenta_colonias: 1,
                    n_muestra_lectura: 1,
                    dilucion: 1,
                    colonias_contadas: 100
                }
            }, new Date(), usuarioAnalista);

            const callArgs = enterobacteriasRepository.upsertEtapa2.mock.calls[0];
            expect(callArgs[1].etapa.ufcPorG).toBe(100);
        });

        it('no calcula ufcPorG cuando completada=false', async () => {
            enterobacteriasRepository.findById.mockResolvedValue(baseForm);
            enterobacteriasRepository.upsertEtapa2.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            await EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: false,
                etapa: {
                    dilucion: 1,
                    colonias_contadas: 100
                }
            }, new Date(), usuarioAnalista);

            const callArgs = enterobacteriasRepository.upsertEtapa2.mock.calls[0];
            expect(callArgs[1].etapa.ufcPorG).toBeUndefined();
        });

        it('omite calculo cuando ENT_UFC_CALC_ENABLED=false', async () => {
            process.env.ENT_UFC_CALC_ENABLED = 'false';
            enterobacteriasRepository.findById.mockResolvedValue(baseForm);
            enterobacteriasRepository.upsertEtapa2.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            await EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {
                    dilucion: 1,
                    colonias_contadas: 100
                }
            }, new Date(), usuarioAnalista);

            const callArgs = enterobacteriasRepository.upsertEtapa2.mock.calls[0];
            expect(callArgs[1].etapa.ufcPorG).toBeUndefined();
        });
    });

    describe('serializeFormulario', () => {
        it('expone ufcPorG como top-level y dentro de etapa2', () => {
            const form = {
                idEntFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date(),
                etapa2: { ufcPorG: 100 },
                muestras: []
            };

            const result = EnterobacteriasService.serializeFormulario(form);
            expect(result.ufcPorG).toBe(100);
            expect(result.etapa2.ufcPorG).toBe(100);
        });

        it('expone ufcPorG null cuando etapa2 no tiene valor', () => {
            const form = {
                idEntFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date(),
                etapa2: { coloniasContadas: 0 },
                muestras: []
            };

            const result = EnterobacteriasService.serializeFormulario(form);
            expect(result.ufcPorG).toBeNull();
        });
    });
});
