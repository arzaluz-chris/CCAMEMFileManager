// === ARCHIVO: frontend/src/utils/formatters.js ===
// Funciones de formateo para la interfaz de usuario

import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatear fecha a formato legible
 * @param {Date|string} fecha - Fecha a formatear
 * @param {string} formato - Formato deseado (por defecto: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, formato = 'dd/MM/yyyy') => {
  if (!fecha) return '';
  
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return format(fechaObj, formato, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

/**
 * Formatear fecha con hora
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export const formatearFechaHora = (fecha) => {
  return formatearFecha(fecha, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatear fecha en formato largo
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato largo
 */
export const formatearFechaLarga = (fecha) => {
  return formatearFecha(fecha, "d 'de' MMMM 'de' yyyy");
};

/**
 * Formatear fecha relativa (hace 2 días, en 3 horas, etc.)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha relativa
 */
export const formatearFechaRelativa = (fecha) => {
  if (!fecha) return '';
  
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha;
    return formatDistance(fechaObj, new Date(), { 
      addSuffix: true, 
      locale: es 
    });
  } catch (error) {
    console.error('Error al formatear fecha relativa:', error);
    return '';
  }
};

/**
 * Formatear número con separadores de miles
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Cantidad de decimales (por defecto: 0)
 * @returns {string} Número formateado
 */
export const formatearNumero = (numero, decimales = 0) => {
  if (numero === null || numero === undefined) return '';
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
};

/**
 * Formatear como moneda mexicana
 * @param {number} cantidad - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda
 */
export const formatearMoneda = (cantidad) => {
  if (cantidad === null || cantidad === undefined) return '';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad);
};

/**
 * Formatear porcentaje
 * @param {number} valor - Valor a formatear (0-100)
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Porcentaje formateado
 */
export const formatearPorcentaje = (valor, decimales = 0) => {
  if (valor === null || valor === undefined) return '';
  
  return `${formatearNumero(valor, decimales)}%`;
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Tamaño formateado
 */
export const formatearTamanoArchivo = (bytes, decimales = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimales < 0 ? 0 : decimales;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatear nombre completo
 * @param {string} nombre - Nombre
 * @param {string} apellidoPaterno - Apellido paterno
 * @param {string} apellidoMaterno - Apellido materno
 * @returns {string} Nombre completo formateado
 */
export const formatearNombreCompleto = (nombre, apellidoPaterno = '', apellidoMaterno = '') => {
  const partes = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);
  return partes.join(' ').trim();
};

/**
 * Formatear número de expediente
 * @param {string} numero - Número de expediente
 * @returns {string} Número formateado
 */
export const formatearNumeroExpediente = (numero) => {
  if (!numero) return '';
  
  // Si ya tiene el formato correcto, devolverlo
  if (numero.includes('/')) return numero;
  
  // Si es solo un número, formatearlo
  const numeroStr = numero.toString().padStart(4, '0');
  const año = new Date().getFullYear();
  return `CCAMEM/${numeroStr}/${año}`;
};

/**
 * Formatear teléfono mexicano
 * @param {string} telefono - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export const formatearTelefono = (telefono) => {
  if (!telefono) return '';
  
  const limpio = telefono.replace(/\D/g, '');
  
  if (limpio.length === 10) {
    return limpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  if (limpio.length === 12 && limpio.startsWith('52')) {
    const sinCodigo = limpio.substring(2);
    return '+52 ' + sinCodigo.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  return telefono;
};

/**
 * Truncar texto
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @param {string} sufijo - Sufijo a agregar (por defecto: '...')
 * @returns {string} Texto truncado
 */
export const truncarTexto = (texto, longitud = 50, sufijo = '...') => {
  if (!texto || texto.length <= longitud) return texto;
  
  return texto.substring(0, longitud - sufijo.length) + sufijo;
};

/**
 * Capitalizar primera letra
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalizar = (texto) => {
  if (!texto) return '';
  
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palabra
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto con cada palabra capitalizada
 */
export const capitalizarPalabras = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => capitalizar(palabra))
    .join(' ');
};

/**
 * Formatear CURP
 * @param {string} curp - CURP a formatear
 * @returns {string} CURP formateado en mayúsculas
 */
