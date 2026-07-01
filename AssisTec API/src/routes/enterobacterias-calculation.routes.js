/**
 * Calculation route for Enterobacterias — NCh 2676.Of2002
 *
 * POST /api/formulario/ent/calcular-muestra
 *   Body: { volumen?, placas: [{ dil, colonias, confirmA, confirmB }] }
 *   Response: { nEnterobacterias, ufcPorG, casoAplicado, operador, esEstimado, incongruenciaDetectada,
 *               observacionIncongruencia, esSd, sumaA, n1, n2, d, detalle, advertencias }
 */

const { Router } = require('express');
const winston = require('winston');
const { calcularUfcEnt } = require('../calculators/ufcEnt.calculator');

const router = Router();

router.post('/calcular-muestra', (req, res) => {
  try {
    const { placas, volumen } = req.body;

    if (!Array.isArray(placas) || placas.length === 0) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['placas (array no vacío con { dil, colonias, confirmA, confirmB })']
      });
    }

    const resultado = calcularUfcEnt({ volumen: volumen ?? 1, placas });
    return res.status(200).json(resultado);
  } catch (error) {
    winston.error('Error en /formulario/ent/calcular-muestra:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
