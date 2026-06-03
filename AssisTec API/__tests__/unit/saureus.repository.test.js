const prisma = require('../../src/config/prisma');
const repo = require('../../src/repositories/saureus.repository');

// Mockear prisma
jest.mock('../../src/config/prisma', () => {
    const mockPrisma = {
        sauFormulario: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn()
        },
        sauEtapa1: { upsert: jest.fn() },
        sauEtapa1Micropipeta: { deleteMany: jest.fn(), createMany: jest.fn() },
        sauEtapa1Lectura: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
        sauEtapa2: { upsert: jest.fn() },
        sauEtapa3: { upsert: jest.fn() },
        sauEtapa3Lectura: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
        sauEtapa4: { upsert: jest.fn() },
        sauEtapa4Lectura: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
        sauEtapa5Resultado: { upsert: jest.fn() },
        sauEtapa6Cierre: { upsert: jest.fn() },
        $transaction: jest.fn((cb) => cb(mockPrisma))
    };
    return mockPrisma;
});

describe('T-007: SauRepository', () => {
    const expectedUpdatedAt = new Date('2024-01-01');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFullInclude', () => {
        it('debe retornar include profundo con todas las relaciones anidadas', () => {
            const include = repo.getFullInclude();

            expect(include).toHaveProperty('solicitudAnalisis');
            expect(include).toHaveProperty('analista');
            expect(include).toHaveProperty('muestras');
            expect(include).toHaveProperty('etapa1');
            expect(include).toHaveProperty('etapa2');
            expect(include).toHaveProperty('etapa3');
            expect(include).toHaveProperty('etapa4');
            expect(include).toHaveProperty('etapa5Resultado');
            expect(include).toHaveProperty('etapa6Cierre');
            expect(include.muestras).toHaveProperty('include');
            expect(include.muestras.include).toHaveProperty('etapa1Lecturas');
            expect(include.muestras.include).toHaveProperty('etapa3Lecturas');
            expect(include.muestras.include).toHaveProperty('etapa4Lecturas');
            expect(include.muestras.include).toHaveProperty('etapa5Resultados');
        });
    });

    describe('findById (heredado)', () => {
        it('debe usar findUnique con BigInt y include completo', async () => {
            repo.getFullInclude = jest.fn().mockReturnValue({ muestras: true });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const result = await repo.findById('1');

            expect(prisma.sauFormulario.findUnique).toHaveBeenCalledWith({
                where: { idSauFormulario: 1n },
                include: { muestras: true }
            });
            expect(result.idSauFormulario).toBe(1n);
        });
    });

    describe('touchFormulario (TOCTOU fix)', () => {
        it('debe usar updateMany con id + updatedAt y verificar count === 1', async () => {
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });

            const result = await repo.touchFormulario('1', { estado: 'cerrado' }, expectedUpdatedAt);

            expect(prisma.sauFormulario.updateMany).toHaveBeenCalledWith({
                where: { idSauFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: { updatedAt: expect.any(Date), estado: 'cerrado' }
            });
            expect(result.count).toBe(1);
        });

        it('debe lanzar CONCURRENCY_ERROR si count === 0', async () => {
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 0 });

            await expect(repo.touchFormulario('1', {}, expectedUpdatedAt))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });

        it('debe lanzar error si no se provee expectedUpdatedAt', async () => {
            await expect(repo.touchFormulario('1', {}, null))
                .rejects.toThrow('MISSING_EXPECTED_UPDATED_AT');
        });
    });

    describe('upsertEtapa1', () => {
        it('debe hacer upsert de etapa1, micropipetas y lecturas en transaccion', async () => {
            prisma.sauEtapa1.upsert.mockResolvedValue({ idSauEtapa1: 10n });
            prisma.sauEtapa1Micropipeta.deleteMany.mockResolvedValue({ count: 0 });
            prisma.sauEtapa1Micropipeta.createMany.mockResolvedValue({ count: 2 });
            prisma.sauEtapa1Lectura.findFirst.mockResolvedValue(null);
            prisma.sauEtapa1Lectura.create.mockResolvedValue({});
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });

            const data = {
                etapa: { fechaInicioIncubacion: new Date(), completada: true },
                micropipetas: [
                    { idPipeta: 1, capacidad: '1ml' },
                    { idPipeta: 2, capacidad: '5ml' }
                ],
                lecturas: [
                    { idSauMuestra: '100', conteo24hPlaca1: 10, conteo24hPlaca2: 12 }
                ]
            };

            const result = await repo.upsertEtapa1('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa1.upsert).toHaveBeenCalled();
            expect(prisma.sauEtapa1Micropipeta.deleteMany).toHaveBeenCalledWith({ where: { idSauEtapa1: 10n } });
            expect(prisma.sauEtapa1Micropipeta.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({ idSauEtapa1: 10n, idPipeta: 1, capacidad: '1ml' })
                ])
            });
            expect(prisma.sauEtapa1Lectura.create).toHaveBeenCalled();
            expect(prisma.sauFormulario.updateMany).toHaveBeenCalled();
            expect(result.idSauFormulario).toBe(1n);
        });

        it('debe actualizar lectura existente en etapa1', async () => {
            prisma.sauEtapa1.upsert.mockResolvedValue({ idSauEtapa1: 10n });
            prisma.sauEtapa1Micropipeta.deleteMany.mockResolvedValue({ count: 0 });
            prisma.sauEtapa1Lectura.findFirst.mockResolvedValue({ idSauEtapa1Lectura: 500n });
            prisma.sauEtapa1Lectura.update.mockResolvedValue({});
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { completada: true },
                lecturas: [
                    { idSauMuestra: '100', conteo24hPlaca1: 20, conteo24hPlaca2: 22 }
                ]
            };

            await repo.upsertEtapa1('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa1Lectura.update).toHaveBeenCalledWith({
                where: { idSauEtapa1Lectura: 500n },
                data: expect.objectContaining({ conteo24hPlaca1: 20, conteo24hPlaca2: 22 })
            });
        });

        it('no debe llamar createMany si micropipetas esta vacio', async () => {
            prisma.sauEtapa1.upsert.mockResolvedValue({ idSauEtapa1: 10n });
            prisma.sauEtapa1Micropipeta.deleteMany.mockResolvedValue({ count: 0 });
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { completada: true },
                micropipetas: []
            };

            await repo.upsertEtapa1('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa1Micropipeta.createMany).not.toHaveBeenCalled();
        });
    });

    describe('upsertEtapa2', () => {
        it('debe hacer upsert simple de etapa2', async () => {
            prisma.sauEtapa2.upsert.mockResolvedValue({ idSauEtapa2: 20n });
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { ctrlSiembraSAureusUfc: 100, completada: true }
            };

            const result = await repo.upsertEtapa2('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa2.upsert).toHaveBeenCalledWith({
                where: { idSauFormulario: 1n },
                create: expect.objectContaining({ idSauFormulario: 1n, ctrlSiembraSAureusUfc: 100, completada: true }),
                update: expect.objectContaining({ ctrlSiembraSAureusUfc: 100, completada: true })
            });
            expect(result.idSauFormulario).toBe(1n);
        });
    });

    describe('upsertEtapa3', () => {
        it('debe hacer upsert de etapa3 y lecturas', async () => {
            prisma.sauEtapa3.upsert.mockResolvedValue({ idSauEtapa3: 30n });
            prisma.sauEtapa3Lectura.findFirst.mockResolvedValue({ idSauEtapa3Lectura: 300n });
            prisma.sauEtapa3Lectura.update.mockResolvedValue({});
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { fechaHoraTraspaso: new Date(), completada: true },
                lecturas: [
                    { idSauMuestra: '100', coloniasPlaca1: 15, coloniasPlaca2: 18 }
                ]
            };

            const result = await repo.upsertEtapa3('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa3.upsert).toHaveBeenCalled();
            expect(prisma.sauEtapa3Lectura.update).toHaveBeenCalled();
            expect(result.idSauFormulario).toBe(1n);
        });
    });

    describe('upsertEtapa4', () => {
        it('debe hacer upsert de etapa4 con lecturas tipificadas (4-6h y 24h)', async () => {
            prisma.sauEtapa4.upsert.mockResolvedValue({ idSauEtapa4: 40n });
            prisma.sauEtapa4Lectura.findFirst.mockResolvedValue(null);
            prisma.sauEtapa4Lectura.create.mockResolvedValue({});
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { fechaHoraPrueba: new Date(), completada: true },
                lecturas: [
                    { idSauMuestra: '100', tipoLectura: '4-6h', coloniasPlaca1: 5, coloniasPlaca2: 6 },
                    { idSauMuestra: '100', tipoLectura: '24h', coloniasPlaca1: 20, coloniasPlaca2: 22 }
                ]
            };

            const result = await repo.upsertEtapa4('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa4.upsert).toHaveBeenCalled();
            expect(prisma.sauEtapa4Lectura.create).toHaveBeenCalledTimes(2);
            expect(prisma.sauEtapa4Lectura.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ tipoLectura: '4-6h' })
                })
            );
            expect(prisma.sauEtapa4Lectura.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ tipoLectura: '24h' })
                })
            );
            expect(result.idSauFormulario).toBe(1n);
        });
    });

    describe('upsertEtapa5Resultados', () => {
        it('debe hacer upsert de resultados por muestra', async () => {
            prisma.sauEtapa5Resultado.upsert.mockResolvedValue({});
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                resultados: [
                    {
                        idSauMuestra: '100',
                        nSAureus: 500,
                        ufcPorG: 500,
                        incongruenciaDetectada: false
                    }
                ]
            };

            const result = await repo.upsertEtapa5Resultados('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa5Resultado.upsert).toHaveBeenCalledWith({
                where: { idSauMuestra: 100n },
                create: expect.objectContaining({ idSauMuestra: 100n, nSAureus: 500, ufcPorG: 500 }),
                update: expect.objectContaining({ nSAureus: 500, ufcPorG: 500 })
            });
            expect(result.idSauFormulario).toBe(1n);
        });
    });

    describe('upsertEtapa6Cierre', () => {
        it('debe hacer upsert de cierre y actualizar estado explicito', async () => {
            prisma.sauEtapa6Cierre.upsert.mockResolvedValue({ idSauEtapa6: 60n });
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { desfavorable: true, cerrado: true },
                estado: 'cerrado'
            };

            const result = await repo.upsertEtapa6Cierre('1', data, expectedUpdatedAt);

            expect(prisma.sauEtapa6Cierre.upsert).toHaveBeenCalledWith({
                where: { idSauFormulario: 1n },
                create: expect.objectContaining({ idSauFormulario: 1n, desfavorable: true, cerrado: true }),
                update: expect.objectContaining({ desfavorable: true, cerrado: true })
            });
            expect(prisma.sauFormulario.updateMany).toHaveBeenCalledWith({
                where: { idSauFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: expect.objectContaining({ estado: 'cerrado', etapaActual: 6, updatedAt: expect.any(Date) })
            });
            expect(result.idSauFormulario).toBe(1n);
        });

        it('debe inferir estado en_proceso cuando cerrado es false', async () => {
            prisma.sauEtapa6Cierre.upsert.mockResolvedValue({ idSauEtapa6: 60n });
            prisma.sauFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.sauFormulario.findUnique.mockResolvedValue({ idSauFormulario: 1n });

            const data = {
                etapa: { desfavorable: false, cerrado: false }
            };

            await repo.upsertEtapa6Cierre('1', data, expectedUpdatedAt);

            expect(prisma.sauFormulario.updateMany).toHaveBeenCalledWith({
                where: expect.any(Object),
                data: expect.objectContaining({ estado: 'en_proceso' })
            });
        });
    });
});
