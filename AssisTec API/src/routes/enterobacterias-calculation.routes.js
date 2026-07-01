/**
 * Calculation route for Enterobacterias — NCh 2676.Of2002
 *
 * POST /api/formulario/ent/calcular-muestra
 *   Body: { diluciones: [{ dil: -1, colonias: [c1, c2] }] }
 *   Response: { nEnterobacterias, ufcPorG, casoAplicado, operador, esEstimado, incongruenciaDetectada, ... }
 */

const { Router } = require('express');
const winston = require('winston');
const { calcularUfcEnt } = require('../calculators/ufcEnt.calculator');

const router = Router();

router.post('/calcular-muestra', (req, res) => {
  try {
    const { diluciones } = req.body;

    if (!Array.isArray(diluciones) || diluciones.length === 0) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        camposRequeridos: ['diluciones (array no vacío con { dil, colonias: [c1, c2] })']
      });
    }

    const resultado = calcularUfcEnt({ volumen: 1, diluciones });
    return res.status(200).json(resultado);
  } catch (error) {
    winston.error('Error en /formulario/ent/calcular-muestra:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
