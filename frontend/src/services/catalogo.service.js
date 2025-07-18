// === ARCHIVO: frontend/src/services/catalogo.service.js ===
// Servicio para gestionar las operaciones del catálogo de clasificación archivística

import apiClient from './api.service';

/**
 * Servicio para el catálogo de clasificación archivística
 * Maneja todas las operaciones CRUD para áreas, secciones, series y subseries
 */
class CatalogoService {
  
  /**
   * ===================================
   * MÉTODOS PARA ÁREAS
   * ===================================
   */

  /**
   * Obtener todas las áreas
   * @param {Object} params - Parámetros de búsqueda y paginación
   * @returns {Promise} Respuesta con las áreas
   */
  async getAreas(params = {}) {
    try {
      const response = await apiClient.get('/catalogo/areas', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || response.data.length
      };
    } catch (error) {
      console.error('Error al obtener áreas:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nueva área
   * @param {Object} area - Datos del área
   * @returns {Promise} Respuesta de la creación
   */
  async createArea(area) {
    try {
      const response = await apiClient.post('/catalogo/areas', area);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Área creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear área:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar área existente
   * @param {number} id - ID del área
   * @param {Object} area - Datos actualizados
   * @returns {Promise} Respuesta de la actualización
   */
  async updateArea(id, area) {
    try {
      const response = await apiClient.put(`/catalogo/areas/${id}`, area);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Área actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar área:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar área
   * @param {number} id - ID del área
   * @returns {Promise} Respuesta de la eliminación
   */
  async deleteArea(id) {
    try {
      await apiClient.delete(`/catalogo/areas/${id}`);
      return {
        success: true,
        message: 'Área eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar área:', error);
      throw this.handleError(error);
    }
  }

  /**
   * ===================================
   * MÉTODOS PARA SECCIONES
   * ===================================
   */

  /**
   * Obtener secciones (opcionalmente filtradas por área)
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} Respuesta con las secciones
   */
  async getSecciones(params = {}) {
    try {
      const response = await apiClient.get('/catalogo/secciones', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || response.data.length
      };
    } catch (error) {
      console.error('Error al obtener secciones:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nueva sección
   * @param {Object} seccion - Datos de la sección
   * @returns {Promise} Respuesta de la creación
   */
  async createSeccion(seccion) {
    try {
      const response = await apiClient.post('/catalogo/secciones', seccion);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Sección creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear sección:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar sección existente
   * @param {number} id - ID de la sección
   * @param {Object} seccion - Datos actualizados
   * @returns {Promise} Respuesta de la actualización
   */
  async updateSeccion(id, seccion) {
    try {
      const response = await apiClient.put(`/catalogo/secciones/${id}`, seccion);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Sección actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar sección:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar sección
   * @param {number} id - ID de la sección
   * @returns {Promise} Respuesta de la eliminación
   */
  async deleteSeccion(id) {
    try {
      await apiClient.delete(`/catalogo/secciones/${id}`);
      return {
        success: true,
        message: 'Sección eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar sección:', error);
      throw this.handleError(error);
    }
  }

  /**
   * ===================================
   * MÉTODOS PARA SERIES
   * ===================================
   */

  /**
   * Obtener series (opcionalmente filtradas por sección)
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} Respuesta con las series
   */
  async getSeries(params = {}) {
    try {
      const response = await apiClient.get('/catalogo/series', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || response.data.length
      };
    } catch (error) {
      console.error('Error al obtener series:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nueva serie
   * @param {Object} serie - Datos de la serie
   * @returns {Promise} Respuesta de la creación
   */
  async createSerie(serie) {
    try {
      const response = await apiClient.post('/catalogo/series', serie);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Serie creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear serie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar serie existente
   * @param {number} id - ID de la serie
   * @param {Object} serie - Datos actualizados
   * @returns {Promise} Respuesta de la actualización
   */
  async updateSerie(id, serie) {
    try {
      const response = await apiClient.put(`/catalogo/series/${id}`, serie);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Serie actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar serie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar serie
   * @param {number} id - ID de la serie
   * @returns {Promise} Respuesta de la eliminación
   */
  async deleteSerie(id) {
    try {
      await apiClient.delete(`/catalogo/series/${id}`);
      return {
        success: true,
        message: 'Serie eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar serie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * ===================================
   * MÉTODOS PARA SUBSERIES
   * ===================================
   */

  /**
   * Obtener subseries (opcionalmente filtradas por serie)
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} Respuesta con las subseries
   */
  async getSubseries(params = {}) {
    try {
      const response = await apiClient.get('/catalogo/subseries', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || response.data.length
      };
    } catch (error) {
      console.error('Error al obtener subseries:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear nueva subserie
   * @param {Object} subserie - Datos de la subserie
   * @returns {Promise} Respuesta de la creación
   */
  async createSubserie(subserie) {
    try {
      const response = await apiClient.post('/catalogo/subseries', subserie);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Subserie creada exitosamente'
      };
    } catch (error) {
      console.error('Error al crear subserie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar subserie existente
   * @param {number} id - ID de la subserie
   * @param {Object} subserie - Datos actualizados
   * @returns {Promise} Respuesta de la actualización
   */
  async updateSubserie(id, subserie) {
    try {
      const response = await apiClient.put(`/catalogo/subseries/${id}`, subserie);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Subserie actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error al actualizar subserie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar subserie
   * @param {number} id - ID de la subserie
   * @returns {Promise} Respuesta de la eliminación
   */
  async deleteSubserie(id) {
    try {
      await apiClient.delete(`/catalogo/subseries/${id}`);
      return {
        success: true,
        message: 'Subserie eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar subserie:', error);
      throw this.handleError(error);
    }
  }

  /**
   * ===================================
   * MÉTODOS ESPECIALES
   * ===================================
   */

  /**
   * Obtener el catálogo completo con estructura jerárquica
   * @returns {Promise} Catálogo completo organizado
   */
  async getCatalogoCompleto() {
    try {
      const response = await apiClient.get('/catalogo/completo');
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error al obtener catálogo completo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Buscar en todo el catálogo
   * @param {string} termino - Término de búsqueda
   * @param {Object} filtros - Filtros adicionales
   * @returns {Promise} Resultados de la búsqueda
   */
  async buscarEnCatalogo(termino, filtros = {}) {
    try {
      const params = {
        q: termino,
        ...filtros
      };
      const response = await apiClient.get('/catalogo/buscar', { params });
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || 0
      };
    } catch (error) {
      console.error('Error al buscar en catálogo:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener valores documentales disponibles
   * @returns {Promise} Lista de valores documentales
   */
  async getValoresDocumentales() {
    try {
      const response = await apiClient.get('/catalogo/valores-documentales');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error al obtener valores documentales:', error);
      throw this.handleError(error);
    }
  }

  /**
   * ===================================
   * MÉTODO AUXILIAR PARA MANEJO DE ERRORES
   * ===================================
   */

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
export default new CatalogoService();