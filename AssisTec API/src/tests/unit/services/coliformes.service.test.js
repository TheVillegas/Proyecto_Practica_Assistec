jest.mock('../../../repositories/coliformes.repository');
jest.mock('../../../calculators/nmpColi.calculator');

const ColiService = require('../../../services/coliformes.service');
const ColiRepository = require('../../../repositories/coliformes.repository');
const { calcularResultadosNMP } = require('../../../calculators/nmpColi.calculator');

describe('ColiService', () => {
    const usuarioAnalista = { roles: [0] };
    const usuarioNoAutorizado = { roles: [1] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assertCanWrite', () => {
        test('debe permitir ANALISTA', () => {
            expect(() => ColiService.assertCanWrite(usuarioAnalista)).not.toThrow();
        });

        test('debe rechazar COORDINADORA', () => {
            expect(() => ColiService.assertCanWrite(usuarioNoAutorizado)).toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('serializeFormulario', () => {
        test('debe serializar BigInt a string', () => {
            const formulario = {
                idColiFormulario: BigInt(1),
                idSolicitudAnalisis: BigInt(2),
                updatedAt: new Date('2024-01-01')
            };
            const result = ColiService.serializeFormulario(formulario);
            expect(result.id_coli_formulario).toBe('1');
            expect(result.id_solicitud_analisis).toBe('2');
            expect(result.updated_at).toBe('2024-01-01T00:00:00.000Z');
        });
    });

    describe('obtener', () => {
        test('debe retornar formulario serializado', async () => {
            ColiRepository.findById.mockResolvedValue({
                idColiFormulario: BigInt(1),
                updatedAt: new Date()
            });

            const result = await ColiService.obtener(1);
            expect(result.id_coli_formulario).toBe('1');
        });

        test('debe lanzar NOT_FOUND si no existe', async () => {
            ColiRepository.findById.mockResolvedValue(null);
            await expect(ColiService.obtener(1)).rejects.toThrow('NOT_FOUND');
        });
    });

    describe('obtenerPorAnalisis', () => {
        test('debe retornar existe:false cuando no hay formulario', async () => {
            ColiRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            const result = await ColiService.obtenerPorAnalisis(1);
            expect(result).toEqual({ existe: false, formulario: null });
        });
    });

    describe('guardarFase', () => {
        test('debe guardar fase 1 correctamente', async () => {
            ColiRepository.findById.mockResolvedValue({
                idColiFormulario: BigInt(1),
                fase1: null, fase2: null, fase3: null, fase35Controles: null,
                updatedAt: new Date()
            });
            ColiRepository.upsertFase1.mockResolvedValue({ idColiFormulario: BigInt(1), updatedAt: new Date() });

            const result = await ColiService.guardarFase(1, 1, {
                fase: { completada: true },
                updated_at: new Date().toISOString()
            }, new Date(), usuarioAnalista);

            expect(ColiRepository.upsertFase1).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        test('debe calcular NMP automaticamente en fase 4', async () => {
            const mockFormulario = {
                idColiFormulario: BigInt(1),
                fase1: { completada: true },
                fase2: { completada: true },
                fase3: { completada: true },
                fase35Controles: { completada: true },
                muestras: [{
                    idColiMuestra: BigInt(10),
                    submuestras: [
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 3, presencia: true }
                    ]
                }]
            };

            ColiRepository.findById.mockResolvedValue(mockFormulario);
            ColiRepository.upsertFase4Resultados.mockResolvedValue({
                idColiFormulario: BigInt(1),
                updatedAt: new Date()
            });
            calcularResultadosNMP.mockReturnValue({
                coliformesTotales: 23,
                coliformesFecales: 9.1,
                eColi: 3.6
            });

            const result = await ColiService.guardarFase(1, 4, {
                fase: { completada: true },
                updated_at: new Date().toISOString()
            }, new Date(), usuarioAnalista);

            expect(calcularResultadosNMP).toHaveBeenCalled();
            expect(ColiRepository.upsertFase4Resultados).toHaveBeenCalled();
        });

        test('debe rechazar fase invalida', async () => {
            await expect(ColiService.guardarFase(1, 99, {}, new Date(), usuarioAnalista))
                .rejects.toThrow('INVALID_FASE');
        });
    });
});
