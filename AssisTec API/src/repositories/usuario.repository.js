const prisma = require('../config/prisma');

class UsuarioRepository {
    async findByCorreo(correo) {
        return await prisma.usuario.findFirst({
            where: { correoUsuario: correo },
            include: {
                roles: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { rol: 'asc' }
                    ]
                }
            }
        });
    }

    async findByRut(rut) {
        return await prisma.usuario.findUnique({
            where: { rutUsuario: rut },
            include: {
                roles: {
                    orderBy: [
                        { isPrimary: 'desc' },
                        { rol: 'asc' }
                    ]
                }
            }
        });
    }

    async create(data) {
        return await prisma.usuario.create({
            data
        });
    }
}

module.exports = new UsuarioRepository();
