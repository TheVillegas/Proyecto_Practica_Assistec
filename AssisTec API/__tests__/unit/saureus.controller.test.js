const request = require('supertest');
const express = require('express');
const saureusController = require('../../src/controllers/saureus.controller');
const saureusService = require('../../src/services/saureus.service');

jest.mock('../../src/services/saureus.service', () => ({
    crear: jest.fn(),
    obtener: jest.fn(),
    obtenerPorAnalisis: jest.fn(),
    guardarEtapa: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
    verifyToken: (req, res, next) => next(),
    authorizeAny: () => (req, res, next) => next()
}));

jest.mock('../../src/middleware/validateForm', () => (() => (req, res, next) => next()));

describe('T-009: SauController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
            query: {},
            user: { roles: [0] },
            expectedUpdatedAt: new Date()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('obtener', () => {
        it('debe retornar 200 con formulario serializado', async () => {
            saureusService.obtener.mockResolvedValue({ id_sau_formulario: '1' });
            req.params.id = '1';

            await saureusController.obtener(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id_sau_formulario: '1' });
        });

        it('debe retornar 404 si no existe', async () => {
            saureusService.obtener.mockRejectedValue(new Error('NOT_FOUND'));
            req.params.id = '999';

            await saureusController.obtener(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('no encontrado') }));
        });
    });

    describe('obtenerPorAnalisis', () => {
        it('debe retornar 200 con existe=true', async () => {
            saureusService.obtenerPorAnalisis.mockResolvedValue({ existe: true, formulario: { id: '1' } });
            req.params.idAnalisis = '5';

            await saureusController.obtenerPorAnalisis(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ existe: true }));
        });
    });

    describe('guardarEtapa', () => {
        it('debe retornar 200 al guardar etapa exitosamente', async () => {
            saureusService.guardarEtapa.mockResolvedValue({ id_sau_formulario: '1' });
            req.params.id = '1';
            req.params.etapa = '3';
            req.body = { etapa: { fecha_hora_traspaso: '2024-01-01' } };

            await saureusController.guardarEtapa(req, res);

            expect(saureusService.guardarEtapa).toHaveBeenCalledWith(
                '1', '3', req.body, req.expectedUpdatedAt, req.user
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debe retornar 409 en error de concurrencia', async () => {
            saureusService.guardarEtapa.mockRejectedValue(new Error('CONCURRENCY_ERROR'));
            req.params.id = '1';
            req.params.etapa = '3';

            await saureusController.guardarEtapa(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('debe retornar 403 si rol no autorizado', async () => {
            saureusService.guardarEtapa.mockRejectedValue(new Error('UNAUTHORIZED_ROLE'));
            req.params.id = '1';
            req.params.etapa = '3';

            await saureusController.guardarEtapa(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('debe retornar 400 para etapa invalida', async () => {
            saureusService.guardarEtapa.mockRejectedValue(new Error('INVALID_ETAPA'));
            req.params.id = '1';
            req.params.etapa = '99';

            await saureusController.guardarEtapa(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debe retornar 500 para error no mapeado', async () => {
            saureusService.guardarEtapa.mockRejectedValue(new Error('UNKNOWN_ERROR'));
            req.params.id = '1';
            req.params.etapa = '3';

            await saureusController.guardarEtapa(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: 'INTERNAL_ERROR' }));
        });
    });

    describe('crear', () => {
        it('debe retornar 201 al crear formulario', async () => {
            saureusService.crear.mockResolvedValue({ id_sau_formulario: '10' });
            req.body = { id_solicitud_analisis: '5', muestras: [{ numero_muestra: 'M1' }] };

            await saureusController.crear(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id_sau_formulario: '10' });
        });
    });
});

describe('T-009: SauRoutes', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            req.user = { roles: [0] };
            next();
        });
        const routes = require('../../src/routes/saureus.routes');
        app.use('/api/formulario/sau', routes);
    });

    it('debe responder 200 en GET /:id', async () => {
        saureusService.obtener.mockResolvedValue({ id_sau_formulario: '1' });

        const response = await request(app).get('/api/formulario/sau/1');

        expect(response.status).toBe(200);
    });

    it('debe responder 200 en GET /por-analisis/:idAnalisis', async () => {
        saureusService.obtenerPorAnalisis.mockResolvedValue({ existe: true });

        const response = await request(app).get('/api/formulario/sau/por-analisis/5');

        expect(response.status).toBe(200);
    });

    it('debe responder 200 en PUT /:id/etapa/:etapa', async () => {
        saureusService.guardarEtapa.mockResolvedValue({ id_sau_formulario: '1' });

        const response = await request(app)
            .put('/api/formulario/sau/1/etapa/3')
            .send({ updated_at: new Date().toISOString(), etapa: {} });

        expect(response.status).toBe(200);
    });

    it('debe responder 400 en PUT sin updated_at', async () => {
        const response = await request(app)
            .put('/api/formulario/sau/1/etapa/3')
            .send({});

        expect(response.status).toBe(400);
    });

    it('NO debe exponer POST /', async () => {
        const response = await request(app).post('/api/formulario/sau').send({});

        expect(response.status).toBe(404);
    });

    it('debe responder 400 para etapa fuera de rango (0)', async () => {
        const response = await request(app)
            .put('/api/formulario/sau/1/etapa/0')
            .send({ updated_at: new Date().toISOString() });

        expect(response.status).toBe(400);
    });

    it('debe responder 400 para etapa no numerica', async () => {
        const response = await request(app)
            .put('/api/formulario/sau/1/etapa/abc')
            .send({ updated_at: new Date().toISOString() });

        expect(response.status).toBe(400);
    });
});
