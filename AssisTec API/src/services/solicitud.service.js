const solicitudRepository = require('../repositories/solicitud.repository');
const reporteService = require('./reporte.service');
const ROLES = require('../config/roles');

const ESTADOS = {
    BORRADOR: 'borrador',
    ENVIADA: 'enviada',
    DEVUELTA: 'devuelta',
    VALIDADA: 'validada',
    REPORTES_GENERADOS: 'reportes_generados'
};

class SolicitudService {
    async crear(data, usuario) {
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const numeroAli = await solicitudRepository.getNextNumeroAli();
        const solicitudData = await this.buildSolicitudData(data, usuario, numeroAli);
        const cantidadMuestras = Number(data.cantidad_muestras ?? data.numeroMuestras ?? 0);

        const creada = await solicitudRepository.create(solicitudData, cantidadMuestras);
        return this.serializeSolicitud(creada);
    }

    async listar(usuario) {
        let whereClause = {};

        if (usuario.role === ROLES.INGRESO) {
            whereClause = { rutResponsableIngreso: usuario.id };
        }

        const list = await solicitudRepository.findAll(whereClause);
        return list.map(item => this.serializeSolicitud(item));
    }

    async obtener(id) {
        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        return this.serializeSolicitud(solicitud);
    }

    async editar(id, data, expectedUpdatedAt, usuario) {
        const solicitud = await solicitudRepository.findById(id);

        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        if ([ESTADOS.VALIDADA, ESTADOS.REPORTES_GENERADOS].includes(solicitud.estado) && usuario.role === ROLES.INGRESO) {
            throw new Error('ALREADY_VALIDATED');
        }

        const datosActualizar = await this.buildSolicitudData(
            data,
            usuario,
            solicitud.numeroAli,
            solicitud
        );

        const updated = await solicitudRepository.update(id, datosActualizar, expectedUpdatedAt);
        return this.serializeSolicitud(updated);
    }

    async enviarValidacion(id, expectedUpdatedAt, usuario) {
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        const now = new Date();
        const updated = await solicitudRepository.update(id, {
            estado: ESTADOS.ENVIADA,
            fechaEnvioValidacion: now,
            fechaHoraRecepcionCoordinadora: now
        }, expectedUpdatedAt);

        return this.serializeSolicitud(updated);
    }

    async validar(id, expectedUpdatedAt, usuario) {
        if (usuario.role !== ROLES.COORDINADORA && usuario.role !== ROLES.JEFE_AREA) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        if (solicitud.estado === ESTADOS.REPORTES_GENERADOS) {
            throw new Error('ALREADY_VALIDATED');
        }

        const resultado = await reporteService.generarDesdeValidacion(
            solicitud,
            expectedUpdatedAt,
            usuario
        );

        return this.serializeSolicitud(resultado.solicitudActualizada, {
            tpa_generado: resultado.tpa_generado,
            ram_generado: resultado.ram_generado
        });
    }

