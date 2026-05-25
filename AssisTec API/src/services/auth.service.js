const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuario.repository');
const { resolvePrimaryRole, resolveUserRoles } = require('../config/roles');

class AuthService {
    async login(correo, contrasena) {
        // 1. Buscar usuario por correo
        const usuario = await usuarioRepository.findByCorreo(correo);
        
        if (!usuario) {
            throw new Error('Credenciales inválidas');
        }

        // 2. Verificar contraseña
        const isMatch = await bcrypt.compare(contrasena, usuario.contrasenaUsuario);
        if (!isMatch) {
            throw new Error('Credenciales inválidas');
        }

        const roles = resolveUserRoles(usuario);
        const primaryRole = resolvePrimaryRole(usuario, roles);

        // 3. Generar token
        const payload = {
            id: usuario.rutUsuario,
            roles,
            primaryRole,
            role: primaryRole,
            rol: primaryRole
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'super_secret_jwt_key_for_local_dev', 
            { expiresIn: '8h' }
        );

        return {
            token,
            usuario: {
                rut: usuario.rutUsuario,
                nombre: usuario.nombreApellidoUsuario,
                correo: usuario.correoUsuario,
                roles,
                primaryRole,
                rol: primaryRole,
                role: primaryRole,
                foto: usuario.urlFoto
            }
        };
    }

    async crearAnalista(data) {
        const rut = data.rut || data.rut_analista;
        const nombreApellido = data.nombreApellidoUsuario || data.nombre_apellido || data.nombre_apellido_analista;
        const correo = data.correoUsuario || data.correo || data.correo_analista;
        const contrasena = data.contrasena || data.contrasena_analista;

        // Verificar si existe el usuario
        const existeUsuario = await usuarioRepository.findByRut(rut);
        if (existeUsuario) {
            throw new Error('El usuario ya existe');
        }

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const primaryRole = data.rolUsuario ?? 0;
        const nuevoUsuario = {
            rutUsuario: rut,
            nombreApellidoUsuario: nombreApellido,
            correoUsuario: correo,
            contrasenaUsuario: hashedPassword,
            rolUsuario: primaryRole, // Analista por defecto
            roles: {
                create: [{
                    rol: primaryRole,
                    isPrimary: true
                }]
            },
            urlFoto: data.urlFoto || ''
        };

        return await usuarioRepository.create(nuevoUsuario);
    }
}

module.exports = new AuthService();
