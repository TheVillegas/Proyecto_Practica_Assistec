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
        findFirst: jest.fn(),
        create: jest.fn()
    },
    solicitudIngreso: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn()
    },
    solicitudMuestra: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn()
    },
    solicitudAnalisis: {
        aggregate: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn()
    },
    formularioAnalisis: {
        findUnique: jest.fn(),
        findFirst: jest.fn()
    },
    tiempoPorCategoria: {
        findFirst: jest.fn()
    },
    alcanceAcreditacion: {
        findFirst: jest.fn()
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
            prisma.formularioAnalisis.findFirst.mockResolvedValue({ idFormularioAnalisis: 1n, codigo: 'TPA', nombreAnalisis: 'TPA', generaTpaDefault: true });
            prisma.formularioAnalisis.findUnique.mockResolvedValue({ idFormularioAnalisis: 1n, codigo: 'TPA', nombreAnalisis: 'TPA' });
            prisma.tiempoPorCategoria.findFirst.mockResolvedValue({ diasNegativo: 2, diasConfirmacion: 4, metodologiaNorma: 0 });
            prisma.alcanceAcreditacion.findFirst.mockResolvedValue({
                idAlcanceAcreditacion: 1,
                normaEspecifica: 'ISO',
                acreditacion: { codigo: 'LE 261' }
            });
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
                    createMany: jest.fn().mockResolvedValue({ count: 1 }),
                    findMany: jest.fn().mockResolvedValue([{ idSolicitudMuestra: 10n, idSolicitud: 1n }])
                },
                solicitudAnalisis: {
                    aggregate: jest.fn().mockResolvedValue({ _max: { idSolicitudAnalisis: 100n } }),
                    createMany: jest.fn().mockResolvedValue({ count: 1 })
                }
            }));

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    codigoALI: 11,
                    numeroActa: 'ACTA-2024-0011',
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

        it('SC-02.2: Usa equipos_lab como equipo de almacenamiento y lo materializa como lugar', async () => {
            const token = mockToken(3);
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });
            prisma.cliente.findFirst.mockResolvedValue({
                idCliente: 1,
                nombre: 'Cliente Demo',
                rut: 'SIN-RUT',
                email: 'sin-correo@asistec.local',
                telefono: 'Sin telefono',
                activo: 'S'
            });
            prisma.direccionCliente.findFirst.mockResolvedValue({
                idDireccion: 1,
                idCliente: 1,
                alias: 'Principal',
                direccion: 'Av. Demo 123'
            });
            prisma.equipoLab.findUnique
                .mockResolvedValueOnce({ idEquipo: 10, nombreEquipo: 'Termometro', codigoEquipo: '10-T-I' })
                .mockResolvedValueOnce({ idEquipo: 20, nombreEquipo: 'Refrigerador 2-I', codigoEquipo: '2-I' });
            prisma.lugarAlmacenamiento.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            prisma.lugarAlmacenamiento.create.mockResolvedValue({ idLugar: 5, nombreLugar: 'Refrigerador 2-I', codigoLugar: '2-I' });
            prisma.formularioAnalisis.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback) => callback({
                solicitudIngreso: {
                    create: jest.fn().mockResolvedValue({ idSolicitud: 1n }),
                    findUnique: jest.fn().mockResolvedValue({
                        idSolicitud: 1n,
                        anioIngreso: 2024,
                        numeroAli: 424,
                        numeroActa: '424',
                        codigoExterno: 'EXT-001',
                        categoria: { idCategoria: 1n, nombre: 'Agua' },
                        cliente: { idCliente: 1, nombre: 'Cliente Demo', rut: 'SIN-RUT' },
                        direccion: { idDireccion: 1, direccion: 'Av. Demo 123', alias: 'Principal' },
                        fechaRecepcion: new Date('2024-01-01T00:00:00.000Z'),
                        fechaInicioMuestreo: new Date('2024-01-01T00:00:00.000Z'),
                        fechaTerminoMuestreo: new Date('2024-01-01T00:00:00.000Z'),
                        temperaturaRecepcion: 4,
                        termometro: { idEquipo: 10 },
                        lugar: { idLugar: 5 },
                        cantidadMuestras: 1,
                        cantEnvases: 1,
                        responsableMuestreo: 'Analista Demo',
                        lugarMuestreo: 'Planta',
                        instructivoMuestreo: 'No informado',
                        envasesSuministradosPor: 'Laboratorio',
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
                    createMany: jest.fn().mockResolvedValue({ count: 1 }),
                    findMany: jest.fn().mockResolvedValue([])
                }
            }));

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    codigoALI: 424,
                    numeroActa: '424',
                    categoriaId: 1,
                    nombreCliente: 'Cliente Demo',
                    direccion: 'Av. Demo 123',
                    nombreSolicitante: 'Solicitante Demo',
                    fechaRecepcion: '2024-01-01T00:00:00.000Z',
                    temperatura: 4,
                    idTermometro: 10,
                    idEquipoAlmacenamiento: 20,
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
            expect(prisma.lugarAlmacenamiento.create).toHaveBeenCalledWith({
                data: { nombreLugar: 'Refrigerador 2-I', codigoLugar: '2-I' }
            });
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
                idFormularioAnalisis: 1n,
                metodologiaNorma: 'ISO',
                acreditado: true,
                diasNegativoSnapshot: 2,
                diasConfirmacionSnapshot: 4
            });
            prisma.solicitudMuestra.findUnique.mockResolvedValue({
                idSolicitudMuestra: 10n,
                solicitud: { categoriaId: 1n }
            });
            prisma.tiempoPorCategoria.findFirst.mockResolvedValue({ diasNegativo: 2, diasConfirmacion: 4 });
            prisma.alcanceAcreditacion.findFirst.mockResolvedValue({ idAlcanceAcreditacion: 1, normaEspecifica: 'ISO' });

            const res = await request(app)
                .post('/api/muestra/10/analisis')
                .set('Authorization', `Bearer ${token}`)
                .send({ id_alcance_acreditacion: 1, id_formulario_analisis: 1, acreditado: true, metodologia_norma: 'ISO' });

            expect(res.status).toBe(201);
            expect(res.body.idSolicitudAnalisis).toBe('101');
        });

        it('SC-04.2: Resuelve norma, LE y dias por categoria/formulario', async () => {
            const token = mockToken(3);
            prisma.formularioAnalisis.findUnique.mockResolvedValue({
                idFormularioAnalisis: 7n,
                codigo: 'SALMONELLA_ISO',
                nombreAnalisis: 'Salmonella ISO'
            });
            prisma.tiempoPorCategoria.findFirst.mockResolvedValue({
                diasNegativo: 3,
                diasConfirmacion: 6,
                metodologiaNorma: 6579
            });
            prisma.alcanceAcreditacion.findFirst.mockResolvedValue({
                idAlcanceAcreditacion: 9,
                normaEspecifica: 'ISO 6579-1:2017',
                acreditacion: { codigo: 'LE 261' }
            });

            const res = await request(app)
                .get('/api/solicitud/analisis/resolver?id_categoria_producto=1&id_formulario_analisis=7')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.codigo_le).toBe('LE 261');
            expect(res.body.metodologia_norma).toBe('ISO 6579-1:2017');
            expect(res.body.dias_negativo).toBe(3);
            expect(res.body.dias_confirmacion).toBe(6);
            expect(res.body.acreditado).toBe(true);
        });

        it('SC-04.3: Calcula plazo como MAX(dias) + 1 dia coordinador', async () => {
            const token = mockToken(3);
            prisma.solicitudIngreso.findFirst.mockResolvedValue({
                idSolicitud: 1n,
                numeroAli: 1001,
                fechaRecepcion: new Date('2026-05-05T00:00:00.000Z'),
                muestras: []
            });
            prisma.solicitudAnalisis.findMany.mockResolvedValue([
                { diasNegativoSnapshot: 2, diasConfirmacionSnapshot: 4 },
                { diasNegativoSnapshot: 5, diasConfirmacionSnapshot: 8 }
            ]);

            const res = await request(app)
                .get('/api/solicitud/1001/plazo-estimado')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.dias_negativo).toBe(6);
            expect(res.body.dias_confirmacion).toBe(9);
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
                    updatedAt: mockDate
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
                    estado: 'validado',
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
            expect(res.body.estado).toBe('validado');
        });
    });
});
