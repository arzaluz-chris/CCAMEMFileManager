// === ARCHIVO: backend/ejemplos/ejemplo-utils.js ===
// Ejemplos de cómo usar los helpers y validators en el sistema

const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

// ===== EJEMPLOS DE HELPERS =====

console.log('🔧 EJEMPLOS DE HELPERS\n');

// 1. Formatear fechas
console.log('1. Formatear fechas:');
const fecha = new Date();
console.log('   Normal:', helpers.formatearFecha(fecha));
console.log('   Con hora:', helpers.formatearFecha(fecha, true));
console.log('   Para archivo:', helpers.formatearFechaArchivo(fecha));
console.log('');

// 2. Generar código de expediente
console.log('2. Generar códigos de expediente:');
console.log('   ', helpers.generarCodigoExpediente('CCAMEM', 2025, 1));
console.log('   ', helpers.generarCodigoExpediente('CCAMEM', 2025, 123));
console.log('   ', helpers.generarCodigoExpediente('CCAMEM', 2025, 9999));
console.log('');

// 3. Sanitizar nombres de archivo
console.log('3. Sanitizar nombres de archivo:');
console.log('   Original: "Documento Médico #1 (versión 2).pdf"');
console.log('   Sanitizado:', helpers.sanitizarNombreArchivo('Documento Médico #1 (versión 2).pdf'));
console.log('');

// 4. Formatear tamaños de archivo
console.log('4. Formatear tamaños:');
console.log('   1024 bytes =', helpers.formatearTamañoArchivo(1024));
console.log('   1048576 bytes =', helpers.formatearTamañoArchivo(1048576));
console.log('   5242880 bytes =', helpers.formatearTamañoArchivo(5242880));
console.log('');

// 5. Generar contraseña aleatoria
console.log('5. Generar contraseñas:');
console.log('   Simple:', helpers.generarContraseñaAleatoria(8));
console.log('   Compleja:', helpers.generarContraseñaAleatoria(12, {
    incluirMayusculas: true,
    incluirMinusculas: true,
    incluirNumeros: true,
    incluirSimbolos: true
}));
console.log('');

// 6. Formatear teléfonos
console.log('6. Formatear teléfonos:');
console.log('   7221234567 =>', helpers.formatearTelefono('7221234567'));
console.log('   527221234567 =>', helpers.formatearTelefono('527221234567'));
console.log('');

// 7. Capitalizar texto
console.log('7. Capitalizar texto:');
console.log('   ', helpers.capitalizar('juan pérez gonzález'));
console.log('   ', helpers.capitalizar('COMISIÓN DE CONCILIACIÓN'));
console.log('');

// 8. Paginación
console.log('8. Cálculo de paginación:');
const paginacion = helpers.calcularPaginacion(2, 10);
console.log('   Página 2, 10 items:', paginacion);
console.log('');

// ===== EJEMPLOS DE VALIDATORS =====

console.log('\n🔍 EJEMPLOS DE VALIDATORS\n');

// 1. Validar emails
console.log('1. Validar emails:');
console.log('   usuario@ccamem.gob.mx:', validators.validarEmail('usuario@ccamem.gob.mx'));
console.log('   email-invalido:', validators.validarEmail('email-invalido'));
console.log('   (vacío):', validators.validarEmail(''));
console.log('');

// 2. Validar contraseñas
console.log('2. Validar contraseñas:');
console.log('   "123":', validators.validarPassword('123'));
console.log('   "password123":', validators.validarPassword('password123'));
console.log('   "Pass123!" (compleja):', validators.validarPassword('Pass123!', {
    longitudMinima: 8,
    requerirMayuscula: true,
    requerirMinuscula: true,
    requerirNumero: true,
    requerirEspecial: true
}));
console.log('');

// 3. Validar fechas
console.log('3. Validar fechas:');
console.log('   Fecha futura:', validators.validarFecha('2030-01-01', { noFutura: true }));
console.log('   Fecha pasada:', validators.validarFecha('2020-01-01', { noPasada: true }));
console.log('   Fecha válida:', validators.validarFecha(new Date()));
console.log('');

// 4. Validar formulario completo
console.log('4. Validar formulario de usuario:');
const datosUsuario = {
    nombre: 'Juan Pérez',
    email: 'juan@ccamem.gob.mx',
    password: 'Pass123!',
    edad: 25,
    telefono: '7221234567'
};

const reglasUsuario = {
    nombre: {
        tipo: 'texto',
        opciones: {
            requerido: true,
            longitudMinima: 3,
            longitudMaxima: 100,
            soloLetras: true
        }
    },
    email: {
        tipo: 'email'
    },
    password: {
        tipo: 'password',
        opciones: {
            longitudMinima: 8,
            requerirMayuscula: true,
            requerirNumero: true
        }
    },
    edad: {
        tipo: 'entero',
        opciones: {
            minimo: 18,
            maximo: 100
        }
    }
};

const resultadoFormulario = validators.validarFormulario(datosUsuario, reglasUsuario);
console.log('   Resultado:', resultadoFormulario);
console.log('');

// 5. Validar CURP y RFC
console.log('5. Validar identificadores mexicanos:');
console.log('   CURP válido:', helpers.validarCURP('PEGJ850101HMCRNN01'));
console.log('   CURP inválido:', helpers.validarCURP('ABC123'));
console.log('   RFC persona física:', helpers.validarRFC('PEGJ850101ABC'));
console.log('   RFC persona moral:', helpers.validarRFC('ABC850101XYZ'));
console.log('');

// ===== EJEMPLO DE USO EN CONTROLADOR =====

console.log('\n📝 EJEMPLO DE USO EN UN CONTROLADOR\n');

// Simulación de un controlador de expedientes
async function crearExpediente(req, res) {
    try {
        // 1. Validar datos de entrada
        const reglas = {
            nombre: {
                tipo: 'texto',
                opciones: { requerido: true, longitudMinima: 5 }
            },
            fecha_apertura: {
                tipo: 'fecha',
                opciones: { noFutura: true }
            },
            area_id: {
                tipo: 'entero',
                opciones: { requerido: true, positivo: true }
            }
        };
        
        const validacion = validators.validarFormulario(req.body, reglas);
        if (!validacion.esValido) {
            return res.status(400).json({
                success: false,
                errores: validacion.errores
            });
        }
        
        // 2. Generar código de expediente
        const año = new Date().getFullYear();
        const consecutivo = 123; // Normalmente vendría de la BD
        const codigo = helpers.generarCodigoExpediente('CCAMEM', año, consecutivo);
        
        // 3. Sanitizar nombre para archivo
        const nombreArchivo = helpers.sanitizarNombreArchivo(req.body.nombre);
        
        // 4. Crear respuesta paginada
        const expedientes = []; // Normalmente vendría de la BD
        const respuesta = helpers.construirRespuestaPaginada(
            expedientes,
            100, // total
            1,   // página
            10   // límite
        );
        
        console.log('Código generado:', codigo);
        console.log('Nombre archivo:', nombreArchivo);
        console.log('Respuesta:', respuesta);
        
    } catch (error) {
        // 5. Manejar errores de BD
        const mensajeError = helpers.manejarErrorDB(error);
        console.log('Error manejado:', mensajeError);
    }
}

// Ejecutar ejemplo
crearExpediente(
    { body: { nombre: 'Expediente de prueba', fecha_apertura: new Date(), area_id: 1 } },
    { status: () => ({ json: () => {} }) }
);

console.log('\n✅ Ejemplos completados!');