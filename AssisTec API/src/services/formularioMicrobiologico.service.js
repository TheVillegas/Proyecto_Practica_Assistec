const saureusRepository = require('../repositories/saureus.repository');
const coliformesRepository = require('../repositories/coliformes.repository');
const salmonellaRepository = require('../repositories/salmonella.repository');

const CODIGO_MAP = {
    SAUREUS: 'sau',
    COLIFORMES_TOTALES: 'coli',
    COLIFORMES_FECALES: 'coli',
    ECOLI_NCH3056: 'coli',
    SALMONELLA: 'sal',
    SALMONELLA_ISO: 'sal'
};

const REPOSITORY_MAP = {
    sau: saureusRepository,
    coli: coliformesRepository,
    sal: salmonellaRepository
};

class FormularioMicrobiologicoService {
    async crearFormulariosParaSolicitud(solicitud, tx) {
        const analisisPorId = new Map();

        for (const muestra of solicitud.muestras ?? []) {
            for (const analisis of muestra.analisis ?? []) {
                const id = String(analisis.idSolicitudAnalisis);
                if (!analisisPorId.has(id)) {
                    analisisPorId.set(id, { analisis, muestras: [] });
                }
                analisisPorId.get(id).muestras.push(muestra);
            }
        }

        const creados = [];
        for (const [, { analisis, muestras }] of analisisPorId) {
            const codigo = analisis.formulario?.codigo;
            const tipo = CODIGO_MAP[codigo];
            if (!tipo) continue;

            const repository = REPOSITORY_MAP[tipo];
            const existente = await repository.findBySolicitudAnalisis(analisis.idSolicitudAnalisis);
            if (existente) continue;

            const muestrasPayload = muestras.map((m, index) => ({
                idSolicitudMuestra: m.idSolicitudMuestra,
                numeroMuestra: String(index + 1),
                esDuplicado: false,
                orden: index + 1
            }));

            const creado = await repository.create({
                idSolicitudAnalisis: analisis.idSolicitudAnalisis,
                rutAnalista: null,
                muestras: muestrasPayload
            }, tx);

            creados.push({ tipo, id: creado[repository.idField] });
        }

        return creados;
    }
}

module.exports = new FormularioMicrobiologicoService();
