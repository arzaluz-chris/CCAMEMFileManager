// === ARCHIVO: backend/check-config.js ===
// Script para verificar que todos los archivos necesarios existen

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del servidor...\n');

// Archivos que deben existir
const requiredFiles = [
    'server.js',
    'controllers/authController.js',
    'controllers/expedientesController.js',
    'routes/auth.js',
    'routes/expedientes.js',
    'middleware/auth.js',
    'config/database.js'
];

let allFilesExist = true;

console.log('📁 Verificando archivos requeridos:');
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ Faltan archivos necesarios');
    process.exit(1);
}

console.log('\n📝 Verificando contenido de server.js...');

try {
    const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    
    // Verificar imports
    const hasExpedientesImport = serverContent.includes("require('./routes/expedientes')") && 
                                !serverContent.includes("// const expedientesRoutes");
    
    // Verificar uso de rutas
    const hasExpedientesRoute = serverContent.includes("app.use('/api/expedientes', expedientesRoutes)") &&
                               !serverContent.includes("// app.use('/api/expedientes'");
    
    console.log(`${hasExpedientesImport ? '✅' : '❌'} Import de rutas de expedientes`);
    console.log(`${hasExpedientesRoute ? '✅' : '❌'} Uso de rutas de expedientes`);
    
    if (!hasExpedientesImport || !hasExpedientesRoute) {
        console.log('\n⚠️  Las rutas de expedientes están comentadas o no existen en server.js');
        console.log('📝 Debes descomentar estas líneas en server.js:');
        console.log("   const expedientesRoutes = require('./routes/expedientes');");
        console.log("   app.use('/api/expedientes', expedientesRoutes);");
    }
    
} catch (error) {
    console.error('❌ Error al leer server.js:', error.message);
}

console.log('\n✅ Verificación completada');