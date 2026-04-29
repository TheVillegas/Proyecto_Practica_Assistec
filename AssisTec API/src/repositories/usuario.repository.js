const prisma = require('../config/prisma');

class UsuarioRepository {
    async findByCorreo(correo) {
        return await prisma.usuario.findFirst({
            where: { correoUsuario: correo }
        });
    }

    async findByRut(rut) {
        return await prisma.usuario.findUnique({
            where: { rutUsuario: rut }
        });
    }

    async create(data) {
        return await prisma.usuario.create({
            data
        });
    }
}

module.exports = new UsuarioRepository();
