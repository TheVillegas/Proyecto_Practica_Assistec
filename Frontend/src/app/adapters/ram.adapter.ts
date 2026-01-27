import { Etapa1, Etapa2, Etapa3Item, Etapa4, Etapa5, Etapa6, Etapa7 } from '../interfaces/reporte-ram.interface';

export class RamAdapter {

    /**
     * Transforma la respuesta cruda del Backend en un ViewModel listo para la vista
     */
    static mapReporteToView(reporte: any): any {
        if (!reporte) return null;

        const viewModel: any = {
            estadoRAM: reporte.estado || 'No realizado',
            ultimaActualizacionRam: reporte.fechaUltimaModificacion || reporte.ultimaActualizacion || '',
            responsableModificacionRam: reporte.usuarioUltimaModificacion || reporte.responsable || '', // Se rellena en el componente si es necesario
            formularioBloqueado: reporte.estado === 'Verificado',
            etapa1: reporte.etapa1 || {},
            etapa2: reporte.etapa2 || {},
            etapa4: reporte.etapa4 || {},
            etapa5: {
                ...reporte.etapa5,
                imagenManual: reporte.etapa5?.manualInocuidad
            },
            etapa6: reporte.etapa6 || {},
            etapa7: reporte.etapa7 || {}
        };

        // Formateo de Fechas Etapa 2
        if (viewModel.etapa2.fechaInicioIncubacion) {
            viewModel.etapa2.fechaInicioIncubacion = this.formatDate(viewModel.etapa2.fechaInicioIncubacion);
        }
        if (viewModel.etapa2.fechaFinIncubacion) {
            viewModel.etapa2.fechaFinIncubacion = this.formatDate(viewModel.etapa2.fechaFinIncubacion);
        }

        // Mapeo Etapa 3
        viewModel.listaRepeticionesEtapa3 = this.mapearEtapa3DesdeBackend(reporte);

        if (viewModel.listaRepeticionesEtapa3.length === 0 && reporte.codigoALI) {
            // Inicialización por defecto si no hay muestras
            viewModel.listaRepeticionesEtapa3 = [{
                id: Date.now(),
                codigoALI: reporte.codigoALI,
                numeroMuestra: 1,
            }];
        }

        // Formateo de Fechas Etapa 5
        if (viewModel.etapa5.fechaEntrega) {
            viewModel.etapa5.fechaEntrega = this.formatDate(viewModel.etapa5.fechaEntrega);
        }

        // Casting Desfavorable
        if (viewModel.etapa5.desfavorable !== null && viewModel.etapa5.desfavorable !== undefined) {
            viewModel.etapa5.desfavorable = String(viewModel.etapa5.desfavorable);
        }

        // Lógica de Formas de Cálculo se mantiene parciamente para listas, 
        // pero aquí aseguramos que exista el array
        if (!viewModel.etapa7.formaCalculoAnalista) {
            viewModel.etapa7.formaCalculoAnalista = [];
        }
        if (!viewModel.etapa7.formaCalculoCoordinador) {
            viewModel.etapa7.formaCalculoCoordinador = [];
        }

        return viewModel;
    }

    private static mapearEtapa3DesdeBackend(reporte: any): Etapa3Item[] {
        if (!reporte.etapa3_repeticiones) return [];

        return reporte.etapa3_repeticiones.map((m: any) => {
            const dil1 = m.diluciones && m.diluciones[0] ? m.diluciones[0] : null;
            const dil2 = m.diluciones && m.diluciones[1] ? m.diluciones[1] : null;

            let dupFields: Partial<Etapa3Item> = {};

            if (m.duplicado) {
                const d = m.duplicado;
                dupFields = {
                    codigoALIDuplicado: d.codigoALI,
                    numeroMuestraDuplicado: m.numero_Muestra, // Se asume que el duplicado tiene el mismo numero de muestra base
                    dilDuplicado01: d.dil01,
                    dilDuplicado02: d.dil02,
                    numeroColoniasDuplicado01: d.numeroColonias?.[0],
                    numeroColoniasDuplicado02: d.numeroColonias?.[1],
                    numeroColoniasDuplicado03: d.numeroColonias?.[2],
                    numeroColoniasDuplicado04: d.numeroColonias?.[3],
                    resultadoRAMDuplicado01: d.resultado_ram,
                    resultadoRPESDuplicado01: d.resultado_rpes,
                    promedioDuplicado: d.promedio,
                    sumaColoniasDuplicado: d.sumaColonias,
                    n1Duplicado: d.n1,
                    n2Duplicado: d.n2,
                    factorDilucionDuplicado: d.factorDilucion,
                };
            }

            return {
                id: Date.now() + Math.random(), // Generar ID único para frontend
                codigoALI: reporte.codigoALI,
                numeroMuestra: m.numero_Muestra,
                dil: dil1 ? dil1.dil : '',
                dil2: dil2 ? dil2.dil : '',
                numeroColonias01: dil1 && dil1.colonias ? dil1.colonias[0] : undefined,
                numeroColonias02: dil1 && dil1.colonias ? dil1.colonias[1] : undefined,
                numeroColonias03: dil2 && dil2.colonias ? dil2.colonias[0] : undefined,
                numeroColonias04: dil2 && dil2.colonias ? dil2.colonias[1] : undefined,
                resultadoRAM01: m.resultado_ram,
                resultadoRPES01: m.resultado_rpes,
                promedio: m.promedio,
                sumaColonias: m.sumaColonias,
                n1: m.n1,
                n2: m.n2,
                factorDilucion: m.factorDilucion,
                ...dupFields
            };
        });
    }

    private static formatDate(dateString: string): string {
        if (!dateString) return '';
        return dateString.split('T')[0];
    }
}
