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
            'banos': prisma.banoTermico,
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

        if (tipo.toLowerCase() === 'usuarios') {
            if (query.rol !== undefined) {
                const rolNum = Number(query.rol);
                if (!isNaN(rolNum)) {
                    where.rolUsuario = rolNum;
                } else if (String(query.rol).toUpperCase() === 'ANALISTA') {
                    where.rolUsuario = 0;
                }
            }
            const users = await model.findMany({ where });
            return users.map(u => ({
                rut: u.rutUsuario,
                nombreApellido: u.nombreApellidoUsuario,
                correo: u.correoUsuario,
                rol: u.rolUsuario
            }));
        }

        return await model.findMany({ where });
    }
}

module.exports = new CatalogoRepository();
