const optimisticLock = require('../../src/middleware/optimisticLock');

describe('T-004: Optimistic Lock Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {}, query: {}, headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('debe usar ?? para evitar falsy-coercion (fecha 1970-01-01 es valida)', () => {
        req.body.updated_at = '1970-01-01T00:00:00.000Z';
        optimisticLock(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.expectedUpdatedAt instanceof Date).toBe(true);
    });

    it('debe aceptar updated_at de body', () => {
        req.body.updated_at = '2024-01-01T00:00:00.000Z';
        optimisticLock(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.expectedUpdatedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('debe aceptar updated_at de query', () => {
        req.query.updated_at = '2024-02-01T00:00:00.000Z';
        optimisticLock(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.expectedUpdatedAt.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });

    it('debe aceptar x-updated-at de headers', () => {
        req.headers['x-updated-at'] = '2024-03-01T00:00:00.000Z';
        optimisticLock(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.expectedUpdatedAt.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    });

    it('debe devolver 400 si no hay updated_at en ninguna fuente', () => {
        optimisticLock(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it('debe devolver 400 si formato de fecha es invalido', () => {
        req.body.updated_at = 'not-a-date';
        optimisticLock(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it('debe devolver 400 para string vacio', () => {
        req.body.updated_at = '';
        optimisticLock(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
