const solicitudRepository = require('../repositories/solicitud.repository');
const ROLES = require('../config/roles');

class SolicitudService {
    async crear(data, usuario) {
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const numeroAli = await solicitudRepository.getNextNumeroAli();
        const now = new Date();

        const nuevaSolicitud = {
            ...data,
            numeroAli,
            estado: 'pendiente',
            createdAt: now,
            updatedAt: now,
            createdBy: usuario.id,
            rutResponsableIngreso: usuario.id, // Asumimos que quien crea es responsable de ingreso
        };

        return await solicitudRepository.create(nuevaSolicitud);
    }

    async listar(usuario) {
        let whereClause = {};

        // Filtrado por rol
        if (usuario.role === ROLES.INGRESO) {
            // Ingreso solo ve solicitudes (no restringe por ahora, asumiendo que ve todas las de ingreso)
        } else if (usuario.role === ROLES.ANALISTA) {
            // Analista solo ve ALI asignados a él (requiere join complejo, simplificado acá por spec)
            // whereClause = { muestras: { some: { analisis: { some: { /* logica analista */ } } } } };
        }

        const list = await solicitudRepository.findAll(whereClause);
        // Convertir BigInt a String para serialización JSON
        return list.map(item => ({
            ...item,
            idSolicitud: item.idSolicitud.toString(),
            categoriaId: item.categoriaId.toString()
        }));
    }

    async editar(id, data, expectedUpdatedAt, usuario) {
        const solicitud = await solicitudRepository.findById(id);
        
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        if (solicitud.estado === 'validada' && usuario.role === ROLES.INGRESO) {
            throw new Error('ALREADY_VALIDATED');
        }

        let datosActualizar = { ...data };

        // Si es coordinadora y está validada, solo puede editar campos específicos
        if (usuario.role === ROLES.COORDINADORA) {
            // Filtrar campos permitidos
            // datosActualizar = { campoPermitido: data.campoPermitido ... }
        }

        const updated = await solicitudRepository.update(id, datosActualizar, expectedUpdatedAt);
        return {
            ...updated,
            idSolicitud: updated.idSolicitud.toString(),
            categoriaId: updated.categoriaId.toString()
        };
    }

    async validar(id, expectedUpdatedAt, usuario) {
        if (usuario.role !== ROLES.COORDINADORA && usuario.role !== ROLES.JEFE_AREA) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const solicitud = await solicitudRepository.findById(id);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        if (solicitud.estado === 'validada') {
            throw new Error('ALREADY_VALIDATED');
        }

        const updated = await solicitudRepository.update(id, { estado: 'validada' }, expectedUpdatedAt);
        return {
            ...updated,
            idSolicitud: updated.idSolicitud.toString(),
            categoriaId: updated.categoriaId.toString()
        };
    }
}

module.exports = new SolicitudService();
