const analisisRepository = require('../repositories/analisis.repository');
const ROLES = require('../config/roles');

class AnalisisService {
    async asignar(idMuestra, data, usuario) {
        // Validación de rol (Ingreso u otro según specs)
        if (usuario.role !== ROLES.INGRESO) {
            throw new Error('UNAUTHORIZED_ROLE');
        }

        const muestra = await analisisRepository.findMuestraWithSolicitud(idMuestra);
        if (!muestra) {
            throw new Error('MUESTRA_NOT_FOUND');
        }

        const idFormulario = data.id_formulario_analisis;
        const [tiempo, alcance] = await Promise.all([
            analisisRepository.findTiempoPorCategoria(muestra.solicitud.categoriaId, idFormulario),
            analisisRepository.findAlcancePorCategoriaFormulario(muestra.solicitud.categoriaId, idFormulario)
        ]);

        const newData = {
            idSolicitudMuestra: BigInt(idMuestra),
            idAlcanceAcreditacion: alcance?.idAlcanceAcreditacion ?? (data.id_alcance_acreditacion ? Number(data.id_alcance_acreditacion) : null),
            idFormularioAnalisis: BigInt(idFormulario),
            acreditado: Boolean(alcance),
            metodologiaNorma: alcance?.normaEspecifica ?? data.metodologia_norma ?? '',
            diasNegativoSnapshot: tiempo?.diasNegativo ?? data.dias_negativo_snapshot ?? null,
            diasConfirmacionSnapshot: tiempo?.diasConfirmacion ?? data.dias_confirmacion_snapshot ?? null
        };

        const creado = await analisisRepository.create(newData);
        
        return {
            ...creado,
            idSolicitudAnalisis: creado.idSolicitudAnalisis.toString(),
            idSolicitudMuestra: creado.idSolicitudMuestra.toString(),
            idFormularioAnalisis: creado.idFormularioAnalisis.toString(),
            metodologiaNorma: creado.metodologiaNorma,
            acreditado: creado.acreditado,
            diasNegativoSnapshot: creado.diasNegativoSnapshot ?? null,
            diasConfirmacionSnapshot: creado.diasConfirmacionSnapshot ?? null
        };
    }
}

module.exports = new AnalisisService();
