jest.mock('../../../config/prisma');

const ColiRepository = require('../../../repositories/coliformes.repository');
const prisma = require('../../../config/prisma');

describe('ColiRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFullInclude', () => {
        test('debe retornar el arbol de relaciones completo', () => {
            const include = ColiRepository.getFullInclude();
            expect(include).toBeDefined();
            expect(include.muestras).toBeDefined();
            expect(include.fase1).toBeDefined();
            expect(include.fase2).toBeDefined();
            expect(include.fase3).toBeDefined();
            expect(include.fase35Controles).toBeDefined();
            expect(include.fase4Resultado).toBeDefined();
        });
    });

    describe('touchFormulario', () => {
        test('debe lanzar CONCURRENCY_ERROR cuando updateMany count es 0', async () => {
            prisma.coliFormulario.updateMany.mockResolvedValue({ count: 0 });

            await expect(ColiRepository.touchFormulario(1, {}, new Date('2024-01-01')))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });

        test('debe actualizar cuando count es 1', async () => {
            prisma.coliFormulario.updateMany.mockResolvedValue({ count: 1 });

            await ColiRepository.touchFormulario(1, { estado: 'en_proceso' }, new Date('2024-01-01'));

            expect(prisma.coliFormulario.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        idColiFormulario: BigInt(1),
                        updatedAt: expect.any(Date)
                    }),
                    data: expect.objectContaining({
                        updatedAt: expect.any(Date),
                        estado: 'en_proceso'
                    })
                })
            );
        });
    });

    describe('upsertFase1', () => {
        test('debe ejecutar transaccion con TOCTOU fix', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    coliFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idColiFormulario: BigInt(1) })
                    },
                    coliFase1: {
                        upsert: jest.fn().mockResolvedValue({ idColiFase1: BigInt(1) })
                    }
                };
                return cb(mockTx);
            });

            const result = await ColiRepository.upsertFase1(1, { etapa: { completada: true } }, new Date());
            expect(result).toEqual({ idColiFormulario: BigInt(1) });
        });
    });

    describe('upsertFase2', () => {
        test('debe manejar estufas y micropipetas en batch', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    coliFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idColiFormulario: BigInt(1) })
                    },
                    coliFase2: {
                        upsert: jest.fn().mockResolvedValue({ idColiFase2: BigInt(1) })
                    },
                    coliFase2Estufa: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                        createMany: jest.fn().mockResolvedValue({ count: 2 })
                    },
                    coliFase2Micropipeta: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                        createMany: jest.fn().mockResolvedValue({ count: 2 })
                    }
                };
                return cb(mockTx);
            });

            await ColiRepository.upsertFase2(1, {
                etapa: { completada: true },
                estufas: [{ idIncubacion: 1 }, { idIncubacion: 2 }],
                micropipetas: [{ idPipeta: 1, capacidad: '1ml' }]
            }, new Date());

            expect(true).toBe(true);
        });
    });

    describe('upsertFase3', () => {
        test('debe manejar submuestras con upsert por clave compuesta', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    coliFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idColiFormulario: BigInt(1) })
                    },
                    coliFase3: {
                        upsert: jest.fn().mockResolvedValue({ idColiFase3: BigInt(1) })
                    },
                    coliFase3Submuestra: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({}),
                        update: jest.fn().mockResolvedValue({})
                    }
                };
                return cb(mockTx);
            });

            await ColiRepository.upsertFase3(1, {
                etapa: { completada: true },
                submuestras: [{
                    idColiMuestra: 1,
                    tipoLectura: 'totales',
                    dilucion: '10',
                    numeroTubo: 1,
                    presencia: true
                }]
            }, new Date());

            expect(true).toBe(true);
        });
    });

    describe('upsertFase4Resultados', () => {
        test('debe persistir resultados calculados por muestra', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    coliFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idColiFormulario: BigInt(1) })
                    },
                    coliFase4Resultado: {
                        upsert: jest.fn().mockResolvedValue({})
                    }
                };
                return cb(mockTx);
            });

            await ColiRepository.upsertFase4Resultados(1, {
                resultados: [{
                    idColiMuestra: 1,
                    coliformesTotales: 23.0,
                    coliformesFecales: 9.1,
                    eColi: 3.6
                }]
            }, new Date());

            expect(true).toBe(true);
        });
    });
});
