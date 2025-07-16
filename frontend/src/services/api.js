import axios from 'axios';

/**
 * Configuración de Axios para las peticiones al backend
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

/**
 * Interceptor para agregar el token JWT a todas las peticiones
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ccamem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor para manejar respuestas y errores globalmente
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('ccamem_token');
      localStorage.removeItem('ccamem_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
