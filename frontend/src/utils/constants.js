// === ARCHIVO: frontend/src/utils/constants.js ===
// Constantes globales para el sistema CCAMEM

/**
 * Roles de usuario en el sistema
 */
export const ROLES = {
  ADMIN: 'admin',
  USUARIO: 'usuario',
  CONSULTA: 'consulta'
};

/**
 * Etiquetas amigables para los roles
 */
export const ROLES_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.USUARIO]: 'Usuario',
  [ROLES.CONSULTA]: 'Consulta'
};

/**
 * Estados de expedientes
 */
export const ESTADOS_EXPEDIENTE = {
  ACTIVO: 'activo',
  CERRADO: 'cerrado',
  TRANSFERIDO: 'transferido',
  BAJA: 'baja'
};

/**
 * Etiquetas para estados de expedientes
 */
export const ESTADOS_EXPEDIENTE_LABELS = {
  [ESTADOS_EXPEDIENTE.ACTIVO]: 'Activo',
  [ESTADOS_EXPEDIENTE.CERRADO]: 'Cerrado',
  [ESTADOS_EXPEDIENTE.TRANSFERIDO]: 'Transferido',
  [ESTADOS_EXPEDIENTE.BAJA]: 'Baja'
};

/**
 * Colores para los estados (para chips de Material UI)
 */
export const ESTADOS_EXPEDIENTE_COLORS = {
  [ESTADOS_EXPEDIENTE.ACTIVO]: 'success',
  [ESTADOS_EXPEDIENTE.CERRADO]: 'default',
  [ESTADOS_EXPEDIENTE.TRANSFERIDO]: 'warning',
  [ESTADOS_EXPEDIENTE.BAJA]: 'error'
};

/**
 * Valores documentales
 */
export const VALORES_DOCUMENTALES = {
  ADMINISTRATIVO: 'administrativo',
  JURIDICO: 'juridico',
  FISCAL: 'fiscal',
  CONTABLE: 'contable'
};

/**
 * Clasificación de información
 */
export const CLASIFICACION_INFO = {
  PUBLICA: 'publica',
  RESERVADA: 'reservada',
  CONFIDENCIAL: 'confidencial'
};

/**
 * Etiquetas para clasificación de información
 */
export const CLASIFICACION_INFO_LABELS = {
  [CLASIFICACION_INFO.PUBLICA]: 'Pública',
  [CLASIFICACION_INFO.RESERVADA]: 'Reservada',
  [CLASIFICACION_INFO.CONFIDENCIAL]: 'Confidencial'
};

/**
 * Destino final de expedientes
 */
export const DESTINO_FINAL = {
  CONSERVACION: 'conservacion',
  BAJA: 'baja'
};

/**
 * Tipos de transferencia
 */
export const TIPOS_TRANSFERENCIA = {
  PRIMARIA: 'primaria',
  SECUNDARIA: 'secundaria'
};

/**
 * Estados de préstamo
 */
export const ESTADOS_PRESTAMO = {
  ACTIVO: 'activo',
  DEVUELTO: 'devuelto'
};

/**
 * Tipos de archivo permitidos
 */
