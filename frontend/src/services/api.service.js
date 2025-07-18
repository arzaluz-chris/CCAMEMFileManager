// === ARCHIVO: frontend/src/services/api.service.js ===
// Servicio API unificado para el sistema CCAMEM

import axios from 'axios';

/**
 * Configuración de Axios para las peticiones al backend
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para agregar el token JWT a todas las peticiones
 */
apiClient.interceptors.request.use(
  (config) => {
    // IMPORTANTE: Usar el mismo nombre de token en toda la aplicación
    const token = localStorage.getItem('ccamem_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token agregado a la petición:', config.method?.toUpperCase(), config.url);
    } else {
      console.log('⚠️ No hay token para la petición:', config.method?.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar respuestas y errores globalmente
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log de respuestas exitosas para debugging
    console.log('✅ Respuesta exitosa:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Error en petición:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    
    // Manejar errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      // Token expirado o inválido
      if (status === 401) {
        console.log('🔄 Token inválido (401), limpiando sesión...');
        
        // Limpiar datos de autenticación
        localStorage.removeItem('ccamem_token');
        localStorage.removeItem('ccamem_user');
        
        // Solo redirigir si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          console.log('🔄 Redirigiendo a login...');
          window.location.href = '/login';
        }
      }
      
      // Errores del servidor
      if (status >= 500) {
        console.error('🔥 Error del servidor:', data?.error || 'Error interno del servidor');
      }
      
      // Agregar información del error para mejor debugging
      error.userMessage = data?.error || data?.message || 'Error en la petición';
      
    } else if (error.request) {
      // Error de red
      console.error('🌐 Error de red:', error.message);
      error.userMessage = 'Error de conexión. Verifique su conexión a internet.';
    } else {
      // Otros errores
      console.error('❓ Error desconocido:', error.message);
      error.userMessage = 'Error inesperado. Intente nuevamente.';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Funciones helper para peticiones comunes
 */
const apiService = {
  /**
   * Petición GET
   */
  get: (url, config = {}) => {
    console.log('📡 GET:', url);
    return apiClient.get(url, config);
  },

  /**
   * Petición POST
   */
  post: (url, data = {}, config = {}) => {
    console.log('📡 POST:', url, data);
    return apiClient.post(url, data, config);
  },

  /**
   * Petición PUT
   */
  put: (url, data = {}, config = {}) => {
    console.log('📡 PUT:', url, data);
    return apiClient.put(url, data, config);
  },

  /**
   * Petición PATCH
   */
  patch: (url, data = {}, config = {}) => {
    console.log('📡 PATCH:', url, data);
    return apiClient.patch(url, data, config);
  },

  /**
   * Petición DELETE
   */
  delete: (url, config = {}) => {
    console.log('📡 DELETE:', url);
    return apiClient.delete(url, config);
  },

  /**
   * Subir archivo
   */
  uploadFile: (url, file, onUploadProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('📤 UPLOAD:', url, file.name);
    
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  /**
   * Descargar archivo
   */
  downloadFile: (url, filename) => {
    console.log('📥 DOWNLOAD:', url);
    
    return apiClient.get(url, {
      responseType: 'blob',
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  /**
   * Obtener URL base del API
   */
  getBaseURL: () => {
    return apiClient.defaults.baseURL;
  },

  /**
   * Configurar timeout
   */
  setTimeout: (timeout) => {
    apiClient.defaults.timeout = timeout;
  },

  /**
   * Obtener instancia de axios (para casos especiales)
   */
  getAxiosInstance: () => {
    return apiClient;
  }
};

// Exportar tanto el cliente como el servicio
export { apiClient, apiService };
export default apiClient;