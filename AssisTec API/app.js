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
const saureusRoutes = require('./src/routes/saureus.routes');
const saureusCalculationRoutes = require('./src/routes/saureus-calculation.routes');
const coliformesRoutes = require('./src/routes/coliformes.routes');
const salmonellaRoutes = require('./src/routes/salmonella.routes');
const enterobacteriasRoutes = require('./src/routes/enterobacterias.routes');
const muestraAliRoutes = require('./src/routes/muestraAli.routes');
const mediosCultivosRoutes = require('./src/routes/maestras/medios-cultivos.route');

app.use('/api/auth', authRoutes);
app.use('/api/solicitud', solicitudRoutes);
app.use('/api/solicitud/:id/muestra', muestraRoutes);
app.use('/api/muestra/:id/analisis', analisisRoutes);
app.use('/api/solicitud/:id/generar', reporteRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/formulario/sau', saureusRoutes);
app.use('/api/saureus', saureusCalculationRoutes);
app.use('/api/formulario/coli', coliformesRoutes);
app.use('/api/formulario/sal', salmonellaRoutes);
app.use('/api/formulario/ent', enterobacteriasRoutes);
app.use('/api/MuestraALI', muestraAliRoutes);
app.use('/api/maestras/medios-cultivos', mediosCultivosRoutes);

// Ruta de health check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'AssisTec API is running' });
});

// Manejo de errores global
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 AssisTec API corriendo en puerto ${PORT}`);
    });
}

module.exports = app;
