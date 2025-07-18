// === ARCHIVO: backend/utils/helpers.js ===
// Funciones de utilidad general para el sistema CCAMEM

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Formatear fecha a formato legible en español
 * @param {Date|string} fecha - Fecha a formatear
 * @param {boolean} incluirHora - Si incluir la hora o no
 * @returns {string} Fecha formateada
 */
const formatearFecha = (fecha, incluirHora = false) => {
    if (!fecha) return '';
    
    const fechaObj = new Date(fecha);
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Mexico_City'
    };
    
    if (incluirHora) {
        opciones.hour = '2-digit';
        opciones.minute = '2-digit';
    }
    
    return fechaObj.toLocaleDateString('es-MX', opciones);
};

/**
 * Formatear fecha para nombres de archivo (YYYYMMDD)
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
const formatearFechaArchivo = (fecha = new Date()) => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}${mes}${dia}`;
};

/**
 * Generar un código único para expedientes
 * @param {string} prefijo - Prefijo del código (ej: 'CCAMEM')
 * @param {number} año - Año del expediente
 * @param {number} consecutivo - Número consecutivo
 * @returns {string} Código generado
 */
const generarCodigoExpediente = (prefijo = 'CCAMEM', año = new Date().getFullYear(), consecutivo = 1) => {
    const consecutivoFormateado = String(consecutivo).padStart(4, '0');
    return `${prefijo}/${consecutivoFormateado}/${año}`;
};

/**
 * Sanitizar nombre de archivo (remover caracteres especiales)
 * @param {string} nombreArchivo - Nombre original del archivo
 * @returns {string} Nombre sanitizado
 */
const sanitizarNombreArchivo = (nombreArchivo) => {
    // Obtener la extensión
    const extension = path.extname(nombreArchivo);
    const nombreSinExtension = path.basename(nombreArchivo, extension);
    
    // Reemplazar caracteres especiales
    const nombreLimpio = nombreSinExtension
        .normalize('NFD') // Descomponer caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Reemplazar caracteres especiales con _
        .replace(/_+/g, '_') // Reemplazar múltiples _ con uno solo
        .trim();
    
    // Agregar timestamp para evitar duplicados
    const timestamp = Date.now();
    
    return `${nombreLimpio}_${timestamp}${extension}`;
};

/**
 * Generar un hash único para un archivo
 * @param {Buffer|string} contenido - Contenido del archivo
 * @returns {string} Hash SHA256
 */
const generarHashArchivo = (contenido) => {
    return crypto
        .createHash('sha256')
        .update(contenido)
        .digest('hex');
};

/**
 * Convertir bytes a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @param {number} decimales - Número de decimales
 * @returns {string} Tamaño formateado
 */
const formatearTamañoArchivo = (bytes, decimales = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimales < 0 ? 0 : decimales;
    const tamaños = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + tamaños[i];
};

/**
 * Crear estructura de directorios si no existe
 * @param {string} rutaDirectorio - Ruta del directorio a crear
 * @returns {Promise<void>}
 */
const crearDirectorioSiNoExiste = async (rutaDirectorio) => {
    try {
        await fs.access(rutaDirectorio);
    } catch (error) {
        // El directorio no existe, crearlo
        await fs.mkdir(rutaDirectorio, { recursive: true });
        console.log(`📁 Directorio creado: ${rutaDirectorio}`);
    }
};

/**
 * Paginar resultados
 * @param {number} page - Número de página (empieza en 1)
 * @param {number} limit - Elementos por página
 * @returns {Object} Offset y limit para la consulta
 */
const calcularPaginacion = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Máximo 100 por página
    const offset = (pageNum - 1) * limitNum;
    
    return {
        offset,
        limit: limitNum,
        page: pageNum
    };
};

/**
 * Construir respuesta de paginación
 * @param {Array} data - Datos a paginar
 * @param {number} totalItems - Total de elementos
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @returns {Object} Respuesta formateada
 */
const construirRespuestaPaginada = (data, totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
        success: true,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems: parseInt(totalItems),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

/**
 * Generar contraseña aleatoria segura
 * @param {number} longitud - Longitud de la contraseña
 * @param {Object} opciones - Opciones de generación
 * @returns {string} Contraseña generada
 */
const generarContraseñaAleatoria = (longitud = 12, opciones = {}) => {
    const {
        incluirMayusculas = true,
        incluirMinusculas = true,
        incluirNumeros = true,
        incluirSimbolos = true
    } = opciones;
    
    let caracteres = '';
    if (incluirMayusculas) caracteres += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (incluirMinusculas) caracteres += 'abcdefghijklmnopqrstuvwxyz';
    if (incluirNumeros) caracteres += '0123456789';
    if (incluirSimbolos) caracteres += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!caracteres) {
        throw new Error('Debe incluir al menos un tipo de caracter');
    }
    
    let contraseña = '';
    for (let i = 0; i < longitud; i++) {
        const indiceAleatorio = crypto.randomInt(0, caracteres.length);
        contraseña += caracteres[indiceAleatorio];
    }
    
    return contraseña;
};

