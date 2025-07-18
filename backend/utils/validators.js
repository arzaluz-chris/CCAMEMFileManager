// === ARCHIVO: backend/utils/validators.js ===
// Funciones de validación para el sistema CCAMEM

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {Object} Resultado de validación
 */
const validarEmail = (email) => {
    if (!email) {
        return { valido: false, mensaje: 'El email es requerido' };
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { valido: false, mensaje: 'El formato del email no es válido' };
    }
    
    // Validar longitud
    if (email.length > 100) {
        return { valido: false, mensaje: 'El email es demasiado largo (máximo 100 caracteres)' };
    }
    
    return { valido: true };
};

/**
 * Validar contraseña segura
 * @param {string} password - Contraseña a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarPassword = (password, opciones = {}) => {
    const {
        longitudMinima = 6,
        requerirMayuscula = false,
        requerirMinuscula = false,
        requerirNumero = false,
        requerirEspecial = false
    } = opciones;
    
    if (!password) {
        return { valido: false, mensaje: 'La contraseña es requerida' };
    }
    
    if (password.length < longitudMinima) {
        return { valido: false, mensaje: `La contraseña debe tener al menos ${longitudMinima} caracteres` };
    }
    
    if (requerirMayuscula && !/[A-Z]/.test(password)) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos una mayúscula' };
    }
    
    if (requerirMinuscula && !/[a-z]/.test(password)) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos una minúscula' };
    }
    
    if (requerirNumero && !/\d/.test(password)) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos un número' };
    }
    
    if (requerirEspecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valido: false, mensaje: 'La contraseña debe contener al menos un caracter especial' };
    }
    
    return { valido: true };
};

/**
 * Validar número de expediente
 * @param {string} numeroExpediente - Número a validar
 * @returns {Object} Resultado de validación
 */
const validarNumeroExpediente = (numeroExpediente) => {
    if (!numeroExpediente) {
        return { valido: false, mensaje: 'El número de expediente es requerido' };
    }
    
    // Formato esperado: CCAMEM/0001/2025
    const regex = /^[A-Z]+\/\d{4}\/\d{4}$/;
    if (!regex.test(numeroExpediente)) {
        return { valido: false, mensaje: 'El formato del expediente debe ser: CCAMEM/0001/2025' };
    }
    
    return { valido: true };
};

