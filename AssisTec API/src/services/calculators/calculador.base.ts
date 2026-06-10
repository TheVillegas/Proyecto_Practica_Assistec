/**
 * Motor de Cálculo Universal para Formularios Microbiológicos
 * 
 * Interfaz y lógica compartida para todos los formularios:
 * - RAM: Recuento directo → UFC/g
 * - S. aureus: Coagulasa + fórmula NCh2676 8.2
 * - Coliformes: NMP (tabla 3 tubos)
 * - Salmonella: Presencia/Ausencia
 */

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────

export interface Dilucion {
  dil: number;                          // Ej: -2 (10^-2), -3 (10^-3)
  colonias: [number | null, number | null];  // [Placa A, Placa B]
}

export interface DatosMuestra {
  diluciones: Dilucion[];
  // Campos específicos por tipo (opcionales)
  coloniasPosibles?: [number | null, number | null];  // S. aureus: colonias posibles S. aureus
  colConfirmar?: [number | null, number | null];       // S. aureus: colonias características traspasadas (máx. 5)
  coagulasa4h?: [number | null, number | null];        // S. aureus: coagulasa positivas a 4 hrs
  coagulasa24h?: [number | null, number | null];       // S. aureus: coagulasa positivas a 24 horas
  volumen?: number;                                     // RAM: volumen sembrado (mL)
  tubosPositivosPorDilucion?: number[];                 // Coliformes: tubos positivos por dilución
  lecturasAgar?: string[];                              // Salmonella: lecturas por agar ('típico' | 'atípico' | 'sin_crecimiento')
}

export interface ResultadoCalculo {
  ufc?: number | null;
  textoReporte: string;           // "1,9 x 10⁴ UFC/g" | "SD" | "Presencia" | "Ausencia"
  operador?: string;              // "=", "<", ">"
  esSd: boolean;
  // Campos específicos S. aureus
  aPlacaA?: number;
  aPlacaB?: number;
  sumaA?: number;
  coagulasaUsada?: string | null; // "4 hrs" | "24 horas" | null (SD)
  // Campos específicos Coliformes
  coliformesTotales?: number;
  coliformesFecales?: number;
  eColi?: number;
  // Campos específicos Salmonella
  presencia?: boolean;
  // Metadata común
  casoAplicado: string;           // PRIORIDAD_1-4 (RAM) | NCh2676_8.2 (S. aureus) | NMP | PRESENCIA_AUSENCIA
  factorDilucion: number;
  sumaColonias: number;
}

// ──────────────────────────────────────────────
// Clase Abstracta Base
// ──────────────────────────────────────────────

export abstract class CalculadorBase {
  
  /**
   * Calcula el resultado para una muestra según la fórmula del formulario
   */
  abstract calcular(datos: DatosMuestra): ResultadoCalculo;

  // ──────────────────────────────────────────────
  // Métodos Compartidos
  // ──────────────────────────────────────────────

  /**
   * Resuelve cuál coagulasa usar: 4 hrs si tiene positivos, si no 24 hrs
   */
  protected resolverCoagulasa(
    coagulasa4h: [number | null, number | null],
    coagulasa24h: [number | null, number | null]
  ): { positivas: [number | null, number | null]; tiempoUsado: string | null } {
    const total4h = (coagulasa4h[0] || 0) + (coagulasa4h[1] || 0);
    const total24h = (coagulasa24h[0] || 0) + (coagulasa24h[1] || 0);

    if (total4h > 0) {
      return { positivas: coagulasa4h, tiempoUsado: '4 hrs' };
    }
    
    if (total24h > 0) {
      return { positivas: coagulasa24h, tiempoUsado: '24 horas' };
    }
    
    return { positivas: [null, null], tiempoUsado: null };
  }

  /**
   * Aplica la regla del 80% (NCh2676 8.2.1):
   * Si b/A >= 0.8 → a = C (sin ajuste)
   * Si b/A < 0.8 → a = (b/A) × C
   */
  protected aplicarRegla80(b: number, A: number, C: number): number {
    if (A === 0 || C === 0) return 0;
    
    const proporcion = b / A;
    
    // Regla del 80%: si la proporción es >= 80%, usar C directo
    if (proporcion >= 0.8) {
      return C;
    }
    
    // Caso contrario: ajuste proporcional
    return Math.floor(proporcion * C);
  }

  /**
   * Redondea a 2 cifras significativas (NCh2676 8.2.2.3)
   */
  protected redondearDosCifras(valor: number): string {
    if (valor === 0) return '0';
    
    const orden = Math.floor(Math.log10(Math.abs(valor)));
    const factor = Math.pow(10, 1 - orden);
    const redondeado = Math.round(valor * factor) / factor;
    
    // Formato con notación científica
    const exponente = Math.floor(Math.log10(Math.abs(redondeado)));
    const mantisa = redondeado / Math.pow(10, exponente);
    
    // Formato español: coma como decimal
    const mantisaStr = mantisa.toFixed(1).replace('.', ',');
    
    if (exponente === 0) {
      return `${mantisaStr}`;
    }
    
    // Superscript para exponente
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    
    const expStr = Math.abs(exponente)
      .toString()
      .split('')
      .map(d => superscripts[d])
      .join('');
    
    const signo = exponente < 0 ? '⁻' : '';
    
    return `${mantisaStr} x 10${signo}${expStr}`;
  }

  /**
   * Calcula el factor de dilución (d) a partir del exponente
   * Ej: dil = -2 → d = 0.01 (10^-2)
   */
  protected calcularFactorDilucion(dilucion: number): number {
    return Math.pow(10, dilucion);
  }

  /**
   * Suma todas las colonias de todas las diluciones
   */
  protected sumarColonias(diluciones: Dilucion[]): number {
    return diluciones.reduce((sum, d) => {
      const coloniasA = d.colonias[0] || 0;
      const coloniasB = d.colonias[1] || 0;
      return sum + coloniasA + coloniasB;
    }, 0);
  }

  /**
   * Extrae información de diluciones (n1, n2, factorDilucion)
   */
  protected extraerDiluciones(diluciones: Dilucion[]): {
    n1: number;
    n2: number;
    factorDilucion: number;
  } {
    // Filtrar diluciones con datos
    const dilucionesConDatos = diluciones.filter(d => 
      d.colonias[0] !== null || d.colonias[1] !== null
    );

    if (dilucionesConDatos.length === 0) {
      return { n1: 0, n2: 0, factorDilucion: 0 };
    }

    // Usar la primera dilución con datos como referencia
    const primeraDil = dilucionesConDatos[0];
    const factorDilucion = this.calcularFactorDilucion(primeraDil.dil);

    // Contar placas por dilución
    const placasDil1 = dilucionesConDatos[0]?.colonias.filter(c => c !== null).length || 0;
    const placasDil2 = dilucionesConDatos[1]?.colonias.filter(c => c !== null).length || 0;

    return {
      n1: placasDil1,
      n2: placasDil2,
      factorDilucion
    };
  }
}
