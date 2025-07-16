// === ARCHIVO: frontend/src/services/expedientes.service.js ===
import api from './api';

class ExpedientesService {
  async getExpedientes(params = {}) {
    const response = await api.get('/expedientes', { params });
    return response.data;
  }

  async getExpedienteById(id) {
    const response = await api.get(`/expedientes/${id}`);
    return response.data;
  }

  async createExpediente(data) {
    const response = await api.post('/expedientes', data);
    return response.data;
  }

  async updateExpediente(id, data) {
    const response = await api.put(`/expedientes/${id}`, data);
    return response.data;
  }

  async deleteExpediente(id) {
    const response = await api.delete(`/expedientes/${id}`);
    return response.data;
  }
}

export default new ExpedientesService();