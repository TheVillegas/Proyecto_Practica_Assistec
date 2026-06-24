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

describe('T-ENT-002: EnterobacteriasService', () => {
    const usuarioAnalista = { id: '1-9', roles: [ROLES.ANALISTA] };
    const usuarioAdmin = { id: 'admin-1', roles: [ROLES.ADMINISTRATOR] };
    const usuarioLectura = { id: 'coord-1', roles: [ROLES.COORDINADORA] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assertCanWrite', () => {
        it('permite a ANALISTA y ADMIN', () => {
            expect(() => EnterobacteriasService.assertCanWrite(usuarioAnalista)).not.toThrow();
            expect(() => EnterobacteriasService.assertCanWrite(usuarioAdmin)).not.toThrow();
        });

        it('rechaza a COORDINADORA y JEFE_AREA', () => {
            expect(() => EnterobacteriasService.assertCanWrite(usuarioLectura)).toThrow('UNAUTHORIZED_ROLE');
            expect(() => EnterobacteriasService.assertCanWrite({ roles: [ROLES.JEFE_AREA] })).toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('serializeFormulario', () => {
        it('serializa BigInt y expone updated_at como ISO string', () => {
            const form = {
                idEntFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date('2024-01-01T00:00:00.000Z'),
                muestras: []
            };
            const result = EnterobacteriasService.serializeFormulario(form);

            expect(result.id_ent_formulario).toBe('1');
            expect(result.id_solicitud_analisis).toBe('2');
            expect(typeof result.updated_at).toBe('string');
            expect(result.updated_at).toBe('2024-01-01T00:00:00.000Z');
        });
    });

    describe('guardarEtapa — progresion de etapas', () => {
        it('permite etapa 1 sin prerequisitos', async () => {
            enterobacteriasRepository.findById.mockResolvedValue({
                idEntFormulario: 1n,
                etapa1: null,
                etapa2: null,
                updatedAt: new Date()
            });
            enterobacteriasRepository.upsertEtapa1.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = {
                updated_at: new Date().toISOString(),
                completada: false,
                etapa: { codigo_ali: 'ALI-1' }
            };

            const result = await EnterobacteriasService.guardarEtapa('1', '1', body, new Date(), usuarioAnalista);
            expect(result.id_ent_formulario).toBe('1');
            expect(enterobacteriasRepository.upsertEtapa1).toHaveBeenCalled();
        });

        it('rechaza etapa 2 si etapa 1 no esta completada', async () => {
            enterobacteriasRepository.findById.mockResolvedValue({
                idEntFormulario: 1n,
                etapa1: { completada: false },
                updatedAt: new Date()
            });

            await expect(EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {}
            }, new Date(), usuarioAnalista)).rejects.toThrow('INVALID_STAGE_PROGRESSION');
        });

        it('permite etapa 2 cuando etapa 1 esta completada', async () => {
            enterobacteriasRepository.findById.mockResolvedValue({
                idEntFormulario: 1n,
                etapa1: { completada: true, fechaInicioIncubacion: new Date('2024-01-01T00:00:00.000Z') },
                updatedAt: new Date()
            });
            enterobacteriasRepository.upsertEtapa2.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-02T01:00:00.000Z').getTime());

            await EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {
                    fecha_lectura_24h: '2024-01-02T01:00:00.000Z',
                    hora_lectura_24h: '01:00',
                    rut_analista_lectura: '1-9',
                    id_equipo_cuenta_colonias: 1,
                    n_muestra_lectura: 1,
                    dilucion: 10,
                    colonias_contadas: 5
                }
            }, new Date(), usuarioAnalista);

            expect(enterobacteriasRepository.upsertEtapa2).toHaveBeenCalled();
            Date.now.mockRestore();
        });
    });

    describe('guardarEtapa — bloqueo 24h incubacion', () => {
        const baseForm = {
            idEntFormulario: 1n,
            etapa1: {
                completada: true,
                fechaInicioIncubacion: new Date('2026-06-22T08:00:00.000Z')
            },
            etapa2: null,
            updatedAt: new Date()
        };

        const runWithNow = (nowIso, expectedError) => {
            enterobacteriasRepository.findById.mockResolvedValue(baseForm);
            jest.spyOn(Date, 'now').mockReturnValue(new Date(nowIso).getTime());
        };

        it('rechaza a las 12h con INCUBATION_LOCKOUT', async () => {
            runWithNow('2026-06-22T20:00:00.000Z');

            await expect(EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: { colonias_contadas: 5 }
            }, new Date(), usuarioAnalista)).rejects.toThrow('INCUBATION_LOCKOUT');

            Date.now.mockRestore();
        });

        it('rechaza a las 22h con INCUBATION_LOCKOUT', async () => {
            runWithNow('2026-06-23T06:00:00.000Z');

            await expect(EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: { colonias_contadas: 5 }
            }, new Date(), usuarioAnalista)).rejects.toThrow('INCUBATION_LOCKOUT');

            Date.now.mockRestore();
        });

        it('permite a las 24.5h', async () => {
            runWithNow('2026-06-23T08:30:00.000Z');
            enterobacteriasRepository.upsertEtapa2.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            await EnterobacteriasService.guardarEtapa('1', '2', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {
                    fecha_lectura_24h: '2026-06-23T08:30:00.000Z',
                    hora_lectura_24h: '08:30',
                    rut_analista_lectura: '1-9',
                    id_equipo_cuenta_colonias: 1,
                    n_muestra_lectura: 1,
                    dilucion: 10,
                    colonias_contadas: 5
                }
            }, new Date(), usuarioAnalista);

            expect(enterobacteriasRepository.upsertEtapa2).toHaveBeenCalled();
            Date.now.mockRestore();
        });
    });

    describe('guardarEtapa — mapping', () => {
        it('mapea payload etapa1 con snake_case y camelCase', async () => {
            enterobacteriasRepository.findById.mockResolvedValue({
                idEntFormulario: 1n,
                etapa1: null,
                updatedAt: new Date()
            });
            enterobacteriasRepository.upsertEtapa1.mockResolvedValue({
                idEntFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            await EnterobacteriasService.guardarEtapa('1', '1', {
                updated_at: new Date().toISOString(),
                completada: true,
                etapa: {
                    codigo_ali: 'ALI-1',
                    n_acta: 'ACTA-1',
                    tipo_muestra: 'Mixta',
                    fecha_inicio: '2026-06-22',
                    hora_inicio: '08:00',
                    rut_analista_inicio: '1-9',
                    fecha_homog: '2026-06-22',
                    hora_homog: '09:00',
                    rut_analista_homog: '1-9',
                    id_lote_agar_vrbg_sembrado: 1,
                    id_estufa_sembrado: 2,
                    placas_sembrado: 2,
                    id_micropipeta: 3,
                    fecha_sembrado: '2026-06-22',
                    hora_sembrado: '10:00',
                    rut_analista_sembrado: '1-9',
                    id_estufa_incub: 2,
                    fecha_inicio_incubacion: '2026-06-22T10:00:00.000Z',
                    fecha_fin_incubacion: '2026-06-23T10:00:00.000Z',
                    rut_analista_incub: '1-9'
                }
            }, new Date(), usuarioAnalista);

            const callArgs = enterobacteriasRepository.upsertEtapa1.mock.calls[0];
            expect(callArgs[1].etapa).toMatchObject({
                codigoAli: 'ALI-1',
                nActa: 'ACTA-1',
                tipoMuestra: 'Mixta',
                idLoteAgarVrbgSembrado: 1,
                idEstufaSembrado: 2,
                placasSembrado: 2,
                idMicropipeta: 3
            });
            expect(callArgs[1].etapa.fechaInicioIncubacion).toBeInstanceOf(Date);
        });
    });
});
