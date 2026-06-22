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

const router = Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Helpers de cálculo (NCh2676 8.2)
// ──────────────────────────────────────────────

/**
 * Resuelve coagulasa: usa 4h si tiene positivos, sino 24h
 */
function resolverCoagulasa(coagulasa4h, coagulasa24h) {
  const c4h = coagulasa4h || [null, null];
  const c24h = coagulasa24h || [null, null];
  const total4h = (c4h[0] || 0) + (c4h[1] || 0);
  const total24h = (c24h[0] || 0) + (c24h[1] || 0);

  if (total4h > 0) return { positivas: c4h, tiempoUsado: '4 hrs' };
  if (total24h > 0) return { positivas: c24h, tiempoUsado: '24 horas' };
  return { positivas: [null, null], tiempoUsado: null };
}

/**
 * Regla del 80%: si b/A >= 0.8 → a = C
 */
function aplicarRegla80(b, A, C) {
  if (A === 0 || C === 0) return 0;
  return (b / A) >= 0.8 ? C : Math.floor((b / A) * C);
}

/**
 * Redondea a 2 cifras significativas (NCh2676 8.2.2.3)
 */
function redondearDosCifras(valor) {
  if (valor === 0) return '0';
  const orden = Math.floor(Math.log10(Math.abs(valor)));
  const factor = Math.pow(10, 1 - orden);
  const redondeado = Math.round(valor * factor) / factor;
  const exponente = Math.floor(Math.log10(Math.abs(redondeado)));
  const mantisaStr = (redondeado / Math.pow(10, exponente)).toFixed(1).replace('.', ',');
  const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const expStr = Math.abs(exponente).toString().split('').map(d => superscripts[d]).join('');
  const signo = exponente < 0 ? '⁻' : '';
  return `${mantisaStr} x 10${signo}${expStr}`;
}

/**
 * Calcula el resultado completo de S. aureus (NCh2676 8.2)
 */
function calcularSAureus(datos) {
  const { diluciones, coloniasPosibles, colConfirmar, coagulasa4h, coagulasa24h } = datos;

  // 1. Resolver coagulasa
  const coag = resolverCoagulasa(coagulasa4h, coagulasa24h);
  const coagPos = coag.positivas;

  // 2. Calcular a por placa (NCh2676 8.2.2.1)
  const C_A = (coloniasPosibles ? coloniasPosibles[0] : null) || 0;
  const C_B = (coloniasPosibles ? coloniasPosibles[1] : null) || 0;
  const A_A = (colConfirmar ? colConfirmar[0] : null) || 0;
  const A_B = (colConfirmar ? colConfirmar[1] : null) || 0;
  const b_A = (coagPos[0] || 0);
  const b_B = (coagPos[1] || 0);

  const aPlacaA = aplicarRegla80(b_A, A_A, C_A);
  const aPlacaB = aplicarRegla80(b_B, A_B, C_B);
  const sumaA = aPlacaA + aPlacaB;

  // 3. Factor de dilución
  const dils = diluciones || [];
  const dilValidas = dils.filter(d => d.colonias[0] !== null || d.colonias[1] !== null);
  const primeraDil = dilValidas.length > 0 ? dilValidas[0] : null;
  const factorDilucion = primeraDil ? Math.pow(10, -Math.abs(primeraDil.dil)) : 0;
  const n1 = primeraDil ? primeraDil.colonias.filter(c => c !== null).length : 0;
  const n2 = dilValidas.length > 1 ? dilValidas[1].colonias.filter(c => c !== null).length : 0;

  // 4. Calcular UFC/g
  let ufc = null;
  let esSd = false;
  if (sumaA > 0 && factorDilucion > 0) {
    ufc = sumaA / ((n1 + 0.1 * n2) * factorDilucion);
  } else {
    esSd = true;
  }

  // 5. Previas
  const totalConfirmar = ((colConfirmar ? colConfirmar[0] : 0) || 0) + ((colConfirmar ? colConfirmar[1] : 0) || 0);
  const totalCoag = ((coagPos[0] || 0) + (coagPos[1] || 0));
  const previas = totalConfirmar > 0 ? (totalCoag / totalConfirmar) * sumaA : null;

  // 6. Formatear
  const textoReporte = esSd ? 'SD' : redondearDosCifras(ufc) + ' UFC/g';
  const sumaColonias = dils.reduce((sum, d) => sum + (d.colonias[0] || 0) + (d.colonias[1] || 0), 0);

  return {
    ufc, textoReporte, operador: '=', esSd,
    aPlacaA, aPlacaB, sumaA, previas,
    coagulasaUsada: coag.tiempoUsado,
    casoAplicado: 'NCh2676_8.2', factorDilucion, sumaColonias
  };
}

// ──────────────────────────────────────────────
// Rutas
// ──────────────────────────────────────────────

/**
 * POST /api/saureus/calcular-muestra
 */
router.post('/calcular-muestra', (req, res) => {
  try {
    const { solicitudAnalisisId, muestraId, diluciones, coloniasPosibles, colConfirmar, coagulasa4h, coagulasa24h } = req.body;

    if (!solicitudAnalisisId || !muestraId || !diluciones) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['solicitudAnalisisId', 'muestraId', 'diluciones']
      });
    }

    const resultado = calcularSAureus({ diluciones, coloniasPosibles, colConfirmar, coagulasa4h, coagulasa24h });
    return res.status(200).json(resultado);
  } catch (error) {
    winston.error('Error en /calcular-muestra:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/saureus/calcular-todo
 */
router.post('/calcular-todo', (req, res) => {
  try {
    const { solicitudAnalisisId, muestras } = req.body;

    if (!solicitudAnalisisId || !muestras || !Array.isArray(muestras)) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['solicitudAnalisisId', 'muestras (array)']
      });
    }

    const resultados = {};
    let maxUfc = 0;
    let tieneSd = false;

    for (const muestra of muestras) {
      const resultado = calcularSAureus(muestra);
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

    // Buscar ALI origen con datos de S. aureus
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
