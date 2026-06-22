/**
 * Servicio de Importación de Duplicado para S. aureus
 * 
 * Importa datos de Muestra 1 de un ALI pasado como referencia
 * para el campo "Duplicado" del formulario S. aureus.
 */

import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const prisma = new PrismaClient();

export interface DuplicadoImportado {
  aliOrigen: number;
  muestra1: {
    diluciones: Array<{ dil: number; colonias: [number | null, number | null] }>;
    coloniasPosibles: [number | null, number | null];
    colConfirmar: [number | null, number | null];
    coagulasa4h: [number | null, number | null];
    coagulasa24h: [number | null, number | null];
    resultadoTexto: string | null;
  } | null;
  advertencia: string | null;
}

export class ImportDuplicadoService {
  
  /**
   * Importa datos de Muestra 1 de un ALI pasado
   * 
   * @param aliOrigen - ID del ALI origen (ej: 421)
   * @param solicitudActualId - ID de la solicitud actual
   * @returns Datos importados o advertencia
   */
  async importarDesdeAli(
    aliOrigen: number,
    solicitudActualId: string
  ): Promise<DuplicadoImportado> {
    try {
      // 1. Buscar la solicitud del ALI origen
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
                    include: {
                      etapa5Resultados: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!solicitudOrigen) {
        return {
          aliOrigen,
          muestra1: null,
          advertencia: `No se encontró el ALI ${aliOrigen}`
        };
      }

      // 2. Obtener formulario S. aureus del ALI origen
      const sauFormulario = solicitudOrigen.formulario?.sauFormulario;
      
      if (!sauFormulario) {
        return {
          aliOrigen,
          muestra1: null,
          advertencia: `El ALI ${aliOrigen} no tiene formulario S. aureus`
        };
      }

      // 3. Obtener Muestra 1
      const muestra1 = sauFormulario.muestras?.[0];
      
      if (!muestra1) {
        return {
          aliOrigen,
          muestra1: null,
          advertencia: `El ALI ${aliOrigen} no tiene Muestra 1 de S. aureus`
        };
      }

      // 4. Extraer datos de la Muestra 1
      const etapa5 = muestra1.etapa5Resultados?.[0];
      
      const datosImportados = {
        diluciones: this.extraerDiluciones(muestra1),
        coloniasPosibles: [
          muestra1.coloniasPosibles1 || null,
          muestra1.coloniasPosibles2 || null
        ] as [number | null, number | null],
        colConfirmar: [
          muestra1.colConfirmar1 || null,
          muestra1.colConfirmar2 || null
        ] as [number | null, number | null],
        coagulasa4h: [
          muestra1.confirmadas4h1 || null,
          muestra1.confirmadas4h2 || null
        ] as [number | null, number | null],
        coagulasa24h: [
          muestra1.confirmadas24h1 || null,
          muestra1.confirmadas24h2 || null
        ] as [number | null, number | null],
        resultadoTexto: etapa5?.resultadoTexto || null
      };

      return {
        aliOrigen,
        muestra1: datosImportados,
        advertencia: null
      };
    } catch (error) {
      winston.error('Error al importar duplicado:', error);
      return {
        aliOrigen,
        muestra1: null,
        advertencia: 'Error al importar datos del ALI origen'
      };
    }
  }

  /**
   * Extrae diluciones de la muestra
   */
  private extraerDiluciones(muestra: any): Array<{ dil: number; colonias: [number | null, number | null] }> {
    const diluciones: Array<{ dil: number; colonias: [number | null, number | null] }> = [];

    if (muestra.dil1 !== null) {
      diluciones.push({
        dil: Number(muestra.dil1),
        colonias: [muestra.c1 || null, muestra.c2 || null]
      });
    }

    if (muestra.dil2 !== null) {
      diluciones.push({
        dil: Number(muestra.dil2),
        colonias: [muestra.c3 || null, muestra.c4 || null]
      });
    }

    return diluciones;
  }
}
