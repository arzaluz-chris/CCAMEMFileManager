// === ARCHIVO: backend/diagnose.js ===
// Diagnóstico completo de módulos

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de módulos del servidor\n');

function checkFile(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        return { exists: false, size: 0 };
    }
    const stats = fs.statSync(fullPath);
    return { exists: true, size: stats.size };
}

function checkExports(filePath) {
    try {
        const module = require(path.join(__dirname, filePath));
        return {
            loaded: true,
            type: typeof module,
            isRouter: module && module.name === 'router',
            hasExports: Object.keys(module).length > 0
        };
    } catch (error) {
        return {
            loaded: false,
            error: error.message
        };
    }
}

// Archivos a verificar
const files = [
    'routes/auth.js',
    'routes/expedientes.js',
    'controllers/authController.js',
    'controllers/expedientesController.js',
    'middleware/auth.js',
    'config/database.js'
];

console.log('📁 Verificación de archivos:\n');

files.forEach(file => {
    const fileInfo = checkFile(file);
    const exportInfo = checkExports(file);
    
    console.log(`${file}:`);
    console.log(`  Existe: ${fileInfo.exists ? '✅' : '❌'}`);
    console.log(`  Tamaño: ${fileInfo.size} bytes`);
    console.log(`  Se puede cargar: ${exportInfo.loaded ? '✅' : '❌'}`);
    
    if (exportInfo.loaded) {
        console.log(`  Tipo de export: ${exportInfo.type}`);
        console.log(`  Es router Express: ${exportInfo.isRouter ? '✅' : '❌'}`);
    } else {
        console.log(`  Error: ${exportInfo.error}`);
    }
    console.log('');
});

// Verificar contenido específico de routes/expedientes.js
console.log('\n📝 Verificando routes/expedientes.js específicamente:\n');

const expedientesPath = path.join(__dirname, 'routes/expedientes.js');
if (fs.existsSync(expedientesPath)) {
    const content = fs.readFileSync(expedientesPath, 'utf8');
    console.log('Primeras líneas del archivo:');
    console.log(content.split('\n').slice(0, 10).join('\n'));
    console.log('...\n');
    
    console.log('Verificaciones:');
    console.log(`  Importa express: ${content.includes("require('express')") ? '✅' : '❌'}`);
    console.log(`  Crea router: ${content.includes('express.Router()') ? '✅' : '❌'}`);
    console.log(`  Exporta router: ${content.includes('module.exports = router') ? '✅' : '❌'}`);
} else {
    console.log('❌ El archivo no existe!');
}