    async buildSolicitudData(data, usuario, numeroAli, existing = null) {
        const now = new Date();
        const existingMetadata = existing ? this.parseMetadata(existing.observacionesGenerales) : {};
        const anioIngreso = existing?.anioIngreso || new Date(data.anioIngreso ?? now).getFullYear();
        const categoria = await this.resolveCategoria(data, existing);
        const cliente = await this.resolveCliente(data, existing);
        const direccion = await this.resolveDireccion(data, cliente.idCliente, existing);
        const termometro = await this.resolveTermometro(data, existing);
        const lugar = await this.resolveLugar(data, existing);

        const formulariosSeleccionados = this.normalizeFormularios(data.formulariosSeleccionados ?? data.formularios);
        const nombreSolicitante = data.nombreSolicitante ?? data.nombre_solicitante ?? existingMetadata.nombreSolicitante ?? '';
        const observacionesLaboratorio = data.observacionesLaboratorio ?? data.observaciones_laboratorio ?? existingMetadata.observacionesLaboratorio ?? '';
        const cantidadMuestras = Number(data.cantidad_muestras ?? data.numeroMuestras ?? existing?.cantidadMuestras ?? 1);
        const cantidadEnvases = Number(data.cant_envases ?? data.numeroEnvases ?? existing?.cantEnvases ?? 1);
        const fechaRecepcion = new Date(data.fechaRecepcion ?? data.fecha_recepcion ?? existing?.fechaRecepcion ?? now);
        const fechaInicioMuestreo = new Date(data.fechaInicioMuestreo ?? data.fecha_inicio_muestreo ?? existing?.fechaInicioMuestreo ?? fechaRecepcion);
        const fechaTerminoMuestreo = new Date(data.fechaTerminoMuestreo ?? data.fecha_termino_muestreo ?? existing?.fechaTerminoMuestreo ?? fechaRecepcion);
        const diasBase = this.calcularDiasEntrega(cantidadMuestras);
        const fechaNegativa = this.sumarDias(fechaRecepcion, diasBase);
        const fechaPositiva = this.sumarDias(fechaRecepcion, diasBase + 2);
        const fechaAnalista = new Date(data.fechaRecepcionAnalista ?? data.fecha_recepcion_analista ?? existing?.fechaRecepcionAnalista ?? fechaRecepcion);
        const fechaSolicitadaAnalista = new Date(data.fechaSolicitadaEntregaAnalista ?? data.fecha_solicitada_entrega_analista ?? existing?.fechaSolicitadaEntregaAnalista ?? fechaNegativa);
        const rutJefaArea = data.rutJefaArea ?? data.rut_jefa_area ?? existing?.rutJefaArea ?? usuario.id;
        const rutCoordinadora = data.rutCoordinadoraRecepcion ?? data.rut_coordinadora_recepcion ?? existing?.rutCoordinaroraRecepcion ?? usuario.id;

        const metadata = {
            version: 1,
            nombreSolicitante,
            observacionesLaboratorio,
            formularios: formulariosSeleccionados
        };

        return {
            anioIngreso,
            numeroAli,
            numeroActa: this.generarNumeroActa(anioIngreso, numeroAli),
            codigoExterno: data.codigoExterno ?? data.codigo_externo ?? existing?.codigoExterno ?? `EXT-${anioIngreso}-${numeroAli}`,
            categoriaId: categoria.idCategoria,
            idCliente: cliente.idCliente,
            idDireccion: direccion.idDireccion,
            fechaRecepcion,
            temperaturaRecepcion: Number(data.temperatura ?? data.temperatura_recepcion ?? existing?.temperaturaRecepcion ?? 0),
            idTermometro: termometro.idEquipo,
            fechaInicioMuestreo,
            fechaTerminoMuestreo,
            cantidadMuestras,
            cantEnvases: cantidadEnvases,
            responsableMuestreo: data.analistaResponsable ?? data.responsable_muestreo ?? existing?.responsableMuestreo ?? '',
            lugarMuestreo: data.lugarMuestreo ?? data.lugar_muestreo ?? existing?.lugarMuestreo ?? '',
            instructivoMuestreo: data.instructivoMuestreo ?? data.instructivo_muestreo ?? existing?.instructivoMuestreo ?? 'No informado',
            envasesSuministradosPor: data.envasesSuministradosPor ?? data.envases_suministrados_por ?? existing?.envasesSuministradosPor ?? 'Cliente',
            idLugar: lugar.idLugar,
            muestraCompartidaQuimica: Boolean(data.muestraCompartida ?? data.muestra_compartida_quimica ?? existing?.muestraCompartidaQuimica ?? false),
            observacionesGenerales: JSON.stringify(metadata),
            observacionesCliente: data.observacionesCliente ?? data.observaciones_cliente ?? existing?.observacionesCliente ?? `Solicitante: ${nombreSolicitante}`,
            notasDelCliente: data.notasCliente ?? data.notas_del_cliente ?? existing?.notasDelCliente ?? '',
            estado: existing?.estado ?? ESTADOS.BORRADOR,
            rutResponsableIngreso: existing?.rutResponsableIngreso ?? usuario.id,
            rutJefaArea,
            rutCoordinaroraRecepcion: rutCoordinadora,
            fechaEnvioValidacion: existing?.fechaEnvioValidacion ?? now,
            fechaEntregaRevisionJefeLab: data.fechaEntregaRevisionJefeLab ?? existing?.fechaEntregaRevisionJefeLab ?? fechaNegativa,
            motivoDevolucion: data.motivoDevolucion ?? data.motivo_devolucion ?? existing?.motivoDevolucion ?? '',
            fechaHoraRecepcionCoordinadora: data.fechaHoraRecepcionCoordinadora ?? existing?.fechaHoraRecepcionCoordinadora ?? now,
            fechaEntregaResultadoNegativoMicro: data.fechaEntregaResultadoNegativoMicro ?? existing?.fechaEntregaResultadoNegativoMicro ?? fechaNegativa,
            diasHabilesResultadoNegativo: data.diasHabilesResultadoNegativo ?? existing?.diasHabilesResultadoNegativo ?? diasBase,
            fechaEntregaResultadoPositivoMicro: data.fechaEntregaResultadoPositivoMicro ?? existing?.fechaEntregaResultadoPositivoMicro ?? fechaPositiva,
            diasHabilesResultadoPositivo: data.diasHabilesResultadoPositivo ?? existing?.diasHabilesResultadoPositivo ?? (diasBase + 2),
            fechaHoraRetiroMuestrasSala: data.fechaHoraRetiroMuestrasSala ?? existing?.fechaHoraRetiroMuestrasSala ?? fechaNegativa,
            fechaRecepcionAnalista: fechaAnalista,
            fechaSolicitadaEntregaAnalista: fechaSolicitadaAnalista,
            fechaEnvioInformePositivo: data.fechaEnvioInformePositivo ?? existing?.fechaEnvioInformePositivo ?? fechaPositiva,
            fechaEnvioInformeNegativo: data.fechaEnvioInformeNegativo ?? existing?.fechaEnvioInformeNegativo ?? fechaNegativa,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            createdBy: existing?.createdBy ?? usuario.id
        };
    }

