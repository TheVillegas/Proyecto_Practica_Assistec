const prisma = require('../config/prisma');

class SolicitudRepository {
    async create(data, cantidadMuestras = 0) {
        return await prisma.$transaction(async (tx) => {
            const solicitud = await tx.solicitudIngreso.create({
                data
            });

            if (cantidadMuestras > 0) {
                await tx.solicitudMuestra.createMany({
                    data: Array.from({ length: cantidadMuestras }).map(() => ({
                        idSolicitud: solicitud.idSolicitud
                    }))
                });
            }

            return tx.solicitudIngreso.findUnique({
                where: { idSolicitud: solicitud.idSolicitud },
                include: this.getInclude()
            });
        });
    }

    async createWithAnalisisDefault(data, cantidadMuestras = 0, formulariosDefault = []) {
        return await prisma.$transaction(async (tx) => {
            const solicitud = await tx.solicitudIngreso.create({ data });

            let muestras = [];
            if (cantidadMuestras > 0) {
                await tx.solicitudMuestra.createMany({
                    data: Array.from({ length: cantidadMuestras }).map(() => ({
                        idSolicitud: solicitud.idSolicitud
                    }))
                });

                muestras = await tx.solicitudMuestra.findMany({
                    where: { idSolicitud: solicitud.idSolicitud },
                    orderBy: { idSolicitudMuestra: 'asc' }
                });
            }

            if (muestras.length > 0 && formulariosDefault.length > 0) {
                const aggr = await tx.solicitudAnalisis.aggregate({
                    _max: { idSolicitudAnalisis: true }
                });
                let nextId = (aggr._max.idSolicitudAnalisis || BigInt(0)) + BigInt(1);
                const dataAnalisis = [];

                for (const muestra of muestras) {
                    for (const formulario of formulariosDefault) {
                        dataAnalisis.push({
                            idSolicitudAnalisis: nextId,
                            idSolicitudMuestra: muestra.idSolicitudMuestra,
                            idAlcanceAcreditacion: formulario.idAlcanceAcreditacion ?? null,
                            idFormularioAnalisis: BigInt(formulario.idFormularioAnalisis),
                            acreditado: formulario.acreditado,
                            metodologiaNorma: formulario.metodologiaNorma,
                            diasNegativoSnapshot: formulario.diasNegativoSnapshot,
                            diasConfirmacionSnapshot: formulario.diasConfirmacionSnapshot
                        });
                        nextId += BigInt(1);
                    }
                }

                if (dataAnalisis.length > 0) {
                    await tx.solicitudAnalisis.createMany({ data: dataAnalisis });
                }
            }

            return tx.solicitudIngreso.findUnique({
                where: { idSolicitud: solicitud.idSolicitud },
                include: this.getInclude()
            });
        });
    }

