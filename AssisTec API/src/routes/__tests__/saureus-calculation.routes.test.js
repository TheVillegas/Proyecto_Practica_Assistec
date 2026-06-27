const express = require('express');
const request = require('supertest');

const mockFindFirst = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    solicitudAnalisis: {
      findFirst: mockFindFirst
    }
  }))
}));

const saureusRoutes = require('../saureus-calculation.routes');

const app = express();
app.use(express.json());
app.use('/api/saureus', saureusRoutes);

describe('S. aureus Calculation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/saureus/calcular-muestra', () => {
    it('debería calcular una muestra válida con n1 por dilución y no por placa', async () => {
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
      expect(response.body.aPlacaA).toBe(9);
      expect(response.body.aPlacaB).toBe(15);
      expect(response.body.sumaA).toBe(24);
      expect(response.body.n1).toBe(1);
      expect(response.body.n2).toBe(0);
      expect(response.body.ufc).toBe(2400);
      expect(response.body.textoReporte).toBe('2,4 x 10³ UFC/g');
    });

    it('debería soportar la dilución positiva enviada por frontend', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestraId: 'M1',
          diluciones: [
            { dil: 2, colonias: [230, 126] },
            { dil: 3, colonias: [null, null] }
          ],
          coloniasPosibles: [230, 126],
          colConfirmar: [5, null],
          coagulasa4h: [2, null],
          coagulasa24h: [3, null]
        });

      expect(response.status).toBe(200);
      expect(response.body.coagulasaUsada).toBe('4 hrs');
      expect(response.body.aPlacaA).toBe(92);
      expect(response.body.aPlacaB).toBe(0);
      expect(response.body.ufc).toBe(9200);
      expect(response.body.textoReporte).toBe('9,2 x 10³ UFC/g');
    });

    it('debería retornar 400 si la suma de colonias a confirmar supera 5', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestraId: 'M1',
          diluciones: [{ dil: -2, colonias: [28, 30] }],
          coloniasPosibles: [28, 30],
          colConfirmar: [3, 3],
          coagulasa4h: [1, 1],
          coagulasa24h: [null, null]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('no puede ser mayor a 5');
    });

    it('debería retornar NE cuando sumaColonias es menor a 15', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestraId: 'M1',
          diluciones: [{ dil: -2, colonias: [10, 0] }],
          coloniasPosibles: [10, 0],
          colConfirmar: [5, 0],
          coagulasa4h: [2, 0],
          coagulasa24h: [null, null]
        });

      expect(response.status).toBe(200);
      expect(response.body.ufc).toBe(400);
      expect(response.body.textoReporte).toBe('NE');
    });

    it('debería retornar el límite detectable cuando sumaColonias es 0', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-muestra')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestraId: 'M1',
          diluciones: [{ dil: -2, colonias: [0, 0] }],
          coloniasPosibles: [0, 0],
          colConfirmar: [0, 0],
          coagulasa4h: [0, 0],
          coagulasa24h: [0, 0]
        });

      expect(response.status).toBe(200);
      expect(response.body.operador).toBe('<');
      expect(response.body.textoReporte).toBe('< 1 x 10² UFC/g');
    });
  });

  describe('POST /api/saureus/calcular-todo', () => {
    it('debería calcular todas las muestras y exponer consolidado según el mayor valor', async () => {
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
              diluciones: [{ dil: 2, colonias: [230, 126] }],
              coloniasPosibles: [230, 126],
              colConfirmar: [5, null],
              coagulasa4h: [2, null],
              coagulasa24h: [3, null]
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.resultados.M1.ufc).toBe(2400);
      expect(response.body.resultados.M2.ufc).toBe(9200);
      expect(response.body.resultadoConsolidado).toBe('9,2 x 10³ UFC/g');
      expect(response.body.reglaAplicada).toContain('mayor valor');
    });

    it('debería retornar 400 si una muestra supera 5 colonias a confirmar', async () => {
      const response = await request(app)
        .post('/api/saureus/calcular-todo')
        .send({
          solicitudAnalisisId: 'test-id-123',
          muestras: [
            {
              id: 'M1',
              diluciones: [{ dil: -2, colonias: [28, 30] }],
              coloniasPosibles: [28, 30],
              colConfirmar: [3, 3],
              coagulasa4h: [1, 1],
              coagulasa24h: [null, null]
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('no puede ser mayor a 5');
    });
  });

  describe('GET /api/saureus/importar-duplicado', () => {
    it('debería importar duplicado desde ALI pasado', async () => {
      mockFindFirst.mockResolvedValue({
        formulario: {
          sauFormulario: {
            muestras: [
              {
                dil1: -2,
                c1: 28,
                c2: 30,
                dil2: null,
                c3: null,
                c4: null,
                coloniasPosibles1: 28,
                coloniasPosibles2: 30,
                colConfirmar1: 3,
                colConfirmar2: 2,
                confirmadas4h1: 1,
                confirmadas4h2: 1,
                confirmadas24h1: null,
                confirmadas24h2: null,
                etapa5Resultados: [{ resultadoTexto: '2,4 x 10³ UFC/g' }]
              }
            ]
          }
        }
      });

      const response = await request(app)
        .get('/api/saureus/importar-duplicado')
        .query({
          aliOrigen: 421,
          solicitudActualId: 'test-id-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.aliOrigen).toBe(421);
      expect(response.body.muestra1).toBeDefined();
      expect(response.body.muestra1.diluciones[0]).toEqual({
        dil: -2,
        colonias: [28, 30]
      });
    });

    it('debería retornar 400 si faltan parámetros', async () => {
      const response = await request(app)
        .get('/api/saureus/importar-duplicado')
        .query({
          aliOrigen: 421
        });

      expect(response.status).toBe(400);
    });
  });
});
