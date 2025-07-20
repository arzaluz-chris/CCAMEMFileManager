// === ARCHIVO: frontend/src/context/AuthContext.jsx ===
// Contexto de autenticación unificado para el sistema CCAMEM

import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../services/api.service';

const AuthContext = createContext(null);

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Verificar autenticación al cargar la aplicación
   */
  useEffect(() => {
    console.log('🔄 AuthProvider: Iniciando verificación de autenticación');
    checkAuthStatus();
  }, []);

  /**
   * Verificar el estado de autenticación
   */
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('ccamem_token');
      const userData = localStorage.getItem('ccamem_user');

      console.log('🔍 Verificando estado de autenticación...');
      console.log('Token encontrado:', !!token);
      console.log('Datos de usuario encontrados:', !!userData);

      if (!token) {
        console.log('❌ No hay token almacenado');
        setLoading(false);
        return;
      }

      // Verificar si el token es válido haciendo una petición al backend
      try {
        console.log('📡 Verificando token con el backend...');
        const response = await apiClient.get('/auth/verify');
        
        console.log('📥 Respuesta de verificación:', response.data);

        if (response.data.success && response.data.user) {
          console.log('✅ Token válido, usuario autenticado:', response.data.user.email);
          setUser(response.data.user);
          setError(null);
        } else {
          console.log('❌ Token inválido según backend, limpiando sesión');
          clearAuthData();
        }
      } catch (verifyError) {
        console.log('❌ Error verificando token:', verifyError.message);
        
        // Si el error es 401, limpiar datos
        if (verifyError.response?.status === 401) {
          console.log('🔄 Token expirado o inválido, limpiando sesión');
          clearAuthData();
        } else if (userData) {
          // Si hay error de red pero tenemos datos de usuario, mantener la sesión
          console.log('⚠️ Error de red, pero manteniendo datos locales');
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } catch (e) {
            console.error('Error parseando datos de usuario:', e);
            clearAuthData();
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error crítico en checkAuthStatus:', error);
      setError('Error verificando autenticación');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar datos de autenticación
   */
  const clearAuthData = () => {
    console.log('🧹 Limpiando datos de autenticación');
    localStorage.removeItem('ccamem_token');
    localStorage.removeItem('ccamem_user');
    setUser(null);
    setError(null);
  };

  /**
   * Login del usuario
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando proceso de login para:', email);
      
      const response = await apiClient.post('/auth/login', { email, password });
      
      console.log('📥 Respuesta de login:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        // Guardar token y datos de usuario
        localStorage.setItem('ccamem_token', response.data.token);
        localStorage.setItem('ccamem_user', JSON.stringify(response.data.user));
        
        // Actualizar estado
        setUser(response.data.user);
        setError(null);
        
        console.log('✅ Login exitoso:', response.data.user.email);
        
        return { success: true, user: response.data.user };
      } else {
        const errorMessage = response.data.error || 'Error en el login';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor. Intente más tarde.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Opcional: notificar al backend sobre el logout
      try {
        await apiClient.post('/auth/logout');
      } catch (logoutError) {
        console.log('⚠️ Error notificando logout al backend:', logoutError.message);
      }
      
      // Limpiar datos locales
      clearAuthData();
      
      console.log('✅ Sesión cerrada correctamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Aún así limpiar datos locales
      clearAuthData();
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (userData) => {
    console.log('🔄 Actualizando datos del usuario:', userData);
    setUser(userData);
    localStorage.setItem('ccamem_user', JSON.stringify(userData));
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (roles) => {
    if (!user) return false;
    
    const userRoles = Array.isArray(user.rol) ? user.rol : [user.rol];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return requiredRoles.some(role => userRoles.includes(role));
  };

  // Valores del contexto
  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    hasRole,
    checkAuthStatus,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
