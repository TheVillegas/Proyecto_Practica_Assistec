const { serializePrismaRecord } = require('../../src/utils/prismaSerialize');
const SauService = require('../../src/services/saureus.service');
const saureusRepository = require('../../src/repositories/saureus.repository');
const ROLES = require('../../src/config/roles');

jest.mock('../../src/repositories/saureus.repository', () => ({
    findById: jest.fn(),
    findBySolicitudAnalisis: jest.fn(),
    create: jest.fn(),
    upsertEtapa1: jest.fn(),
    upsertEtapa2: jest.fn(),
    upsertEtapa3: jest.fn(),
    upsertEtapa4: jest.fn(),
    upsertEtapa5Resultados: jest.fn(),
    upsertEtapa6Cierre: jest.fn()
}));

describe('T-008: SauService', () => {
    const usuarioAnalista = { id: '12345678-9', roles: [ROLES.ANALISTA] };
    const usuarioAdmin = { id: 'admin-1', roles: [ROLES.ADMINISTRATOR] };
    const usuarioLectura = { id: 'coord-1', roles: [ROLES.COORDINADORA] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assertCanWrite', () => {
        it('debe permitir a ANALISTA y ADMIN', () => {
            expect(() => SauService.assertCanWrite(usuarioAnalista)).not.toThrow();
            expect(() => SauService.assertCanWrite(usuarioAdmin)).not.toThrow();
        });

        it('debe rechazar a COORDINADORA y JEFE_AREA', () => {
            expect(() => SauService.assertCanWrite(usuarioLectura)).toThrow('UNAUTHORIZED_ROLE');
            expect(() => SauService.assertCanWrite({ roles: [ROLES.JEFE_AREA] })).toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('serializeFormulario', () => {
        it('debe serializar BigInt y exponer updated_at como ISO string', () => {
            const form = {
                idSauFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date('2024-01-01T00:00:00.000Z'),
                muestras: []
            };
            const result = SauService.serializeFormulario(form);

            expect(result.id_sau_formulario).toBe('1');
            expect(result.id_solicitud_analisis).toBe('2');
            expect(typeof result.updated_at).toBe('string');
            expect(result.updated_at).toBe('2024-01-01T00:00:00.000Z');
        });

        it('debe retornar null para input null', () => {
            expect(SauService.serializeFormulario(null)).toBeNull();
        });
    });

    describe('crear', () => {
        it('debe crear formulario con muestras mapeadas', async () => {
            saureusRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            saureusRepository.create.mockResolvedValue({
                idSauFormulario: 10n,
                idSolicitudAnalisis: 5n,
                updatedAt: new Date(),
                muestras: []
            });

            const data = {
                id_solicitud_analisis: '5',
                muestras: [
                    { id_solicitud_muestra: '100', numero_muestra: 'M1' },
                    { id_solicitud_muestra: '101', numero_muestra: 'M2', es_duplicado: true }
                ]
            };

            const result = await SauService.crear(data, usuarioAnalista);

            expect(saureusRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                idSolicitudAnalisis: '5',
                rutAnalista: expect.any(String),
                muestras: expect.arrayContaining([
                    expect.objectContaining({ idSolicitudMuestra: '100', numeroMuestra: 'M1', esDuplicado: false })
                ])
            }));
            expect(result.id_sau_formulario).toBe('10');
        });

        it('debe lanzar FORMULARIO_ALREADY_EXISTS si ya existe', async () => {
            saureusRepository.findBySolicitudAnalisis.mockResolvedValue({ idSauFormulario: 1n });

            await expect(SauService.crear({ id_solicitud_analisis: '5', muestras: [{ numero_muestra: 'M1' }] }, usuarioAnalista))
                .rejects.toThrow('FORMULARIO_ALREADY_EXISTS');
        });
    });

    describe('obtener', () => {
        it('debe obtener y serializar formulario por id', async () => {
            saureusRepository.findById.mockResolvedValue({
                idSauFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date(),
                muestras: []
            });

            const result = await SauService.obtener('1');

            expect(saureusRepository.findById).toHaveBeenCalledWith('1');
            expect(result.id_sau_formulario).toBe('1');
        });

        it('debe lanzar NOT_FOUND si no existe', async () => {
            saureusRepository.findById.mockResolvedValue(null);

            await expect(SauService.obtener('999')).rejects.toThrow('NOT_FOUND');
        });
    });

    describe('obtenerPorAnalisis', () => {
        it('debe retornar existe=true con formulario serializado', async () => {
            saureusRepository.findBySolicitudAnalisis.mockResolvedValue({
                idSauFormulario: 1n,
                idSolicitudAnalisis: 2n,
                updatedAt: new Date(),
                muestras: []
            });

            const result = await SauService.obtenerPorAnalisis('2');

            expect(result.existe).toBe(true);
            expect(result.formulario.id_solicitud_analisis).toBe('2');
        });

        it('debe retornar existe=false cuando no hay formulario', async () => {
            saureusRepository.findBySolicitudAnalisis.mockResolvedValue(null);

            const result = await SauService.obtenerPorAnalisis('99');

            expect(result.existe).toBe(false);
            expect(result.formulario).toBeNull();
        });
    });

    describe('guardarEtapa — payload mapping', () => {
        it('debe mapear etapa1 con snake_case y camelCase', async () => {
            saureusRepository.upsertEtapa1.mockResolvedValue({
                idSauFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = {
                fecha_inicio_incubacion: '2024-01-01T00:00:00.000Z',
                codigo_agar_baird_parker: 'AGAR-001',
                id_estufa: 5,
                completada: true
            };

            const result = await SauService.guardarEtapa('1', '1', body, new Date(), usuarioAnalista);

            expect(saureusRepository.upsertEtapa1).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    etapa: expect.objectContaining({
                        fechaInicioIncubacion: expect.any(Date),
                        codigoAgarBairdParker: 'AGAR-001',
                        idEstufa: 5,
                        completada: true
                    })
                }),
                expect.any(Date)
            );
            expect(result.id_sau_formulario).toBe('1');
        });

        it('debe mapear etapa4 con lecturas tipificadas', async () => {
            saureusRepository.upsertEtapa4.mockResolvedValue({
                idSauFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = {
                fecha_hora_prueba: '2024-01-01T00:00:00.000Z',
                id_estufa: 3,
                lecturas: [
                    { id_sau_muestra: '100', tipo_lectura: '4-6h', colonias_placa1: 5, colonias_placa2: 6 }
                ],
                completada: true
            };

            await SauService.guardarEtapa('1', '4', body, new Date(), usuarioAnalista);

            expect(saureusRepository.upsertEtapa4).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    lecturas: expect.arrayContaining([
                        expect.objectContaining({ tipoLectura: '4-6h', coloniasPlaca1: 5, coloniasPlaca2: 6, idSauMuestra: '100' })
                    ])
                }),
                expect.any(Date)
            );
        });
    });

    describe('guardarEtapa5 — calculo UFC/g automatico', () => {
        it('debe calcular UFC/g y sobreescribir resultados del cliente', async () => {
            const mockForm = {
                idSauFormulario: 1n,
                muestras: [
                    {
                        idSauMuestra: 100n,
                        numeroMuestra: 'M1',
                        etapa1Lecturas: [
                            { conteo48hPlaca1: 50, conteo48hPlaca2: 52 }
                        ],
                        etapa3Lecturas: [
                            { coloniasPlaca1: 3, coloniasPlaca2: 3 }
                        ],
                        etapa4Lecturas: [
                            { tipoLectura: '4-6h', coloniasPlaca1: 2, coloniasPlaca2: 2 }
                        ]
                    }
                ],
                etapa1: { pesoMuestraTipo: '1g' },
                updatedAt: new Date()
            };
            saureusRepository.findById.mockResolvedValue(mockForm);
            saureusRepository.upsertEtapa5Resultados.mockResolvedValue({
                idSauFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = {
                resultados: [
                    { id_sau_muestra: '100', n_s_aureus: 999, ufc_por_g: 999 } // cliente envia valores incorrectos
                ]
            };

            await SauService.guardarEtapa('1', '5', body, new Date(), usuarioAnalista);

            expect(saureusRepository.upsertEtapa5Resultados).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    resultados: expect.arrayContaining([
                        expect.objectContaining({
                            idSauMuestra: '100',
                            nSAureus: expect.any(Number),
                            ufcPorG: expect.any(Number)
                        })
                    ])
                }),
                expect.any(Date)
            );

            // Verificar que se sobreescribio con el valor calculado (no 999)
            const callArgs = saureusRepository.upsertEtapa5Resultados.mock.calls[0];
            const resultados = callArgs[1].resultados;
            const res = resultados.find((r) => r.idSauMuestra === '100');
            expect(res.nSAureus).not.toBe(999);
            expect(res.ufcPorG).not.toBe(999);
        });

        it('debe usar valores del cliente si no hay lecturas para calcular', async () => {
            const mockForm = {
                idSauFormulario: 1n,
                muestras: [
                    {
                        idSauMuestra: 100n,
                        numeroMuestra: 'M1',
                        etapa1Lecturas: [],
                        etapa3Lecturas: [],
                        etapa4Lecturas: []
                    }
                ],
                updatedAt: new Date()
            };
            saureusRepository.findById.mockResolvedValue(mockForm);
            saureusRepository.upsertEtapa5Resultados.mockResolvedValue({
                idSauFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = {
                resultados: [
                    { id_sau_muestra: '100', n_s_aureus: 250, ufc_por_g: 250 }
                ]
            };

            await SauService.guardarEtapa('1', '5', body, new Date(), usuarioAnalista);

            const callArgs = saureusRepository.upsertEtapa5Resultados.mock.calls[0];
            const resultados = callArgs[1].resultados;
            const res = resultados.find((r) => r.idSauMuestra === '100');
            // Sin lecturas, debe mantener los valores del cliente
            expect(res.nSAureus).toBe(250);
            expect(res.ufcPorG).toBe(250);
        });
    });

    describe('guardarEtapa — validacion general', () => {
        it('debe rechazar etapa invalida', async () => {
            await expect(SauService.guardarEtapa('1', '99', {}, new Date(), usuarioAnalista))
                .rejects.toThrow('INVALID_ETAPA');
        });

        it('debe rechazar usuario sin permiso de escritura', async () => {
            await expect(SauService.guardarEtapa('1', '1', {}, new Date(), usuarioLectura))
                .rejects.toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('guardarEtapa6 — validacion de etapas previas', () => {
        it('debe rechazar cierre si etapas 1-5 no estan completadas', async () => {
            const mockForm = {
                idSauFormulario: 1n,
                etapa1: { completada: true },
                etapa2: { completada: true },
                etapa3: { completada: false }, // incompleta
                etapa4: { completada: true },
                etapa5Resultado: [{}],
                updatedAt: new Date()
            };
            saureusRepository.findById.mockResolvedValue(mockForm);

            const body = { etapa: { cerrado: true } };

            await expect(SauService.guardarEtapa('1', '6', body, new Date(), usuarioAnalista))
                .rejects.toThrow('INVALID_STAGE_PROGRESSION');
        });

        it('debe permitir cierre cuando etapas 1-5 estan completadas', async () => {
            const mockForm = {
                idSauFormulario: 1n,
                etapa1: { completada: true },
                etapa2: { completada: true },
                etapa3: { completada: true },
                etapa4: { completada: true },
                etapa5Resultado: [{ idSauEtapa5Resultado: 1n }],
                updatedAt: new Date()
            };
            saureusRepository.findById.mockResolvedValue(mockForm);
            saureusRepository.upsertEtapa6Cierre.mockResolvedValue({
                idSauFormulario: 1n,
                updatedAt: new Date(),
                muestras: []
            });

            const body = { etapa: { cerrado: true } };

            const result = await SauService.guardarEtapa('1', '6', body, new Date(), usuarioAnalista);

            expect(saureusRepository.upsertEtapa6Cierre).toHaveBeenCalled();
            expect(result.id_sau_formulario).toBe('1');
        });
    });
});
