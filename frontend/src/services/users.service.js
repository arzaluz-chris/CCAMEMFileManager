// === ARCHIVO: frontend/src/services/users.service.js ===
// Servicio para gestionar usuarios del sistema CCAMEM

import apiClient from './api.service';

/**
 * Servicio para la gestión de usuarios
 * Maneja todas las operaciones CRUD de usuarios
 */
class UsersService {
  
  /**
   * Obtener lista de usuarios con filtros y paginación
   * @param {Object} params - Parámetros de búsqueda y paginación
   * @returns {Promise} Respuesta con usuarios
   */
  async getUsuarios(params = {}) {
    try {
      const response = await apiClient.get('/users', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || {
          totalItems: response.data.length || 0,
          page: params.page || 1,
          limit: params.limit || 10
        }
      };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise} Respuesta con datos del usuario
   */
  async getUsuarioById(id) {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} Respuesta de la creación
   */
  async createUsuario(userData) {
    try {
      const response = await apiClient.post('/users', userData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Usuario creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos actualizados del usuario
   * @returns {Promise} Respuesta de la actualización
   */
  async updateUsuario(id, userData) {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar usuario (desactivar)
   * @param {number} id - ID del usuario
   * @returns {Promise} Respuesta de la eliminación
   */
  async deleteUsuario(id) {
    try {
      await apiClient.delete(`/users/${id}`);
      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cambiar contraseña de usuario
   * @param {number} id - ID del usuario
   * @param {Object} passwordData - Datos de contraseña
   * @returns {Promise} Respuesta del cambio
   */
  async changePassword(id, passwordData) {
    try {
      const response = await apiClient.put(`/users/${id}/password`, passwordData);
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Activar/desactivar usuario
   * @param {number} id - ID del usuario
   * @param {boolean} activo - Estado activo/inactivo
   * @returns {Promise} Respuesta del cambio de estado
   */
  async toggleEstadoUsuario(id, activo) {
    try {
      const response = await apiClient.put(`/users/${id}/estado`, { activo });
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   * @returns {Promise} Estadísticas de usuarios
   */
  async getEstadisticas() {
    try {
      const response = await apiClient.get('/users/estadisticas');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener roles disponibles
   * @returns {Array} Lista de roles del sistema
   */
  getRoles() {
    return [
      { value: 'admin', label: 'Administrador', descripcion: 'Acceso completo al sistema' },
      { value: 'jefe', label: 'Jefe de Área', descripcion: 'Gestión de su área y expedientes' },
      { value: 'usuario', label: 'Usuario', descripcion: 'Acceso básico para consulta y creación' },
      { value: 'consulta', label: 'Solo Consulta', descripcion: 'Solo puede consultar información' }
    ];
  }

  /**
   * Validar datos de usuario antes de enviar
   * @param {Object} userData - Datos del usuario a validar
   * @param {boolean} isEdit - Si es edición (no requiere contraseña)
   * @returns {Object} Objeto con errores de validación
   */
  validateUserData(userData, isEdit = false) {
    const errors = {};

    // Validar nombre
    if (!userData.nombre || userData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      errors.email = 'Ingresa un email válido';
    }

    // Validar contraseña (solo para creación o si se proporciona en edición)
    if (!isEdit || userData.password) {
      if (!userData.password || userData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    // Validar rol
    const rolesValidos = this.getRoles().map(r => r.value);
    if (!userData.rol || !rolesValidos.includes(userData.rol)) {
      errors.rol = 'Selecciona un rol válido';
    }

    // Validar área (opcional pero si se proporciona debe ser válida)
    if (userData.area && userData.area.trim().length === 0) {
      errors.area = 'El área no puede estar vacía si se especifica';
    }

    return errors;
  }

  /**
   * Formatear datos de usuario para mostrar
   * @param {Object} usuario - Datos del usuario
   * @returns {Object} Usuario formateado
   */
  formatUserForDisplay(usuario) {
    const roles = this.getRoles();
    const rolInfo = roles.find(r => r.value === usuario.rol);

    return {
      ...usuario,
      rolLabel: rolInfo?.label || usuario.rol,
      rolDescripcion: rolInfo?.descripcion || '',
      estadoLabel: usuario.activo ? 'Activo' : 'Inactivo',
      fechaCreacionFormatted: usuario.fecha_creacion ? 
        new Date(usuario.fecha_creacion).toLocaleDateString('es-MX') : '',
      ultimoAccesoFormatted: usuario.ultimo_acceso ? 
        new Date(usuario.ultimo_acceso).toLocaleDateString('es-MX') : 'Nunca'
    };
  }

  /**
   * Generar contraseña aleatoria segura
   * @param {number} length - Longitud de la contraseña
   * @returns {string} Contraseña generada
   */
  generateRandomPassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar con caracteres aleatorios
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Maneja los errores de las peticiones HTTP
   * @param {Error} error - Error de la petición
   * @returns {Error} Error formateado
   */
  handleError(error) {
    if (error.response) {
      // Error del servidor
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     'Error en el servidor';
      return new Error(message);
    } else if (error.request) {
      // Error de red
      return new Error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Error desconocido
      return new Error(error.message || 'Error desconocido');
    }
  }
}

// Exportar instancia única del servicio
export default new UsersService();