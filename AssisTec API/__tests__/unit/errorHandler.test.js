const errorHandler = require('../../src/middleware/errorHandler');

describe('T-003: Error Handler Sanitizado', () => {
    let req, res, next;
    const mockLogger = { error: jest.fn() };

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    const runHandler = (err) => errorHandler(err, req, res, next, mockLogger);

    it('CONCURRENCY_ERROR → 409 con mensaje generico', () => {
        runHandler(new Error('CONCURRENCY_ERROR'));
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            codigo: 'CONCURRENCY_ERROR',
            mensaje: expect.any(String)
        }));
    });

    it('INVALID_STAGE_PROGRESSION → 409 con mensaje generico', () => {
        runHandler(new Error('INVALID_STAGE_PROGRESSION'));
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            codigo: 'INVALID_STAGE_PROGRESSION'
        }));
    });

    it('NOT_FOUND → 404', () => {
        runHandler(new Error('NOT_FOUND'));
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            codigo: 'NOT_FOUND'
        }));
    });

    it('UNAUTHORIZED_ROLE → 403', () => {
        runHandler(new Error('UNAUTHORIZED_ROLE'));
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            codigo: 'UNAUTHORIZED_ROLE'
        }));
    });

    it('P2002 → 409 con mensaje generico (no filtra err.message)', () => {
        const err = { code: 'P2002', message: 'Unique constraint failed on the fields: (`email`)' };
        runHandler(err);
        expect(res.status).toHaveBeenCalledWith(409);
        const json = res.json.mock.calls[0][0];
        expect(json.mensaje).toBeTruthy();
        expect(json.mensaje).not.toContain('email');
    });

    it('P2025 → 404', () => {
        const err = { code: 'P2025', message: 'Record not found' };
        runHandler(err);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('P2003 → 400', () => {
        const err = { code: 'P2003', message: 'Foreign key' };
        runHandler(err);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('Fallback → 500 y no expone err.message ni stack', () => {
        const err = new Error('Internal secret');
        err.stack = 'Stack trace secret';
        runHandler(err);
        expect(res.status).toHaveBeenCalledWith(500);
        const json = res.json.mock.calls[0][0];
        expect(json.mensaje).not.toContain('secret');
        expect(json.stack).toBeUndefined();
    });

    it('loguea err.message y err.stack server-side', () => {
        const err = new Error('Internal secret');
        err.stack = 'Stack trace secret';
        runHandler(err);
        expect(mockLogger.error).toHaveBeenCalled();
        const logCall = mockLogger.error.mock.calls[0][0];
        expect(logCall).toContain('secret');
    });
});
