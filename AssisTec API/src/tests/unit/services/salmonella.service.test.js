jest.mock('../../../repositories/salmonella.repository');
jest.mock('../../../calculators/presenciaSal.calculator');

const SalService = require('../../../services/salmonella.service');
const SalRepository = require('../../../repositories/salmonella.repository');
const { determinarPresenciaAusencia } = require('../../../calculators/presenciaSal.calculator');

describe('SalService', () => {
    const usuarioAnalista = { roles: [0] };
    const usuarioNoAutorizado = { roles: [1] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assertCanWrite', () => {
        test('debe permitir ANALISTA', () => {
            expect(() => SalService.assertCanWrite(usuarioAnalista)).not.toThrow();
        });

        test('debe rechazar COORDINADORA', () => {
            expect(() => SalService.assertCanWrite(usuarioNoAutorizado)).toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('serializeFormulario', () => {
        test('debe serializar BigInt a string', () => {
            const formulario = {
                idSalFormulario: BigInt(1),
                idSolicitudAnalisis: BigInt(2),
                updatedAt: new Date('2024-01-01')
            };
            const result = SalService.serializeFormulario(formulario);
            expect(result.id_sal_formulario).toBe('1');
            expect(result.id_solicitud_analisis).toBe('2');
            expect(result.updated_at).toBe('2024-01-01T00:00:00.000Z');
        });
    });

    describe('obtener', () => {
        test('debe retornar formulario serializado', async () => {
            SalRepository.findById.mockResolvedValue({
                idSalFormulario: BigInt(1),
                updatedAt: new Date()
            });

            const result = await SalService.obtener(1);
            expect(result.id_sal_formulario).toBe('1');
        });

        test('debe lanzar NOT_FOUND si no existe', async () => {
            SalRepository.findById.mockResolvedValue(null);
            await expect(SalService.obtener(1)).rejects.toThrow('NOT_FOUND');
        });
    });

    describe('obtenerPorAnalisis', () => {
        test('debe retornar existe:false cuando no hay formulario', async () => {
            SalRepository.findBySolicitudAnalisis.mockResolvedValue(null);
            const result = await SalService.obtenerPorAnalisis(1);
            expect(result).toEqual({ existe: false, formulario: null });
        });
    });

    describe('guardarFase', () => {
        test('debe guardar fase 1 correctamente', async () => {
            SalRepository.findById.mockResolvedValue({
                idSalFormulario: BigInt(1),
                fase1: null, fase2a: null, fase2b: null, fase2c: null,
                fase3a: null, fase3b: null, fase4a: null,
                updatedAt: new Date()
            });
            SalRepository.upsertFase1.mockResolvedValue({ idSalFormulario: BigInt(1), updatedAt: new Date() });

            const result = await SalService.guardarFase(1, 1, {
                fase: { completada: true, tipo_matriz: 'polvo' },
                updated_at: new Date().toISOString()
            }, new Date(), usuarioAnalista);

            expect(SalRepository.upsertFase1).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        test('debe calcular Presencia/Ausencia automaticamente en fase 10', async () => {
            const mockFormulario = {
                idSalFormulario: BigInt(1),
                fase1: { completada: true },
                fase2a: { completada: true },
                fase2b: { completada: true },
                fase2c: { completada: true },
                fase3a: { completada: true },
                fase3b: { completada: true },
                fase4a: { completada: true },
                muestras: [{
                    idSalMuestra: BigInt(10),
                    fase4bLecturas: [{
                        resXld24hSelenito: 'tipico',
                        resSs24hSelenito: 'atipico',
                        resXld48hSelenito: 'sin_crecimiento',
                        resSs48hSelenito: 'atipico',
                        resXld24hRappaport: 'atipico',
                        resSs24hRappaport: 'sin_crecimiento',
                        resXld48hRappaport: 'atipico',
                        resSs48hRappaport: 'atipico'
                    }]
                }]
            };

            SalRepository.findById.mockResolvedValue(mockFormulario);
            SalRepository.upsertFase5Resultado.mockResolvedValue({
                idSalFormulario: BigInt(1),
                updatedAt: new Date()
            });
            determinarPresenciaAusencia.mockReturnValue('Presencia');

            const result = await SalService.guardarFase(1, 10, {
                fase: { completada: true },
                updated_at: new Date().toISOString()
            }, new Date(), usuarioAnalista);

            expect(determinarPresenciaAusencia).toHaveBeenCalled();
            expect(SalRepository.upsertFase5Resultado).toHaveBeenCalled();
        });

        test('debe rechazar fase invalida', async () => {
            SalRepository.findById.mockResolvedValue({
                idSalFormulario: BigInt(1),
                updatedAt: new Date()
            });
            await expect(SalService.guardarFase(1, 99, {}, new Date(), usuarioAnalista))
                .rejects.toThrow('INVALID_FASE');
        });
    });
});
