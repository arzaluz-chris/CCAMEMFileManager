// === ARCHIVO: frontend/src/services/auth.service.js ===
import api from './api';

class AuthService {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('ccamem_token', response.data.token);
      localStorage.setItem('ccamem_user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  logout() {
    localStorage.removeItem('ccamem_token');
    localStorage.removeItem('ccamem_user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('ccamem_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }
}

export default new AuthService();