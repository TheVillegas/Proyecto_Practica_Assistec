const BaseFormRepository = require('../../src/repositories/baseForm.repository');

describe('T-002: BaseFormRepository', () => {
    let mockModel;
    let repo;

    beforeEach(() => {
        mockModel = {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            create: jest.fn(),
        };
        repo = new BaseFormRepository(mockModel, 'idTestFormulario');
    });

    describe('findById', () => {
        it('debe buscar por id usando findUnique con include completo', async () => {
            repo.getFullInclude = jest.fn().mockReturnValue({ muestras: true });
            mockModel.findUnique.mockResolvedValue({ idTestFormulario: 1n });

            const result = await repo.findById(1);

            expect(mockModel.findUnique).toHaveBeenCalledWith({
                where: { idTestFormulario: 1n },
                include: { muestras: true }
            });
            expect(result.idTestFormulario).toBe(1n);
        });
    });

    describe('findBySolicitudAnalisis', () => {
        it('debe buscar por idSolicitudAnalisis usando findFirst con include', async () => {
            repo.getFullInclude = jest.fn().mockReturnValue({ muestras: true });
            mockModel.findFirst.mockResolvedValue({ idSolicitudAnalisis: 5n });

            const result = await repo.findBySolicitudAnalisis(5);

            expect(mockModel.findFirst).toHaveBeenCalledWith({
                where: { idSolicitudAnalisis: 5n },
                include: { muestras: true }
            });
            expect(result.idSolicitudAnalisis).toBe(5n);
        });
    });

    describe('assertConcurrency', () => {
        it('debe lanzar NOT_FOUND si el registro no existe', async () => {
            mockModel.findUnique.mockResolvedValue(null);

            await expect(repo.assertConcurrency(1, new Date(), null))
                .rejects.toThrow('NOT_FOUND');
        });

        it('debe lanzar CONCURRENCY_ERROR si updatedAt no coincide', async () => {
            mockModel.findUnique.mockResolvedValue({ updatedAt: new Date('2024-02-01') });

            await expect(repo.assertConcurrency(1, new Date('2024-01-01'), null))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });

        it('debe permitir continuar si updatedAt coincide', async () => {
            const expected = new Date('2024-01-01');
            mockModel.findUnique.mockResolvedValue({ updatedAt: expected });

            await expect(repo.assertConcurrency(1, expected, null)).resolves.toBeUndefined();
        });
    });

    describe('touchFormulario', () => {
        it('debe actualizar updatedAt y campos extras', async () => {
            const tx = {
                update: jest.fn().mockResolvedValue({ count: 1 })
            };
            // touchFormulario uses this.model.update, not tx.update
            // Wait - let's check design: touchFormulario uses updateMany or update?
            // Design says: update({ where: { id }, data: { updatedAt: new Date(), ...extra } })
            mockModel.update.mockResolvedValue({ idTestFormulario: 1n });

            await repo.touchFormulario(1, { estado: 'cerrado' }, tx);

            expect(tx.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { idTestFormulario: 1n },
                data: expect.objectContaining({ updatedAt: expect.any(Date), estado: 'cerrado' })
            }));
        });
    });

    describe('create', () => {
        it('debe crear formulario con muestras en transaccion', async () => {
            repo.getFullInclude = jest.fn().mockReturnValue({ muestras: true });
            const tx = {
                create: jest.fn().mockResolvedValue({ idTestFormulario: 10n })
            };
            const data = {
                idSolicitudAnalisis: 1n,
                muestras: [{ idSolicitudMuestra: 2n }]
            };

            const result = await repo.create(data, tx);

            expect(tx.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    idSolicitudAnalisis: 1n,
                    muestras: { create: [{ idSolicitudMuestra: 2n }] }
                }),
                include: { muestras: true }
            });
            expect(result.idTestFormulario).toBe(10n);
        });
    });

    describe('updateEstado', () => {
        it('debe usar updateMany para TOCTOU fix y verificar count === 1', async () => {
            const expectedUpdatedAt = new Date('2024-01-01');
            mockModel.updateMany.mockResolvedValue({ count: 1 });
            mockModel.findUnique.mockResolvedValue({ idTestFormulario: 1n, estado: 'cerrado' });
            repo.getFullInclude = jest.fn().mockReturnValue({});

            const result = await repo.updateEstado(1, 'cerrado', 'etapaActual', 3, expectedUpdatedAt);

            expect(mockModel.updateMany).toHaveBeenCalledWith({
                where: { idTestFormulario: 1n, updatedAt: expectedUpdatedAt },
                data: { estado: 'cerrado', etapaActual: 3, updatedAt: expect.any(Date) }
            });
            expect(result.estado).toBe('cerrado');
        });

        it('debe lanzar CONCURRENCY_ERROR si count === 0', async () => {
            mockModel.updateMany.mockResolvedValue({ count: 0 });

            await expect(repo.updateEstado(1, 'cerrado', 'etapaActual', 3, new Date()))
                .rejects.toThrow('CONCURRENCY_ERROR');
        });
    });

    describe('getFullInclude', () => {
        it('debe lanzar error si no se sobrescribe', () => {
            const baseRepo = new BaseFormRepository(mockModel, 'id');
            expect(() => baseRepo.getFullInclude()).toThrow('Abstract');
        });
    });
});
