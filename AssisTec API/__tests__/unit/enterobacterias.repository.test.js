const prisma = require('../../src/config/prisma');
const repo = require('../../src/repositories/enterobacterias.repository');

jest.mock('../../src/config/prisma', () => {
    const mockPrisma = {
        entFormulario: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn()
        },
        entEtapa1: { upsert: jest.fn() },
        entEtapa2: { upsert: jest.fn() },
        entEtapa3: { upsert: jest.fn() },
        $transaction: jest.fn((cb) => cb(mockPrisma))
    };
    return mockPrisma;
});

describe('T-ENT-003: EnterobacteriasRepository', () => {
    const expectedUpdatedAt = new Date('2024-01-01');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFullInclude', () => {
        it('retorna include con relaciones de etapas y muestras', () => {
            const include = repo.getFullInclude();

            expect(include).toHaveProperty('solicitudAnalisis');
            expect(include).toHaveProperty('analista');
            expect(include).toHaveProperty('muestras');
            expect(include).toHaveProperty('etapa1');
            expect(include).toHaveProperty('etapa2');
            expect(include).toHaveProperty('etapa3');
        });
    });

    describe('touchFormulario (TOCTOU fix)', () => {
        it('usa updateMany con id + updatedAt y verifica count === 1', async () => {
            prisma.entFormulario.updateMany.mockResolvedValue({ count: 1 });

            const result = await repo.touchFormulario('1', { estado: 'cerrado' }, expectedUpdatedAt);

            expect(prisma.entFormulario.updateMany).toHaveBeenCalledWith({
                where: { idEntFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: { updatedAt: expect.any(Date), estado: 'cerrado' }
            });
            expect(result.count).toBe(1);
        });

        it('lanza CONCURRENCY_ERROR si count === 0', async () => {
            prisma.entFormulario.updateMany.mockResolvedValue({ count: 0 });

            await expect(repo.touchFormulario('1', {}, expectedUpdatedAt))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });

        it('lanza error si no se provee expectedUpdatedAt', async () => {
            await expect(repo.touchFormulario('1', {}, null))
                .rejects.toThrow('MISSING_EXPECTED_UPDATED_AT');
        });
    });

    describe('upsertEtapa1', () => {
        it('hace upsert de etapa1 y actualiza etapa_actual', async () => {
            prisma.entEtapa1.upsert.mockResolvedValue({ idEntEtapa1: 10n });
            prisma.entFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.entFormulario.findUnique.mockResolvedValue({ idEntFormulario: 1n });

            const data = {
                etapa: {
                    codigoAli: 'ALI-1',
                    nActa: 'ACTA-1',
                    tipoMuestra: 'Mixta',
                    idLoteAgarVrbgSembrado: 1,
                    completada: true
                },
                etapaActual: 2
            };

            const result = await repo.upsertEtapa1('1', data, expectedUpdatedAt);

            expect(prisma.entEtapa1.upsert).toHaveBeenCalledWith({
                where: { idEntFormulario: 1n },
                create: expect.objectContaining({
                    idEntFormulario: 1n,
                    codigoAli: 'ALI-1',
                    idLoteAgarVrbgSembrado: 1n
                }),
                update: expect.objectContaining({
                    codigoAli: 'ALI-1',
                    idLoteAgarVrbgSembrado: 1n
                })
            });
            expect(prisma.entFormulario.updateMany).toHaveBeenCalledWith({
                where: { idEntFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: expect.objectContaining({ etapaActual: 2, updatedAt: expect.any(Date) })
            });
            expect(result.idEntFormulario).toBe(1n);
        });
    });

    describe('upsertEtapa3', () => {
        it('hace upsert de etapa3 y cierra formulario cuando completada es true', async () => {
            prisma.entEtapa3.upsert.mockResolvedValue({ idEntEtapa3: 30n });
            prisma.entFormulario.updateMany.mockResolvedValue({ count: 1 });
            prisma.entFormulario.findUnique.mockResolvedValue({ idEntFormulario: 1n });

            const data = {
                etapa: {
                    fechaTraspaso: new Date('2024-01-01'),
                    reactivoOxidasa: 'R69-25-01',
                    idAgarNutritivo: 2,
                    completada: true
                },
                estado: 'cerrado'
            };

            await repo.upsertEtapa3('1', data, expectedUpdatedAt);

            expect(prisma.entFormulario.updateMany).toHaveBeenCalledWith({
                where: { idEntFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: expect.objectContaining({ estado: 'cerrado', updatedAt: expect.any(Date) })
            });
        });
    });
});
