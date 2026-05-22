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
        create: jest.fn(),
        findMany: jest.fn()
    },
    subcategoriaProducto: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
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

const mockToken = (roleOrPayload) => {
    const payload = typeof roleOrPayload === 'number'
        ? { id: '1-9', role: roleOrPayload, rol: roleOrPayload, roles: [roleOrPayload], primaryRole: roleOrPayload }
        : {
            id: '1-9',
            role: roleOrPayload.primaryRole ?? roleOrPayload.role ?? roleOrPayload.rol ?? roleOrPayload.roles?.[0] ?? 0,
            rol: roleOrPayload.primaryRole ?? roleOrPayload.role ?? roleOrPayload.rol ?? roleOrPayload.roles?.[0] ?? 0,
            roles: roleOrPayload.roles ?? [],
            primaryRole: roleOrPayload.primaryRole ?? roleOrPayload.role ?? roleOrPayload.rol ?? roleOrPayload.roles?.[0] ?? 0,
            ...roleOrPayload
        };

    return jwt.sign(payload, process.env.JWT_SECRET || 'testsecret');
};
process.env.JWT_SECRET = 'testsecret';

describe('AssisTec API - Pruebas Automatizadas (Specs)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('REQ-01: Autenticación y Login', () => {
        it('SC-01.1: Login multi-rol exitoso', async () => {
            prisma.usuario.findFirst.mockResolvedValue({
                rutUsuario: '1-9',
                nombreApellidoUsuario: 'Ana Lab',
                correoUsuario: 'ana@lab.cl',
                contrasenaUsuario: 'hashed',
                rolUsuario: 1,
                urlFoto: 'foto.jpg',
                roles: [
                    { rol: 1, isPrimary: true },
                    { rol: 0, isPrimary: false }
                ]
            });
            bcrypt.compare.mockResolvedValue(true);

            const res = await request(app).post('/api/auth/login').send({
                correo: 'ana@lab.cl',
                contrasena: '123'
            });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.usuario.rut).toBe('1-9');
            expect(res.body.usuario.roles).toEqual([1, 0]);
            expect(res.body.usuario.primaryRole).toBe(1);
            expect(res.body.usuario.rol).toBe(1);
        });

        it('SC-01.3: Login legacy mantiene compatibilidad con rol único', async () => {
            prisma.usuario.findFirst.mockResolvedValue({
                rutUsuario: '3-9',
                nombreApellidoUsuario: 'Ines Legacy',
                correoUsuario: 'ines@lab.cl',
                contrasenaUsuario: 'hashed',
                rolUsuario: 3,
                urlFoto: 'legacy.jpg',
                roles: []
            });
            bcrypt.compare.mockResolvedValue(true);

            const res = await request(app).post('/api/auth/login').send({
                correo: 'ines@lab.cl',
                contrasena: '123'
            });

            expect(res.status).toBe(200);
            expect(res.body.usuario.roles).toEqual([3]);
            expect(res.body.usuario.primaryRole).toBe(3);
            expect(res.body.usuario.rol).toBe(3);
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
            expect(res.body.dias_confirmacion).toBe(8);
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

        it('SC-05.2: Bloquea generación de reportes para analista no asignado', async () => {
            const token = mockToken({ role: 0, roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 5n,
                numeroAli: 1001,
                estado: 'validado',
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                rutJefaArea: 'other-user',
                rutCoordinaroraRecepcion: 'other-user',
                muestras: []
            });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('No está asignado a esta solicitud');
        });
    });

    describe('REQ-06: Validación de Documentos', () => {
        it('SC-06.1: Coordinadora registra su validación pero la solicitud sigue en revisión hasta la segunda aprobación', async () => {
            const token = mockToken(1); // Coordinadora = 1
            const mockDate = new Date('2024-01-01T00:00:00.000Z');

            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({
                    idSolicitud: 5n,
                    numeroAli: 1001,
                    estado: 'enviada',
                    updatedAt: mockDate,
                    observacionesCliente: '',
                    observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: null, validacionJefa: null }),
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
                    observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: { aprobada: true, rut: '1-1', fecha: '2024-01-01T00:00:00.000Z' }, validacionJefa: null }),
                    estado: 'enviado',
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
            expect(res.body.estado).toBe('enviado');
            expect(res.body.validacion_coordinadora.aprobada).toBe(true);
            expect(res.body.validacion_jefa.aprobada).toBe(false);
        });

        it('SC-06.1b: Jefatura completa la segunda validación y recién ahí pasa a validado', async () => {
            const token = mockToken(2); // Jefe = 2
            const mockDate = new Date('2024-01-01T00:00:00.000Z');

            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({
                    idSolicitud: 5n,
                    numeroAli: 1001,
                    estado: 'enviado',
                    updatedAt: mockDate,
                    observacionesCliente: '',
                    observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: { aprobada: true, rut: '1-1', fecha: '2024-01-01T00:00:00.000Z' }, validacionJefa: null }),
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
                    observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: { aprobada: true, rut: '1-1', fecha: '2024-01-01T00:00:00.000Z' }, validacionJefa: { aprobada: true, rut: '2-2', fecha: '2024-01-01T00:00:00.000Z' } }),
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
            expect(res.body.validacion_coordinadora.aprobada).toBe(true);
            expect(res.body.validacion_jefa.aprobada).toBe(true);
        });

        it('SC-06.2: Rechaza actingRole inválido en validación', async () => {
            const token = mockToken({ role: 1, roles: [1], primaryRole: 1 });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ actingRole: 2, updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('actingRole no autorizado para este usuario');
        });

        it('SC-06.3: Administrator debe informar actingRole auditado', async () => {
            const token = mockToken({ role: 4, roles: [4], primaryRole: 4 });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('actingRole es obligatorio para esta acción');
        });

        it('SC-06.4: Administrator puede validar actuando como coordinadora', async () => {
            const token = mockToken({ id: '4-1', role: 4, roles: [4, 1], primaryRole: 4 });
            const mockDate = new Date('2024-01-01T00:00:00.000Z');

            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({
                    idSolicitud: 5n,
                    numeroAli: 1001,
                    estado: 'enviada',
                    updatedAt: mockDate,
                    observacionesCliente: '',
                    observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: null, validacionJefa: null }),
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
                    observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: { aprobada: true, rut: '4-1', fecha: '2024-01-01T00:00:00.000Z' }, validacionJefa: null }),
                    estado: 'enviado',
                    rutResponsableIngreso: '3-3',
                    rutJefaArea: '2-2',
                    rutCoordinaroraRecepcion: '4-1',
                    fechaEnvioValidacion: mockDate,
                    fechaHoraRecepcionCoordinadora: new Date('2024-01-02T00:00:00.000Z'),
                    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
                    muestras: []
                });
            prisma.solicitudIngreso.update.mockResolvedValue({
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
                observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Solicitante Demo', observacionesLaboratorio: '', formularios: [{ codigo: 'TPA', genera_tpa_default: true }], validacionCoordinadora: { aprobada: true, rut: '4-1', fecha: '2024-01-01T00:00:00.000Z' }, validacionJefa: null }),
                estado: 'enviado',
                rutResponsableIngreso: '3-3',
                rutJefaArea: '2-2',
                rutCoordinaroraRecepcion: '4-1',
                fechaEnvioValidacion: mockDate,
                fechaHoraRecepcionCoordinadora: new Date('2024-01-02T00:00:00.000Z'),
                updatedAt: new Date('2024-01-02T00:00:00.000Z'),
                muestras: []
            });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ actingRole: 1, updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('enviado');
            expect(prisma.solicitudIngreso.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { idSolicitud: 5n },
                data: expect.objectContaining({
                    rutCoordinaroraRecepcion: '4-1',
                    estado: 'enviado'
                })
            }));
        });
    });

    // ========================================================
    // REQ-07: Dashboard /summary y /queue — visibilidad por rol
    // ========================================================

    const mockSolicitudItem = (overrides = {}) => ({
        idSolicitud: 1n,
        anioIngreso: 2024,
        numeroAli: 1001,
        numeroActa: 'ACTA-2024-1001',
        codigoExterno: '',
        categoria: { idCategoria: 1n, nombre: 'Agua' },
        cliente: { idCliente: 1, nombre: 'Cliente', rut: 'SIN-RUT' },
        direccion: { idDireccion: 1, direccion: 'Dir', alias: 'Principal' },
        fechaRecepcion: new Date('2024-01-01'),
        fechaInicioMuestreo: new Date('2024-01-01'),
        fechaTerminoMuestreo: new Date('2024-01-01'),
        temperaturaRecepcion: 4,
        termometro: { idEquipo: 1 },
        lugar: { idLugar: 1 },
        cantidadMuestras: 1,
        cantEnvases: 1,
        responsableMuestreo: 'Analista',
        lugarMuestreo: 'Planta',
        instructivoMuestreo: 'No informado',
        envasesSuministradosPor: 'Cliente',
        muestraCompartidaQuimica: false,
        notasDelCliente: '',
        observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Test', observacionesLaboratorio: '', formularios: [] }),
        estado: 'borrador',
        rutResponsableIngreso: '3-9',
        rutJefaArea: '2-2',
        rutCoordinaroraRecepcion: '1-1',
        fechaEnvioValidacion: new Date('2024-01-01'),
        fechaEnvioInformePositivo: new Date('2024-01-05'),
        fechaEnvioInformeNegativo: new Date('2024-01-03'),
        codigoEquipoManual: null,
        updatedAt: new Date('2024-01-01'),
        muestras: [],
        ...overrides
    });

    describe('REQ-07: Dashboard /summary y /queue', () => {
        it('SC-07.1: Ingreso /summary — ve conteos solo de sus propias solicitudes', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'borrador', rutResponsableIngreso: '3-9' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'rechazado', rutResponsableIngreso: '3-9' }),
                mockSolicitudItem({ idSolicitud: 3n, estado: 'enviado', rutResponsableIngreso: '3-9' }),
                mockSolicitudItem({ idSolicitud: 4n, estado: 'validado', rutResponsableIngreso: '3-9' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.editable).toBe(1);
            expect(res.body.summary.resubmittable).toBe(1);
            expect(res.body.summary.under_review).toBe(1);
            expect(res.body.summary.post_validation).toBe(1);
        });

        it('SC-07.2: Coordinadora /summary — ve conteos de under_review y post_validation', async () => {
            const token = mockToken({ id: '1-1', roles: [1], primaryRole: 1 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'enviado', rutResponsableIngreso: 'otro' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'enviada', rutResponsableIngreso: 'otro2' }),
                mockSolicitudItem({ idSolicitud: 3n, estado: 'validado', rutResponsableIngreso: 'otro3' }),
                mockSolicitudItem({ idSolicitud: 4n, estado: 'reportes_generados', rutResponsableIngreso: 'otro4' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.editable).toBe(0);
            expect(res.body.summary.under_review).toBe(2);
            expect(res.body.summary.post_validation).toBe(2);
        });

        it('SC-07.3: Analista /summary — ve solo post_validation asignado', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'validado', rutJefaArea: '0-1', rutCoordinaroraRecepcion: 'otro' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.post_validation).toBe(1);
            expect(res.body.summary.editable).toBe(0);
            expect(res.body.summary.under_review).toBe(0);
        });

        it('SC-07.4: Administrator /summary con actingRole — filtra por rol actuante', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 1, 3], primaryRole: 4 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'enviado', rutResponsableIngreso: '3-9' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'validado', rutResponsableIngreso: '3-9' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary?actingRole=1')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.under_review).toBe(1);
            expect(res.body.summary.post_validation).toBe(1);
            expect(res.body.summary.editable).toBe(0);
        });

        it('SC-08.1: Ingreso /queue?family=editable — ve sus propios borradores', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'borrador', rutResponsableIngreso: '3-9' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'devuelta', rutResponsableIngreso: '3-9' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/queue?family=editable')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(2);
            expect(res.body.items[0].estado).toBe('borrador');
            expect(res.body.items[1].estado).toBe('devuelta');
        });

        it('SC-08.2: Coordinadora /queue?family=under_review — cola compartida', async () => {
            const token = mockToken({ id: '1-1', roles: [1], primaryRole: 1 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'enviado', rutResponsableIngreso: 'user-a' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'enviado', rutResponsableIngreso: 'user-b' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/queue?family=under_review')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(2);
            expect(res.body.items[0].rut_responsable_ingreso).toBe('user-a');
            expect(res.body.items[1].rut_responsable_ingreso).toBe('user-b');
        });

        it('SC-08.3: Analista /queue?family=post_validation — solo asignado', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 3n, estado: 'validado', rutJefaArea: '0-1', rutCoordinaroraRecepcion: 'otro' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/queue?family=post_validation')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].id_solicitud).toBe('3');
        });

        it('SC-08.4: Admin /queue?family=under_review&actingRole=2 — actúa como jefe', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 2, 1], primaryRole: 4 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 5n, estado: 'enviado', rutResponsableIngreso: 'user-x' }),
                mockSolicitudItem({ idSolicitud: 6n, estado: 'enviada', rutResponsableIngreso: 'user-y' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/queue?family=under_review&actingRole=2')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(2);
        });

        it('SC-08.5: actingRole inválido se ignora y usa primaryRole', async () => {
            const token = mockToken({ id: '1-1', roles: [1], primaryRole: 1 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 10n, estado: 'enviado', rutResponsableIngreso: 'user-g' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/queue?family=under_review&actingRole=2')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
        });

        it('SC-07.5: Analista sin solicitudes asignadas — summary vacío', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.editable).toBe(0);
            expect(res.body.summary.resubmittable).toBe(0);
            expect(res.body.summary.under_review).toBe(0);
            expect(res.body.summary.post_validation).toBe(0);
        });
    });

    // ========================================================
    // REQ-08: Política de edición por familia — ingreso no edita post_validation ni under_review
    // ========================================================

    describe('REQ-08: Edición bloqueada por familia para ingreso', () => {
        it('SC-09.1: Ingreso no puede editar solicitud en under_review (enviado)', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 1n,
                estado: 'enviado',
                updatedAt: new Date('2024-01-01')
            });

            const res = await request(app)
                .put('/api/solicitud/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toMatch(/Solicitud ya validada|no se puede modificar/);
        });

        it('SC-09.2: Ingreso no puede editar solicitud en post_validation (reportes_generados)', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 1n,
                estado: 'reportes_generados',
                updatedAt: new Date('2024-01-01')
            });

            const res = await request(app)
                .put('/api/solicitud/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toMatch(/Solicitud ya validada|no se puede modificar/);
        });

        it('SC-09.3: Coordinadora sí puede editar solicitud en under_review', async () => {
            const token = mockToken({ id: '1-1', roles: [1], primaryRole: 1 });
            const mockDate = new Date('2024-01-01T00:00:00.000Z');
            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({
                    idSolicitud: 1n,
                    estado: 'enviado',
                    numeroAli: 1001,
                    updatedAt: mockDate,
                    observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Test', observacionesLaboratorio: '', formularios: [] }),
                    categoria: { idCategoria: 1n, nombre: 'Agua' },
                    cliente: { idCliente: 1, nombre: 'Cliente', rut: 'SIN-RUT' },
                    direccion: { idDireccion: 1, direccion: 'Dir', alias: 'Principal' },
                    fechaRecepcion: mockDate,
                    fechaInicioMuestreo: mockDate,
                    fechaTerminoMuestreo: mockDate,
                    temperaturaRecepcion: 4,
                    termometro: { idEquipo: 1 },
                    lugar: { idLugar: 1 },
                    cantidadMuestras: 1,
                    cantEnvases: 1,
                    responsableMuestreo: '',
                    lugarMuestreo: '',
                    instructivoMuestreo: '',
                    envasesSuministradosPor: '',
                    muestraCompartidaQuimica: false,
                    notasDelCliente: '',
                    rutResponsableIngreso: '3-9',
                    rutJefaArea: '2-2',
                    rutCoordinaroraRecepcion: '1-1',
                    fechaEnvioValidacion: mockDate,
                    muestras: []
                })
                .mockResolvedValueOnce({
                    updatedAt: mockDate
                });
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });
            prisma.solicitudIngreso.update.mockResolvedValue({
                idSolicitud: 1n,
                anioIngreso: 2024,
                numeroAli: 1001,
                numeroActa: 'ACTA-2024-1001',
                codigoExterno: '',
                categoria: { idCategoria: 1n, nombre: 'Agua' },
                cliente: { idCliente: 1, nombre: 'Cliente', rut: 'SIN-RUT' },
                direccion: { idDireccion: 1, direccion: 'Dir', alias: 'Principal' },
                fechaRecepcion: mockDate,
                fechaInicioMuestreo: mockDate,
                fechaTerminoMuestreo: mockDate,
                temperaturaRecepcion: 4,
                termometro: { idEquipo: 1 },
                lugar: { idLugar: 1 },
                cantidadMuestras: 1,
                cantEnvases: 1,
                responsableMuestreo: '',
                lugarMuestreo: '',
                instructivoMuestreo: '',
                envasesSuministradosPor: '',
                muestraCompartidaQuimica: false,
                notasDelCliente: '',
                observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Test', observacionesLaboratorio: '', formularios: [] }),
                estado: 'enviado',
                rutResponsableIngreso: '3-9',
                rutJefaArea: '2-2',
                rutCoordinaroraRecepcion: '1-1',
                fechaEnvioValidacion: mockDate,
                fechaEnvioInformePositivo: mockDate,
                fechaEnvioInformeNegativo: mockDate,
                codigoEquipoManual: null,
                updatedAt: mockDate,
                muestras: []
            });

            const res = await request(app)
                .put('/api/solicitud/1')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z', categoriaId: 1, nombreCliente: 'Cliente', rutCliente: 'SIN-RUT' });

            expect(res.status).toBe(200);
        });
    });

    // ========================================================
    // REQ-09: Reporte service endurecido para analista
    // ========================================================

    describe('REQ-09: Generación de reportes endurecida para analista', () => {
        it('SC-10.1: Analista puede generar reportes para solicitud asignada (post_validation)', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 5n,
                numeroAli: 1001,
                estado: 'validado',
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                rutJefaArea: '0-1',
                muestras: []
            });
            prisma.muestraAli.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (cb) => {
                const tx = {
                    muestraAli: { create: jest.fn().mockResolvedValue({ codigoAli: 1001 }) },
                    tpaReporte: { create: jest.fn().mockResolvedValue({ id: 1 }) },
                    ramReporte: { create: jest.fn().mockResolvedValue(null) }
                };
                return cb(tx);
            });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tpa_generado).toBe(true);
        });

        it('SC-10.2: Analista bloqueado si la solicitud no le está asignada', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 5n,
                numeroAli: 1001,
                estado: 'validado',
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                rutJefaArea: 'other-user',
                rutCoordinaroraRecepcion: 'other-user',
                muestras: []
            });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    // ========================================================
    // REQ-10: actingRole obligatorio para admin en todas las acciones auditadas
    // ========================================================

    describe('REQ-10: actingRole requerido para admin en create, resend, reject, generate', () => {
        it('SC-11.1: Admin crea solicitud sin actingRole → 403', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 3], primaryRole: 4 });
            prisma.solicitudIngreso.aggregate.mockResolvedValue({ _max: { numeroAli: 10 } });
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({ categoriaId: 1, nombreCliente: 'Test', direccion: 'Dir' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('actingRole es obligatorio para esta acción');
        });

        it('SC-11.2: Admin crea solicitud con actingRole=3 (ingreso) → 201', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 3], primaryRole: 4 });
            prisma.solicitudIngreso.aggregate.mockResolvedValue({ _max: { numeroAli: 10 } });
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });
            prisma.cliente.findFirst.mockResolvedValue(null);
            prisma.cliente.create.mockResolvedValue({
                idCliente: 1, nombre: 'Cliente Demo', rut: 'SIN-RUT', email: 'sin-correo@asistec.local', telefono: 'Sin teléfono', activo: 'S'
            });
            prisma.direccionCliente.findFirst.mockResolvedValue(null);
            prisma.direccionCliente.create.mockResolvedValue({
                idDireccion: 1, idCliente: 1, alias: 'Principal', direccion: 'Av. Demo 123'
            });
            prisma.equipoLab.findFirst.mockResolvedValue({ idEquipo: 1, nombreEquipo: 'Equipo Demo' });
            prisma.lugarAlmacenamiento.findFirst.mockResolvedValue({ idLugar: 1, nombreLugar: 'Lugar Demo' });
            prisma.formularioAnalisis.findFirst.mockResolvedValue({ idFormularioAnalisis: 1n, codigo: 'TPA', nombreAnalisis: 'TPA', generaTpaDefault: true });
            prisma.formularioAnalisis.findUnique.mockResolvedValue({ idFormularioAnalisis: 1n, codigo: 'TPA', nombreAnalisis: 'TPA' });
            prisma.tiempoPorCategoria.findFirst.mockResolvedValue({ diasNegativo: 2, diasConfirmacion: 4, metodologiaNorma: 0 });
            prisma.alcanceAcreditacion.findFirst.mockResolvedValue({ idAlcanceAcreditacion: 1, normaEspecifica: 'ISO', acreditacion: { codigo: 'LE 261' } });
            prisma.$transaction.mockImplementation(async (callback) => callback({
                solicitudIngreso: {
                    create: jest.fn().mockResolvedValue({ idSolicitud: 1n }),
                    findUnique: jest.fn().mockResolvedValue({
                        idSolicitud: 1n, anioIngreso: 2024, numeroAli: 100, numeroActa: 'ACTA-100',
                        codigoExterno: 'EXT-001', categoria: { idCategoria: 1n, nombre: 'Agua' },
                        cliente: { idCliente: 1, nombre: 'Cliente Demo', rut: 'SIN-RUT' },
                        direccion: { idDireccion: 1, direccion: 'Av. Demo 123', alias: 'Principal' },
                        fechaRecepcion: new Date('2024-01-01'), fechaInicioMuestreo: new Date('2024-01-01'),
                        fechaTerminoMuestreo: new Date('2024-01-01'), temperaturaRecepcion: 4,
                        termometro: { idEquipo: 1 }, lugar: { idLugar: 1 }, cantidadMuestras: 1, cantEnvases: 1,
                        responsableMuestreo: 'Admin', lugarMuestreo: 'Planta', instructivoMuestreo: 'No informado',
                        envasesSuministradosPor: 'Cliente', muestraCompartidaQuimica: false, notasDelCliente: '',
                        observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Admin', observacionesLaboratorio: '', formularios: [] }),
                        estado: 'borrador', rutResponsableIngreso: '4-1', rutJefaArea: '2-2',
                        rutCoordinaroraRecepcion: '1-1', fechaEnvioValidacion: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-01'), muestras: []
                    })
                },
                solicitudMuestra: { createMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn().mockResolvedValue([]) },
                solicitudAnalisis: { aggregate: jest.fn().mockResolvedValue({ _max: { idSolicitudAnalisis: 100n } }), createMany: jest.fn().mockResolvedValue({ count: 1 }) }
            }));

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    codigoALI: 100, numeroActa: 'ACTA-100', categoriaId: 1,
                    nombreCliente: 'Cliente Demo', direccion: 'Av. Demo 123',
                    nombreSolicitante: 'Admin', fechaRecepcion: '2024-01-01T00:00:00.000Z',
                    temperatura: 4, fechaInicioMuestreo: '2024-01-01T00:00:00.000Z',
                    fechaTerminoMuestreo: '2024-01-01T00:00:00.000Z',
                    numeroMuestras: 1, numeroEnvases: 1,
                    analistaResponsable: 'Admin', lugarMuestreo: 'Planta',
                    rutJefaArea: '2-2', rutCoordinadoraRecepcion: '1-1',
                    actingRole: 3
                });

            expect(res.status).toBe(201);
            expect(res.body.id_solicitud).toBe('1');
        });

        it('SC-11.3: Admin genera reportes sin actingRole → 403', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 1], primaryRole: 4 });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('actingRole es obligatorio para esta acción');
        });

        it('SC-11.4: Admin genera reportes con actingRole=1 (coordinadora) → 200', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 1], primaryRole: 4 });
            prisma.solicitudIngreso.findUnique.mockResolvedValue({
                idSolicitud: 5n, numeroAli: 1001, estado: 'validado',
                observacionesCliente: '',
                observacionesGenerales: JSON.stringify({ formularios: [{ codigo: 'TPA', genera_tpa_default: true }] }),
                rutJefaArea: 'other', rutCoordinaroraRecepcion: '4-1', muestras: []
            });
            prisma.muestraAli.findUnique.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (cb) => {
                return cb({
                    muestraAli: { create: jest.fn().mockResolvedValue({ codigoAli: 1001 }) },
                    tpaReporte: { create: jest.fn().mockResolvedValue({ id: 1 }) },
                    ramReporte: { create: jest.fn().mockResolvedValue(null) }
                });
            });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`)
                .send({ actingRole: 1 });

            expect(res.status).toBe(200);
            expect(res.body.tpa_generado).toBe(true);
        });

        it('SC-11.5: Admin rechaza sin actingRole → 403', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 1], primaryRole: 4 });

            const res = await request(app)
                .post('/api/solicitud/5/rechazar')
                .set('Authorization', `Bearer ${token}`)
                .send({ motivo: 'Test rechazo', updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('actingRole es obligatorio para esta acción');
        });

        it('SC-11.6: Admin rechaza con actingRole=1 (coordinadora) → 200', async () => {
            const token = mockToken({ id: '4-1', roles: [4, 1], primaryRole: 4 });
            const mockDate = new Date('2024-01-01T00:00:00.000Z');
            const mockDateUpdated = new Date('2024-01-02T00:00:00.000Z');
            const updatedSolicitud = {
                idSolicitud: 5n, numeroAli: 1001, estado: 'rechazado',
                anioIngreso: 2024, numeroActa: 'ACTA-1001', codigoExterno: '',
                categoria: { idCategoria: 1n, nombre: 'Agua' },
                cliente: { idCliente: 1, nombre: 'Cliente', rut: 'SIN-RUT' },
                direccion: { idDireccion: 1, direccion: 'Dir', alias: 'Principal' },
                fechaRecepcion: mockDate, fechaInicioMuestreo: mockDate, fechaTerminoMuestreo: mockDate,
                temperaturaRecepcion: 4, termometro: { idEquipo: 1 }, lugar: { idLugar: 1 },
                cantidadMuestras: 1, cantEnvases: 1, responsableMuestreo: '', lugarMuestreo: '',
                instructivoMuestreo: '', envasesSuministradosPor: '', muestraCompartidaQuimica: false,
                notasDelCliente: '',
                observacionesGenerales: JSON.stringify({ nombreSolicitante: 'Test', observacionesLaboratorio: '', formularios: [] }),
                rutResponsableIngreso: '3-9', rutJefaArea: '2-2', rutCoordinaroraRecepcion: '4-1',
                fechaEnvioValidacion: mockDate, fechaEnvioInformePositivo: null, fechaEnvioInformeNegativo: null,
                codigoEquipoManual: null, updatedAt: mockDateUpdated, muestras: []
            };
            prisma.solicitudIngreso.findUnique
                .mockResolvedValueOnce({  // service.findById
                    idSolicitud: 5n, numeroAli: 1001, estado: 'enviada', updatedAt: mockDate,
                    observacionesCliente: '', observacionesGenerales: updatedSolicitud.observacionesGenerales,
                    rutJefaArea: '2-2', rutCoordinaroraRecepcion: '1-1', muestras: []
                })
                .mockResolvedValueOnce({ updatedAt: mockDate })  // repo.update select
                .mockResolvedValueOnce(updatedSolicitud);          // repo.update findById
            prisma.solicitudIngreso.update.mockResolvedValue(updatedSolicitud);

            const res = await request(app)
                .post('/api/solicitud/5/rechazar')
                .set('Authorization', `Bearer ${token}`)
                .send({ motivoDevolucion: 'Faltan datos', actingRole: 1, updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(200);
            expect(res.body.estado).toBe('rechazado');
        });
    });

    // ========================================================
    // REQ-11: Bloqueo por rol — ingreso y jefe no acceden a rutas exclusivas
    // ========================================================

    describe('REQ-11: Bloqueo por rol para rutas no autorizadas', () => {
        it('SC-12.1: Ingreso bloqueado en validar → 403', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('No tienes permiso para realizar esta acción');
        });

        it('SC-12.2: Ingreso bloqueado en rechazar → 403', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });

            const res = await request(app)
                .post('/api/solicitud/5/rechazar')
                .set('Authorization', `Bearer ${token}`)
                .send({ motivo: 'Test', updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
        });

        it('SC-12.3: Ingreso bloqueado en generar reportes → 403', async () => {
            const token = mockToken({ id: '3-9', roles: [3], primaryRole: 3 });

            const res = await request(app)
                .post('/api/solicitud/5/generar')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });

        it('SC-12.4: Jefe bloqueado en crear solicitud → 403', async () => {
            const token = mockToken({ id: '2-2', roles: [2], primaryRole: 2 });
            prisma.categoriaProducto.findUnique.mockResolvedValue({ idCategoria: 1n, nombre: 'Agua' });

            const res = await request(app)
                .post('/api/solicitud')
                .set('Authorization', `Bearer ${token}`)
                .send({ categoriaId: 1, nombreCliente: 'Test', direccion: 'Dir' });

            expect(res.status).toBe(403);
            expect(res.body.mensaje).toBe('No tienes permiso para realizar esta acción');
        });

        it('SC-12.5: Analista bloqueado en validar → 403', async () => {
            const token = mockToken({ id: '0-1', roles: [0], primaryRole: 0 });

            const res = await request(app)
                .post('/api/solicitud/5/validar')
                .set('Authorization', `Bearer ${token}`)
                .send({ updated_at: '2024-01-01T00:00:00.000Z' });

            expect(res.status).toBe(403);
        });
    });

    // ========================================================
    // REQ-12: Jefe /summary y Admin /summary sin actingRole
    // ========================================================

    describe('REQ-12: Summary coverage para jefe y admin sin actingRole', () => {
        it('SC-13.1: Jefe /summary — ve conteos de under_review y post_validation', async () => {
            const token = mockToken({ id: '2-2', roles: [2], primaryRole: 2 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'enviado', rutResponsableIngreso: 'user-a' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'enviada', rutResponsableIngreso: 'user-b' }),
                mockSolicitudItem({ idSolicitud: 3n, estado: 'validado', rutResponsableIngreso: 'user-c' }),
                mockSolicitudItem({ idSolicitud: 4n, estado: 'reportes_generados', rutResponsableIngreso: 'user-d' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.editable).toBe(0);
            expect(res.body.summary.under_review).toBe(2);
            expect(res.body.summary.post_validation).toBe(2);
        });

        it('SC-13.2: Admin /summary sin actingRole — ve todas las familias sin filtro', async () => {
            const token = mockToken({ id: '4-1', roles: [4], primaryRole: 4 });
            prisma.solicitudIngreso.findMany.mockResolvedValue([
                mockSolicitudItem({ idSolicitud: 1n, estado: 'borrador', rutResponsableIngreso: 'user-a' }),
                mockSolicitudItem({ idSolicitud: 2n, estado: 'rechazado', rutResponsableIngreso: 'user-b' }),
                mockSolicitudItem({ idSolicitud: 3n, estado: 'enviado', rutResponsableIngreso: 'user-c' }),
                mockSolicitudItem({ idSolicitud: 4n, estado: 'validado', rutResponsableIngreso: 'user-d' }),
                mockSolicitudItem({ idSolicitud: 5n, estado: 'reportes_generados', rutResponsableIngreso: 'user-e' })
            ]);

            const res = await request(app)
                .get('/api/solicitud/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.summary.editable).toBeGreaterThan(0);
            expect(res.body.summary.under_review).toBeGreaterThan(0);
            expect(res.body.summary.post_validation).toBeGreaterThan(0);
        });
    });
});
