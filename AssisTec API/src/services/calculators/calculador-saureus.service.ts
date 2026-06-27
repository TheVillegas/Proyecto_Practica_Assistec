/**
 * Calculador de S. aureus - Fase 5
 * 
 * Fórmula: NCh2676 8.2.2.1
 * a = (b / A) × C por placa individual
 * 
 * Donde:
 * - C = colonias posibles S. aureus de esa placa
 * - A = colonias traspasadas de esa placa (colConfirmar)
 * - b = colonias coagulasa positivas de esa placa
 * 
 * Σa = a_placaA + a_placaB
 * N = Σa / ((n₁ + 0.1 × n₂) × d)
 */

import { CalculadorBase, DatosMuestra, ResultadoCalculo } from './calculador.base';

export class CalculadorSaureusService extends CalculadorBase {

  calcular(datos: DatosMuestra): ResultadoCalculo {
    // Validar campos requeridos para S. aureus
    if (!datos.coloniasPosibles || !datos.colConfirmar) {
      return this.crearResultadoVacio();
    }

    const totalColoniasConfirmar = (datos.colConfirmar[0] || 0) + (datos.colConfirmar[1] || 0);
    if (totalColoniasConfirmar > 5) {
      throw new Error('La suma de colonias a confirmar no puede ser mayor a 5');
    }

    // 1. Resolver coagulasa por placa
    const coagulasa4h = datos.coagulasa4h || [null, null];
    const coagulasa24h = datos.coagulasa24h || [null, null];
    const { positivas: coagulasa, tiempoUsado } = this.resolverCoagulasa(coagulasa4h, coagulasa24h);

    // 2. Calcular 'a' por placa individual (NCh2676 8.2.2.1)
    const placaA = this.calcularResultadoPlaca(
      datos.coloniasPosibles[0],
      datos.colConfirmar[0],
      coagulasa[0]
    );
    const placaB = this.calcularResultadoPlaca(
      datos.coloniasPosibles[1],
      datos.colConfirmar[1],
      coagulasa[1]
    );

    const aPlacaA = placaA.a;
    const aPlacaB = placaB.a;

    // 3. Sumar Σa
    const sumaA = aPlacaA + aPlacaB;
    const sumaColonias = this.sumarColonias(datos.diluciones);

    // 4. Extraer diluciones
    const { n1, n2, factorDilucion } = this.extraerDiluciones(datos.diluciones);

    // 5. Calcular UFC/g (NCh2676 8.2.2.2)
    let ufc: number | null = null;
    let esSd = false;
    let operador = '=';

    if (sumaA > 0 && factorDilucion > 0) {
      ufc = sumaA / ((n1 + 0.1 * n2) * factorDilucion);
    } else if (sumaColonias > 0) {
      esSd = true;
    }

    // 6. Calcular previas (para referencia)
    const previas = this.calcularPrevias(coagulasa, datos.colConfirmar, sumaA);

    // 7. Formatear resultado
    let textoReporte = this.formatearResultado(ufc, esSd);

    if (sumaColonias === 0 && factorDilucion > 0) {
      operador = '<';
      esSd = false;
      ufc = 1 / factorDilucion;
      textoReporte = `< ${this.formatearLimiteDeteccion(factorDilucion)} UFC/g`;
    } else if (!esSd && sumaColonias < 15) {
      textoReporte = 'NE';
    }

    return {
      ufc,
      textoReporte,
      operador,
      esSd,
      aPlacaA,
      aPlacaB,
      sumaA,
      previas,
      coagulasaUsada: tiempoUsado,
      proporcionA: placaA.proporcion,
      proporcionB: placaB.proporcion,
      regla80AplicadaA: placaA.regla80Aplicada,
      regla80AplicadaB: placaB.regla80Aplicada,
      n1,
      n2,
      casoAplicado: 'NCh2676_8.2',
      factorDilucion,
      sumaColonias
    };
  }

  /**
   * Calcula el valor "Previas" según fórmula del Excel:
   * Previas = (colConfirmar / coloniasPosibles) × sumaA
   */
  private calcularPrevias(
    coagulasa: [number | null, number | null],
    colConfirmar: [number | null, number | null],
    sumaA: number
  ): number | null {
    const totalConfirmar = (colConfirmar[0] || 0) + (colConfirmar[1] || 0);
    const totalCoagulasa = (coagulasa[0] || 0) + (coagulasa[1] || 0);
    
    if (totalConfirmar === 0) return null;
    
    return (totalCoagulasa / totalConfirmar) * sumaA;
  }

  /**
   * Formatea el resultado según reglas de negocio
   */
  private formatearResultado(
    ufc: number | null,
    esSd: boolean
  ): string {
    if (esSd) {
      return 'SD';
    }
    
    if (ufc === null) {
      return 'SD';
    }

    // Formato: "1,2 x 10³ UFC/g"
    const textoRedondeado = this.redondearDosCifras(ufc);
    return `${textoRedondeado} UFC/g`;
  }

  /**
   * Crea un resultado vacío (cuando faltan datos)
   */
  private crearResultadoVacio(): ResultadoCalculo {
    return {
      ufc: null,
      textoReporte: 'SD',
      operador: '=',
      esSd: true,
      aPlacaA: 0,
      aPlacaB: 0,
      sumaA: 0,
      coagulasaUsada: null,
      casoAplicado: 'NCh2676_8.2',
      factorDilucion: 0,
      sumaColonias: 0
    };
  }
}