    async findAll(whereClause = {}) {
        return await prisma.solicitudIngreso.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: this.getInclude()
        });
    }

    async findById(id) {
        return await prisma.solicitudIngreso.findUnique({
            where: { idSolicitud: BigInt(id) },
            include: this.getInclude()
        });
    }

    async update(id, data, expectedUpdatedAt) {
        const existing = await prisma.solicitudIngreso.findUnique({
            where: { idSolicitud: BigInt(id) },
            select: { updatedAt: true }
        });

        if (!existing) {
            throw new Error('NOT_FOUND');
        }

        // Permitir un margen pequeño o igualdad exacta (en JS las fechas pueden perder ms al serializar)
        if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
            throw new Error('CONCURRENCY_ERROR');
        }

        await prisma.solicitudIngreso.update({
            where: { idSolicitud: BigInt(id) },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return this.findById(id);
    }

    async getNextNumeroAli() {
        const aggr = await prisma.solicitudIngreso.aggregate({
            _max: { numeroAli: true }
        });
        return (aggr._max.numeroAli || 0) + 1;
    }

    async findByNumeroAli(numeroAli) {
        return prisma.solicitudIngreso.findFirst({
            where: { numeroAli: Number(numeroAli) },
            include: this.getInclude()
        });
    }

    async findCategoriaById(idCategoria) {
        return prisma.categoriaProducto.findUnique({
            where: { idCategoria: BigInt(idCategoria) }
        });
    }

    async findCategoriaByName(nombre) {
        return prisma.categoriaProducto.findFirst({
            where: { nombre }
        });
    }

    async createCategoria(nombre) {
        return prisma.categoriaProducto.create({
            data: { nombre }
        });
    }

    async findClienteById(idCliente) {
        return prisma.cliente.findUnique({
            where: { idCliente: Number(idCliente) }
        });
    }

    async findClienteByNombre(nombre) {
        return prisma.cliente.findFirst({
            where: { nombre }
        });
    }

    async createCliente(data) {
        return prisma.cliente.create({ data });
    }

    async findDireccionById(idDireccion) {
        return prisma.direccionCliente.findUnique({
            where: { idDireccion: Number(idDireccion) }
        });
    }

    async findDireccionByClienteYTexto(idCliente, direccion) {
        return prisma.direccionCliente.findFirst({
            where: {
                idCliente: Number(idCliente),
                direccion
            }
        });
    }

    async createDireccion(data) {
        return prisma.direccionCliente.create({ data });
    }

    async findEquipoById(idEquipo) {
        return prisma.equipoLab.findUnique({
            where: { idEquipo: Number(idEquipo) }
        });
    }

    async getPrimerEquipo() {
        return prisma.equipoLab.findFirst({
            orderBy: { idEquipo: 'asc' }
        });
    }

    async findLugarById(idLugar) {
        return prisma.lugarAlmacenamiento.findUnique({
            where: { idLugar: Number(idLugar) }
        });
    }

    async findLugarByCodigo(codigoLugar) {
        return prisma.lugarAlmacenamiento.findFirst({
            where: { codigoLugar }
        });
    }

    async findLugarByNombre(nombreLugar) {
        return prisma.lugarAlmacenamiento.findFirst({
            where: { nombreLugar }
        });
    }

    async createLugar(data) {
        return prisma.lugarAlmacenamiento.create({ data });
    }

    async getPrimerLugar() {
        return prisma.lugarAlmacenamiento.findFirst({
            orderBy: { idLugar: 'asc' }
        });
    }

    async findFormularioById(idFormularioAnalisis) {
        return prisma.formularioAnalisis.findUnique({
            where: { idFormularioAnalisis: BigInt(idFormularioAnalisis) }
        });
    }

    async findFormularioTpaDefault() {
        return prisma.formularioAnalisis.findFirst({
            where: { generaTpaDefault: true },
            orderBy: { idFormularioAnalisis: 'asc' }
        });
    }

    async findTiempoPorCategoria(idCategoriaProducto, idFormularioAnalisis) {
        return prisma.tiempoPorCategoria.findFirst({
            where: {
                idCategoriaProducto: BigInt(idCategoriaProducto),
                idFormularioAnalisis: BigInt(idFormularioAnalisis)
            },
            include: { formulario: true }
        });
    }

    async findAlcancePorCategoriaFormulario(idCategoriaProducto, idFormularioAnalisis) {
        return prisma.alcanceAcreditacion.findFirst({
            where: {
                idCategoriaProducto: BigInt(idCategoriaProducto),
                idFormularioAnalisis: BigInt(idFormularioAnalisis)
            },
            include: { acreditacion: true }
        });
    }

    async findAnalisisByCodigoAli(numeroAli) {
        return prisma.solicitudAnalisis.findMany({
            where: {
                muestra: {
                    solicitud: {
                        numeroAli: Number(numeroAli)
                    }
                }
            },
            include: {
                formulario: true,
                alcance: { include: { acreditacion: true } },
                muestra: { include: { solicitud: true } }
            }
        });
    }

    getInclude() {
        return {
            categoria: true,
            cliente: true,
            direccion: true,
            termometro: true,
            lugar: true,
            responsableIngreso: true,
            jefaArea: true,
            coordinadora: true,
            muestras: {
                include: {
                    analisis: {
                        include: {
                            formulario: true,
                            alcance: true
                        }
                    }
                }
            }
        };
    }
}

module.exports = new SolicitudRepository();
