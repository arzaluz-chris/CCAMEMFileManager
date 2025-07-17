import api from './api';

class ReportesService {
  async generarReporte(params = {}, options = {}) {
    const response = await api.get('/reportes/generar', {
      params,
      responseType: options.preview ? 'json' : 'blob'
    });
    return response.data;
  }
}

export default new ReportesService();
