const Analista = require('../models/analistaModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mapAnalista } = require('../utils/mappers');
const logger = require('../utils/logger');


// Asegúrate de tener JWT_SECRET en tus variables de entorno
const SECRET_KEY = process.env.JWT_SECRET;

exports.crearAnalista = async (req, res) => {
    try {
        const datos = req.body;

        // Validar campos obligatorios básicos
        if (!datos.rut_analista || !datos.contrasena_analista) {
            return res.status(400).json({ mensaje: 'RUT y contraseña son obligatorios' });
        }

        // 1. Validar si el analista ya existe
        const result = await Analista.obtenerPorRut(datos.rut_analista);

        if (result.rows && result.rows.length > 0) {
            return res.status(400).json({ mensaje: 'El RUT ya está registrado' });
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(datos.contrasena_analista, salt);

        // Reemplazamos la contraseña plana por la hasheada
        datos.contrasena_analista = hashedPassword;

        // 3. Crear usuario
        const resultCreate = await Analista.crear(datos);

        res.status(201).json({
            mensaje: 'Analista creado exitosamente',
            filasAfectadas: resultCreate.rowsAffected
        });

    } catch (error) {
        logger.error('Error crearAnalista', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

exports.loginAnalista = async (req, res) => {
    try {
        const { correo, contrasena_analista } = req.body;

        if (!correo || !contrasena_analista) {
            return res.status(400).json({ mensaje: 'Debe ingresar correo y contraseña' });
        }

        // hay que buscar el rut por correo
        const rut_analista = await Analista.obtenerPorCorreo(correo);

        if (!rut_analista) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // 1. Buscar usuario por RUT
        const result = await Analista.obtenerPorRut(rut_analista);

        // Si no se encuentra el usuario
        if (!result.rows || result.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // 2. Comparar contraseña (la ingresada vs la hasheada en BD)
        // Intentamos leer en mayúsculas (Oracle) o minúsculas por compatibilidad
        const passHashDB = usuario.CONTRASENA_ANALISTA || usuario.contrasena_analista;

        const validPassword = await bcrypt.compare(contrasena_analista, passHashDB);

        if (!validPassword) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // 3. Generar Token JWT
        const token = jwt.sign(
            {
                id: usuario.RUT_ANALISTA || usuario.rut_analista,
                role: usuario.ROL_ANALISTA || usuario.rol_analista
            },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Mapper para el usuario logueado
        const usuarioMapeado = mapAnalista(usuario);

        res.status(200).json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: usuarioMapeado
        });
    } catch (bkError) {
        logger.error('Error loginAnalista', { message: bkError.message });
        res.status(500).json({ mensaje: 'Error al validar credenciales' });
    }
};

exports.listarAnalistas = async (req, res) => {
    try {
        const result = await Analista.obtenerAnalistas();
        // Aplicar mapper a cada fila
        const analistas = result.rows.map(mapAnalista);
        res.status(200).json(analistas);
    } catch (err) {
        logger.error('Error listarAnalistas', { message: err.message });
        res.status(500).json({ mensaje: 'Error al obtener analistas' });
    }
};

exports.actualizarFotoPerfil = async (req, res) => {
    try {
        const { rut } = req.params;
        const { url_foto } = req.body;

        if (!rut || !url_foto) {
            return res.status(400).json({ mensaje: 'RUT y URL de foto son obligatorios' });
        }

        // Validar que el usuario que actualiza es el mismo del RUT (Seguridad básica)
        // req.user viene del middleware authMiddleware: { rut: decoded.id, rol: decoded.role }
        // Roles: 0 = Analista, 1 = Supervisor
        if (req.user.rut !== rut && req.user.rol !== 1) {
            return res.status(403).json({ mensaje: 'No tiene permisos para modificar este usuario' });
        }

        await Analista.actualizarFoto(rut, url_foto);
        res.status(200).json({ mensaje: 'Foto de perfil actualizada correctamente' });
    } catch (error) {
        logger.error('Error al actualizar foto de perfil', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno al actualizar foto' });
    }
};

exports.actualizarCorreo = async (req, res) => {
    try {
        const { rut } = req.params;
        const { correo } = req.body;

        if (!rut || !correo) {
            return res.status(400).json({ mensaje: 'RUT y correo son obligatorios' });
        }

        // TODO: Validar si el correo ya existe en otro usuario (Opcional pero recomendado)

        await Analista.actualizarCorreo(rut, correo);
        res.status(200).json({ mensaje: 'Correo actualizado correctamente' });
    } catch (error) {
        logger.error('Error al actualizar correo', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno al actualizar correo' });
    }
};

exports.actualizarPassword = async (req, res) => {
    try {
        const { rut } = req.params;
        const { password } = req.body;

        if (!rut || !password) {
            return res.status(400).json({ mensaje: 'RUT y contraseña son obligatorios' });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Analista.actualizarPassword(rut, hashedPassword);
        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        logger.error('Error al actualizar contraseña', { message: error.message });
        res.status(500).json({ mensaje: 'Error interno al actualizar contraseña' });
    }
};
