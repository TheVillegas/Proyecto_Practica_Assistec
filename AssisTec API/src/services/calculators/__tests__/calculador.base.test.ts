/**
 * Tests unitarios para CalculadorBase
 * 
 * Estos tests verifican la lógica compartida del motor de cálculo.
 * NO se incluyen en commits - solo para verificación.
 */

import { CalculadorBase, Dilucion, DatosMuestra } from '../calculador.base';

// Implementación concreta para testing
class TestCalculador extends CalculadorBase {
  calcular(datos: DatosMuestra) {
    return {
      ufc: 100,
      textoReporte: '1 x 10² UFC/g',
      operador: '=',
      esSd: false,
      casoAplicado: 'TEST',
      factorDilucion: 0.01,
      sumaColonias: 50
    };
  }

  // Exponer métodos protegidos para testing
  public testResolverCoagulasa(
    coagulasa4h: [number | null, number | null],
    coagulasa24h: [number | null, number | null]
  ) {
    return this.resolverCoagulasa(coagulasa4h, coagulasa24h);
  }

  public testAplicarRegla80(b: number, A: number, C: number) {
    return this.aplicarRegla80(b, A, C);
  }

  public testCalcularResultadoPlaca(
    coloniasPosibles: number | null | undefined,
    coloniasTraspasadas: number | null | undefined,
    coagulasaPositiva: number | null | undefined
  ) {
    return this.calcularResultadoPlaca(coloniasPosibles, coloniasTraspasadas, coagulasaPositiva);
  }

  public testRedondearDosCifras(valor: number) {
    return this.redondearDosCifras(valor);
  }

  public testCalcularFactorDilucion(dilucion: number) {
    return this.calcularFactorDilucion(dilucion);
  }

  public testSumarColonias(diluciones: Dilucion[]) {
    return this.sumarColonias(diluciones);
  }

  public testExtraerDiluciones(diluciones: Dilucion[]) {
    return this.extraerDiluciones(diluciones);
  }

  public testFormatearLimiteDeteccion(factorDilucion: number) {
    return this.formatearLimiteDeteccion(factorDilucion);
  }
}

describe('CalculadorBase', () => {
  let calculador: TestCalculador;

  beforeEach(() => {
    calculador = new TestCalculador();
  });

  describe('resolverCoagulasa', () => {
    it('debería usar 4 hrs si tiene positivos', () => {
      const resultado = calculador.testResolverCoagulasa([1, 1], [null, null]);
      expect(resultado.tiempoUsado).toBe('4 hrs');
      expect(resultado.positivas).toEqual([1, 1]);
    });

    it('debería usar 24 hrs si 4 hrs no tiene positivos', () => {
      const resultado = calculador.testResolverCoagulasa([0, 0], [2, 1]);
      expect(resultado.tiempoUsado).toBe('24 horas');
      expect(resultado.positivas).toEqual([2, 1]);
    });

    it('debería retornar null si ambas son cero', () => {
      const resultado = calculador.testResolverCoagulasa([0, 0], [0, 0]);
      expect(resultado.tiempoUsado).toBeNull();
      expect(resultado.positivas).toEqual([null, null]);
    });
  });

  describe('aplicarRegla80', () => {
    it('debería usar C directo si proporción >= 80%', () => {
      // b=4, A=5 → 80%
      const resultado = calculador.testAplicarRegla80(4, 5, 10);
      expect(resultado).toBe(10); // C directo
    });

    it('debería ajustar proporcionalmente si proporción < 80%', () => {
      // b=1, A=3 → 33%
      const resultado = calculador.testAplicarRegla80(1, 3, 28);
      expect(resultado).toBe(9); // floor(0.333 × 28) = 9
    });

    it('debería retornar 0 si A es 0', () => {
      const resultado = calculador.testAplicarRegla80(1, 0, 10);
      expect(resultado).toBe(0);
    });

    it('debería retornar 0 si C es 0', () => {
      const resultado = calculador.testAplicarRegla80(1, 3, 0);
      expect(resultado).toBe(0);
    });
  });

  describe('calcularResultadoPlaca', () => {
    it('debería exponer proporción y regla 80 aplicada', () => {
      const resultado = calculador.testCalcularResultadoPlaca(10, 5, 4);

      expect(resultado).toEqual({
        a: 10,
        proporcion: 0.8,
        regla80Aplicada: true
      });
    });

    it('debería retornar placa vacía si no hay colonias traspasadas', () => {
      const resultado = calculador.testCalcularResultadoPlaca(126, null, null);

      expect(resultado).toEqual({
        a: 0,
        proporcion: null,
        regla80Aplicada: false
      });
    });
  });

  describe('redondearDosCifras', () => {
    it('debería redondear 2400 a "2,4 x 10³"', () => {
      const resultado = calculador.testRedondearDosCifras(2400);
      expect(resultado).toBe('2,4 x 10³');
    });

    it('debería redondear 18500 a "1,9 x 10⁴"', () => {
      const resultado = calculador.testRedondearDosCifras(18500);
      expect(resultado).toBe('1,9 x 10⁴');
    });

    it('debería retornar "0" para 0', () => {
      const resultado = calculador.testRedondearDosCifras(0);
      expect(resultado).toBe('0');
    });
  });

  describe('calcularFactorDilucion', () => {
    it('debería calcular 10^-2 = 0.01', () => {
      const resultado = calculador.testCalcularFactorDilucion(-2);
      expect(resultado).toBe(0.01);
    });

    it('debería calcular 10^-3 = 0.001', () => {
      const resultado = calculador.testCalcularFactorDilucion(-3);
      expect(resultado).toBe(0.001);
    });
  });

  describe('sumarColonias', () => {
    it('debería sumar colonias de todas las diluciones', () => {
      const diluciones: Dilucion[] = [
        { dil: -2, colonias: [28, 30] },
        { dil: -3, colonias: [null, null] }
      ];
      const resultado = calculador.testSumarColonias(diluciones);
      expect(resultado).toBe(58); // 28 + 30
    });
  });

  describe('extraerDiluciones', () => {
    it('debería extraer información de diluciones', () => {
      const diluciones: Dilucion[] = [
        { dil: -2, colonias: [28, 30] },
        { dil: -3, colonias: [null, null] }
      ];
      const resultado = calculador.testExtraerDiluciones(diluciones);
      expect(resultado.n1).toBe(1);
      expect(resultado.n2).toBe(0);
      expect(resultado.factorDilucion).toBe(0.01);
    });

    it('debería aceptar diluciones positivas enviadas por frontend', () => {
      const resultado = calculador.testExtraerDiluciones([
        { dil: 2, colonias: [230, 126] }
      ]);

      expect(resultado).toEqual({
        n1: 1,
        n2: 0,
        factorDilucion: 0.01
      });
    });
  });

  describe('formatearLimiteDeteccion', () => {
    it('debería formatear d⁻¹ para el texto < 1 × d⁻¹', () => {
      const resultado = calculador.testFormatearLimiteDeteccion(0.01);

      expect(resultado).toBe('1 x 10²');
    });
  });
});
