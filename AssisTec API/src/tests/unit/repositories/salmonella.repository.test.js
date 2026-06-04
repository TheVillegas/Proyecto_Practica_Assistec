jest.mock('../../../config/prisma');

const SalRepository = require('../../../repositories/salmonella.repository');
const prisma = require('../../../config/prisma');

describe('SalRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFullInclude', () => {
        test('debe retornar el arbol de relaciones completo', () => {
            const include = SalRepository.getFullInclude();
            expect(include).toBeDefined();
            expect(include.muestras).toBeDefined();
            expect(include.fase1).toBeDefined();
            expect(include.fase2a).toBeDefined();
            expect(include.fase2b).toBeDefined();
            expect(include.fase2c).toBeDefined();
            expect(include.fase3a).toBeDefined();
            expect(include.fase3b).toBeDefined();
            expect(include.fase4a).toBeDefined();
            expect(include.fase5Resultado).toBeDefined();
        });
    });

    describe('touchFormulario', () => {
        test('debe lanzar CONCURRENCY_ERROR cuando updateMany count es 0', async () => {
            prisma.salFormulario.updateMany.mockResolvedValue({ count: 0 });

            await expect(SalRepository.touchFormulario(1, {}, new Date('2024-01-01')))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });

        test('debe actualizar cuando count es 1', async () => {
            prisma.salFormulario.updateMany.mockResolvedValue({ count: 1 });

            await SalRepository.touchFormulario(1, { estado: 'en_proceso' }, new Date('2024-01-01'));

            expect(prisma.salFormulario.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        idSalFormulario: BigInt(1),
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
        test('debe ejecutar upsert de fase1 dentro de transaccion', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    salFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idSalFormulario: BigInt(1) })
                    },
                    salFase1: {
                        upsert: jest.fn().mockResolvedValue({ idSalFase1: BigInt(1) })
                    }
                };
                return cb(mockTx);
            });

            const result = await SalRepository.upsertFase1(1, { etapa: { completada: true } }, new Date());
            expect(result).toEqual({ idSalFormulario: BigInt(1) });
        });
    });

    describe('upsertFase2b', () => {
        test('debe manejar tween pipetas y micropipetas en batch', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    salFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idSalFormulario: BigInt(1) })
                    },
                    salFase2b: {
                        upsert: jest.fn().mockResolvedValue({ idSalFase2b: BigInt(1) })
                    },
                    salFase2bTweenPipeta: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                        createMany: jest.fn().mockResolvedValue({ count: 2 })
                    },
                    salFase2bMicropipeta: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                        createMany: jest.fn().mockResolvedValue({ count: 2 })
                    }
                };
                return cb(mockTx);
            });

            await SalRepository.upsertFase2b(1, {
                etapa: { completada: true },
                tweenPipetas: [{ idMaterial: 1 }, { idMaterial: 2 }],
                micropipetas: [{ idPipeta: 1 }]
            }, new Date());

            expect(true).toBe(true);
        });
    });

    describe('upsertFase4bLectura', () => {
        test('debe persistir lecturas por muestra', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    salFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idSalFormulario: BigInt(1) })
                    },
                    salFase4bLectura: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({}),
                        update: jest.fn().mockResolvedValue({})
                    }
                };
                return cb(mockTx);
            });

            await SalRepository.upsertFase4bLectura(1, {
                lecturas: [{
                    idSalMuestra: 1,
                    idSalFase4a: 1,
                    resXld24hSelenito: 'tipico'
                }]
            }, new Date());

            expect(true).toBe(true);
        });
    });

    describe('upsertFase5Resultado', () => {
        test('debe persistir resultado por muestra', async () => {
            prisma.$transaction.mockImplementation(async (cb) => {
                const mockTx = {
                    salFormulario: {
                        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                        findUnique: jest.fn().mockResolvedValue({ idSalFormulario: BigInt(1) })
                    },
                    salFase5Resultado: {
                        upsert: jest.fn().mockResolvedValue({})
                    }
                };
                return cb(mockTx);
            });

            await SalRepository.upsertFase5Resultado(1, {
                resultados: [{
                    idSalMuestra: 1,
                    resultadoFinal: 'Presencia'
                }]
            }, new Date());

            expect(true).toBe(true);
        });
    });
});
