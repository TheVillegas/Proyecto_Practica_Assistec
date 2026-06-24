jest.mock('../../src/middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { roles: [0] };
        next();
    },
    authorize: () => (req, res, next) => next(),
    authorizeAny: () => (req, res, next) => next(),
    requireActingRole: () => (req, res, next) => next()
}));

const request = require('supertest');
const app = require('../../app');

describe('Integration - Enterobacterias Endpoints', () => {
    describe('GET /api/formulario/ent/:id', () => {
        test('debe retornar 404 para ID inexistente', async () => {
            const res = await request(app)
                .get('/api/formulario/ent/999999')
                .set('Authorization', 'Bearer test');

            expect(res.statusCode).toBe(404);
            expect(res.body.codigo).toBe('NOT_FOUND');
        });
    });

    describe('GET /api/formulario/ent/por-analisis/:idAnalisis', () => {
        test('debe retornar existe:false cuando no hay formulario', async () => {
            const res = await request(app)
                .get('/api/formulario/ent/por-analisis/999999')
                .set('Authorization', 'Bearer test');

            expect(res.statusCode).toBe(200);
            expect(res.body.existe).toBe(false);
        });
    });

    describe('PUT /api/formulario/ent/:id/etapa/:etapa', () => {
        test('debe rechazar etapa invalida', async () => {
            const res = await request(app)
                .put('/api/formulario/ent/1/etapa/99')
                .set('Authorization', 'Bearer test')
                .send({ updated_at: new Date().toISOString() });

            expect(res.statusCode).toBe(400);
            expect(res.body.codigo).toBe('INVALID_ETAPA');
        });

        test('debe rechazar sin updated_at', async () => {
            const res = await request(app)
                .put('/api/formulario/ent/1/etapa/1')
                .set('Authorization', 'Bearer test')
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.codigo).toBe('MISSING_UPDATED_AT');
        });

        test('debe rechazar reactivo_oxidasa con formato invalido', async () => {
            const res = await request(app)
                .put('/api/formulario/ent/1/etapa/3')
                .set('Authorization', 'Bearer test')
                .send({
                    updated_at: new Date().toISOString(),
                    completada: false,
                    etapa: {
                        reactivo_oxidasa: 'R69-25-99'
                    }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.codigo).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/catalogo/lotes_reactivo', () => {
        test('debe retornar lotes sembrados filtrados por tipo', async () => {
            const res = await request(app)
                .get('/api/catalogo/lotes_reactivo?tipo=agar_vrbg')
                .set('Authorization', 'Bearer test');

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(2);
            expect(res.body.every((l) => l.tipo === 'agar_vrbg')).toBe(true);
        });
    });
});
