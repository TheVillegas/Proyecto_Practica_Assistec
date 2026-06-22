/**
 * Tests unitarios para ImportDuplicadoService
 *
 * Simula ambos comportamientos del import:
 *   1. ✅ ALI encontrado con S. aureus → devuelve datos de Muestra 1
 *   2. ⚠️ ALI no encontrado / sin S. aureus → devuelve advertencia, permite llenado manual
 *
 * Nota: requiere ts-jest para ejecutarse. Ver setup en jest.config.js
 */

import { ImportDuplicadoService } from '../import-duplicado.service';

// ──────────────────────────────────────────────
// Mock de PrismaClient
// ──────────────────────────────────────────────
const mockFindFirst = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    solicitudAnalisis: {
      findFirst: mockFindFirst
    }
  }))
}));

describe('ImportDuplicadoService', () => {
  let service: ImportDuplicadoService;

  beforeEach(() => {
    service = new ImportDuplicadoService();
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // Caso 1: ALI encontrado con datos de S. aureus
  // ──────────────────────────────────────────
  describe('cuando el ALI existe y tiene S. aureus', () => {
    it('debería devolver los datos de Muestra 1 completos', async () => {
      // Simular ALI con formulario S. aureus y Muestra 1
      mockFindFirst.mockResolvedValue({
        idSolicitudAnalisis: 'solic-123',
        codigoAli: '421',
        formulario: {
          sauFormulario: {
            muestras: [
              {
                numeroMuestra: '1',
                dil1: -2,
                c1: 28,
                c2: 30,
                dil2: -3,
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
                etapa5Resultados: [
                  { resultadoTexto: '1,2 x 10³ UFC/g' }
                ]
              }
            ]
          }
        }
      });

      const resultado = await service.importarDesdeAli(421, 'solic-actual');

      expect(resultado.advertencia).toBeNull();
      expect(resultado.muestra1).not.toBeNull();
      expect(resultado.muestra1!.coloniasPosibles).toEqual([28, 30]);
      expect(resultado.muestra1!.colConfirmar).toEqual([3, 2]);
      expect(resultado.muestra1!.coagulasa4h).toEqual([1, 1]);
      expect(resultado.muestra1!.coagulasa24h).toEqual([null, null]);
      expect(resultado.muestra1!.diluciones).toHaveLength(1);
      expect(resultado.muestra1!.diluciones[0]).toEqual({
        dil: -2,
        colonias: [28, 30]
      });
    });

    it('debería usar coagulasa 4h cuando está disponible', async () => {
      mockFindFirst.mockResolvedValue({
        idSolicitudAnalisis: 'solic-123',
        codigoAli: '421',
        formulario: {
          sauFormulario: {
            muestras: [
              {
                numeroMuestra: '1',
                dil1: -2, c1: 28, c2: 30,
                coloniasPosibles1: 28, coloniasPosibles2: 30,
                colConfirmar1: 5, colConfirmar2: 5,
                confirmadas4h1: 3, confirmadas4h2: 4,
                confirmadas24h1: 2, confirmadas24h2: 2,
                dil2: null, c3: null, c4: null,
                etapa5Resultados: []
              }
            ]
          }
        }
      });

      const resultado = await service.importarDesdeAli(421, 'solic-actual');

      expect(resultado.muestra1).not.toBeNull();
      // Debería tomar 4h no 24h
      expect(resultado.muestra1!.coagulasa4h).toEqual([3, 4]);
    });
  });

  // ──────────────────────────────────────────
  // Caso 2: ALI no encontrado
  // ──────────────────────────────────────────
  describe('cuando el ALI no existe', () => {
    it('debería devolver advertencia y muestra1 null', async () => {
      mockFindFirst.mockResolvedValue(null);

      const resultado = await service.importarDesdeAli(999, 'solic-actual');

      expect(resultado.muestra1).toBeNull();
      expect(resultado.advertencia).toContain('No se encontró el ALI 999');
    });
  });

  // ──────────────────────────────────────────
  // Caso 3: ALI existe pero no tiene formulario S. aureus
  // ──────────────────────────────────────────
  describe('cuando el ALI existe pero no tiene S. aureus', () => {
    it('debería devolver advertencia si no hay sauFormulario', async () => {
      mockFindFirst.mockResolvedValue({
        idSolicitudAnalisis: 'solic-456',
        codigoAli: '456',
        formulario: {
          sauFormulario: null
        }
      });

      const resultado = await service.importarDesdeAli(456, 'solic-actual');

      expect(resultado.muestra1).toBeNull();
      expect(resultado.advertencia).toContain('no tiene formulario S. aureus');
    });
  });

  // ──────────────────────────────────────────
  // Caso 4: ALI con S. aureus pero sin Muestra 1
  // ──────────────────────────────────────────
  describe('cuando el ALI tiene S. aureus pero no Muestra 1', () => {
    it('debería devolver advertencia si no hay muestras', async () => {
      mockFindFirst.mockResolvedValue({
        idSolicitudAnalisis: 'solic-789',
        codigoAli: '789',
        formulario: {
          sauFormulario: {
            muestras: []
          }
        }
      });

      const resultado = await service.importarDesdeAli(789, 'solic-actual');

      expect(resultado.muestra1).toBeNull();
      expect(resultado.advertencia).toContain('no tiene Muestra 1');
    });
  });

  // ──────────────────────────────────────────
  // Caso 5: Error de base de datos
  // ──────────────────────────────────────────
  describe('cuando hay un error de DB', () => {
    it('debería manejarlo sin lanzar excepción', async () => {
      mockFindFirst.mockRejectedValue(new Error('DB connection failed'));

      const resultado = await service.importarDesdeAli(421, 'solic-actual');

      expect(resultado.muestra1).toBeNull();
      expect(resultado.advertencia).toContain('Error al importar');
    });
  });
});