    async resolveCategoria(data, existing) {
        const categoriaId = data.categoriaId ?? data.categoria_id ?? data.categoria?.id;
        if (categoriaId) {
            const categoria = await solicitudRepository.findCategoriaById(categoriaId);
            if (categoria) return categoria;
        }

        const nombre = data.categoriaNombre ?? data.categoria_nombre ?? data.categoria?.nombre ?? data.categoria ?? existing?.categoria?.nombre ?? 'General';
        const found = await solicitudRepository.findCategoriaByName(nombre);
        return found || solicitudRepository.createCategoria(nombre);
    }

    async resolveCliente(data, existing) {
        const idCliente = data.idCliente ?? data.id_cliente ?? data.cliente?.id;
        if (idCliente) {
            const cliente = await solicitudRepository.findClienteById(idCliente);
            if (cliente) return cliente;
        }

        const nombre = data.nombreCliente ?? data.nombre_cliente ?? data.cliente?.nombre ?? existing?.cliente?.nombre;
        const rut = data.rutCliente ?? data.rut_cliente ?? existing?.cliente?.rut ?? 'SIN-RUT';
        const email = data.emailCliente ?? data.email_cliente ?? existing?.cliente?.email ?? 'sin-correo@asistec.local';
        const telefono = data.telefonoCliente ?? data.telefono_cliente ?? existing?.cliente?.telefono ?? 'Sin teléfono';
        const activo = existing?.cliente?.activo ?? 'S';

        const existente = nombre ? await solicitudRepository.findClienteByNombre(nombre) : null;
        if (existente) return existente;

        return solicitudRepository.createCliente({
            rut,
            nombre: nombre || `Cliente ${Date.now()}`,
            email,
            telefono,
            activo
        });
    }

    async resolveDireccion(data, idCliente, existing) {
        const idDireccion = data.idDireccion ?? data.id_direccion ?? data.direccion?.id;
        if (idDireccion) {
            const direccion = await solicitudRepository.findDireccionById(idDireccion);
            if (direccion) return direccion;
        }

        const textoDireccion = data.direccion ?? data.direccion_texto ?? data.direccionCliente ?? existing?.direccion?.direccion ?? 'Dirección no informada';
        const existente = await solicitudRepository.findDireccionByClienteYTexto(idCliente, textoDireccion);
        if (existente) return existente;

        return solicitudRepository.createDireccion({
            idCliente,
            alias: data.aliasDireccion ?? data.alias_direccion ?? 'Principal',
            direccion: textoDireccion,
            solicitadoPorDefault: data.nombreSolicitante ?? this.parseMetadata(existing?.observacionesGenerales).nombreSolicitante ?? 'Cliente',
            activo: true
        });
    }

    async resolveTermometro(data, existing) {
        const idTermometro = data.idTermometro ?? data.id_termometro;
        if (idTermometro) {
            const equipo = await solicitudRepository.findEquipoById(idTermometro);
            if (equipo) return equipo;
        }

        if (existing?.termometro) return existing.termometro;

        const primero = await solicitudRepository.getPrimerEquipo();
        if (!primero) {
            throw new Error('MISSING_TERMOMETRO');
        }
        return primero;
    }

    async resolveLugar(data, existing) {
        const idLugar = data.idLugar ?? data.id_lugar ?? data.equipoAlmacenamiento ?? data.equipo_almacenamiento;
        if (idLugar) {
            const lugar = await solicitudRepository.findLugarById(idLugar);
            if (lugar) return lugar;
        }

        if (existing?.lugar) return existing.lugar;

        const primero = await solicitudRepository.getPrimerLugar();
        if (!primero) {
            throw new Error('MISSING_LUGAR');
        }
        return primero;
    }

