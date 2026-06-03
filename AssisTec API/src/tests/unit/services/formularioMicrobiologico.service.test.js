jest.mock('../../../repositories/saureus.repository');
jest.mock('../../../repositories/coliformes.repository');
jest.mock('../../../repositories/salmonella.repository');

const formularioMicrobiologicoService = require('../../../services/formularioMicrobiologico.service');
const saureusRepository = require('../../../repositories/saureus.repository');
const coliformesRepository = require('../../../repositories/coliformes.repository');
const salmonellaRepository = require('../../../repositories/salmonella.repository');

describe('FormularioMicrobiologicoService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function crearSolicitudCompleta(analisisPorMuestra) {
        const muestras = analisisPorMuestra.map((analisisList, idx) => ({
            idSolicitudMuestra: BigInt(idx + 1),
            analisis: analisisList.map((codigo, aidx) => ({
                idSolicitudAnalisis: BigInt((idx + 1) * 100 + aidx + 1),
                formulario: { codigo }
            }))
        }));
        return { muestras };
    }

    describe('crearFormulariosParaSolicitud', () => {
        test('debe crear formularios para SAU, COLI y SAL', async () => {
            const solicitud = crearSolicitudCompleta([
                ['SAU'],
                ['COLI'],
                ['SAL']
            ]);

            saureusRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            coliformesRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            salmonellaRepository.findBySolicitudAnalisis.mockResolvedValue(null);

            saureusRepository.create.mockResolvedValue({ idSauFormulario: BigInt(1) });
            coliformesRepository.create.mockResolvedValue({ idColiFormulario: BigInt(2) });
            salmonellaRepository.create.mockResolvedValue({ idSalFormulario: BigInt(3) });

            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            expect(saureusRepository.create).toHaveBeenCalledTimes(1);
            expect(coliformesRepository.create).toHaveBeenCalledTimes(1);
            expect(salmonellaRepository.create).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(3);
        });

        test('debe saltar formularios ya existentes (idempotencia)', async () => {
            const solicitud = crearSolicitudCompleta([['SAU']]);

            saureusRepository.findBySolicitudAnalisis.mockResolvedValue({ idSauFormulario: BigInt(99) });

            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            expect(saureusRepository.create).not.toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });

        test('debe ignorar codigos de formulario desconocidos', async () => {
            const solicitud = crearSolicitudCompleta([['XYZ']]);

            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            expect(result).toHaveLength(0);
        });

        test('debe pasar tx a los repositories cuando se proporciona', async () => {
            const solicitud = crearSolicitudCompleta([['SAU']]);
            const tx = { mockTransaction: true };

            saureusRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            saureusRepository.create.mockResolvedValue({ idSauFormulario: BigInt(1) });

            await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud, tx);

            expect(saureusRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ idSolicitudAnalisis: expect.anything(), rutAnalista: null }),
                tx
            );
        });

        test('debe mapear correctamente las muestras vinculadas', async () => {
            const solicitud = crearSolicitudCompleta([
                ['SAU']
            ]);

            saureusRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            saureusRepository.create.mockResolvedValue({ idSauFormulario: BigInt(1) });

            await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            const createCall = saureusRepository.create.mock.calls[0][0];
            expect(createCall.muestras).toHaveLength(1);
            expect(createCall.muestras[0]).toMatchObject({
                idSolicitudMuestra: expect.anything(),
                numeroMuestra: '1',
                esDuplicado: false,
                orden: 1
            });
        });

        test('debe dejar rutAnalista como null', async () => {
            const solicitud = crearSolicitudCompleta([['COLI']]);

            coliformesRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            coliformesRepository.create.mockResolvedValue({ idColiFormulario: BigInt(1) });

            await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            const createCall = coliformesRepository.create.mock.calls[0][0];
            expect(createCall.rutAnalista).toBeNull();
        });

        test('debe retornar vacio cuando no hay muestras', async () => {
            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud({ muestras: [] });
            expect(result).toEqual([]);
        });

        test('debe retornar vacio cuando las muestras no tienen analisis', async () => {
            const solicitud = crearSolicitudCompleta([[]]);
            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);
            expect(result).toEqual([]);
        });

        test('debe crear solo los formularios inexistentes en mix idempotente', async () => {
            const solicitud = crearSolicitudCompleta([['SAU'], ['SAU']]);

            saureusRepository.findBySolicitudAnalisis.mockImplementation(async (id) => {
                if (String(id) === '101') return { idSauFormulario: BigInt(99) };
                return null;
            });
            saureusRepository.create.mockResolvedValue({ idSauFormulario: BigInt(1) });

            const result = await formularioMicrobiologicoService.crearFormulariosParaSolicitud(solicitud);

            expect(saureusRepository.create).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
        });
    });
});
