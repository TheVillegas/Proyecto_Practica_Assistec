/**
 * Rutas para Cálculo de S. aureus - Fase 5
 * 
 * POST /api/saureus/calcular-muestra - Calcular una muestra individual
 * POST /api/saureus/calcular-todo    - Calcular TODAS las muestras de un ALI
 * GET  /api/saureus/importar-duplicado - Importar duplicado desde ALI pasado
 */

import { Router, Request, Response } from 'express';
import { CalculadorFactory } from '../services/calculators/calculador.factory';
import { DatosMuestra } from '../services/calculators/calculador.base';

const router = Router();
const calculadorFactory = new CalculadorFactory();

/**
 * POST /api/saureus/calcular-muestra
 * 
 * Calcula el resultado de una muestra individual de S. aureus
 * 
 * Request body:
 * {
 *   solicitudAnalisisId: string,
 *   muestraId: string,
 *   diluciones: Array<{ dil: number; colonias: [number|null, number|null] }>,
 *   coloniasPosibles: [number|null, number|null],
 *   colConfirmar: [number|null, number|null],
 *   coagulasa4h: [number|null, number|null],
 *   coagulasa24h: [number|null, number|null]
 * }
 */
router.post('/calcular-muestra', async (req: Request, res: Response) => {
  try {
    const {
      solicitudAnalisisId,
      muestraId,
      diluciones,
      coloniasPosibles,
      colConfirmar,
      coagulasa4h,
      coagulasa24h
    } = req.body;

    // Validar campos requeridos
    if (!solicitudAnalisisId || !muestraId || !diluciones) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['solicitudAnalisisId', 'muestraId', 'diluciones']
      });
    }

    // Obtener calculador de S. aureus
    const calculador = calculadorFactory.obtenerCalculador('SAU');

    // Preparar datos
    const datos: DatosMuestra = {
      diluciones,
      coloniasPosibles,
      colConfirmar,
      coagulasa4h,
      coagulasa24h
    };

    // Calcular
    const resultado = calculador.calcular(datos);

    // Responder
    return res.status(200).json({
      muestraId,
      resultado
    });
  } catch (error) {
    console.error('Error en /calcular-muestra:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/saureus/calcular-todo
 * 
 * Calcula TODAS las muestras de un ALI y retorna consolidado
 * 
 * Request body:
 * {
 *   solicitudAnalisisId: string,
 *   muestras: Array<{
 *     id: string,
 *     diluciones: Array<{ dil: number; colonias: [number|null, number|null] }>,
 *     coloniasPosibles: [number|null, number|null],
 *     colConfirmar: [number|null, number|null],
 *     coagulasa4h: [number|null, number|null],
 *     coagulasa24h: [number|null, number|null]
 *   }>
 * }
 */
router.post('/calcular-todo', async (req: Request, res: Response) => {
  try {
    const { solicitudAnalisisId, muestras } = req.body;

    // Validar campos requeridos
    if (!solicitudAnalisisId || !muestras || !Array.isArray(muestras)) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['solicitudAnalisisId', 'muestras (array)']
      });
    }

    // Obtener calculador de S. aureus
    const calculador = calculadorFactory.obtenerCalculador('SAU');

    // Calcular cada muestra
    const resultados: Record<string, any> = {};
    let maxUfc = 0;
    let tieneSd = false;

    for (const muestra of muestras) {
      const datos: DatosMuestra = {
        diluciones: muestra.diluciones,
        coloniasPosibles: muestra.coloniasPosibles,
        colConfirmar: muestra.colConfirmar,
        coagulasa4h: muestra.coagulasa4h,
        coagulasa24h: muestra.coagulasa24h
      };

      const resultado = calculador.calcular(datos);
      resultados[muestra.id] = resultado;

      // Encontrar máximo UFC (para consolidado)
      if (resultado.ufc && resultado.ufc > maxUfc) {
        maxUfc = resultado.ufc;
      }

      if (resultado.esSd) {
        tieneSd = true;
      }
    }

    // Calcular consolidado (Etapa 6)
    const consolidado = this.calcularConsolidado(resultados, maxUfc);

    // Responder
    return res.status(200).json({
      solicitudAnalisisId,
      resultados,
      consolidado
    });
  } catch (error) {
    console.error('Error en /calcular-todo:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/saureus/importar-duplicado
 * 
 * Importa datos de Muestra 1 de un ALI pasado como referencia
 * 
 * Query params:
 * - aliOrigen: number - ID del ALI origen
 * - solicitudActualId: string - ID de la solicitud actual
 */
router.get('/importar-duplicado', async (req: Request, res: Response) => {
  try {
    const { aliOrigen, solicitudActualId } = req.query;

    // Validar parámetros
    if (!aliOrigen || !solicitudActualId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        parametrosRequeridos: ['aliOrigen', 'solicitudActualId']
      });
    }

    // TODO: Implementar lógica de importación desde base de datos
    // Por ahora, retornar mock de respuesta
    const respuesta = {
      aliOrigen: Number(aliOrigen),
      muestra1: {
        diluciones: [{ dil: -2, colonias: [28, 30] }],
        coloniasPosibles: [28, 30],
        colConfirmar: [3, 2],
        coagulasa4h: [1, 1],
        coagulasa24h: [null, null],
        resultadoTexto: '1,2 x 10³ UFC/g'
      },
      advertencia: null
    };

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error en /importar-duplicado:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

/**
 * Calcula el consolidado para Etapa 6
 */
function calcularConsolidado(
  resultados: Record<string, any>,
  maxUfc: number
) {
  const muestras = Object.keys(resultados);
  const tieneSd = muestras.some(m => resultados[m].esSd);

  // Formatear máximo
  const calculador = calculadorFactory.obtenerCalculador('SAU');
  const textoMaximo = calculador.calcular({
    diluciones: [],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null]
  }).textoReporte;

  return {
    totalMuestras: muestras.length,
    muestrasConResultado: muestras.filter(m => !resultados[m].esSd).length,
    muestrasSd: muestras.filter(m => resultados[m].esSd).length,
    maxUfc,
    textoMaximo: maxUfc > 0 ? `${maxUfc} UFC/g` : 'SD',
    reglaAplicada: 'Se toma el mayor valor entre las muestras que presentan desarrollo'
  };
}

export default router;
