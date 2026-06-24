const prisma = require('../config/prisma');

class CatalogoRepository {
    async findAll(tipo, query = {}) {
        // Mapeo simple del tipo de catálogo al modelo de Prisma
        const map = {
            'clientes': prisma.cliente,
            'usuarios': prisma.usuario,
            'categorias': prisma.categoriaProducto,
            'formularios': prisma.formularioAnalisis,
            'equipos_lab': prisma.equipoLab,
            'lugares': prisma.lugarAlmacenamiento,
            'acreditaciones': prisma.acreditacionInn,
            'diluyentes': prisma.diluyente,
            'equipos_incubacion': prisma.equipoIncubacion,
            'instrumentos': prisma.instrumento,
            'checklist_limpieza': prisma.maestroChecklistLimpieza,
            'formas_calculo': prisma.maestroFormasCalculo,
            'tipos_analisis': prisma.maestroTiposAnalisis,
            'material_siembra': prisma.materialSiembra,
            'micropipetas': prisma.micropipeta,
            'subcategorias': prisma.subcategoriaProducto,
            'lotes_reactivo': prisma.loteReactivo
        };

        const model = map[tipo.toLowerCase()];
        if (!model) {
            throw new Error('INVALID_CATALOG_TYPE');
        }

        const where = {};
        if (tipo.toLowerCase() === 'lotes_reactivo' && query.tipo) {
            where.tipo = query.tipo;
        }

        return await model.findMany({ where });
    }
}

module.exports = new CatalogoRepository();
