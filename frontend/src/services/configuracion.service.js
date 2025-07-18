// === ARCHIVO: frontend/src/services/configuracion.service.js ===
// Servicio para consumir la API de configuración desde el frontend

import api from './api';

/**
 * Servicio para gestionar la configuración del sistema
 */
class ConfiguracionService {
  /**
   * Obtener todas las configuraciones del sistema
   * @returns {Promise} Configuraciones agrupadas por categoría
   */
  async obtenerConfiguraciones() {
    const response = await api.get('/configuracion/sistema');
    return response.data;
  }

  /**
   * Actualizar una configuración específica
   * @param {string} clave - Clave de la configuración
   * @param {any} valor - Nuevo valor
   * @returns {Promise} Resultado de la actualización
   */
  async actualizarConfiguracion(clave, valor) {
    const response = await api.put(`/configuracion/sistema/${clave}`, { valor });
    return response.data;
  }

  /**
   * Obtener configuraciones de notificaciones
   * @returns {Promise} Lista de notificaciones configurables
   */
  async obtenerNotificaciones() {
    const response = await api.get('/configuracion/notificaciones');
    return response.data;
  }

  /**
   * Actualizar configuración de notificación
   * @param {number} id - ID de la notificación
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise} Notificación actualizada
   */
  async actualizarNotificacion(id, datos) {
    const response = await api.put(`/configuracion/notificaciones/${id}`, datos);
    return response.data;
  }

  /**
   * Obtener logs de auditoría
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise} Logs con paginación
   */
  async obtenerAuditoria(params = {}) {
    const response = await api.get('/configuracion/auditoria', { params });
    return response.data;
  }

  /**
   * Obtener estadísticas de auditoría
   * @returns {Promise} Estadísticas del sistema
   */
  async obtenerEstadisticasAuditoria() {
    const response = await api.get('/configuracion/auditoria/estadisticas');
    return response.data;
  }

  /**
   * Limpiar logs antiguos
   * @param {number} dias - Días a conservar
   * @returns {Promise} Resultado de la limpieza
   */
  async limpiarLogs(dias) {
    const response = await api.post('/configuracion/auditoria/limpiar', { dias });
    return response.data;
  }

  /**
   * Obtener respaldos configurados
   * @returns {Promise} Lista de respaldos
   */
  async obtenerRespaldos() {
    const response = await api.get('/configuracion/respaldos');
    return response.data;
  }

  /**
   * Configurar nuevo respaldo
   * @param {Object} datos - Configuración del respaldo
   * @returns {Promise} Respaldo creado
   */
  async configurarRespaldo(datos) {
    const response = await api.post('/configuracion/respaldos', datos);
    return response.data;
  }

  /**
   * Ejecutar respaldo manual
   * @param {number} id - ID del respaldo
   * @returns {Promise} Resultado de la ejecución
   */
  async ejecutarRespaldo(id) {
    const response = await api.post(`/configuracion/respaldos/${id}/ejecutar`);
    return response.data;
  }

  /**
   * Probar configuración de email
   * @param {string} emailDestino - Email donde enviar la prueba
   * @returns {Promise} Resultado de la prueba
   */
  async probarEmail(emailDestino) {
    const response = await api.post('/configuracion/email/probar', { 
      email_destino: emailDestino 
    });
    return response.data;
  }

  /**
   * Obtener información del sistema
   * @returns {Promise} Información del sistema y servidor
   */
  async obtenerInfoSistema() {
    const response = await api.get('/configuracion/info-sistema');
    return response.data;
  }

  /**
   * Exportar configuración completa
   * @returns {Object} Configuración para exportar
   */
  async exportarConfiguracion() {
    const configs = await this.obtenerConfiguraciones();
    const notificaciones = await this.obtenerNotificaciones();
    const respaldos = await this.obtenerRespaldos();
    
    return {
      fecha_exportacion: new Date().toISOString(),
      configuraciones: configs.data,
      notificaciones: notificaciones.data,
      respaldos: respaldos.data
    };
  }

  /**
   * Validar conexión SMTP
   * @param {Object} config - Configuración SMTP a validar
   * @returns {Promise} Resultado de la validación
   */
  async validarSMTP(config) {
    // Primero actualizar la configuración
    const promises = Object.entries(config).map(([clave, valor]) => 
      this.actualizarConfiguracion(clave, valor)
    );
    
    await Promise.all(promises);
    
    // Luego probar el envío
    return this.probarEmail(config.email_prueba || 'admin@ccamem.gob.mx');
  }
}

// Exportar instancia única del servicio
export default new ConfiguracionService();