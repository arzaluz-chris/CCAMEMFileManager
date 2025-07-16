// === ARCHIVO: backend/server.js ===
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Importar la configuración de base de datos
const { pool } = require('./config/database');

// Importar todas las rutas
const authRoutes = require('./routes/auth');
const expedientesRoutes = require('./routes/expedientes');
const catalogoRoutes = require('./routes/catalogo');
const reportesRoutes = require('./routes/reportes');
const uploadsRoutes = require('./routes/uploads');
const siserRoutes = require('./routes/siser');

// Crear aplicación Express
const app = express();

// Configurar puerto
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Servir archivos estáticos (para los documentos digitalizados)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de prueba
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a base de datos
        const result = await pool.query('SELECT NOW()');
        
        res.json({ 
            status: 'OK', 
            message: 'Servidor CCAMEM funcionando correctamente',
            version: '1.0.0',
            timestamp: new Date(),
            database: 'Conectado',
            dbTime: result.rows[0].now,
            features: {
                auth: true,
                expedientes: true,
                catalogo: true,
                reportes: true,
                uploads: true,
                siser: true
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Servidor funcionando pero hay problemas con la base de datos',
            error: error.message
        });
    }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/expedientes', expedientesRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/siser', siserRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Error de Multer (archivos)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'El archivo es demasiado grande. Máximo 10MB.'
            });
        }
    }
    
    res.status(500).json({
        error: 'Algo salió mal!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`
    🚀 Servidor CCAMEM iniciado
    📁 Sistema de Gestión de Archivos
    🌐 Puerto: ${PORT}
    🔗 URL: http://localhost:${PORT}
    
    📊 Endpoints disponibles:
    ├── 🔑 Auth: /api/auth
    ├── 📂 Expedientes: /api/expedientes
    ├── 📚 Catálogo: /api/catalogo
    ├── 📈 Reportes: /api/reportes
    ├── 📤 Uploads: /api/uploads
    └── 🤖 SISER: /api/siser
    
    💡 Health Check: http://localhost:${PORT}/api/health
    `);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        pool.end(() => {
            console.log('Conexiones a base de datos cerradas');
            process.exit(0);
        });
    });
});

module.exports = app;