jest.mock('../../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { roles: [0] };
        next();
    },
    authorize: () => (req, res, next) => next(),
    authorizeAny: () => (req, res, next) => next(),
    requireActingRole: () => (req, res, next) => next()
}));

const request = require('supertest');
const app = require('../../../app');

describe('Integration - Coliformes Endpoints', () => {
    describe('GET /api/formulario/coli/:id', () => {
        test('debe retornar 404 para ID inexistente', async () => {
            const res = await request(app)
                .get('/api/formulario/coli/999999')
                .set('Authorization', 'Bearer test');

            expect(res.statusCode).toBe(404);
            expect(res.body.codigo).toBe('NOT_FOUND');
        });
    });

    describe('GET /api/formulario/coli/por-analisis/:idAnalisis', () => {
        test('debe retornar existe:false cuando no hay formulario', async () => {
            const res = await request(app)
                .get('/api/formulario/coli/por-analisis/999999')
                .set('Authorization', 'Bearer test');

            expect(res.statusCode).toBe(200);
            expect(res.body.existe).toBe(false);
        });
    });

    describe('PUT /api/formulario/coli/:id/fase/:fase', () => {
        test('debe rechazar fase invalida', async () => {
            const res = await request(app)
                .put('/api/formulario/coli/1/fase/99')
                .set('Authorization', 'Bearer test')
                .send({ updated_at: new Date().toISOString() });

            expect(res.statusCode).toBe(400);
            expect(res.body.codigo).toBe('INVALID_FASE');
        });

        test('debe rechazar sin updated_at', async () => {
            const res = await request(app)
                .put('/api/formulario/coli/1/fase/1')
                .set('Authorization', 'Bearer test')
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.codigo).toBe('MISSING_UPDATED_AT');
        });
    });
});
