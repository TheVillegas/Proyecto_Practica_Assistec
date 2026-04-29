const muestraRepository = require('../repositories/muestra.repository');
const solicitudRepository = require('../repositories/solicitud.repository');
const ROLES = require('../config/roles');

class MuestraService {
    async crearBatch(idSolicitud, cantidad, usuario) {
        // Validar rol de Ingreso
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        if (!cantidad || cantidad < 1) {
            throw new Error('INVALID_QUANTITY');
        }

        const solicitud = await solicitudRepository.findById(idSolicitud);
        if (!solicitud) {
            throw new Error('NOT_FOUND');
        }

        if (solicitud.estado === 'validada') {
            throw new Error('ALREADY_VALIDATED');
        }

        const creadas = await muestraRepository.createBatch(idSolicitud, cantidad);
        
        return creadas.map(m => ({
            ...m,
            idSolicitudMuestra: m.idSolicitudMuestra.toString(),
            idSolicitud: m.idSolicitud.toString()
        }));
    }

    async listarPorSolicitud(idSolicitud) {
        const list = await muestraRepository.findBySolicitud(idSolicitud);
        return list.map(m => ({
            ...m,
            idSolicitudMuestra: m.idSolicitudMuestra.toString(),
            idSolicitud: m.idSolicitud.toString(),
            analisis: m.analisis.map(a => ({
                ...a,
                idSolicitudAnalisis: a.idSolicitudAnalisis.toString(),
                idSolicitudMuestra: a.idSolicitudMuestra.toString(),
                idFormularioAnalisis: a.idFormularioAnalisis.toString(),
            }))
        }));
    }
}

module.exports = new MuestraService();
