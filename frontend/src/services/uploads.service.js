import api from './api';

class UploadsService {
  async subirDocumento(expedienteId, file, data = {}) {
    const formData = new FormData();
    formData.append('archivo', file);
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    return api.post(`/uploads/expediente/${expedienteId}/documento`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async subirMultiples(expedienteId, files = []) {
    const formData = new FormData();
    files.forEach(f => formData.append('archivos', f));
    return api.post(`/uploads/expediente/${expedienteId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async obtenerDocumentos(expedienteId) {
    const res = await api.get(`/uploads/expediente/${expedienteId}/documentos`);
    return res.data;
  }

  async descargarDocumento(id) {
    const res = await api.get(`/uploads/documento/${id}/descargar`, { responseType: 'blob' });
    return res.data;
  }

  async eliminarDocumento(id) {
    return api.delete(`/uploads/documento/${id}`);
  }
}

export default new UploadsService();
