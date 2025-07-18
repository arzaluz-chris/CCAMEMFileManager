// === ARCHIVO: backend/test-utils.js ===
// Script para probar las utilidades del sistema

const helpers = require('./utils/helpers');
const validators = require('./utils/validators');

console.log('🧪 Probando utilidades del sistema CCAMEM\n');

async function probarHelpers() {
    console.log('📦 PROBANDO HELPERS\n');
    
    // Probar formateo de fechas
    console.log('1. Formateo de fechas:');
    const ahora = new Date();
    console.log('   Fecha normal:', helpers.formatearFecha(ahora));
    console.log('   Fecha con hora:', helpers.formatearFecha(ahora, true));
    console.log('   Fecha para archivo:', helpers.formatearFechaArchivo(ahora));
    
    // Probar generación de códigos
    console.log('\n2. Generación de códigos de expediente:');
    for (let i = 1; i <= 5; i++) {
        console.log('   ', helpers.generarCodigoExpediente('CCAMEM', 2025, i));
    }
    
    // Probar sanitización de archivos
    console.log('\n3. Sanitización de nombres de archivo:');
    const nombresArchivo = [
        'Documento Médico #1.pdf',
        'Reporte (versión final).docx',
        'Análisis-2025@CCAMEM.xlsx',
        'Fotografía médica ñoño.jpg'
    ];
    nombresArchivo.forEach(nombre => {
        console.log(`   "${nombre}" => "${helpers.sanitizarNombreArchivo(nombre)}"`);
    });
    
    // Probar formateo de tamaños
    console.log('\n4. Formateo de tamaños de archivo:');
    const tamaños = [512, 1024, 1048576, 5242880, 1073741824];
    tamaños.forEach(tamaño => {
        console.log(`   ${tamaño} bytes = ${helpers.formatearTamañoArchivo(tamaño)}`);
    });
    
    // Probar generación de contraseñas
    console.log('\n5. Generación de contraseñas aleatorias:');
    console.log('   Simple (8 chars):', helpers.generarContraseñaAleatoria(8));
    console.log('   Media (10 chars):', helpers.generarContraseñaAleatoria(10, {
        incluirMayusculas: true,
        incluirMinusculas: true,
        incluirNumeros: true
    }));
    console.log('   Compleja (12 chars):', helpers.generarContraseñaAleatoria(12, {
        incluirMayusculas: true,
        incluirMinusculas: true,
        incluirNumeros: true,
        incluirSimbolos: true
    }));
    
    // Probar formateo de teléfonos
    console.log('\n6. Formateo de teléfonos mexicanos:');
    const telefonos = ['7221234567', '527221234567', '1234567890', '521234567890'];
    telefonos.forEach(tel => {
        console.log(`   ${tel} => ${helpers.formatearTelefono(tel)}`);
    });
    
    // Probar capitalización
    console.log('\n7. Capitalización de texto:');
    const textos = [
        'juan pérez gonzález',
        'COMISIÓN DE CONCILIACIÓN Y ARBITRAJE',
        'unidad médica del estado'
    ];
    textos.forEach(texto => {
        console.log(`   "${texto}" => "${helpers.capitalizar(texto)}"`);
    });
    
    // Probar validación de CURP y RFC
    console.log('\n8. Validación de identificadores mexicanos:');
    console.log('   CURP válido (PEGJ850101HMCRNN01):', helpers.validarCURP('PEGJ850101HMCRNN01'));
    console.log('   CURP inválido (ABC123):', helpers.validarCURP('ABC123'));
    console.log('   RFC persona física (PEGJ850101ABC):', helpers.validarRFC('PEGJ850101ABC'));
    console.log('   RFC persona moral (ABC850101XYZ):', helpers.validarRFC('ABC850101XYZ'));
    
    // Probar paginación
    console.log('\n9. Cálculo de paginación:');
    const paginaciones = [
        { page: 1, limit: 10 },
        { page: 2, limit: 20 },
        { page: 5, limit: 50 }
    ];
    paginaciones.forEach(({ page, limit }) => {
        const calc = helpers.calcularPaginacion(page, limit);
        console.log(`   Página ${page}, ${limit} items:`, calc);
    });
    
    // Probar manejo de errores de BD
    console.log('\n10. Manejo de errores de base de datos:');
    const erroresDB = [
        { code: '23505', detail: 'Key (email)=(test@test.com) already exists.' },
        { code: '23503', detail: 'Foreign key violation' },
        { code: '23502', detail: 'Not null violation' }
    ];
    erroresDB.forEach(error => {
        console.log(`   Error ${error.code}:`, helpers.manejarErrorDB(error));
    });
}

