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

function crearErrorCliente(mensaje) {
  const error = new Error(mensaje);
  error.statusCode = 400;
  return error;
}

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

function calcularResultadoPlaca(C, A, b) {
  const coloniasPosibles = C || 0;
  const coloniasTraspasadas = A || 0;
  const coagulasaPositiva = b || 0;

  if (coloniasPosibles === 0 || coloniasTraspasadas === 0) {
    return { a: 0, proporcion: null, regla80Aplicada: false };
  }

  const proporcion = coagulasaPositiva / coloniasTraspasadas;
  const regla80Aplicada = proporcion >= 0.8;

  return {
    a: aplicarRegla80(coagulasaPositiva, coloniasTraspasadas, coloniasPosibles),
    proporcion,
    regla80Aplicada
  };
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

function calcularFactorDilucion(dil) {
  return Math.pow(10, -Math.abs(dil));
}

function extraerDiluciones(diluciones) {
  const dilucionesValidas = (diluciones || []).filter(
    dilucion => dilucion.colonias[0] !== null || dilucion.colonias[1] !== null
  );

  if (dilucionesValidas.length === 0) {
    return { n1: 0, n2: 0, factorDilucion: 0 };
  }

  return {
    n1: 1,
    n2: dilucionesValidas.length > 1 ? 1 : 0,
    factorDilucion: calcularFactorDilucion(dilucionesValidas[0].dil)
  };
}

function sumarColonias(diluciones) {
  return (diluciones || []).reduce(
    (total, dilucion) => total + (dilucion.colonias[0] || 0) + (dilucion.colonias[1] || 0),
    0
  );
}

function formatearLimiteDeteccion(factorDilucion) {
  const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const exponente = Math.round(Math.log10(1 / factorDilucion));
  const expStr = Math.abs(exponente).toString().split('').map(d => superscripts[d]).join('');
  const signo = exponente < 0 ? '⁻' : '';

  return `1 x 10${signo}${expStr}`;
}

/**
 * Calcula el resultado completo de S. aureus (NCh2676 8.2)
 */
function calcularSAureus(datos) {
  const { diluciones, coloniasPosibles, colConfirmar, coagulasa4h, coagulasa24h } = datos;
  const totalColoniasConfirmar = ((colConfirmar ? colConfirmar[0] : 0) || 0) + ((colConfirmar ? colConfirmar[1] : 0) || 0);

  if (totalColoniasConfirmar > 5) {
    throw crearErrorCliente('La suma de colonias a confirmar no puede ser mayor a 5');
  }

  // 1. Resolver coagulasa
  const coag = resolverCoagulasa(coagulasa4h, coagulasa24h);
  const coagPos = coag.positivas;

  // 2. Calcular a por placa (NCh2676 8.2.2.1)
  const placaA = calcularResultadoPlaca(
    coloniasPosibles ? coloniasPosibles[0] : null,
    colConfirmar ? colConfirmar[0] : null,
    coagPos[0]
  );
  const placaB = calcularResultadoPlaca(
    coloniasPosibles ? coloniasPosibles[1] : null,
    colConfirmar ? colConfirmar[1] : null,
    coagPos[1]
  );

  const aPlacaA = placaA.a;
  const aPlacaB = placaB.a;
  const sumaA = aPlacaA + aPlacaB;
  const sumaColonias = sumarColonias(diluciones);

  // 3. Factor de dilución
  const { n1, n2, factorDilucion } = extraerDiluciones(diluciones);

  // 4. Calcular UFC/g
  let ufc = null;
  let esSd = false;
  let operador = '=';
  if (sumaA > 0 && factorDilucion > 0) {
    ufc = sumaA / ((n1 + 0.1 * n2) * factorDilucion);
  } else if (sumaColonias > 0) {
    esSd = true;
  }

  // 5. Previas
  const totalConfirmar = totalColoniasConfirmar;
  const totalCoag = ((coagPos[0] || 0) + (coagPos[1] || 0));
  const previas = totalConfirmar > 0 ? (totalCoag / totalConfirmar) * sumaA : null;

  // 6. Formatear
  let textoReporte = 'SD';

  if (!esSd && ufc !== null) {
    textoReporte = `${redondearDosCifras(ufc)} UFC/g`;
  }

  if (sumaColonias === 0 && factorDilucion > 0) {
    operador = '<';
    esSd = false;
    ufc = 1 / factorDilucion;
    textoReporte = `< ${formatearLimiteDeteccion(factorDilucion)} UFC/g`;
  } else if (!esSd && sumaColonias < 15) {
    textoReporte = 'NE';
  }

  return {
    ufc, textoReporte, operador, esSd,
    aPlacaA, aPlacaB, sumaA, previas,
    coagulasaUsada: coag.tiempoUsado,
    proporcionA: placaA.proporcion,
    proporcionB: placaB.proporcion,
    regla80AplicadaA: placaA.regla80Aplicada,
    regla80AplicadaB: placaB.regla80Aplicada,
    n1,
    n2,
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
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
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

    for (const muestra of muestras) {
      const resultado = calcularSAureus(muestra);
      resultados[muestra.id] = resultado;
      if (resultado.ufc && resultado.ufc > maxUfc) maxUfc = resultado.ufc;
    }

    return res.status(200).json({
      solicitudAnalisisId,
      resultados,
      resultadoConsolidado: maxUfc > 0 ? `${redondearDosCifras(maxUfc)} UFC/g` : 'SD',
      reglaAplicada: 'Se toma el mayor valor entre las muestras que presentan desarrollo'
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
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
