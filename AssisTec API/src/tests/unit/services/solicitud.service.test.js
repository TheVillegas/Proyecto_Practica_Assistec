jest.mock('../../../repositories/solicitud.repository');
jest.mock('../../../services/formularioMicrobiologico.service');
jest.mock('../../../config/prisma', () => ({
    $transaction: jest.fn((fn) => fn({ mockTx: true }))
}));

const SolicitudService = require('../../../services/solicitud.service');
const solicitudRepository = require('../../../repositories/solicitud.repository');
const formularioMicrobiologicoService = require('../../../services/formularioMicrobiologico.service');
const prisma = require('../../../config/prisma');

const ROLES = require('../../../config/roles');

describe('SolicitudService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function crearSolicitud(parcial = {}) {
        return {
            idSolicitud: BigInt(1),
            estado: 'enviado',
            observacionesGenerales: JSON.stringify({
                validacionCoordinadora: parcial.coordinadora ?? null,
                validacionJefa: parcial.jefa ?? null
            }),
            rutJefaArea: '111',
            rutCoordinaroraRecepcion: '222',
            fechaEntregaRevisionJefeLab: new Date(),
            fechaHoraRecepcionCoordinadora: new Date(),
            ...parcial.extra
        };
    }

    describe('validar', () => {
        test('debe crear formularios cuando la solicitud queda totalmente validada', async () => {
            const solicitud = crearSolicitud({
                coordinadora: { aprobada: true, rut: '222', fecha: new Date().toISOString() }
            });

            solicitudRepository.findById.mockResolvedValue(solicitud);
            solicitudRepository.update.mockImplementation(async (id, data, expectedUpdatedAt, tx) => {
                return { ...solicitud, ...data, muestras: [] };
            });
            formularioMicrobiologicoService.crearFormulariosParaSolicitud.mockResolvedValue([]);

            const usuario = { id: '333', role: ROLES.JEFE_AREA };
            const now = new Date();

            await SolicitudService.validar(1, now, usuario);

            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(solicitudRepository.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ estado: 'validado' }),
                expect.anything(),
                expect.anything() // tx
            );
            expect(formularioMicrobiologicoService.crearFormulariosParaSolicitud).toHaveBeenCalled();
        });

        test('no debe crear formularios cuando la validacion es parcial', async () => {
            const solicitud = crearSolicitud({
                coordinadora: null,
                jefa: null
            });

            solicitudRepository.findById.mockResolvedValue(solicitud);
            solicitudRepository.update.mockImplementation(async (id, data) => {
                return { ...solicitud, ...data };
            });

            const usuario = { id: '222', role: ROLES.COORDINADORA };
            const now = new Date();

            await SolicitudService.validar(1, now, usuario);

            expect(prisma.$transaction).not.toHaveBeenCalled();
            expect(formularioMicrobiologicoService.crearFormulariosParaSolicitud).not.toHaveBeenCalled();
            expect(solicitudRepository.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ estado: 'enviado' }),
                expect.anything()
            );
        });

        test('debe propagar error y hacer rollback si falla la creacion de formularios', async () => {
            const solicitud = crearSolicitud({
                coordinadora: { aprobada: true, rut: '222', fecha: new Date().toISOString() }
            });

            solicitudRepository.findById.mockResolvedValue(solicitud);
            solicitudRepository.update.mockImplementation(async (id, data, expectedUpdatedAt, tx) => {
                return { ...solicitud, ...data, muestras: [] };
            });
            formularioMicrobiologicoService.crearFormulariosParaSolicitud.mockRejectedValue(new Error('DB_ERROR'));
            prisma.$transaction.mockImplementation(async (fn) => fn({ mockTx: true }));

            const usuario = { id: '333', role: ROLES.JEFE_AREA };
            const now = new Date();

            await expect(SolicitudService.validar(1, now, usuario)).rejects.toThrow('DB_ERROR');
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        test('debe pasar tx al repository y al servicio de formularios', async () => {
            const solicitud = crearSolicitud({
                coordinadora: { aprobada: true, rut: '222', fecha: new Date().toISOString() }
            });

            solicitudRepository.findById.mockResolvedValue(solicitud);
            solicitudRepository.update.mockImplementation(async (id, data, expectedUpdatedAt, tx) => {
                return { ...solicitud, ...data, muestras: [] };
            });
            formularioMicrobiologicoService.crearFormulariosParaSolicitud.mockResolvedValue([]);
            prisma.$transaction.mockImplementation(async (fn) => fn({ mockTx: true }));

            const usuario = { id: '333', role: ROLES.JEFE_AREA };
            const now = new Date();

            await SolicitudService.validar(1, now, usuario);

            expect(solicitudRepository.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.anything(),
                { mockTx: true }
            );
            expect(formularioMicrobiologicoService.crearFormulariosParaSolicitud).toHaveBeenCalledWith(
                expect.objectContaining({ estado: 'validado' }),
                { mockTx: true }
            );
        });
    });
});