/**
 * Validar fecha
 * @param {string|Date} fecha - Fecha a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarFecha = (fecha, opciones = {}) => {
    const {
        requerida = true,
        noFutura = false,
        noPasada = false,
        fechaMinima = null,
        fechaMaxima = null
    } = opciones;
    
    if (!fecha && requerida) {
        return { valido: false, mensaje: 'La fecha es requerida' };
    }
    
    if (!fecha && !requerida) {
        return { valido: true };
    }
    
    const fechaObj = new Date(fecha);
    
    // Verificar si es una fecha válida
    if (isNaN(fechaObj.getTime())) {
        return { valido: false, mensaje: 'La fecha no es válida' };
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (noFutura && fechaObj > hoy) {
        return { valido: false, mensaje: 'La fecha no puede ser futura' };
    }
    
    if (noPasada && fechaObj < hoy) {
        return { valido: false, mensaje: 'La fecha no puede ser pasada' };
    }
    
    if (fechaMinima) {
        const minima = new Date(fechaMinima);
        if (fechaObj < minima) {
            return { valido: false, mensaje: `La fecha debe ser posterior a ${minima.toLocaleDateString('es-MX')}` };
        }
    }
    
    if (fechaMaxima) {
        const maxima = new Date(fechaMaxima);
        if (fechaObj > maxima) {
            return { valido: false, mensaje: `La fecha debe ser anterior a ${maxima.toLocaleDateString('es-MX')}` };
        }
    }
    
    return { valido: true };
};

/**
 * Validar número entero
 * @param {any} valor - Valor a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarEntero = (valor, opciones = {}) => {
    const {
        requerido = true,
        minimo = null,
        maximo = null,
        positivo = false
    } = opciones;
    
    if ((valor === null || valor === undefined || valor === '') && requerido) {
        return { valido: false, mensaje: 'El valor es requerido' };
    }
    
    if (!requerido && (valor === null || valor === undefined || valor === '')) {
        return { valido: true };
    }
    
    const numero = Number(valor);
    
    if (!Number.isInteger(numero)) {
        return { valido: false, mensaje: 'El valor debe ser un número entero' };
    }
    
    if (positivo && numero < 0) {
        return { valido: false, mensaje: 'El valor debe ser positivo' };
    }
    
    if (minimo !== null && numero < minimo) {
        return { valido: false, mensaje: `El valor mínimo es ${minimo}` };
    }
    
    if (maximo !== null && numero > maximo) {
        return { valido: false, mensaje: `El valor máximo es ${maximo}` };
    }
    
    return { valido: true };
};

/**
 * Validar texto
 * @param {string} texto - Texto a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarTexto = (texto, opciones = {}) => {
    const {
        requerido = true,
        longitudMinima = null,
        longitudMaxima = null,
        soloLetras = false,
        soloAlfanumerico = false,
        sinEspacios = false
    } = opciones;
    
    if ((!texto || texto.trim() === '') && requerido) {
        return { valido: false, mensaje: 'El texto es requerido' };
    }
    
    if (!requerido && (!texto || texto.trim() === '')) {
        return { valido: true };
    }
    
    const textoLimpio = texto.trim();
    
    if (longitudMinima && textoLimpio.length < longitudMinima) {
        return { valido: false, mensaje: `El texto debe tener al menos ${longitudMinima} caracteres` };
    }
    
    if (longitudMaxima && textoLimpio.length > longitudMaxima) {
        return { valido: false, mensaje: `El texto no puede exceder ${longitudMaxima} caracteres` };
    }
    
    if (soloLetras && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(textoLimpio)) {
        return { valido: false, mensaje: 'El texto solo puede contener letras' };
    }
    
    if (soloAlfanumerico && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(textoLimpio)) {
        return { valido: false, mensaje: 'El texto solo puede contener letras y números' };
    }
    
    if (sinEspacios && /\s/.test(textoLimpio)) {
        return { valido: false, mensaje: 'El texto no puede contener espacios' };
    }
    
    return { valido: true };
};

/**
 * Validar archivo
 * @param {Object} archivo - Objeto de archivo (con name, size, mimetype)
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarArchivo = (archivo, opciones = {}) => {
    const {
        requerido = true,
        tamañoMaximoMB = 10,
        tiposPermitidos = [],
        extensionesPermitidas = []
    } = opciones;
    
    if (!archivo && requerido) {
        return { valido: false, mensaje: 'El archivo es requerido' };
    }
    
    if (!archivo && !requerido) {
        return { valido: true };
    }
    
    // Validar tamaño
    const tamañoMaximoBytes = tamañoMaximoMB * 1024 * 1024;
    if (archivo.size > tamañoMaximoBytes) {
        return { valido: false, mensaje: `El archivo no puede exceder ${tamañoMaximoMB}MB` };
    }
    
    // Validar tipo MIME
    if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(archivo.mimetype)) {
        return { valido: false, mensaje: 'El tipo de archivo no está permitido' };
    }
    
    // Validar extensión
    if (extensionesPermitidas.length > 0) {
        const extension = archivo.name.split('.').pop().toLowerCase();
        if (!extensionesPermitidas.includes(extension)) {
            return { 
                valido: false, 
                mensaje: `Solo se permiten archivos: ${extensionesPermitidas.join(', ')}` 
            };
        }
    }
    
    return { valido: true };
};

/**
 * Validar conjunto de datos (útil para formularios)
 * @param {Object} datos - Objeto con datos a validar
 * @param {Object} reglas - Reglas de validación para cada campo
 * @returns {Object} Resultado con errores por campo
 */
const validarFormulario = (datos, reglas) => {
    const errores = {};
    let esValido = true;
    
    for (const campo in reglas) {
        const valor = datos[campo];
        const regla = reglas[campo];
        
        let resultado = { valido: true };
        
        // Determinar qué validador usar según el tipo
        switch (regla.tipo) {
            case 'email':
                resultado = validarEmail(valor);
                break;
                
            case 'password':
                resultado = validarPassword(valor, regla.opciones);
                break;
                
            case 'texto':
                resultado = validarTexto(valor, regla.opciones);
                break;
                
            case 'entero':
                resultado = validarEntero(valor, regla.opciones);
                break;
                
            case 'fecha':
                resultado = validarFecha(valor, regla.opciones);
                break;
                
            case 'archivo':
                resultado = validarArchivo(valor, regla.opciones);
                break;
                
            case 'custom':
                if (regla.validador && typeof regla.validador === 'function') {
                    resultado = regla.validador(valor, datos);
                }
                break;
                
            default:
                console.warn(`Tipo de validación no reconocido: ${regla.tipo}`);
        }
        
        if (!resultado.valido) {
            errores[campo] = resultado.mensaje;
            esValido = false;
        }
    }
    
    return {
        esValido,
        errores
    };
};

