const express = require('express');
const request = require('supertest');
const enterobacteriasCalculationRoutes = require('../../src/routes/enterobacterias-calculation.routes');

const app = express();
app.use(express.json());
app.use('/api/formulario/ent', enterobacteriasCalculationRoutes);

describe('T-ECR-001: Enterobacterias calculation routes', () => {
    describe('POST /api/formulario/ent/calcular-muestra', () => {
        it('calcula correctamente una muestra válida y devuelve la forma esperada', async () => {
            const response = await request(app)
                .post('/api/formulario/ent/calcular-muestra')
                .send({
                    volumen: 1,
                    placas: [
                        { dil: -1, colonias: 45, confirmA: 5, confirmB: 3 },
                        { dil: -1, colonias: 50, confirmA: 5, confirmB: 4 }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                nEnterobacterias: 335,
                ufcPorG: 335,
                operador: '=',
                esEstimado: false,
                esSd: false,
                casoAplicado: 'NCh2676_porPlaca',
                incongruenciaDetectada: false,
                sumaA: 67,
                n1: 2,
                n2: 0
            });
            expect(response.body.detalle).toHaveLength(2);
            expect(Array.isArray(response.body.advertencias)).toBe(true);
        });

        it('retorna 400 si falta el campo placas', async () => {
            const response = await request(app)
                .post('/api/formulario/ent/calcular-muestra')
                .send({ volumen: 1 });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Faltan campos requeridos');
        });

        it('retorna 400 si placas es un array vacío', async () => {
            const response = await request(app)
                .post('/api/formulario/ent/calcular-muestra')
                .send({ volumen: 1, placas: [] });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Faltan campos requeridos');
        });

        it('retorna 400 si placas no es un array', async () => {
            const response = await request(app)
                .post('/api/formulario/ent/calcular-muestra')
                .send({ volumen: 1, placas: 'no-array' });

            expect(response.status).toBe(400);
        });
    });
});
