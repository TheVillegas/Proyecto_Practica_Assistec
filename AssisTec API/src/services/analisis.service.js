const analisisRepository = require('../repositories/analisis.repository');
const ROLES = require('../config/roles');

class AnalisisService {
    async asignar(idMuestra, data, usuario) {
        // Validación de rol (Ingreso u otro según specs)
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const newData = {
            idSolicitudMuestra: BigInt(idMuestra),
            idAlcanceAcreditacion: Number(data.id_alcance_acreditacion),
            idFormularioAnalisis: BigInt(data.id_formulario_analisis),
            acreditado: data.acreditado === true,
            metodologiaNorma: data.metodologia_norma || ''
        };

        const creado = await analisisRepository.create(newData);
        
        return {
            ...creado,
            idSolicitudAnalisis: creado.idSolicitudAnalisis.toString(),
            idSolicitudMuestra: creado.idSolicitudMuestra.toString(),
            idFormularioAnalisis: creado.idFormularioAnalisis.toString()
        };
    }
}

module.exports = new AnalisisService();
