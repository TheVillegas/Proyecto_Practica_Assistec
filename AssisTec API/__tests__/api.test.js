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
    categoriaProducto: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn()
    },
    cliente: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn()
    },
    direccionCliente: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn()
    },
    equipoLab: {
        findUnique: jest.fn(),
        findFirst: jest.fn()
    },
    lugarAlmacenamiento: {
        findUnique: jest.fn(),
        findFirst: jest.fn()
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
        findUnique: jest.fn(),
        create: jest.fn()
    },
    tpaReporte: {
        create: jest.fn()
    },
    ramReporte: {
        create: jest.fn()
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
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });
            prisma.cliente.findFirst.mockResolvedValue(null);
            prisma.cliente.create.mockResolvedValue({
                idCliente: 1,
                nombre: 'Cliente Demo',
                rut: 'SIN-RUT',
                email: 'sin-correo@asistec.local',
                telefono: 'Sin teléfono',
                activo: 'S'
            });
            prisma.direccionCliente.findFirst.mockResolvedValue(null);
            prisma.direccionCliente.create.mockResolvedValue({
                idDireccion: 1,
                idCliente: 1,
                alias: 'Principal',
                direccion: 'Av. Demo 123'
            });
            prisma.equipoLab.findFirst.mockResolvedValue({ idEquipo: 1, nombreEquipo: 'Equipo Demo' });
            prisma.lugarAlmacenamiento.findFirst.mockResolvedValue({ idLugar: 1, nombreLugar: 'Lugar Demo' });
            prisma.$transaction.mockImplementation(async (callback) => callback({
                solicitudIngreso: {
                    create: jest.fn().mockResolvedValue({ idSolicitud: 1n }),
                    findUnique: jest.fn().mockResolvedValue({
                        idSolicitud: 1n,
                        anioIngreso: 2024,
                        numeroAli: 11,
                        numeroActa: 'ACTA-2024-0011',
                        codigoExterno: 'EXT-001',
                        categoria: { idCategoria: 1n, nombre: 'Agua' },
                        cliente: { idCliente: 1, nombre: 'Cliente Demo', rut: 'SIN-RUT' },
                        direccion: { idDireccion: 1, direccion: 'Av. Demo 123', alias: 'Principal' },
                        fechaRecepcion: new Date('2024-01-01T00:00:00.000Z'),
                        fechaInicioMuestreo: new Date('2024-01-01T00:00:00.000Z'),
                        fechaTerminoMuestreo: new Date('2024-01-01T00:00:00.000Z'),
                        temperaturaRecepcion: 4,
                        termometro: { idEquipo: 1 },
                        lugar: { idLugar: 1 },
                        cantidadMuestras: 1,
                        cantEnvases: 1,
                        responsableMuestreo: 'Analista Demo',
                        lugarMuestreo: 'Planta',
                        instructivoMuestreo: 'No informado',
                        envasesSuministradosPor: 'Cliente',
                        muestraCompartidaQuimica: false,
                        notasDelCliente: '',
                        observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [] }),
                        estado: 'borrador',
                        rutResponsableIngreso: '3-3',
                        rutJefaArea: '2-2',
                        rutCoordinaroraRecepcion: '1-1',
                        fechaEnvioValidacion: new Date('2024-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
                        muestras: []
                    })
                },
                solicitudMuestra: {
                    createMany: jest.fn().mockResolvedValue({ count: 1 })
                }
            }));

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    categoriaId: 1,
                    nombreCliente: 'Cliente Demo',
                    direccion: 'Av. Demo 123',
                    nombreSolicitante: 'Solicitante Demo',
                    fechaRecepcion: '2024-01-01T00:00:00.000Z',
                    temperatura: 4,
                    fechaInicioMuestreo: '2024-01-01T00:00:00.000Z',
                    fechaTerminoMuestreo: '2024-01-01T00:00:00.000Z',
                    numeroMuestras: 1,
                    numeroEnvases: 1,
                    analistaResponsable: 'Analista Demo',
                    lugarMuestreo: 'Planta',
                    rutJefaArea: '2-2',
                    rutCoordinadoraRecepcion: '1-1'
                });

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
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }, { codigo: 'RAM', genera_tpa_default: false }] }),
                muestras: []
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
                numeroAli: 1001,
                estado: 'enviada',
                updatedAt: mockDate,
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                rutJefaArea: '2-2',
                rutCoordinaroraRecepcion: '1-1',
                muestras: []
            });
            prisma.muestraAli.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback) => callback({
                solicitudIngreso: {
                    findUnique: jest.fn().mockResolvedValue({ updatedAt: mockDate }),
                    update: jest.fn().mockResolvedValue({
                        idSolicitud: 5n,
                        estado: 'reportes_generados',
                        updatedAt: new Date('2024-01-02T00:00:00.000Z')
                    })
                },
                muestraAli: { create: jest.fn().mockResolvedValue({ codigoAli: 1001 }) },
                tpaReporte: { create: jest.fn().mockResolvedValue({ id: 1 }) },
                ramReporte: { create: jest.fn().mockResolvedValue(null) }
            }));
            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({
                    idSolicitud: 5n,
                    numeroAli: 1001,
                    estado: 'enviada',
                    updatedAt: mockDate,
                    observacionesCliente: '',
                    observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                    rutJefaArea: '2-2',
                    rutCoordinaroraRecepcion: '1-1',
                    muestras: []
                })
                .mockResolvedValueOnce({
                    idSolicitud: 5n,
                    anioIngreso: 2024,
                    numeroAli: 1001,
                    numeroActa: 'ACTA-2024-1001',
                    codigoExterno: 'EXT-001',
                    categoria: { idCategoria: 1n, nombre: 'Agua' },
                    cliente: { idCliente: 1, nombre: 'Cliente Demo', rut: 'SIN-RUT' },
                    direccion: { idDireccion: 1, direccion: 'Av. Demo 123', alias: 'Principal' },
                    fechaRecepcion: mockDate,
                    fechaInicioMuestreo: mockDate,
                    fechaTerminoMuestreo: mockDate,
                    temperaturaRecepcion: 4,
                    termometro: { idEquipo: 1 },
                    lugar: { idLugar: 1 },
                    cantidadMuestras: 1,
                    cantEnvases: 1,
                    responsableMuestreo: 'Analista Demo',
                    lugarMuestreo: 'Planta',
                    instructivoMuestreo: 'No informado',
                    envasesSuministradosPor: 'Cliente',
                    muestraCompartidaQuimica: false,
                    notasDelCliente: '',
                    observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                    estado: 'reportes_generados',
                    rutResponsableIngreso: '3-3',
                    rutJefaArea: '2-2',
                    rutCoordinaroraRecepcion: '1-1',
                    fechaEnvioValidacion: mockDate,
                    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
                    muestras: []
                });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('reportes_generados');
            expect(res.body.tpa_generado).toBe(true);
        });
    });
});
