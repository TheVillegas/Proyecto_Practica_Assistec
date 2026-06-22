class BaseFormRepository {
    constructor(prismaModel, idField = 'id') {
        this.model = prismaModel;
        this.idField = idField;
    }

    getFullInclude() {
        throw new Error('Abstract — implementar en subclase');
    }

    async findById(id) {
        return this.model.findUnique({
            where: { [this.idField]: BigInt(id) },
            include: this.getFullInclude()
        });
    }

    async findBySolicitudAnalisis(idSolicitudAnalisis) {
        return this.model.findFirst({
            where: { idSolicitudAnalisis: BigInt(idSolicitudAnalisis) },
            include: this.getFullInclude()
        });
    }

    // touchFormulario base: fallback sin verificación de concurrencia.
    // Las subclases (Coli, Sal, Sau) sobreescriben con updateMany + expectedUpdatedAt.
    async touchFormulario(id, extra = {}, tx) {
        const client = tx || this.model;
        return client.update({
            where: { [this.idField]: BigInt(id) },
            data: {
                updatedAt: new Date(),
                ...extra
            }
        });
    }

    async create(data, tx) {
        const client = tx || this.model;
        const payload = {
            ...data,
            muestras: data.muestras ? { create: data.muestras } : undefined
        };
        return client.create({
            data: payload,
            include: this.getFullInclude()
        });
    }

    async updateEstado(id, estado, etapaField, valorEtapa, expectedUpdatedAt) {
        const result = await this.model.updateMany({
            where: {
                [this.idField]: BigInt(id),
                updatedAt: expectedUpdatedAt
            },
            data: {
                estado,
                [etapaField]: valorEtapa,
                updatedAt: new Date()
            }
        });

        if (result.count === 0) {
            throw new Error('CONCURRENCY_ERROR');
        }

        return this.model.findUnique({
            where: { [this.idField]: BigInt(id) },
            include: this.getFullInclude()
        });
    }
}

module.exports = BaseFormRepository;
