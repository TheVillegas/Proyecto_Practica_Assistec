const authService = require('../services/auth.service');

class AuthController {
    async login(req, res) {
        try {
            const { correo, contrasena } = req.body;

            if (!correo || !contrasena) {
                return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
            }

            const result = await authService.login(correo, contrasena);
            
            return res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Credenciales inválidas') {
                return res.status(401).json({ mensaje: error.message });
            }
            console.error('Error en login:', error);
            return res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

    async crearAnalista(req, res) {
        try {
            const data = req.body;
            
            const rut = data.rut || data.rut_analista;
            const correo = data.correo || data.correo_analista;

            if (!rut || !correo) {
                return res.status(400).json({ mensaje: 'Rut y correo son requeridos' });
            }

            const nuevoAnalista = await authService.crearAnalista(data);
            return res.status(201).json({
                mensaje: 'Analista creado exitosamente',
                usuario: {
                    rut: nuevoAnalista.rutUsuario,
                    nombre: nuevoAnalista.nombreApellidoUsuario,
                    correo: nuevoAnalista.correoUsuario
                }
            });
        } catch (error) {
            if (error.message === 'El usuario ya existe') {
                return res.status(409).json({ mensaje: error.message });
            }
            console.error('Error en crearAnalista:', error);
            return res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }
}

module.exports = new AuthController();
