/**
 * Tests de integración para rutas de cálculo S. aureus
 * 
 * Estos tests verifican los endpoints de la API.
 * NO se incluyen en commits - solo para verificación.
 */

import request from 'supertest';
import express from 'express';
import saureusRoutes from '../saureus-calculation.routes';

const app = express();
app.use(express.json());
app.use('/api/saureus', saureusRoutes);

describe('S. aureus Calculation Routes', () => {
  describe('POST /api/saureus/calcular-muestra', () => {
    it('debería calcular correctamente una muestra válida', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestraId: 'M1',
          diluciones: [
            { dil: -2, colonias: [28, 30] },
            { dil: -3, colonias: [null, null] }
          ],
          coloniasPosibles: [28, 30],
          colConfirmar: [3, 2],
          coagulasa4h: [1, 1],
          coagulasa24h: [null, null]
        });

      expect(response.status).toBe(200);
      expect(response.body.muestraId).toBe('M1');
      expect(response.body.resultado).toBeDefined();
      expect(response.body.resultado.aPlacaA).toBe(9);
      expect(response.body.resultado.aPlacaB).toBe(15);
      expect(response.body.resultado.sumaA).toBe(24);
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123'
          // Falta muestraId y diluciones
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Faltan campos requeridos');
    });
  });

  describe('POST /api/saureus/calcular-todo', () => {
    it('debería calcular todas las muestras', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-todo')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestras: [
            {
              id: 'M1',
              diluciones: [{ dil: -2, colonias: [28, 30] }],
              coloniasPosibles: [28, 30],
              colConfirmar: [3, 2],
              coagulasa4h: [1, 1],
              coagulasa24h: [null, null]
            },
            {
              id: 'M2',
              diluciones: [{ dil: -2, colonias: [0, 0] }],
              coloniasPosibles: [0, 0],
              colConfirmar: [0, 0],
              coagulasa4h: [0, 0],
              coagulasa24h: [0, 0]
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.resultados.M1).toBeDefined();
      expect(response.body.resultados.M2).toBeDefined();
      expect(response.body.consolidado).toBeDefined();
    });
  });

  describe('GET /api/saureus/importar-duplicado', () => {
    it('debería importar duplicado desde ALI pasado', async () => {
      const response = await request(app)
        .get('/api/saureus/importar-duplicado')
        .query({
          aliOrigen: 421,
          solicitudActualId: 'test-id-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.aliOrigen).toBe(421);
      expect(response.body.muestra1).toBeDefined();
    });

    it('debería retornar 400 si faltan parámetros', async () => {
      const response = await request(app)
        .get('/api/saureus/importar-duplicado')
        .query({
          aliOrigen: 421
          // Falta solicitudActualId
        });

      expect(response.status).toBe(400);
    });
  });
});