/**
 * Limpiar y formatear número de teléfono mexicano
 * @param {string} telefono - Número de teléfono
 * @returns {string} Teléfono formateado
 */
const formatearTelefono = (telefono) => {
    if (!telefono) return '';
    
    // Remover todo excepto números
    const numeroLimpio = telefono.replace(/\D/g, '');
    
    // Si es número mexicano de 10 dígitos
    if (numeroLimpio.length === 10) {
        return numeroLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    // Si incluye código de país (52 para México)
    if (numeroLimpio.length === 12 && numeroLimpio.startsWith('52')) {
        const sinCodigo = numeroLimpio.substring(2);
        return '+52 ' + sinCodigo.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    return telefono; // Devolver original si no coincide con formato esperado
};

/**
 * Capitalizar texto (primera letra mayúscula de cada palabra)
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
const capitalizar = (texto) => {
    if (!texto) return '';
    
    return texto
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
};

/**
 * Validar CURP mexicano
 * @param {string} curp - CURP a validar
 * @returns {boolean} Si es válido o no
 */
const validarCURP = (curp) => {
    if (!curp) return false;
    
    // Expresión regular para CURP
    const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    return regex.test(curp.toUpperCase());
};

/**
 * Validar RFC mexicano
 * @param {string} rfc - RFC a validar
 * @returns {boolean} Si es válido o no
 */
const validarRFC = (rfc) => {
    if (!rfc) return false;
    
    // Expresión regular para RFC de persona física o moral
    const regexFisica = /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/;
    const regexMoral = /^[A-Z]{3}\d{6}[A-Z0-9]{3}$/;
    
    const rfcUpper = rfc.toUpperCase();
    return regexFisica.test(rfcUpper) || regexMoral.test(rfcUpper);
};

/**
 * Obtener el tipo MIME de un archivo por su extensión
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} Tipo MIME
 */
const obtenerTipoMIME = (nombreArchivo) => {
    const extension = path.extname(nombreArchivo).toLowerCase();
    
    const tipos = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed'
    };
    
    return tipos[extension] || 'application/octet-stream';
};

/**
 * Calcular edad a partir de fecha de nacimiento
 * @param {Date|string} fechaNacimiento - Fecha de nacimiento
 * @returns {number} Edad en años
 */
const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
};

/**
 * Generar un slug a partir de un texto
 * @param {string} texto - Texto a convertir
 * @returns {string} Slug generado
 */
const generarSlug = (texto) => {
    return texto
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con -
        .replace(/^-+|-+$/g, '') // Remover - al inicio y final
        .substring(0, 50); // Limitar longitud
};

/**
 * Esperar un tiempo determinado (útil para pruebas y delays)
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
const esperar = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Manejar errores de base de datos y devolver mensajes amigables
 * @param {Error} error - Error de la base de datos
 * @returns {string} Mensaje de error amigable
 */
const manejarErrorDB = (error) => {
    // Error de llave duplicada
    if (error.code === '23505') {
        const campo = error.detail.match(/\(([^)]+)\)/);
        if (campo) {
            return `Ya existe un registro con ese ${campo[1]}`;
        }
        return 'Ya existe un registro con esos datos';
    }
    
    // Error de llave foránea
    if (error.code === '23503') {
        return 'No se puede realizar la operación porque el registro está relacionado con otros datos';
    }
    
    // Error de violación de restricción
    if (error.code === '23502') {
        return 'Faltan datos requeridos';
    }
    
    // Error genérico
    return 'Error en la operación de base de datos';
};

// Exportar todas las funciones
module.exports = {
    formatearFecha,
    formatearFechaArchivo,
    generarCodigoExpediente,
    sanitizarNombreArchivo,
    generarHashArchivo,
    formatearTamañoArchivo,
    crearDirectorioSiNoExiste,
    calcularPaginacion,
    construirRespuestaPaginada,
    generarContraseñaAleatoria,
    formatearTelefono,
    capitalizar,
    validarCURP,
    validarRFC,
    obtenerTipoMIME,
    calcularEdad,
    generarSlug,
    esperar,
    manejarErrorDB
};