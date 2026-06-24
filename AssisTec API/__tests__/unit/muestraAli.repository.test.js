const MuestraAliRepository = require('../../src/repositories/muestraAli.repository');

jest.mock('../../src/config/prisma', () => ({
    muestraAli: {
        findUnique: jest.fn()
    },
    solicitudIngreso: {
        findFirst: jest.fn()
    },
    solicitudMuestra: {
        findMany: jest.fn()
    },
    solicitudAnalisis: {
        findMany: jest.fn()
    },
    sauFormulario: {
        findMany: jest.fn()
    },
    coliFormulario: {
        findMany: jest.fn()
    },
    salFormulario: {
        findMany: jest.fn()
    }
}));

const prisma = require('../../src/config/prisma');

describe('T-SFE-001: MuestraAliRepository - ruteo de formularios', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe mapear SALMONELLA a /form-salmonella', async () => {
        prisma.solicitudIngreso.findFirst.mockResolvedValue({ idSolicitud: 1n });
        prisma.solicitudMuestra.findMany.mockResolvedValue([{ idSolicitudMuestra: 1n }]);
        prisma.solicitudAnalisis.findMany.mockResolvedValue([{ idSolicitudAnalisis: 1n }]);

        prisma.sauFormulario.findMany.mockResolvedValue([]);
        prisma.coliFormulario.findMany.mockResolvedValue([]);
        prisma.salFormulario.findMany.mockResolvedValue([{
            idSalFormulario: 1n,
            idSolicitudAnalisis: 1n,
            estado: 'EN_PROCESO',
            faseActual: 1,
            rutAnalista: '1-9'
        }]);

        const formularios = await MuestraAliRepository.findFormulariosByCodigoAli('ALI-1');

        const salmonella = formularios.find((f) => f.codigo === 'SALMONELLA');
        expect(salmonella).toBeDefined();
        expect(salmonella.ruta).toBe('/form-salmonella');
    });

    it('debe mantener mapeos existentes de SAUREUS y COLIFORMES', async () => {
        prisma.solicitudIngreso.findFirst.mockResolvedValue({ idSolicitud: 1n });
        prisma.solicitudMuestra.findMany.mockResolvedValue([{ idSolicitudMuestra: 1n }]);
        prisma.solicitudAnalisis.findMany.mockResolvedValue([{ idSolicitudAnalisis: 1n }]);

        prisma.sauFormulario.findMany.mockResolvedValue([{
            idSauFormulario: 1n,
            idSolicitudAnalisis: 1n,
            estado: 'EN_PROCESO',
            etapaActual: 1,
            rutAnalista: '1-9'
        }]);
        prisma.coliFormulario.findMany.mockResolvedValue([{
            idColiFormulario: 1n,
            idSolicitudAnalisis: 1n,
            estado: 'EN_PROCESO',
            faseActual: 1,
            rutAnalista: '1-9'
        }]);
        prisma.salFormulario.findMany.mockResolvedValue([]);

        const formularios = await MuestraAliRepository.findFormulariosByCodigoAli('ALI-1');

        const sau = formularios.find((f) => f.codigo === 'SAUREUS');
        const coli = formularios.find((f) => f.codigo === 'COLIFORMES');

        expect(sau.ruta).toBe('/form-s-aureus');
        expect(coli.ruta).toBe('/form-coliformes');
    });
});
