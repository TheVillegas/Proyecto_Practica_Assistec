/**
 * Fábrica de Calculadores Microbiológicos
 * 
 * Proporciona la instancia correcta del calculador según el tipo de formulario.
 * 
 * Tipos soportados:
 * - RAM: Recuento directo → UFC/g
 * - SAU: S. aureus → Coagulasa + NCh2676 8.2
 * - COLI: Coliformes → NMP (tabla 3 tubos)
 * - SAL: Salmonella → Presencia/Ausencia
 */

import { CalculadorBase } from './calculador.base';
import { CalculadorSaureusService } from './calculador-saureus.service';

// Importar otros calculadores cuando se implementen
// import { CalculadorRamService } from './calculador-ram.service';
// import { CalculadorColiformesService } from './calculador-coliformes.service';
// import { CalculadorSalmonellaService } from './calculador-salmonella.service';

export class CalculadorFactory {
  private calculadores: Map<string, CalculadorBase>;
  private calculadorSaureus: CalculadorSaureusService;

  constructor() {
    this.calculadores = new Map();
    this.calculadorSaureus = new CalculadorSaureusService();
    
    // Registrar calculadores disponibles
    this.calculadores.set('SAU', this.calculadorSaureus);
    
    // Registrar otros calculadores cuando se implementen
    // this.calculadores.set('RAM', new CalculadorRamService());
    // this.calculadores.set('COLI', new CalculadorColiformesService());
    // this.calculadores.set('SAL', new CalculadorSalmonellaService());
  }

  /**
   * Obtiene el calculador para un tipo de formulario
   * @param tipoFormulario - Código del formulario: 'RAM', 'SAU', 'COLI', 'SAL'
   * @returns Instancia del calculador correspondiente
   * @throws Error si no existe calculador para el tipo
   */
  obtenerCalculador(tipoFormulario: string): CalculadorBase {
    const tipoNormalizado = tipoFormulario.toUpperCase();
    const calculador = this.calculadores.get(tipoNormalizado);
    
    if (!calculador) {
      const tiposDisponibles = Array.from(this.calculadores.keys()).join(', ');
      throw new Error(
        `No existe calculador para el tipo: ${tipoFormulario}. ` +
        `Tipos disponibles: ${tiposDisponibles}`
      );
    }
    
    return calculador;
  }

  /**
   * Verifica si existe un calculador para el tipo dado
   */
  tieneCalculador(tipoFormulario: string): boolean {
    return this.calculadores.has(tipoFormulario.toUpperCase());
  }

  /**
   * Retorna lista de tipos disponibles
   */
  tiposDisponibles(): string[] {
    return Array.from(this.calculadores.keys());
  }
}
