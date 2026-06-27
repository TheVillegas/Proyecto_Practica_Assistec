/**
 * Tests unitarios para CalculadorSaureusService
 * 
 * Fórmula: NCh2676 8.2.2.1
 * a = (b / A) × C por placa individual
 * 
 * Estos tests verifican el cálculo de S. aureus Fase 5.
 * NO se incluyen en commits - solo para verificación.
 */

import { CalculadorSaureusService } from '../calculador-saureus.service';
import { DatosMuestra } from '../calculador.base';

describe('CalculadorSaureusService', () => {
  let calculador: CalculadorSaureusService;

  beforeEach(() => {
    calculador = new CalculadorSaureusService();
  });

  describe('Cálculo por placa individual (NCh2676 8.2.2.1)', () => {
    it('debería calcular correctamente ambas placas con datos', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      // Placa A: a = (1/3) × 28 = 9
      expect(resultado.aPlacaA).toBe(9);
      // Placa B: a = (1/2) × 30 = 15
      expect(resultado.aPlacaB).toBe(15);
      // Σa = 9 + 15 = 24
      expect(resultado.sumaA).toBe(24);
    });

    it('debería calcular una placa sin datos', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, null] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, null],
        colConfirmar: [3, null],
        coagulasa4h: [1, null],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      // Placa A: a = (1/3) × 28 = 9
      expect(resultado.aPlacaA).toBe(9);
      // Placa B: a = 0 (sin datos)
      expect(resultado.aPlacaB).toBe(0);
      // Σa = 9
      expect(resultado.sumaA).toBe(9);
    });
  });

  describe('Regla del 80% (NCh2676 8.2.1)', () => {
    it('debería aplicar regla 80% cuando proporción >= 80%', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [10, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [10, 30],
        colConfirmar: [5, 2],  // A=5
        coagulasa4h: [4, 1],   // b=4 → 4/5 = 80%
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      // Placa A: regla 80% → a = C = 10
      expect(resultado.aPlacaA).toBe(10);
      expect(resultado.regla80AplicadaA).toBe(true);
      expect(resultado.proporcionA).toBe(0.8);
    });

    it('debería ajustar proporcionalmente cuando proporción < 80%', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [1, 1],  // 1/3 = 33%, 1/2 = 50%
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      // Placa A: a = floor(1/3 × 28) = 9
      expect(resultado.aPlacaA).toBe(9);
      // Placa B: a = floor(1/2 × 30) = 15
      expect(resultado.aPlacaB).toBe(15);
      expect(resultado.regla80AplicadaA).toBe(false);
      expect(resultado.regla80AplicadaB).toBe(false);
    });
  });

  describe('Resolución de coagulasa 4 hrs / 24 horas', () => {
    it('debería usar 4 hrs si tiene positivos', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.coagulasaUsada).toBe('4 hrs');
    });

    it('debería usar 24 hrs si 4 hrs no tiene positivos', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [0, 0],
        coagulasa24h: [2, 1]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.coagulasaUsada).toBe('24 horas');
    });

    it('debería retornar SD si ambas coagulasa son cero', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [0, 0],
        coagulasa24h: [0, 0]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.esSd).toBe(true);
      expect(resultado.textoReporte).toBe('SD');
    });
  });

  describe('Fórmula general y redondeo (NCh2676 8.2.2.2/8.2.2.3)', () => {
    it('debería calcular UFC correctamente según ejemplo del design', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      // Σa = 24, n1 = 1, n2 = 0, d = 0.01
      // N = 24 / ((1 + 0.1×0) × 0.01) = 2400
      expect(resultado.n1).toBe(1);
      expect(resultado.n2).toBe(0);
      expect(resultado.ufc).toBe(2400);
      expect(resultado.textoReporte).toBe('2,4 x 10³ UFC/g');
    });

    it('debería calcular el ejemplo reportado por el usuario con placa B sin desarrollo', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: 2, colonias: [230, 126] },
          { dil: 3, colonias: [null, null] }
        ],
        coloniasPosibles: [230, 126],
        colConfirmar: [5, null],
        coagulasa4h: [2, null],
        coagulasa24h: [3, null]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.coagulasaUsada).toBe('4 hrs');
      expect(resultado.aPlacaA).toBe(92);
      expect(resultado.aPlacaB).toBe(0);
      expect(resultado.sumaA).toBe(92);
      expect(resultado.n1).toBe(1);
      expect(resultado.n2).toBe(0);
      expect(resultado.factorDilucion).toBe(0.01);
      expect(resultado.ufc).toBe(9200);
      expect(resultado.textoReporte).toBe('9,2 x 10³ UFC/g');
    });

    it('debería reportar SD si no hay colonias pero hubo desarrollo sospechoso sin confirmación positiva', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [0, 0],
        coagulasa24h: [0, 0]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.esSd).toBe(true);
      expect(resultado.textoReporte).toBe('SD');
    });
  });

  describe('Validación máximo 5 colonias', () => {
    it('debería permitir cálculo con ≤ 5 colonias', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],  // Total: 5
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.sumaA).toBeGreaterThan(0);
    });

    it('debería bloquear cálculo si la suma supera 5 colonias', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [28, 30] }
        ],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 3],
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null]
      };

      expect(() => calculador.calcular(datos)).toThrow('La suma de colonias a confirmar no puede ser mayor a 5');
    });
  });

  describe('Resultados con menos de 15 colonias', () => {
    it('debería reportar NE cuando la suma de colonias es menor a 15', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [10, 0] }
        ],
        coloniasPosibles: [10, 0],
        colConfirmar: [5, 0],
        coagulasa4h: [2, 0],
        coagulasa24h: [null, null]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.esSd).toBe(false);
      expect(resultado.ufc).toBe(400);
      expect(resultado.textoReporte).toBe('NE');
    });

    it('debería reportar < 1 × d⁻¹ cuando sumaColonias es 0', () => {
      const datos: DatosMuestra = {
        diluciones: [
          { dil: -2, colonias: [0, 0] }
        ],
        coloniasPosibles: [0, 0],
        colConfirmar: [0, 0],
        coagulasa4h: [0, 0],
        coagulasa24h: [0, 0]
      };

      const resultado = calculador.calcular(datos);

      expect(resultado.esSd).toBe(false);
      expect(resultado.operador).toBe('<');
      expect(resultado.ufc).toBe(100);
      expect(resultado.textoReporte).toBe('< 1 x 10² UFC/g');
    });
  });
});
