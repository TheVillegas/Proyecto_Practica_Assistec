const reporteRepository = require('../repositories/reporte.repository');
const solicitudRepository = require('../repositories/solicitud.repository');

class ReporteService {
    async generar(idSolicitud) {
        const solicitud = await solicitudRepository.findById(idSolicitud);

        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        const resultado = await this.generarDesdeSolicitud(solicitud);
        return {
            tpa_generado: resultado.tpa_generado,
            ram_generado: resultado.ram_generado
        };
    }

    async generarDesdeValidacion(solicitud, expectedUpdatedAt, usuario) {
        return this.generarDesdeSolicitud(solicitud, {
            expectedUpdatedAt,
            actualizarSolicitud: {
                estado: 'reportes_generados',
                rutJefaArea: usuario.role === 2 ? usuario.id : solicitud.rutJefaArea,
                rutCoordinaroraRecepcion: usuario.role === 1 ? usuario.id : solicitud.rutCoordinaroraRecepcion,
                fechaEntregaRevisionJefeLab: new Date(),
                fechaHoraRecepcionCoordinadora: new Date()
            }
        });
    }

    async generarDesdeSolicitud(solicitud, options = {}) {
        const existe = await reporteRepository.findByCodigoAli(solicitud.numeroAli);
        if (existe) {
            throw new Error('ALREADY_GENERATED');
        }

        const requisitos = this.resolverRequisitos(solicitud);
        if (!requisitos.tieneAnalisis) {
            throw new Error('NO_ANALYSIS');
        }

        const resultado = await reporteRepository.crearBridge({
            idSolicitud: solicitud.idSolicitud,
            numeroAli: solicitud.numeroAli,
            reqTpa: requisitos.requiereTpa,
            reqRam: requisitos.requiereRam,
            observacionesCliente: solicitud.observacionesCliente,
            observacionesGenerales: solicitud.observacionesGenerales,
            expectedUpdatedAt: options.expectedUpdatedAt,
            actualizarSolicitud: options.actualizarSolicitud
        });

        return {
            solicitudActualizada: resultado.solicitud ?? solicitud,
            tpa_generado: !!resultado.tpa,
            ram_generado: !!resultado.ram
        };
    }

    resolverRequisitos(solicitud) {
        let requiereTpa = false;
        let requiereRam = false;
        let tieneAnalisis = false;

        for (const muestra of solicitud.muestras ?? []) {
            for (const analisis of muestra.analisis ?? []) {
                tieneAnalisis = true;
                if (analisis.formulario?.generaTpaDefault) requiereTpa = true;
                if (analisis.formulario?.codigo?.toUpperCase() === 'RAM') requiereRam = true;
            }
        }

        if (tieneAnalisis) {
            return { requiereTpa, requiereRam, tieneAnalisis };
        }

        const metadata = this.parseMetadata(solicitud.observacionesGenerales);
        const formularios = Array.isArray(metadata.formularios) ? metadata.formularios : [];
        if (formularios.length === 0) {
            return { requiereTpa: false, requiereRam: false, tieneAnalisis: false };
        }

        requiereTpa = formularios.some((formulario) =>
            formulario.genera_tpa_default === true ||
            String(formulario.codigo || '').toUpperCase() === 'TPA'
        );
        requiereRam = formularios.some((formulario) =>
            String(formulario.codigo || '').toUpperCase() === 'RAM'
        );

        return {
            requiereTpa,
            requiereRam,
            tieneAnalisis: true
        };
    }

    parseMetadata(rawValue) {
        if (!rawValue) return {};

        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return {};
        }
    }
}

module.exports = new ReporteService();
