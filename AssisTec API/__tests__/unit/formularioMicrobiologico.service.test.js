jest.mock('../../src/repositories/saureus.repository');
jest.mock('../../src/repositories/coliformes.repository');
jest.mock('../../src/repositories/salmonella.repository');
jest.mock('../../src/repositories/enterobacterias.repository');

const formularioMicrobiologicoService = require('../../src/services/formularioMicrobiologico.service');
const enterobacteriasRepository = require('../../src/repositories/enterobacterias.repository');

describe('FormularioMicrobiologicoService — Enterobacterias', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function crearSolicitudConAnalisis(codigosPorMuestra) {
        return {
            muestras: codigosPorMuestra.map((codigos, idx) => ({
                idSolicitudMuestra: BigInt(idx + 1),
                analisis: codigos.map((codigo, aidx) => ({
                    idSolicitudAnalisis: BigInt((idx + 1) * 100 + aidx + 1),
                    formulario: { codigo }
                }))
            }))
        };
    }

    test('debe crear EntFormulario para codigo ENTEROBACTERIAS', async () => {
        const solicitud = crearSolicitudConAnalisis([['ENTEROBACTERIAS']]);
        const tx = { entFormulario: { mockEntModel: true } };

        enterobacteriasRepository.findBySolicitudAnalisis.mockResolvedValue(null);
        enterobacteriasRepository.create.mockResolvedValue({ idEntFormulario: BigInt(7) });

        const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud, tx);

        expect(enterobacteriasRepository.create).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ tipo: 'ent', id: BigInt(7) });
    });

    test('debe saltar EntFormulario si ya existe (idempotencia)', async () => {
        const solicitud = crearSolicitudConAnalisis([['ENTEROBACTERIAS']]);
        const tx = { entFormulario: { mockEntModel: true } };

        enterobacteriasRepository.findBySolicitudAnalisis.mockResolvedValue({ idEntFormulario: BigInt(7) });

        const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud, tx);

        expect(enterobacteriasRepository.create).not.toHaveBeenCalled();
        expect(result).toHaveLength(0);
    });

    test('debe crear EntFormulario con estado en_proceso, etapa 1 y subetapa 1', async () => {
        const solicitud = crearSolicitudConAnalisis([['ENTEROBACTERIAS']]);
        const tx = { entFormulario: { mockEntModel: true } };

        enterobacteriasRepository.findBySolicitudAnalisis.mockResolvedValue(null);
        enterobacteriasRepository.create.mockResolvedValue({ idEntFormulario: BigInt(7) });

        await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud, tx);

        const createCall = enterobacteriasRepository.create.mock.calls[0][0];
        expect(createCall.estado).toBe('en_proceso');
        expect(createCall.etapaActual).toBe(1);
        expect(createCall.subetapaActual).toBe(1);
        expect(createCall.rutAnalista).toBeNull();
        expect(createCall.muestras).toHaveLength(1);
        expect(createCall.muestras[0]).toMatchObject({
            idSolicitudMuestra: expect.anything(),
            numeroMuestra: '1',
            esDuplicado: false,
            orden: 1
        });
    });

    test('debe pasar tx.entFormulario al repositorio cuando se proporciona transaccion', async () => {
        const solicitud = crearSolicitudConAnalisis([['ENTEROBACTERIAS']]);
        const txEntFormulario = { mockEntModel: true };
        const tx = { entFormulario: txEntFormulario };

        enterobacteriasRepository.findBySolicitudAnalisis.mockResolvedValue(null);
        enterobacteriasRepository.create.mockResolvedValue({ idEntFormulario: BigInt(7) });

        await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud, tx);

        expect(enterobacteriasRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({ idSolicitudAnalisis: expect.anything() }),
            txEntFormulario
        );
    });
});
