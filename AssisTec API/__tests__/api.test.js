const request = require('supertest');
const app = require('../app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mockear Prisma
jest.mock('../src/config/prisma', () => ({
    usuario: {
        findFirst: jest.fn(),
        findUnique: jest.fn()
    },
    solicitudIngreso: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn()
    },
    solicitudMuestra: {
        createMany: jest.fn(),
        findMany: jest.fn()
    },
    solicitudAnalisis: {
        aggregate: jest.fn(),
        create: jest.fn()
    },
    $transaction: jest.fn(),
    muestraAli: {
        findUnique: jest.fn()
    }
}));

// Mockear Bcrypt para no demorar los tests
jest.mock('bcryptjs', () => ({
    compare: jest.fn()
}));

const mockToken = (role) => jwt.sign({ id: '1-9', role }, process.env.JWT_SECRET || 'testsecret');
process.env.JWT_SECRET = 'testsecret';

describe('AssisTec API - Pruebas Automatizadas (Specs)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('REQ-01: Autenticación y Login', () => {
        it('SC-01.1: Login exitoso', async () => {
            prisma.usuario.findFirst.mockResolvedValue({
                rutUsuario: '1-9',
                nombreApellidoUsuario: 'Ana Lab',
                correoUsuario: 'ana@lab.cl',
                contrasenaUsuario: 'hashed',
                rolUsuario: 0,
                urlFoto: 'foto.jpg'
            });
            bcrypt.compare.mockResolvedValue(true);

            const res = await request(app).post('/api/auth/login').send({
                correo: 'ana@lab.cl',
                contrasena: '123'
            });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.usuario.rut).toBe('1-9');
        });

        it('SC-01.2: Credenciales inválidas', async () => {
            prisma.usuario.findFirst.mockResolvedValue(null);

            const res = await request(app).post('/api/auth/login').send({
                correo: 'noexiste@lab.cl',
                contrasena: '123'
            });

            expect(res.status).toBe(401);
            expect(res.body.mensaje).toBe('Credenciales inválidas');
        });
    });

    describe('REQ-02: CRUD Solicitud de Ingreso', () => {
        it('SC-02.1: Crear solicitud (Rol Ingreso)', async () => {
            const token = mockToken(3); // Rol Ingreso = 3
            prisma.solicitudIngreso.aggregate.mockResolvedValue({ _max: { numeroAli: 10 } });
            prisma.solicitudIngreso.create.mockResolvedValue({ idSolicitud: 1n, numeroAli: 11 });

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({ categoriaId: 1, idCliente: 1 });

            expect(res.status).toBe(201);
            expect(res.body.id_solicitud).toBe('1');
            expect(res.body.numero_ali).toBe(11);
        });

        it('SC-02.5: Editar solicitud validada (Error)', async () => {
            const token = mockToken(3); // Rol Ingreso
            prisma.solicitudIngreso.findUnique.mockResolvedValue({ 
                idSolicitud: 1n, 
                estado: 'validada',
                updatedAt: new Date('2024-01-01')
            });

            const res = await request(app)
                .put('/api/solicitud/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('Solicitud ya validada, no se puede modificar');
        });
    });

    describe('REQ-03: Gestión de Submuestras', () => {
        it('SC-03.1: Crear batch de submuestras', async () => {
            const token = mockToken(3);
            prisma.solicitudIngreso.findUnique.mockResolvedValue({ idSolicitud: 5n, estado: 'pendiente' });
            prisma.solicitudMuestra.createMany.mockResolvedValue({ count: 3 });
            prisma.solicitudMuestra.findMany.mockResolvedValue([
                { idSolicitudMuestra: 10n, idSolicitud: 5n },
                { idSolicitudMuestra: 11n, idSolicitud: 5n },
                { idSolicitudMuestra: 12n, idSolicitud: 5n }
            ]);

            const res = await request(app)
                .post('/api/solicitud/5/muestra')
                .set('Authorization', `Bearer ${token}`)
                .send({ cantidad: 3 });

            expect(res.status).toBe(201);
            expect(res.body.length).toBe(3);
        });
    });

    describe('REQ-04: Asignación de Análisis', () => {
        it('SC-04.1: Asignar análisis a submuestra', async () => {
            const token = mockToken(3);
            prisma.solicitudAnalisis.aggregate.mockResolvedValue({ _max: { idSolicitudAnalisis: 100n } });
            prisma.solicitudAnalisis.create.mockResolvedValue({
                idSolicitudAnalisis: 101n,
                idSolicitudMuestra: 10n,
                idFormularioAnalisis: 1n
            });

            const res = await request(app)
                .post('/api/muestra/10/analisis')
                .set('Authorization', `Bearer ${token}`)
                .send({ id_alcance_acreditacion: 1, id_formulario_analisis: 1, acreditado: true, metodologia_norma: 'ISO' });

            expect(res.status).toBe(201);
            expect(res.body.idSolicitudAnalisis).toBe('101');
        });
    });

    describe('REQ-05: Generación de Reportes', () => {
        it('SC-05.1: Generar reportes', async () => {
            const token = mockToken(1); // Coordinadora
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 5n,
                numeroAli: 1001,
                muestras: [{ analisis: [{ formulario: { generaTpaDefault: true } }] }]
            });
            prisma.muestraAli.findUnique.mockResolvedValue(null);
            
            // Mock transaction to just return what it gets or execute the callback
            prisma.$transaction.mockImplementation(async (cb) => {
                const tx = {
                    muestraAli: { create: jest.fn().mockResolvedValue({ codigoAli: 1001 }) },
                    tpaReporte: { create: jest.fn().mockResolvedValue({ id: 1 }) },
                    ramReporte: { create: jest.fn().mockResolvedValue({ id: 1 }) }
                };
                return cb(tx);
            });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tpa_generado).toBe(true);
            expect(res.body.ram_generado).toBe(true);
        });
    });

    describe('REQ-06: Validación de Documentos', () => {
        it('SC-06.1: Coordinadora valida solicitud', async () => {
            const token = mockToken(1); // Coordinadora = 1
            const mockDate = new Date('2024-01-01T00:00:00.000Z');
            
            prisma.solicitudIngreso.findUnique.mockResolvedValue({ 
                idSolicitud: 5n, 
                estado: 'pendiente',
                updatedAt: mockDate
            });
            prisma.solicitudIngreso.update.mockResolvedValue({ 
                idSolicitud: 5n, 
                estado: 'validada',
                categoriaId: 1n
            });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('validada');
            expect(prisma.solicitudIngreso.update).toHaveBeenCalled();
        });
    });
});