async function probarValidators() {
    console.log('\n\n📋 PROBANDO VALIDATORS\n');
    
    // Probar validación de emails
    console.log('1. Validación de emails:');
    const emails = [
        'usuario@ccamem.gob.mx',
        'invalido@',
        '@invalido.com',
        'sin-arroba.com',
        ''
    ];
    emails.forEach(email => {
        const resultado = validators.validarEmail(email);
        console.log(`   "${email}":`, resultado.valido ? '✅ Válido' : `❌ ${resultado.mensaje}`);
    });
    
    // Probar validación de contraseñas
    console.log('\n2. Validación de contraseñas:');
    const passwords = [
        { pass: '123', opts: {} },
        { pass: 'abc123', opts: {} },
        { pass: 'Pass123!', opts: { 
            longitudMinima: 8, 
            requerirMayuscula: true,
            requerirNumero: true,
            requerirEspecial: true 
        }}
    ];
    passwords.forEach(({ pass, opts }) => {
        const resultado = validators.validarPassword(pass, opts);
        console.log(`   "${pass}":`, resultado.valido ? '✅ Válido' : `❌ ${resultado.mensaje}`);
    });
    
    // Probar validación de números de expediente
    console.log('\n3. Validación de números de expediente:');
    const expedientes = [
        'CCAMEM/0001/2025',
        'CCAMEM/9999/2025',
        'ccamem/0001/2025',
        'CCAMEM/1/2025',
        'INVALIDO'
    ];
    expedientes.forEach(num => {
        const resultado = validators.validarNumeroExpediente(num);
        console.log(`   "${num}":`, resultado.valido ? '✅ Válido' : `❌ ${resultado.mensaje}`);
    });
    
    // Probar validación de fechas
    console.log('\n4. Validación de fechas:');
    const fechasPrueba = [
        { fecha: new Date(), opts: { noFutura: true }, desc: 'Hoy (no futura)' },
        { fecha: '2030-01-01', opts: { noFutura: true }, desc: 'Futura (no permitida)' },
        { fecha: '2020-01-01', opts: { noPasada: true }, desc: 'Pasada (no permitida)' },
        { fecha: 'fecha-invalida', opts: {}, desc: 'Fecha inválida' }
    ];
    fechasPrueba.forEach(({ fecha, opts, desc }) => {
        const resultado = validators.validarFecha(fecha, opts);
        console.log(`   ${desc}:`, resultado.valido ? '✅ Válido' : `❌ ${resultado.mensaje}`);
    });
    
    // Probar validación de formulario completo
    console.log('\n5. Validación de formulario completo:');
    
    const formularioPrueba = {
        nombre: 'Juan Pérez García',
        email: 'juan.perez@ccamem.gob.mx',
        password: 'Secure123!',
        edad: 35,
        telefono: '7221234567',
        descripcion: 'Médico especialista en medicina interna'
    };
    
    const reglasPrueba = {
        nombre: {
            tipo: 'texto',
            opciones: {
                requerido: true,
                longitudMinima: 3,
                longitudMaxima: 100
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
                requerirNumero: true,
                requerirEspecial: true
            }
        },
        edad: {
            tipo: 'entero',
            opciones: {
                minimo: 18,
                maximo: 100
            }
        },
        telefono: {
            tipo: 'custom',
            validador: (valor) => {
                if (!valor || valor.length !== 10) {
                    return { valido: false, mensaje: 'El teléfono debe tener 10 dígitos' };
                }
                return { valido: true };
            }
        }
    };
    
    const resultadoFormulario = validators.validarFormulario(formularioPrueba, reglasPrueba);
    console.log('   Formulario válido:', resultadoFormulario.esValido ? '✅ Sí' : '❌ No');
    if (!resultadoFormulario.esValido) {
        console.log('   Errores:', resultadoFormulario.errores);
    }
    
    // Probar validación de archivos
    console.log('\n6. Validación de archivos:');
    const archivos = [
        {
            name: 'documento.pdf',
            size: 1048576, // 1MB
            mimetype: 'application/pdf'
        },
        {
            name: 'imagen.jpg',
            size: 15728640, // 15MB
            mimetype: 'image/jpeg'
        },
        {
            name: 'script.exe',
            size: 1024,
            mimetype: 'application/x-executable'
        }
    ];
    
    const opcionesArchivo = {
        tamañoMaximoMB: 10,
        tiposPermitidos: ['application/pdf', 'image/jpeg', 'image/png'],
        extensionesPermitidas: ['pdf', 'jpg', 'jpeg', 'png']
    };
    
    archivos.forEach(archivo => {
        const resultado = validators.validarArchivo(archivo, opcionesArchivo);
        console.log(`   ${archivo.name} (${helpers.formatearTamañoArchivo(archivo.size)}):`,
            resultado.valido ? '✅ Válido' : `❌ ${resultado.mensaje}`);
    });
    
    // Probar sanitización HTML
    console.log('\n7. Sanitización de HTML:');
    const textosPeligrosos = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'Texto normal & seguro',
        '"Comillas" y \'apostrofes\''
    ];
    textosPeligrosos.forEach(texto => {
        console.log(`   Original: ${texto}`);
        console.log(`   Sanitizado: ${validators.sanitizarHTML(texto)}`);
    });
}

// Función para crear directorio de prueba
async function probarCreacionDirectorio() {
    console.log('\n\n📁 PROBANDO CREACIÓN DE DIRECTORIOS\n');
    
    const rutaPrueba = './uploads/test/2025/01';
    console.log(`Intentando crear directorio: ${rutaPrueba}`);
    
    try {
        await helpers.crearDirectorioSiNoExiste(rutaPrueba);
        console.log('✅ Directorio creado o ya existía');
        
        // Limpiar directorio de prueba
        const fs = require('fs').promises;
        await fs.rmdir('./uploads/test/2025/01');
        await fs.rmdir('./uploads/test/2025');
        await fs.rmdir('./uploads/test');
        console.log('✅ Directorio de prueba eliminado');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Ejecutar todas las pruebas
async function ejecutarPruebas() {
    try {
        await probarHelpers();
        await probarValidators();
        await probarCreacionDirectorio();
        
        console.log('\n\n✅ Todas las pruebas completadas exitosamente!');
    } catch (error) {
        console.error('\n\n❌ Error durante las pruebas:', error);
    }
}

// Ejecutar
ejecutarPruebas();