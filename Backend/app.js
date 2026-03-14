require('dotenv').config();
const express = require("express");
const app = express();
const logger = require('./utils/logger');

const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    logger.error('FATAL ERROR: JWT_SECRET is not defined in .env');
    process.exit(1);
}

app.use(express.json());
const cors = require('cors');
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

app.get("/", (req, res) => {
    res.send("Servidor corriendo ✅");
});

// 11. Conexión a la BD
const db = require('./config/DB.js');
// Esperar a que la BD esté lista antes de arrancar el servidor
db.initialize().then(() => {
    const analistasRoutes = require('./routes/analistasRoutes.js');
    const catalogoRoutes = require('./routes/catalogoRoutes.js');
    const muestraAliRoutes = require('./routes/muestraAliRoutes.js');
    const reporteTPARoutes = require('./routes/reporteTPARoutes.js');
    const reporteRAMRoutes = require('./routes/reporteRAMRoutes.js');
    const exportarRoutes = require('./routes/exportarRoutes.js');
    const uploadRoutes = require('./routes/uploadRoutes.js');

    app.use('/AsisTec/Usuarios', analistasRoutes);
    app.use('/AsisTec/Catalogos', catalogoRoutes);
    app.use('/AsisTec/MuestraALI', muestraAliRoutes);
    app.use('/AsisTec/ReporteTPA', reporteTPARoutes);
    app.use('/AsisTec/ReporteRAM', reporteRAMRoutes);
    app.use('/AsisTec/exportar', exportarRoutes);
    app.use('/AsisTec', uploadRoutes);

    // Global error handler — debe ir DESPUÉS de todas las rutas.
    // Express lo identifica como error handler por tener exactamente 4 parámetros.
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        logger.error('[GlobalErrorHandler]', { message: err.message, stack: err.stack });
        const status = err.status || err.statusCode || 500;
        // En producción nunca exponer detalles internos al cliente
        const mensaje = process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : (err.message || 'Error interno del servidor');
        res.status(status).json({ mensaje });
    });

    app.listen(port, () => {
    });
}).catch(err => {
    logger.error('No se pudo iniciar la aplicación', { message: err.message, stack: err.stack });
    process.exit(1);
});
