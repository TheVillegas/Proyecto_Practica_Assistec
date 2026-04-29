const catalogoRepository = require('../repositories/catalogo.repository');

class CatalogoService {
    async listar(tipo) {
        const list = await catalogoRepository.findAll(tipo);
        
        // Convertir BigInt a String para evitar errores de serialización
        return list.map(item => {
            const parsed = {};
            for (const [key, value] of Object.entries(item)) {
                parsed[key] = typeof value === 'bigint' ? value.toString() : value;
            }
            return parsed;
        });
    }
}

module.exports = new CatalogoService();
