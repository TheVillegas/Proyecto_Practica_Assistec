const ColiService = require('../../../src/services/coliformes.service');
const ColiRepository = require('../../../src/repositories/coliformes.repository');
const ROLES = require('../../../src/config/roles');
const { Prisma } = require('@prisma/client');

jest.mock('../../../src/repositories/coliformes.repository', () => ({
    findById: jest.fn(),
    findBySolicitudAnalisis: jest.fn(),
    create: jest.fn(),
    upsertFase1: jest.fn(),
    upsertFase2: jest.fn(),
    upsertFase3: jest.fn(),
    upsertFase35Controles: jest.fn(),
    upsertFase4Resultados: jest.fn()
}));

describe('ColiService', () => {
    const usuarioAnalista = { roles: [ROLES.ANALISTA] };
    const usuarioNoAutorizado = { roles: [ROLES.COORDINADORA] };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assertCanWrite', () => {
        it('permite ANALISTA y ADMINISTRADOR', () => {
            expect(() => ColiService.assertCanWrite(usuarioAnalista)).not.toThrow();
            expect(() => ColiService.assertCanWrite({ roles: [ROLES.ADMINISTRATOR] })).not.toThrow();
        });

        it('rechaza COORDINADORA', () => {
            expect(() => ColiService.assertCanWrite(usuarioNoAutorizado)).toThrow('UNAUTHORIZED_ROLE');
        });
    });

    describe('serializeFormulario', () => {
        it('serializa BigInt a string y Date a ISO', () => {
            const formulario = {
                idColiFormulario: BigInt(1),
                idSolicitudAnalisis: BigInt(2),
                updatedAt: new Date('2024-01-01T00:00:00.000Z')
            };
            const result = ColiService.serializeFormulario(formulario);
            expect(result.id_coli_formulario).toBe('1');
            expect(result.id_solicitud_analisis).toBe('2');
            expect(result.updated_at).toBe('2024-01-01T00:00:00.000Z');
        });
    });

    describe('_calcularResultadosFase4', () => {
        it('agrupa submuestras por tipoLectura y calcula 3 organismos con el motor', async () => {
            const mockFormulario = {
                idColiFormulario: BigInt(1),
                muestras: [{
                    idColiMuestra: BigInt(10),
                    submuestras: [
                        // totales: 3 positivos en dilucion 10
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 3, presencia: true },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 1, presencia: false },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 2, presencia: false },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 3, presencia: false },
                        { tipoLectura: 'totales', dilucion: '0.1', numeroTubo: 1, presencia: false },
                        { tipoLectura: 'totales', dilucion: '0.1', numeroTubo: 2, presencia: false },
                        { tipoLectura: 'totales', dilucion: '0.1', numeroTubo: 3, presencia: false },
                        // fecales: todos positivos
                        { tipoLectura: 'fecales', dilucion: '10', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '10', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '10', numeroTubo: 3, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '1', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '1', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '1', numeroTubo: 3, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '0.1', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '0.1', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'fecales', dilucion: '0.1', numeroTubo: 3, presencia: true },
                        // ecoli: patron incongruente 0,3,0
                        { tipoLectura: 'ecoli', dilucion: '10', numeroTubo: 1, presencia: false },
                        { tipoLectura: 'ecoli', dilucion: '10', numeroTubo: 2, presencia: false },
                        { tipoLectura: 'ecoli', dilucion: '10', numeroTubo: 3, presencia: false },
                        { tipoLectura: 'ecoli', dilucion: '1', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'ecoli', dilucion: '1', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'ecoli', dilucion: '1', numeroTubo: 3, presencia: true },
                        { tipoLectura: 'ecoli', dilucion: '0.1', numeroTubo: 1, presencia: false },
                        { tipoLectura: 'ecoli', dilucion: '0.1', numeroTubo: 2, presencia: false },
                        { tipoLectura: 'ecoli', dilucion: '0.1', numeroTubo: 3, presencia: false }
                    ]
                }]
            };

            ColiRepository.findById.mockResolvedValue(mockFormulario);

            const resultados = await ColiService._calcularResultadosFase4(1);

            expect(resultados).toHaveLength(1);
            const r = resultados[0];
            expect(r.idColiMuestra).toBe('10');

            // totales: 3,0,0 -> NMP estimado (no cero, no mayor_que)
            expect(r.totalesEstado).toBe('estimado');
            expect(r.coliformesTotales).toBeInstanceOf(Prisma.Decimal);
            expect(r.coliformesTotales.toNumber()).toBeGreaterThan(0);
            expect(r.totalesCategoriaRareza).toBe(1);

            // fecales: todos positivos -> mayor_que, NMP principal null
            expect(r.fecalesEstado).toBe('mayor_que');
            expect(r.coliformesFecales).toBeNull();
            expect(r.fecalesLimiteInferior).toBeInstanceOf(Prisma.Decimal);
            expect(r.fecalesLimiteInferior.toNumber()).toBeGreaterThan(0);

            // ecoli: patron 0,3,0 -> rareza 3
            expect(r.ecoliEstado).toBe('estimado');
            expect(r.ecoliCategoriaRareza).toBe(3);
            expect(r.incongruenciaDetectada).toBe(true);
            expect(r.observacionIncongruencia).toContain('E. coli');
        });

        it('no usa Object.keys().sort() ni default de dilucion: datos sin dilucion quedan invalidos', async () => {
            const mockFormulario = {
                idColiFormulario: BigInt(1),
                muestras: [{
                    idColiMuestra: BigInt(20),
                    submuestras: [
                        // totales: 3 diluciones, pero una submuestra sin dilucion => invalido
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 1, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 2, presencia: true },
                        { tipoLectura: 'totales', dilucion: '10', numeroTubo: 3, presencia: true },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 1, presencia: false },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 2, presencia: false },
                        { tipoLectura: 'totales', dilucion: '1', numeroTubo: 3, presencia: false },
                        { tipoLectura: 'totales', dilucion: null, numeroTubo: 1, presencia: false }
                    ]
                }]
            };
            ColiRepository.findById.mockResolvedValue(mockFormulario);

            // totales invalido por submuestra sin dilucion; fecales/ecoli invalidos por falta de submuestras
            const resultados = await ColiService._calcularResultadosFase4(1);
            const r = resultados[0];
            expect(r.totalesEstado).toBe('invalido');
            expect(r.fecalesEstado).toBe('invalido');
            expect(r.ecoliEstado).toBe('invalido');
        });
    });

    describe('calcularNmp', () => {
        it('devuelve el shape del contrato MD §6.1 con 3 organismos independientes', async () => {
            ColiRepository.findById.mockResolvedValue({ idColiFormulario: BigInt(1) });

            const body = {
                muestras: [{
                    idColiMuestra: 12,
                    lecturas: {
                        totales: [
                            [true, false, true],
                            [true, false, false],
                            [false, true, true]
                        ],
                        fecales: [
                            [true, true, true],
                            [false, false, false],
                            [false, false, false]
                        ],
                        ecoli: [
                            [false, false, false],
                            [false, false, false],
                            [false, false, false]
                        ]
                    }
                }]
            };

            const { fase4Resultado } = await ColiService.calcularNmp(1, body, usuarioAnalista);

            expect(fase4Resultado).toHaveLength(1);
            const r = fase4Resultado[0];
            expect(r.idColiMuestra).toBe(12);
            expect(r).toHaveProperty('coliformesTotales');
            expect(r).toHaveProperty('coliformesFecales');
            expect(r).toHaveProperty('eColi');
            expect(r).toHaveProperty('totales');
            expect(r).toHaveProperty('fecales');
            expect(r).toHaveProperty('ecoli');
            expect(r).toHaveProperty('incongruenciaDetectada');
            expect(r).toHaveProperty('observacionIncongruencia');

            expect(r.totales).toHaveProperty('mpn');
            expect(r.totales).toHaveProperty('log10Mpn');
            expect(r.totales).toHaveProperty('sdLog10');
            expect(r.totales).toHaveProperty('limiteInferior');
            expect(r.totales).toHaveProperty('limiteSuperior');
            expect(r.totales).toHaveProperty('rarityIndex');
            expect(r.totales).toHaveProperty('categoriaRareza');
            expect(r.totales).toHaveProperty('estado');

            // fecales 3,0,0 -> NMP estimado; ecoli todos negativos -> cero
            expect(r.fecales.estado).toBe('estimado');
            expect(r.ecoli.estado).toBe('cero');
            expect(r.eColi).toBe(0);
        });

        it('serializa Infinity como null en el output (todos positivos)', async () => {
            ColiRepository.findById.mockResolvedValue({ idColiFormulario: BigInt(1) });

            const body = {
                muestras: [{
                    idColiMuestra: 13,
                    lecturas: {
                        totales: [[true, true, true], [true, true, true], [true, true, true]],
                        fecales: [[false, false, false], [false, false, false], [false, false, false]],
                        ecoli: [[false, false, false], [false, false, false], [false, false, false]]
                    }
                }]
            };

            const { fase4Resultado } = await ColiService.calcularNmp(1, body, usuarioAnalista);
            const r = fase4Resultado[0];

            expect(r.totales.estado).toBe('mayor_que');
            expect(r.coliformesTotales).toBeNull();
            expect(r.totales.limiteSuperior).toBeNull();
            expect(r.totales.limiteInferior).toBeGreaterThan(0);
        });

        it('caso todos negativos: estado cero, NMP 0 y limiteSuperior finito', async () => {
            ColiRepository.findById.mockResolvedValue({ idColiFormulario: BigInt(1) });

            const body = {
                muestras: [{
                    idColiMuestra: 14,
                    lecturas: {
                        totales: [[false, false, false], [false, false, false], [false, false, false]],
                        fecales: [[false, false, false], [false, false, false], [false, false, false]],
                        ecoli: [[false, false, false], [false, false, false], [false, false, false]]
                    }
                }]
            };

            const { fase4Resultado } = await ColiService.calcularNmp(1, body, usuarioAnalista);
            const r = fase4Resultado[0];

            expect(r.totales.estado).toBe('cero');
            expect(r.totales.mpn).toBe(0);
            expect(r.coliformesTotales).toBe(0);
            expect(r.totales.limiteInferior).toBe(0);
            expect(r.totales.limiteSuperior).toBeCloseTo(11.0777, 3);
        });

        it('deriva incongruenciaDetectada de categoriaRareza === 3', async () => {
            ColiRepository.findById.mockResolvedValue({ idColiFormulario: BigInt(1) });

            const body = {
                muestras: [{
                    idColiMuestra: 15,
                    lecturas: {
                        totales: [[false, false, false], [true, true, true], [false, false, false]],
                        fecales: [[false, false, false], [false, false, false], [false, false, false]],
                        ecoli: [[false, false, false], [false, false, false], [false, false, false]]
                    }
                }]
            };

            const { fase4Resultado } = await ColiService.calcularNmp(1, body, usuarioAnalista);
            const r = fase4Resultado[0];

            expect(r.totales.categoriaRareza).toBe(3);
            expect(r.incongruenciaDetectada).toBe(true);
            expect(r.observacionIncongruencia).toContain('coliformes totales');
        });

        it('fallback legacy: acepta tubosPositivos24h/48h sin romper', async () => {
            ColiRepository.findById.mockResolvedValue({ idColiFormulario: BigInt(1) });

            const body = {
                muestras: [{
                    idColiMuestra: 16,
                    tubosPositivos24h: [3, 0, 0],
                    tubosPositivos48h: [0, 0, 0]
                }]
            };

            const { fase4Resultado } = await ColiService.calcularNmp(1, body, usuarioAnalista);
            const r = fase4Resultado[0];

            expect(r.coliformesTotales).toBeGreaterThan(0);
            expect(r.coliformesFecales).toBe(0);
            expect(r.eColi).toBe(0);
            expect(r.totales.estado).toBe('estimado');
            expect(r.fecales.estado).toBe('cero');
        });
    });
});
