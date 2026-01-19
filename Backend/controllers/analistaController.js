const Analista = require('../models/analistaModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mapAnalista } = require('../utils/mappers');

// Asegúrate de que coincida con el del middleware (idealmente en .env)
const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_secreto_para_desarrollo';

exports.crearAnalista = async (req, res) => {
    try {
        const datos = req.body;

        // Validar campos obligatorios básicos
        if (!datos.rut_analista || !datos.contrasena_analista) {
            return res.status(400).json({ mensaje: 'RUT y contraseña son obligatorios' });
        }

        // 1. Validar si el analista ya existe
        Analista.obtenerPorRut(datos.rut_analista, async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ mensaje: 'Error al verificar usuario' });
            }

            if (result.rows && result.rows.length > 0) {
                return res.status(400).json({ mensaje: 'El RUT ya está registrado' });
            }

            // 2. Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(datos.contrasena_analista, salt);

            // Reemplazamos la contraseña plana por la hasheada
            datos.contrasena_analista = hashedPassword;

            // 3. Crear usuario
            Analista.crear(datos, (errCreate, resultCreate) => {
                if (errCreate) {
                    console.error(errCreate);
                    return res.status(500).json({ mensaje: 'Error al crear el analista en la BD' });
                }

                res.status(201).json({
                    mensaje: 'Analista creado exitosamente',
                    filasAfectadas: resultCreate.rowsAffected
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

exports.loginAnalista = async (req, res) => {
    const { correo, contrasena_analista } = req.body;

    if (!correo || !contrasena_analista) {
        return res.status(400).json({ mensaje: 'Debe ingresar correo y contraseña' });
    }

    // hay que buscar el rut por correo
    const rut_analista = await Analista.obtenerPorCorreo(correo);
    // 1. Buscar usuario por RUT
    Analista.obtenerPorRut(rut_analista, async (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al intentar loguearse' });
        }

        // Si no se encuentra el usuario
        if (!result.rows || result.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // 2. Comparar contraseña (la ingresada vs la hasheada en BD)
        // Intentamos leer en mayúsculas (Oracle) o minúsculas por compatibilidad
        const passHashDB = usuario.CONTRASENA_ANALISTA || usuario.contrasena_analista;

        try {
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
            console.error(bkError);
            res.status(500).json({ mensaje: 'Error al validar credenciales' });
        }
    });
};

exports.listarAnalistas = (req, res) => {
    Analista.obtenerAnalistas((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ mensaje: 'Error al obtener analistas' });
        }
        // Aplicar mapper a cada fila
        const analistas = result.rows.map(mapAnalista);
        res.status(200).json(analistas);
    });
};
