require('dotenv').config();
const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
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
    app.use('/AsisTec/Exportar', exportarRoutes);
    app.use('/AsisTec', uploadRoutes);

    app.listen(port, () => {
    });
}).catch(err => {
    console.error("No se pudo iniciar la aplicación debido a un error:", err); // Mostrar el error real
    process.exit(1);
});
