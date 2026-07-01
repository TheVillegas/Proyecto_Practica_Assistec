/**
 * Rutas para Cálculo de S. aureus - Fase 5
 *
 * POST /api/saureus/calcular-muestra - Calcular una muestra individual
 * POST /api/saureus/calcular-todo    - Calcular TODAS las muestras de un ALI
 * GET  /api/saureus/importar-duplicado - Importar duplicado desde ALI pasado
 */

const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const winston = require('winston');
const { calcularUfcSauNch2671 } = require('../calculators/ufcSauNch2671.calculator');

const router = Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Rutas
// ──────────────────────────────────────────────

/**
 * POST /api/saureus/calcular-muestra
 *
 * Body: { solicitudAnalisisId, muestraId, placas: [{ dil, colonias24h, colonias48h, aConfirmar, coag4a6h, coag24h }] }
 */
router.post('/calcular-muestra', (req, res) => {
  try {
    const { placas } = req.body;

    if (!Array.isArray(placas) || placas.length === 0) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['placas (array no vacío)']
      });
    }

    const resultado = calcularUfcSauNch2671({ placas });
    return res.status(200).json(resultado);
  } catch (error) {
    winston.error('Error en /calcular-muestra:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/saureus/calcular-todo
 *
 * Body: { solicitudAnalisisId, muestras: [{ id, placas: [...] }] }
 */
router.post('/calcular-todo', (req, res) => {
  try {
    const { solicitudAnalisisId, muestras } = req.body;

    if (!solicitudAnalisisId || !Array.isArray(muestras)) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['solicitudAnalisisId', 'muestras (array)']
      });
    }

    const resultados = {};
    let maxUfc = 0;
    let tieneSd = false;

    for (const muestra of muestras) {
      if (!Array.isArray(muestra.placas) || muestra.placas.length === 0) continue;
      const resultado = calcularUfcSauNch2671({ placas: muestra.placas });
      resultados[muestra.id] = resultado;
      if (resultado.ufc && resultado.ufc > maxUfc) maxUfc = resultado.ufc;
      if (resultado.esSd) tieneSd = true;
    }

    const consolidado = {
      totalMuestras: muestras.length,
      muestrasConResultado: muestras.filter(m => !resultados[m.id]?.esSd).length,
      muestrasSd: muestras.filter(m => resultados[m.id]?.esSd).length,
      maxUfc,
      textoMaximo: maxUfc > 0 ? `${maxUfc} UFC/g` : 'SD',
      reglaAplicada: 'Se toma el mayor valor entre las muestras que presentan desarrollo'
    };

    return res.status(200).json({ solicitudAnalisisId, resultados, consolidado });
  } catch (error) {
    winston.error('Error en /calcular-todo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/saureus/importar-duplicado
 */
router.get('/importar-duplicado', async (req, res) => {
  try {
    const { aliOrigen, solicitudActualId } = req.query;

    if (!aliOrigen || !solicitudActualId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        parametrosRequeridos: ['aliOrigen', 'solicitudActualId']
      });
    }

    const solicitudOrigen = await prisma.solicitudAnalisis.findFirst({
      where: {
        codigoAli: aliOrigen.toString(),
        idSolicitudAnalisis: { not: solicitudActualId }
      },
      include: {
        formulario: {
          include: {
            sauFormulario: {
              include: {
                muestras: {
                  where: { numeroMuestra: '1' },
                  include: { etapa5Resultados: true }
                }
              }
            }
          }
        }
      }
    });

    if (!solicitudOrigen) {
      return res.status(200).json({
        aliOrigen: Number(aliOrigen),
        muestra1: null,
        advertencia: `No se encontró el ALI ${aliOrigen}`
      });
    }

    const sauFormulario = solicitudOrigen.formulario?.sauFormulario;
    if (!sauFormulario) {
      return res.status(200).json({
        aliOrigen: Number(aliOrigen),
        muestra1: null,
        advertencia: `El ALI ${aliOrigen} no tiene formulario S. aureus`
      });
    }

    const muestra1 = sauFormulario.muestras?.[0];
    if (!muestra1) {
      return res.status(200).json({
        aliOrigen: Number(aliOrigen),
        muestra1: null,
        advertencia: `El ALI ${aliOrigen} no tiene Muestra 1 de S. aureus`
      });
    }

    const etapa5 = muestra1.etapa5Resultados?.[0];
    const extraerDiluciones = (m) => {
      const dils = [];
      if (m.dil1 !== null) dils.push({ dil: Number(m.dil1), colonias: [m.c1 || null, m.c2 || null] });
      if (m.dil2 !== null) dils.push({ dil: Number(m.dil2), colonias: [m.c3 || null, m.c4 || null] });
      return dils;
    };

    return res.status(200).json({
      aliOrigen: Number(aliOrigen),
      muestra1: {
        diluciones: extraerDiluciones(muestra1),
        coloniasPosibles: [
          muestra1.coloniasPosibles1 || null,
          muestra1.coloniasPosibles2 || null
        ],
        colConfirmar: [
          muestra1.colConfirmar1 || null,
          muestra1.colConfirmar2 || null
        ],
        coagulasa4h: [
          muestra1.confirmadas4h1 || null,
          muestra1.confirmadas4h2 || null
        ],
        coagulasa24h: [
          muestra1.confirmadas24h1 || null,
          muestra1.confirmadas24h2 || null
        ],
        resultadoTexto: etapa5?.resultadoTexto || null
      },
      advertencia: null
    });
  } catch (error) {
    winston.error('Error en /importar-duplicado:', error);
    return res.status(500).json({
      aliOrigen: Number(req.query.aliOrigen),
      muestra1: null,
      advertencia: 'Error al importar datos del ALI origen'
    });
  }
});

module.exports = router;
