// === ARCHIVO: frontend/src/services/users.service.js ===
// Servicio para consumir la API de usuarios desde el frontend

import api from './api';

/**
 * Servicio para gestionar usuarios
 * Todas las peticiones usan el cliente axios configurado con el token JWT
 */
class UsersService {
  /**
   * Obtener lista de usuarios con filtros y paginación
   * @param {Object} params - Parámetros de búsqueda
   * @param {number} params.page - Número de página (default: 1)
   * @param {number} params.limit - Usuarios por página (default: 10)
   * @param {string} params.search - Búsqueda por nombre o email
   * @param {string} params.rol - Filtrar por rol
   * @param {string} params.area - Filtrar por área
   * @param {string} params.activo - Filtrar por estado activo/inactivo
   * @returns {Promise} Respuesta con usuarios y paginación
   */
  async getUsuarios(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  }

  /**
   * Obtener un usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise} Datos del usuario
   */
  async getUsuarioById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo usuario
   * @param {Object} data - Datos del usuario
   * @param {string} data.nombre - Nombre completo
   * @param {string} data.email - Correo electrónico
   * @param {string} data.password - Contraseña
   * @param {string} data.rol - Rol del usuario (admin, usuario, consulta)
   * @param {string} data.area - Código del área (opcional)
   * @returns {Promise} Usuario creado
   */
  async createUsuario(data) {
    const response = await api.post('/users', data);
    return response.data;
  }

  /**
   * Actualizar un usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} Usuario actualizado
   */
  async updateUsuario(id, data) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar (desactivar) un usuario
   * @param {number} id - ID del usuario
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteUsuario(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }

  /**
   * Obtener estadísticas de usuarios
   * @returns {Promise} Estadísticas del sistema
   */
  async getEstadisticas() {
    const response = await api.get('/users/estadisticas');
    return response.data;
  }

  /**
   * Validar si un email ya existe
   * Útil para validación en tiempo real en formularios
   * @param {string} email - Email a verificar
   * @param {number} excludeId - ID de usuario a excluir (para edición)
   * @returns {Promise<boolean>} true si el email ya existe
   */
  async checkEmailExists(email, excludeId = null) {
    try {
      const params = { search: email };
      const response = await this.getUsuarios(params);
      
      // Filtrar resultados para coincidencia exacta
      const usuarios = response.data || [];
      const exists = usuarios.some(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        user.id !== excludeId
      );
      
      return exists;
    } catch (error) {
      console.error('Error verificando email:', error);
      return false;
    }
  }
}

// Exportar una instancia única del servicio
export default new UsersService();