/**
 * Validar array
 * @param {Array} array - Array a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarArray = (array, opciones = {}) => {
    const {
        requerido = true,
        minimoElementos = null,
        maximoElementos = null,
        elementosUnicos = false,
        validadorElemento = null
    } = opciones;
    
    if (!Array.isArray(array) && requerido) {
        return { valido: false, mensaje: 'Se esperaba un arreglo' };
    }
    
    if (!array && !requerido) {
        return { valido: true };
    }
    
    if (minimoElementos !== null && array.length < minimoElementos) {
        return { valido: false, mensaje: `Se requieren al menos ${minimoElementos} elementos` };
    }
    
    if (maximoElementos !== null && array.length > maximoElementos) {
        return { valido: false, mensaje: `No se permiten más de ${maximoElementos} elementos` };
    }
    
    if (elementosUnicos) {
        const conjunto = new Set(array);
        if (conjunto.size !== array.length) {
            return { valido: false, mensaje: 'Los elementos deben ser únicos' };
        }
    }
    
    if (validadorElemento && typeof validadorElemento === 'function') {
        for (let i = 0; i < array.length; i++) {
            const resultado = validadorElemento(array[i], i);
            if (!resultado.valido) {
                return { 
                    valido: false, 
                    mensaje: `Error en elemento ${i + 1}: ${resultado.mensaje}` 
                };
            }
        }
    }
    
    return { valido: true };
};

/**
 * Validar código postal mexicano
 * @param {string} codigoPostal - Código postal a validar
 * @returns {Object} Resultado de validación
 */
const validarCodigoPostal = (codigoPostal) => {
    if (!codigoPostal) {
        return { valido: false, mensaje: 'El código postal es requerido' };
    }
    
    // México usa códigos postales de 5 dígitos
    const regex = /^\d{5}$/;
    if (!regex.test(codigoPostal)) {
        return { valido: false, mensaje: 'El código postal debe tener 5 dígitos' };
    }
    
    return { valido: true };
};

/**
 * Validar URL
 * @param {string} url - URL a validar
 * @param {Object} opciones - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validarURL = (url, opciones = {}) => {
    const {
        requerida = true,
        protocolosPermitidos = ['http', 'https']
    } = opciones;
    
    if (!url && requerida) {
        return { valido: false, mensaje: 'La URL es requerida' };
    }
    
    if (!url && !requerida) {
        return { valido: true };
    }
    
    try {
        const urlObj = new URL(url);
        
        if (!protocolosPermitidos.includes(urlObj.protocol.replace(':', ''))) {
            return { 
                valido: false, 
                mensaje: `Solo se permiten los protocolos: ${protocolosPermitidos.join(', ')}` 
            };
        }
        
        return { valido: true };
    } catch (error) {
        return { valido: false, mensaje: 'La URL no es válida' };
    }
};

/**
 * Sanitizar entrada de usuario (prevenir XSS)
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
const sanitizarHTML = (texto) => {
    if (!texto) return '';
    
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validar campos requeridos en un objeto
 * @param {Object} objeto - Objeto a validar
 * @param {Array<string>} camposRequeridos - Lista de campos requeridos
 * @returns {Object} Resultado de validación
 */
const validarCamposRequeridos = (objeto, camposRequeridos) => {
    const camposFaltantes = [];
    
    for (const campo of camposRequeridos) {
        if (!objeto[campo] || (typeof objeto[campo] === 'string' && objeto[campo].trim() === '')) {
            camposFaltantes.push(campo);
        }
    }
    
    if (camposFaltantes.length > 0) {
        return {
            valido: false,
            mensaje: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`,
            camposFaltantes
        };
    }
    
    return { valido: true };
};

/**
 * Validar que un valor esté en una lista de opciones
 * @param {any} valor - Valor a validar
 * @param {Array} opcionesValidas - Lista de opciones válidas
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} Resultado de validación
 */
const validarOpcion = (valor, opcionesValidas, opciones = {}) => {
    const { requerido = true, nombreCampo = 'valor' } = opciones;
    
    if (!valor && requerido) {
        return { valido: false, mensaje: `El ${nombreCampo} es requerido` };
    }
    
    if (!valor && !requerido) {
        return { valido: true };
    }
    
    if (!opcionesValidas.includes(valor)) {
        return {
            valido: false,
            mensaje: `El ${nombreCampo} debe ser uno de: ${opcionesValidas.join(', ')}`
        };
    }
    
    return { valido: true };
};

/**
 * Middleware de Express para validar request
 * @param {Object} reglas - Reglas de validación
 * @returns {Function} Middleware de Express
 */
const validarRequest = (reglas) => {
    return (req, res, next) => {
        const resultado = validarFormulario(req.body, reglas);
        
        if (!resultado.esValido) {
            return res.status(400).json({
                success: false,
                error: 'Errores de validación',
                errores: resultado.errores
            });
        }
        
        next();
    };
};

// Exportar todas las funciones
module.exports = {
    validarEmail,
    validarPassword,
    validarNumeroExpediente,
    validarFecha,
    validarEntero,
    validarTexto,
    validarArchivo,
    validarFormulario,
    validarArray,
    validarCodigoPostal,
    validarURL,
    sanitizarHTML,
    validarCamposRequeridos,
    validarOpcion,
    validarRequest
};