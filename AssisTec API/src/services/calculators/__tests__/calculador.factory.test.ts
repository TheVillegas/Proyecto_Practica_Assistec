/**
 * Tests unitarios para CalculadorFactory
 * 
 * Estos tests verifican la fábrica de calculadores.
 * NO se incluyen en commits - solo para verificación.
 */

import { CalculadorFactory } from '../calculador.factory';
import { CalculadorSaureusService } from '../calculador-saureus.service';

describe('CalculadorFactory', () => {
  let factory: CalculadorFactory;

  beforeEach(() => {
    factory = new CalculadorFactory();
  });

  describe('obtenerCalculador', () => {
    it('debería retornar calculador SAU para tipo SAU', () => {
      const calculador = factory.obtenerCalculador('SAU');
      expect(calculador).toBeInstanceOf(CalculadorSaureusService);
    });

    it('debería retornar calculador SAU para tipo sau (minúsculas)', () => {
      const calculador = factory.obtenerCalculador('sau');
      expect(calculador).toBeInstanceOf(CalculadorSaureusService);
    });

    it('debería lanzar error para tipo no existente', () => {
      expect(() => factory.obtenerCalculador('NO_EXISTE')).toThrow(
        'No existe calculador para el tipo: NO_EXISTE'
      );
    });
  });

  describe('tieneCalculador', () => {
    it('debería retornar true para tipo SAU', () => {
      expect(factory.tieneCalculador('SAU')).toBe(true);
    });

    it('debería retornar false para tipo no existente', () => {
      expect(factory.tieneCalculador('NO_EXISTE')).toBe(false);
    });
  });

  describe('tiposDisponibles', () => {
    it('debería incluir SAU en tipos disponibles', () => {
      const tipos = factory.tiposDisponibles();
      expect(tipos).toContain('SAU');
    });
  });
});