export const TIPOS_ARCHIVO_PERMITIDOS = {
  DOCUMENTOS: {
    accept: '.pdf,.doc,.docx,.txt',
    extensions: ['pdf', 'doc', 'docx', 'txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  IMAGENES: {
    accept: '.jpg,.jpeg,.png,.gif',
    extensions: ['jpg', 'jpeg', 'png', 'gif'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif']
  },
  HOJAS_CALCULO: {
    accept: '.xls,.xlsx,.csv',
    extensions: ['xls', 'xlsx', 'csv'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
  },
  TODOS: {
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv',
    extensions: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xls', 'xlsx', 'csv']
  }
};

/**
 * Tamaño máximo de archivo en MB
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Mensajes de error comunes
 */
export const MENSAJES_ERROR = {
  GENERAL: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
  SIN_CONEXION: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
  SESION_EXPIRADA: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  SIN_PERMISOS: 'No tienes permisos para realizar esta acción.',
  ARCHIVO_MUY_GRANDE: `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB}MB`,
  TIPO_ARCHIVO_NO_PERMITIDO: 'El tipo de archivo no está permitido'
};

/**
 * Mensajes de éxito comunes
 */
export const MENSAJES_EXITO = {
  GUARDADO: 'Los cambios se guardaron exitosamente',
  CREADO: 'Se creó exitosamente',
  ACTUALIZADO: 'Se actualizó exitosamente',
  ELIMINADO: 'Se eliminó exitosamente',
  ARCHIVO_SUBIDO: 'El archivo se subió exitosamente'
};

/**
 * Opciones de paginación
 */
export const OPCIONES_PAGINACION = [5, 10, 25, 50, 100];

/**
 * Tiempo de espera para peticiones (millisegundos)
 */
export const TIMEOUT_REQUEST = 30000; // 30 segundos

/**
 * Rutas de la aplicación
 */
export const RUTAS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EXPEDIENTES: '/expedientes',
  EXPEDIENTE_NUEVO: '/expedientes/nuevo',
  EXPEDIENTE_EDITAR: '/expedientes/editar/:id',
  EXPEDIENTE_DETALLE: '/expedientes/:id',
  DIGITALIZACION: '/digitalizacion',
  CATALOGO: '/catalogo',
  AREAS: '/catalogo/areas',
  SECCIONES: '/catalogo/secciones',
  SERIES: '/catalogo/series',
  SUBSERIES: '/catalogo/subseries',
  REPORTES: '/reportes',
  USUARIOS: '/usuarios',
  SISER: '/siser',
  CONFIGURACION: '/configuracion',
  PERFIL: '/perfil'
};

/**
 * Expresiones regulares para validaciones
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NUMERO_EXPEDIENTE: /^[A-Z]+\/\d{4}\/\d{4}$/,
  CURP: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/,
  RFC_FISICA: /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/,
  RFC_MORAL: /^[A-Z]{3}\d{6}[A-Z0-9]{3}$/,
  TELEFONO: /^\d{10}$/,
  CODIGO_POSTAL: /^\d{5}$/
};

/**
 * Formatos de fecha
 */
export const FORMATOS_FECHA = {
  FECHA_CORTA: 'DD/MM/YYYY',
  FECHA_LARGA: 'DD [de] MMMM [de] YYYY',
  FECHA_HORA: 'DD/MM/YYYY HH:mm',
  HORA: 'HH:mm',
  ARCHIVO: 'YYYYMMDD'
};

/**
 * Códigos de área por defecto
 */
export const AREAS_DEFAULT = {
  DG: 'Dirección General',
  UA: 'Unidad de Apoyo Administrativo',
  UM: 'Unidad Médica',
  UJ: 'Unidad Jurídica',
  SISTEMAS: 'Sistemas'
};

/**
 * Configuración de gráficas
 */
export const CONFIG_GRAFICAS = {
  COLORES: [
    '#1976d2', // Azul
    '#388e3c', // Verde
    '#d32f2f', // Rojo
    '#f57c00', // Naranja
    '#7b1fa2', // Morado
    '#455a64', // Gris azulado
    '#0097a7', // Cyan
    '#5d4037'  // Café
  ],
  ALTURA_MINIMA: 300,
  ALTURA_MAXIMA: 500
};

/**
 * Tiempos de conservación por defecto (en años)
 */
export const TIEMPOS_CONSERVACION = {
  ARCHIVO_TRAMITE: 2,
  ARCHIVO_CONCENTRACION: 5
};

/**
 * Configuración de notificaciones
 */
export const CONFIG_NOTIFICACIONES = {
  DURACION: 6000, // 6 segundos
  POSICION: {
    vertical: 'bottom',
    horizontal: 'center'
  }
};

/**
 * Límites del sistema
 */
export const LIMITES = {
  MAX_LEGAJOS: 999,
  MAX_HOJAS: 9999,
  MIN_PASSWORD: 6,
  MAX_PASSWORD: 50,
  MAX_NOMBRE: 300,
  MAX_DESCRIPCION: 1000
};

/**
 * Prefijo para localStorage
 */
export const STORAGE_PREFIX = 'ccamem_';

/**
 * Keys de localStorage
 */
export const STORAGE_KEYS = {
  TOKEN: `${STORAGE_PREFIX}token`,
  USER: `${STORAGE_PREFIX}user`,
  THEME: `${STORAGE_PREFIX}theme`,
  FILTROS_EXPEDIENTES: `${STORAGE_PREFIX}filtros_expedientes`
};