    normalizeFormularios(formularios = []) {
        if (!Array.isArray(formularios)) {
            return [];
        }

        return formularios.map((formulario) => ({
            id: formulario.id ?? formulario.idFormularioAnalisis ?? null,
            codigo: formulario.codigo ?? formulario.id ?? '',
            nombre: formulario.nombre ?? formulario.nombreAnalisis ?? '',
            genera_tpa_default: Boolean(formulario.generaTpaDefault ?? formulario.genera_tpa_default ?? false)
        }));
    }

    serializeSolicitud(solicitud, extra = {}) {
        const metadata = this.parseMetadata(solicitud.observacionesGenerales);
        const dto = {
            id_solicitud: solicitud.idSolicitud.toString(),
            anio_ingreso: solicitud.anioIngreso,
            numero_ali: solicitud.numeroAli,
            numero_acta: solicitud.numeroActa,
            codigo_externo: solicitud.codigoExterno,
            categoria: solicitud.categoria
                ? { id: solicitud.categoria.idCategoria.toString(), nombre: solicitud.categoria.nombre }
                : null,
            cliente: solicitud.cliente
                ? { id: solicitud.cliente.idCliente, nombre: solicitud.cliente.nombre, rut: solicitud.cliente.rut }
                : null,
            direccion: solicitud.direccion
                ? { id: solicitud.direccion.idDireccion, direccion: solicitud.direccion.direccion, alias: solicitud.direccion.alias }
                : null,
            fecha_recepcion: solicitud.fechaRecepcion,
            fecha_inicio_muestreo: solicitud.fechaInicioMuestreo,
            fecha_termino_muestreo: solicitud.fechaTerminoMuestreo,
            temperatura: Number(solicitud.temperaturaRecepcion),
            id_termometro: solicitud.termometro?.idEquipo ?? solicitud.idTermometro,
            id_lugar: solicitud.lugar?.idLugar ?? solicitud.idLugar,
            cantidad_muestras: solicitud.cantidadMuestras,
            cant_envases: solicitud.cantEnvases,
            responsable_muestreo: solicitud.responsableMuestreo,
            lugar_muestreo: solicitud.lugarMuestreo,
            instructivo_muestreo: solicitud.instructivoMuestreo,
            envases_suministrados_por: solicitud.envasesSuministradosPor,
            muestra_compartida_quimica: solicitud.muestraCompartidaQuimica,
            notas_cliente: solicitud.notasDelCliente,
            nombre_solicitante: metadata.nombreSolicitante ?? '',
            observaciones_laboratorio: metadata.observacionesLaboratorio ?? '',
            formularios_seleccionados: metadata.formularios ?? [],
            estado: solicitud.estado,
            rut_responsable_ingreso: solicitud.rutResponsableIngreso,
            rut_jefa_area: solicitud.rutJefaArea,
            rut_coordinadora_recepcion: solicitud.rutCoordinaroraRecepcion,
            fecha_envio_validacion: solicitud.fechaEnvioValidacion,
            updated_at: solicitud.updatedAt,
            muestras: (solicitud.muestras ?? []).map((muestra) => ({
                id_solicitud_muestra: muestra.idSolicitudMuestra.toString(),
                analisis: (muestra.analisis ?? []).map((analisis) => ({
                    id_solicitud_analisis: analisis.idSolicitudAnalisis.toString(),
                    id_formulario_analisis: analisis.idFormularioAnalisis.toString(),
                    codigo_formulario: analisis.formulario?.codigo ?? null,
                    nombre_formulario: analisis.formulario?.nombreAnalisis ?? null
                }))
            })),
            ...extra
        };

        solicitud.__metadata = metadata;
        return dto;
    }

    parseMetadata(rawValue) {
        if (!rawValue) {
            return {};
        }

        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return {
                observacionesLaboratorio: rawValue,
                formularios: []
            };
        }
    }

    generarNumeroActa(anio, numeroAli) {
        return `ACTA-${anio}-${String(numeroAli).padStart(4, '0')}`;
    }

    calcularDiasEntrega(cantidadMuestras) {
        return 5 + Math.ceil((cantidadMuestras || 1) / 5);
    }

    sumarDias(fecha, dias) {
        const base = new Date(fecha);
        base.setDate(base.getDate() + dias);
        return base;
    }
}

module.exports = new SolicitudService();
