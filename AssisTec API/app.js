require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const authRoutes = require('./src/routes/auth.routes');
const solicitudRoutes = require('./src/routes/solicitud.routes');
const muestraRoutes = require('./src/routes/muestra.routes');
const analisisRoutes = require('./src/routes/analisis.routes');
const reporteRoutes = require('./src/routes/reporte.routes');
const catalogoRoutes = require('./src/routes/catalogo.routes');

app.use('/api/auth', authRoutes);
app.use('/api/solicitud', solicitudRoutes);
app.use('/api/solicitud/:id/muestra', muestraRoutes);
app.use('/api/muestra/:id/analisis', analisisRoutes);
app.use('/api/solicitud/:id/generar', reporteRoutes);
app.use('/api/catalogo', catalogoRoutes);

// Ruta de health check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'AssisTec API is running' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: err.message });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 AssisTec API corriendo en puerto ${PORT}`);
    });
}

module.exports = app;
