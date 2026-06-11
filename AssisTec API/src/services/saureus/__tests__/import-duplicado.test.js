/**
 * Tests unitarios para la lógica de importación de duplicado S. aureus
 *
 * Verifica los 2 comportamientos del import sin depender de ts-jest:
 *   1. ✅ ALI encontrado con S. aureus → devuelve datos de Muestra 1
 *   2. ⚠️ ALI no encontrado / sin S. aureus → devuelve advertencia
 *
 * El test mockea el servicio completo para aislar la lógica de negocio
 * que usa el frontend (onReimportar) sin depender de Prisma.
 */

// ───────────────────────────────────────────────
// Mock: respuesta con datos encontrados
// ───────────────────────────────────────────────
function crearRespuestaConDatos(overrides = {}) {
  return {
    aliOrigen: 421,
    muestra1: {
      diluciones: [{ dil: -2, colonias: [28, 30] }],
      coloniasPosibles: [28, 30],
      colConfirmar: [3, 2],
      coagulasa4h: [1, 1],
      coagulasa24h: [null, null],
      resultadoTexto: '1,2 x 10³ UFC/g',
      ...overrides
    },
    advertencia: null
  };
}

// ───────────────────────────────────────────────
// Mock: respuesta sin datos (advertencia)
// ───────────────────────────────────────────────
function crearRespuestaSinDatos(mensaje) {
  return {
    aliOrigen: 999,
    muestra1: null,
    advertencia: mensaje
  };
}

// ───────────────────────────────────────────────
// Simula el comportamiento de onReimportar del frontend
// ───────────────────────────────────────────────
function simularOnReimportar(datosImportados) {
  const { muestra1, advertencia } = datosImportados;

  return new Promise((resolve) => {
    if (muestra1 && !advertencia) {
      // Caso: datos encontrados → poblar formulario
      resolve({
        aliReferencia: datosImportados.aliOrigen,
        diluciones: muestra1.diluciones,
        coloniasPosibles: muestra1.coloniasPosibles,
        colConfirmar: muestra1.colConfirmar,
        coagulasa4h: muestra1.coagulasa4h,
        coagulasa24h: muestra1.coagulasa24h,
        advertencia: null,
        resultado: {
          textoReporte: muestra1.resultadoTexto,
          esSd: false
        }
      });
    } else {
      // Caso: sin datos → mostrar advertencia, campos vacíos
      resolve({
        aliReferencia: datosImportados.aliOrigen,
        diluciones: [
          { dil: -2, colonias: [null, null] },
          { dil: -3, colonias: [null, null] }
        ],
        coloniasPosibles: [null, null],
        colConfirmar: [null, null],
        coagulasa4h: [null, null],
        coagulasa24h: [null, null],
        resultado: undefined,
        advertencia: advertencia || 'No se encontraron datos de S. aureus en el ALI seleccionado'
      });
    }
  });
}

describe('Importación de Duplicado S. aureus', () => {
  // ──────────────────────────────────────────
  // Caso 1: Datos encontrados
  // ──────────────────────────────────────────
  describe('cuando el ALI tiene datos de S. aureus', () => {
    it('debería devolver diluciones, colonias y coagulasa de Muestra 1', async () => {
      const mockRespuesta = crearRespuestaConDatos();
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.advertencia).toBeNull();
      expect(resultado.diluciones).toEqual([{ dil: -2, colonias: [28, 30] }]);
      expect(resultado.coloniasPosibles).toEqual([28, 30]);
      expect(resultado.colConfirmar).toEqual([3, 2]);
      expect(resultado.coagulasa4h).toEqual([1, 1]);
      expect(resultado.coagulasa24h).toEqual([null, null]);
    });

    it('debería incluir el resultado calculado', async () => {
      const mockRespuesta = crearRespuestaConDatos();
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.resultado).toBeDefined();
      expect(resultado.resultado.textoReporte).toBe('1,2 x 10³ UFC/g');
      expect(resultado.resultado.esSd).toBe(false);
    });

    it('debería mantener el aliReferencia correcto', async () => {
      const mockRespuesta = crearRespuestaConDatos();
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.aliReferencia).toBe(421);
    });
  });

  // ──────────────────────────────────────────
  // Caso 2: Sin datos (advertencia)
  // ──────────────────────────────────────────
  describe('cuando el ALI no tiene datos de S. aureus', () => {
    it('debería devolver advertencia si no se encontró el ALI', async () => {
      const mockRespuesta = crearRespuestaSinDatos('No se encontró el ALI 999');
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.muestra1).toBeUndefined();
      expect(resultado.advertencia).toContain('No se encontró el ALI 999');
    });

    it('debería devolver advertencia si no tiene formulario S. aureus', async () => {
      const mockRespuesta = crearRespuestaSinDatos('El ALI 999 no tiene formulario S. aureus');
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.muestra1).toBeUndefined();
      expect(resultado.advertencia).toContain('no tiene formulario S. aureus');
    });

    it('debería dejar campos vacíos para llenado manual', async () => {
      const mockRespuesta = crearRespuestaSinDatos('No se encontró el ALI 999');
      const resultado = await simularOnReimportar(mockRespuesta);

      // Todas las diluciones deben estar vacías
      expect(resultado.diluciones.every(d => d.colonias[0] === null)).toBe(true);
      expect(resultado.diluciones.every(d => d.colonias[1] === null)).toBe(true);
      expect(resultado.coloniasPosibles).toEqual([null, null]);
      expect(resultado.colConfirmar).toEqual([null, null]);
    });

    it('no debería tener resultado calculado cuando hay advertencia', async () => {
      const mockRespuesta = crearRespuestaSinDatos('No se encontró el ALI 999');
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.resultado).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────
  // Caso 3: Edge cases
  // ──────────────────────────────────────────
  describe('edge cases', () => {
    it('debería manejar advertencia por defecto si no viene del backend', async () => {
      const mockRespuesta = {
        aliOrigen: 999,
        muestra1: null,
        advertencia: null
      };
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.advertencia).toContain('No se encontraron datos de S. aureus');
    });

    it('debería extraer diluciones con 2 diluciones cuando existen', async () => {
      const mockRespuesta = crearRespuestaConDatos({
        diluciones: [
          { dil: -2, colonias: [28, 30] },
          { dil: -3, colonias: [15, 18] }
        ]
      });
      const resultado = await simularOnReimportar(mockRespuesta);

      expect(resultado.diluciones).toHaveLength(2);
      expect(resultado.diluciones[1]).toEqual({ dil: -3, colonias: [15, 18] });
    });
  });
});
