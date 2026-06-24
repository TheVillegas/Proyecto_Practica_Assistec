const prisma = require('../config/prisma');

class MuestraAliRepository {
    async findAll() {
        const muestras = await prisma.muestraAli.findMany({
            include: {
                tpaReportes: true,
                ramReportes: true
            },
            orderBy: { codigoAli: 'desc' }
        });

        // Para cada muestra, buscar formularios microbiológicos asociados
        const result = [];
        for (const muestra of muestras) {
            const formularios = await this.findFormulariosByCodigoAli(muestra.codigoAli);
            result.push({ ...muestra, formulariosMicrobiologicos: formularios });
        }
        return result;
    }

    async findByCodigoAli(codigoAli) {
        const muestra = await prisma.muestraAli.findUnique({
            where: { codigoAli },
            include: {
                tpaReportes: true,
                ramReportes: true
            }
        });

        if (!muestra) return null;

        const formularios = await this.findFormulariosByCodigoAli(codigoAli);
        return { ...muestra, formulariosMicrobiologicos: formularios };
    }

    /**
     * Busca los formularios microbiológicos (SAU/COLI/SAL) asociados a una MuestraAli
     * a través de la cadena: codigoAli → SolicitudIngreso → SolicitudMuestra → SolicitudAnalisis → Formularios
     */
    async findFormulariosByCodigoAli(codigoAli) {
        // 1. Buscar la solicitud de ingreso que tenga este numeroAli
        const solicitud = await prisma.solicitudIngreso.findFirst({
            where: { numeroAli: codigoAli },
            select: { idSolicitud: true }
        });

        if (!solicitud) return [];

        const idSolicitud = solicitud.idSolicitud;

        // 2. Obtener los id_solicitud_muestra de esta solicitud
        const muestras = await prisma.solicitudMuestra.findMany({
            where: { idSolicitud },
            select: { idSolicitudMuestra: true }
        });

        if (muestras.length === 0) return [];

        const idsMuestra = muestras.map(m => m.idSolicitudMuestra);

        // 3. Obtener los id_solicitud_analisis de esas muestras
        const analisis = await prisma.solicitudAnalisis.findMany({
            where: { idSolicitudMuestra: { in: idsMuestra } },
            select: { idSolicitudAnalisis: true, formulario: true }
        });

        if (analisis.length === 0) return [];

        const idsAnalisis = analisis.map(a => a.idSolicitudAnalisis);

        // 4. Buscar formularios SAU, COLI, SAL
        const [sauForms, coliForms, salForms] = await Promise.all([
            prisma.sauFormulario.findMany({
                where: { idSolicitudAnalisis: { in: idsAnalisis } },
                select: { idSauFormulario: true, idSolicitudAnalisis: true, estado: true, etapaActual: true, rutAnalista: true }
            }),
            prisma.coliFormulario.findMany({
                where: { idSolicitudAnalisis: { in: idsAnalisis } },
                select: { idColiFormulario: true, idSolicitudAnalisis: true, estado: true, faseActual: true, rutAnalista: true }
            }),
            prisma.salFormulario.findMany({
                where: { idSolicitudAnalisis: { in: idsAnalisis } },
                select: { idSalFormulario: true, idSolicitudAnalisis: true, estado: true, faseActual: true, rutAnalista: true }
            })
        ]);

        // Armar ruta frontend según código de formulario
        const getRuta = (codigo) => {
            const mapa = {
                SAUREUS: '/form-s-aureus',
                COLIFORMES: '/form-coliformes',
                SALMONELLA: '/form-salmonella'
            };
            return mapa[codigo] ?? null;
        };

        // 5. Armar respuesta
        const formularios = [];

        if (sauForms.length > 0) {
            formularios.push({
                codigo: 'SAUREUS',
                nombre: 'S. Aureus',
                estado: this.mergeFormEstado(sauForms),
                ruta: getRuta('SAUREUS'),
                idSolicitudAnalisis: sauForms.map(f => String(f.idSolicitudAnalisis))
            });
        }

        if (coliForms.length > 0) {
            formularios.push({
                codigo: 'COLIFORMES',
                nombre: 'Coliformes',
                estado: this.mergeFormEstado(coliForms),
                ruta: getRuta('COLIFORMES'),
                idSolicitudAnalisis: coliForms.map(f => String(f.idSolicitudAnalisis))
            });
        }

        if (salForms.length > 0) {
            formularios.push({
                codigo: 'SALMONELLA',
                nombre: 'Salmonella',
                estado: this.mergeFormEstado(salForms),
                ruta: getRuta('SALMONELLA'),
                idSolicitudAnalisis: salForms.map(f => String(f.idSolicitudAnalisis))
            });
        }

        return formularios;
    }

    /**
     * Combina el estado de múltiples formularios del mismo tipo
     * (ej: varios coli_formulario para distintas muestras).
     * Prioridad: en_proceso > no_realizado > completado
     */
    mergeFormEstado(forms) {
        if (!forms || forms.length === 0) return 'NO_REALIZADO';

        const normalizar = (e) => (e || '').toUpperCase().replace(/ /g, '_');

        // Si alguno está en progreso → EN_PROCESO
        if (forms.some(f => normalizar(f.estado) === 'EN_PROCESO')) return 'EN_PROCESO';

        // Si alguno está en borrador → BORRADOR
        if (forms.some(f => normalizar(f.estado) === 'BORRADOR')) return 'BORRADOR';

        // Si todos están completados/verificados → COMPLETADO
        if (forms.every(f => ['COMPLETADO', 'VERIFICADO'].includes(normalizar(f.estado)))) return 'COMPLETADO';

        // Si todos están NO_REALIZADO → NO_REALIZADO
        if (forms.every(f => normalizar(f.estado) === 'NO_REALIZADO')) return 'NO_REALIZADO';

        return normalizar(forms[0]?.estado) || 'NO_REALIZADO';
    }

    async updateObservaciones(codigoAli, observacionesGenerales) {
        return prisma.muestraAli.update({
            where: { codigoAli },
            data: { observacionesGenerales }
        });
    }

    async delete(codigoAli) {
        return prisma.muestraAli.delete({
            where: { codigoAli }
        });
    }

    /**
     * Transforma un row de MuestraAli al formato que espera el frontend
     */
    toFrontendFormat(muestra) {
        if (!muestra) return null;

        const formularios = [...(muestra.formulariosMicrobiologicos ?? [])];

        // Agregar TPA (siempre presente en cada muestra)
        const ultimoTPA = muestra.tpaReportes?.length > 0
            ? muestra.tpaReportes[muestra.tpaReportes.length - 1]
            : null;
        formularios.push({
            codigo: 'TPA',
            nombre: 'Reporte TPA',
            estado: ultimoTPA?.estadoActual ?? 'NO_REALIZADO',
            ruta: '/reporte-tpa'
        });

        // Agregar RAM solo si existe registro (se seleccionó formulario RAM)
        const ultimoRAM = muestra.ramReportes?.length > 0
            ? muestra.ramReportes[muestra.ramReportes.length - 1]
            : null;
        if (ultimoRAM) {
            formularios.push({
                codigo: 'RAM',
                nombre: 'Reporte RAM',
                estado: ultimoRAM.estadoRam,
                ruta: '/reporte-ram'
            });
        }

        return {
            ALIMuestra: String(muestra.codigoAli),
            CodigoSerna: muestra.codigoOtros ?? null,
            observacionesCliente: muestra.observacionesCliente ?? '',
            observacionesGenerales: muestra.observacionesGenerales ?? '',
            formularios
        };
    }
}

module.exports = new MuestraAliRepository();
