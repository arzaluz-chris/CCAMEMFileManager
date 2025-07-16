// === ARCHIVO: frontend/src/services/catalogo.service.js ===
import api from './api';

class CatalogoService {
  async getAreas() {
    const response = await api.get('/catalogo/areas');
    return response.data;
  }

  async getSecciones(fondoId = null) {
    const params = fondoId ? { fondo_id: fondoId } : {};
    const response = await api.get('/catalogo/secciones', { params });
    return response.data;
  }

  async getSeries(seccionId = null) {
    const params = seccionId ? { seccion_id: seccionId } : {};
    const response = await api.get('/catalogo/series', { params });
    return response.data;
  }

  async getSubseries(serieId = null) {
    const params = serieId ? { serie_id: serieId } : {};
    const response = await api.get('/catalogo/subseries', { params });
    return response.data;
  }

  async getCatalogoCompleto() {
    const response = await api.get('/catalogo/completo');
    return response.data;
  }

  async buscarEnCatalogo(query) {
    const response = await api.get('/catalogo/buscar', { params: { q: query } });
    return response.data;
  }

  async getValoresDocumentales() {
    const response = await api.get('/catalogo/valores-documentales');
    return response.data;
  }
}

export default new CatalogoService();