export const formatearCURP = (curp) => {
  if (!curp) return '';
  
  // Remover espacios y convertir a mayúsculas
  const curpLimpio = curp.replace(/\s/g, '').toUpperCase();
  
  // Si tiene 18 caracteres, agregar guiones para mejor legibilidad
  if (curpLimpio.length === 18) {
    return `${curpLimpio.substr(0, 4)}-${curpLimpio.substr(4, 6)}-${curpLimpio.substr(10, 8)}`;
  }
  
  return curpLimpio;
};

/**
 * Formatear RFC
 * @param {string} rfc - RFC a formatear
 * @returns {string} RFC formateado en mayúsculas
 */
export const formatearRFC = (rfc) => {
  if (!rfc) return '';
  
  // Remover espacios y convertir a mayúsculas
  const rfcLimpio = rfc.replace(/\s/g, '').toUpperCase();
  
  // Agregar guiones para mejor legibilidad
  if (rfcLimpio.length === 12 || rfcLimpio.length === 13) {
    const letras = rfcLimpio.length === 12 ? 3 : 4;
    return `${rfcLimpio.substr(0, letras)}-${rfcLimpio.substr(letras, 6)}-${rfcLimpio.substr(letras + 6)}`;
  }
  
  return rfcLimpio;
};

/**
 * Formatear código postal
 * @param {string} cp - Código postal
 * @returns {string} Código postal formateado
 */
export const formatearCodigoPostal = (cp) => {
  if (!cp) return '';
  
  const cpLimpio = cp.replace(/\D/g, '');
  return cpLimpio.padStart(5, '0').substr(0, 5);
};

/**
 * Obtener iniciales de un nombre
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales
 */
export const obtenerIniciales = (nombre) => {
  if (!nombre) return '';
  
  return nombre
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase())
    .join('')
    .substr(0, 2);
};

/**
 * Formatear duración en formato legible
 * @param {number} segundos - Duración en segundos
 * @returns {string} Duración formateada
 */
export const formatearDuracion = (segundos) => {
  if (!segundos || segundos < 0) return '0 segundos';
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  const partes = [];
  if (horas > 0) partes.push(`${horas} hora${horas !== 1 ? 's' : ''}`);
  if (minutos > 0) partes.push(`${minutos} minuto${minutos !== 1 ? 's' : ''}`);
  if (segs > 0 || partes.length === 0) partes.push(`${segs} segundo${segs !== 1 ? 's' : ''}`);
  
  return partes.join(', ');
};

/**
 * Formatear lista como texto
 * @param {Array} lista - Lista de elementos
 * @param {string} conector - Conector para el último elemento (por defecto: 'y')
 * @returns {string} Lista formateada
 */
export const formatearLista = (lista, conector = 'y') => {
  if (!lista || lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  if (lista.length === 2) return `${lista[0]} ${conector} ${lista[1]}`;
  
  const ultimos = lista.slice(-2);
  const primeros = lista.slice(0, -2);
  
  return `${primeros.join(', ')}, ${ultimos[0]} ${conector} ${ultimos[1]}`;
};

/**
 * Formatear estado de expediente
 * @param {string} estado - Estado del expediente
 * @returns {string} Estado formateado con emoji
 */
export const formatearEstadoExpediente = (estado) => {
  const estados = {
    activo: '🟢 Activo',
    cerrado: '🔒 Cerrado',
    transferido: '📦 Transferido',
    baja: '❌ Baja'
  };
  
  return estados[estado?.toLowerCase()] || estado;
};

/**
 * Formatear clasificación de información
 * @param {string} clasificacion - Tipo de clasificación
 * @returns {string} Clasificación formateada con emoji
 */
export const formatearClasificacion = (clasificacion) => {
  const clasificaciones = {
    publica: '📢 Pública',
    reservada: '🔐 Reservada',
    confidencial: '🔒 Confidencial'
  };
  
  return clasificaciones[clasificacion?.toLowerCase()] || clasificacion;
};

/**
 * Generar color para avatar basado en texto
 * @param {string} texto - Texto base para generar color
 * @returns {string} Color en formato hexadecimal
 */
export const generarColorAvatar = (texto) => {
  if (!texto) return '#757575';
  
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colores = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];
  
  return colores[Math.abs(hash) % colores.length];
};