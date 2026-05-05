const solicitudRepository = require('../repositories/solicitud.repository');
const reporteService = require('./reporte.service');
const ROLES = require('../config/roles');

const ESTADOS = {
    BORRADOR: 'borrador',
    ENVIADO: 'enviado',
    RECHAZADO: 'rechazado',
    VALIDADO: 'validado',
    CONVERTIDO_MUESTRAS: 'convertido_muestras',
    ENVIADA_LEGACY: 'enviada',
    DEVUELTA_LEGACY: 'devuelta',
    VALIDADA_LEGACY: 'validada',
    REPORTES_GENERADOS_LEGACY: 'reportes_generados'
};

class SolicitudService {
    async crear(data, usuario) {
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const numeroAli = this.resolveNumeroAliManual(data);
        if (!String(data.numeroActa ?? data.numero_acta ?? '').trim()) {
            throw new Error('MISSING_NUMERO_ACTA');
        }
        const solicitudData = await this.buildSolicitudData(data, usuario, numeroAli);
        const cantidadMuestras = Number(data.cantidad_muestras ?? data.numeroMuestras ?? 0);
        const formulariosDefault = await this.buildFormulariosDefault(solicitudData.categoriaId);

        const creada = await solicitudRepository.createWithAnalisisDefault(solicitudData, cantidadMuestras, formulariosDefault);
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

        if ([ESTADOS.VALIDADO, ESTADOS.CONVERTIDO_MUESTRAS, ESTADOS.VALIDADA_LEGACY, ESTADOS.REPORTES_GENERADOS_LEGACY].includes(solicitud.estado) && usuario.role === ROLES.INGRESO) {
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
            estado: ESTADOS.ENVIADO,
            fechaEnvioValidacion: now,
            rutResponsableIngreso: usuario.id
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

        if (solicitud.estado === ESTADOS.CONVERTIDO_MUESTRAS || solicitud.estado === ESTADOS.REPORTES_GENERADOS_LEGACY) {
            throw new Error('ALREADY_VALIDATED');
        }

        const now = new Date();
        const updated = await solicitudRepository.update(id, {
            estado: ESTADOS.VALIDADO,
            rutJefaArea: usuario.role === ROLES.JEFE_AREA ? usuario.id : solicitud.rutJefaArea,
            rutCoordinaroraRecepcion: usuario.role === ROLES.COORDINADORA ? usuario.id : solicitud.rutCoordinaroraRecepcion,
            fechaEntregaRevisionJefeLab: now,
            fechaHoraRecepcionCoordinadora: usuario.role === ROLES.COORDINADORA ? now : solicitud.fechaHoraRecepcionCoordinadora
        }, expectedUpdatedAt);

        return this.serializeSolicitud(updated);
    }

    async rechazar(id, data, expectedUpdatedAt, usuario) {
        if (usuario.role !== ROLES.COORDINADORA && usuario.role !== ROLES.JEFE_AREA) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const motivo = data.motivoDevolucion ?? data.motivo_devolucion ?? '';
        if (!String(motivo).trim()) {
            throw new Error('MISSING_REJECTION_REASON');
        }

        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        const updated = await solicitudRepository.update(id, {
            estado: ESTADOS.RECHAZADO,
            motivoDevolucion: motivo,
            rutJefaArea: usuario.role === ROLES.JEFE_AREA ? usuario.id : solicitud.rutJefaArea,
            rutCoordinaroraRecepcion: usuario.role === ROLES.COORDINADORA ? usuario.id : solicitud.rutCoordinaroraRecepcion,
            fechaEntregaRevisionJefeLab: new Date()
        }, expectedUpdatedAt);

        return this.serializeSolicitud(updated);
    }

    async resolverAnalisis(query) {
        const idCategoria = query.id_categoria_producto ?? query.categoriaId ?? query.categoria_id;
        const idFormulario = query.id_formulario_analisis ?? query.formularioId ?? query.formulario_id;
        if (!idCategoria || !idFormulario) {
            throw new Error('MISSING_PARAMS');
        }

        return this.resolverAnalisisPorCategoriaFormulario(idCategoria, idFormulario);
    }

    async plazoEstimado(codigoAli) {
        const solicitud = await solicitudRepository.findByNumeroAli(codigoAli);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        const analisis = await solicitudRepository.findAnalisisByCodigoAli(codigoAli);
        const plazo = this.calcularPlazoDesdeAnalisis(analisis);
        return {
            dias_negativo: plazo.diasNegativo,
            dias_confirmacion: plazo.diasConfirmacion,
            fecha_entrega_neg: plazo.diasNegativo == null ? null : this.sumarDias(solicitud.fechaRecepcion, plazo.diasNegativo).toISOString(),
            fecha_entrega_pos: plazo.diasConfirmacion == null ? null : this.sumarDias(solicitud.fechaRecepcion, plazo.diasConfirmacion).toISOString()
        };
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
        const diasBase = this.calcularDiasEntrega(formulariosSeleccionados);
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
            numeroActa: data.numeroActa ?? data.numero_acta ?? existing?.numeroActa ?? '',
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
        const idEquipoAlmacenamiento = data.idEquipoAlmacenamiento ?? data.id_equipo_almacenamiento;
        if (idEquipoAlmacenamiento) {
            const equipo = await solicitudRepository.findEquipoById(idEquipoAlmacenamiento);
            if (equipo) {
                return this.resolveLugarDesdeEquipo(equipo);
            }
        }

        const idLugar = data.idLugar ?? data.id_lugar ?? data.equipoAlmacenamiento ?? data.equipo_almacenamiento;
        if (idLugar) {
            const lugar = await solicitudRepository.findLugarById(idLugar);
            if (lugar) return lugar;

            const equipo = await solicitudRepository.findEquipoById(idLugar);
            if (equipo) {
                return this.resolveLugarDesdeEquipo(equipo);
            }
        }

        if (existing?.lugar) return existing.lugar;

        const primero = await solicitudRepository.getPrimerLugar();
        if (!primero) {
            throw new Error('MISSING_LUGAR');
        }
        return primero;
    }

    async resolveLugarDesdeEquipo(equipo) {
        const codigo = equipo.codigoEquipo || null;
        if (codigo) {
            const byCode = await solicitudRepository.findLugarByCodigo(codigo);
            if (byCode) return byCode;
        }

        const byName = await solicitudRepository.findLugarByNombre(equipo.nombreEquipo);
        if (byName) return byName;

        return solicitudRepository.createLugar({
            nombreLugar: equipo.nombreEquipo,
            codigoLugar: codigo
        });
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

    resolveNumeroAliManual(data) {
        const numeroAli = data.codigoALI ?? data.codigo_ali ?? data.numeroAli ?? data.numero_ali;
        const parsed = Number(numeroAli);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error('MISSING_CODIGO_ALI');
        }
        return parsed;
    }

    async buildFormulariosDefault(idCategoriaProducto) {
        const tpa = await solicitudRepository.findFormularioTpaDefault();
        if (!tpa) return [];
        const snapshot = await this.resolverAnalisisPorCategoriaFormulario(idCategoriaProducto, tpa.idFormularioAnalisis);
        return [{
            idFormularioAnalisis: tpa.idFormularioAnalisis,
            idAlcanceAcreditacion: snapshot.id_alcance_acreditacion,
            acreditado: snapshot.acreditado,
            metodologiaNorma: snapshot.metodologia_norma,
            diasNegativoSnapshot: snapshot.dias_negativo,
            diasConfirmacionSnapshot: snapshot.dias_confirmacion
        }];
    }

    async resolverAnalisisPorCategoriaFormulario(idCategoriaProducto, idFormularioAnalisis) {
        const [formulario, tiempo, alcance] = await Promise.all([
            solicitudRepository.findFormularioById(idFormularioAnalisis),
            solicitudRepository.findTiempoPorCategoria(idCategoriaProducto, idFormularioAnalisis),
            solicitudRepository.findAlcancePorCategoriaFormulario(idCategoriaProducto, idFormularioAnalisis)
        ]);

        if (!formulario) {
            throw new Error('FORMULARIO_NOT_FOUND');
        }

        return {
            id_formulario_analisis: formulario.idFormularioAnalisis.toString(),
            codigo_formulario: formulario.codigo,
            nombre_formulario: formulario.nombreAnalisis,
            id_alcance_acreditacion: alcance?.idAlcanceAcreditacion ?? null,
            codigo_le: alcance?.acreditacion?.codigo ?? null,
            acreditado: Boolean(alcance),
            metodologia_norma: alcance?.normaEspecifica ?? (tiempo?.metodologiaNorma != null ? String(tiempo.metodologiaNorma) : ''),
            dias_negativo: tiempo?.diasNegativo ?? null,
            dias_confirmacion: tiempo?.diasConfirmacion ?? null
        };
    }

    calcularPlazoDesdeAnalisis(analisis = []) {
        const negativos = analisis
            .map((item) => item.diasNegativoSnapshot ?? null)
            .filter((dias) => dias !== null && dias !== undefined)
            .map(Number);
        const confirmaciones = analisis
            .map((item) => item.diasConfirmacionSnapshot ?? null)
            .filter((dias) => dias !== null && dias !== undefined)
            .map(Number);

        return {
            diasNegativo: negativos.length ? Math.max(...negativos) + 1 : null,
            diasConfirmacion: confirmaciones.length ? Math.max(...confirmaciones) + 1 : null
        };
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
                    ,
                    metodologia_norma: analisis.metodologiaNorma ?? null,
                    acreditado: Boolean(analisis.acreditado),
                    codigo_le: analisis.alcance?.acreditacion?.codigo ?? null,
                    dias_negativo_snapshot: analisis.diasNegativoSnapshot ?? null,
                    dias_confirmacion_snapshot: analisis.diasConfirmacionSnapshot ?? null
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

    calcularDiasEntrega(formularios = []) {
        const negativos = formularios
            .map((formulario) => formulario.dias_negativo ?? formulario.diasNegativoSnapshot)
            .filter((dias) => dias !== null && dias !== undefined)
            .map(Number);
        if (negativos.length === 0) return 1;
        return Math.max(...negativos) + 1;
    }

    sumarDias(fecha, dias) {
        const base = new Date(fecha);
        base.setDate(base.getDate() + dias);
        return base;
    }
}

module.exports = new SolicitudService();
