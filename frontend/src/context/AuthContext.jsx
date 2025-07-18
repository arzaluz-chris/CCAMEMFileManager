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
      
      // IMPORTANTE: Usar el mismo nombre de token en toda la aplicación
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
        
        // Si el error es 401 (no autorizado), limpiar datos
        if (verifyError.response?.status === 401) {
          console.log('🔄 Token expirado o inválido, limpiando sesión');
          clearAuthData();
        } else {
          // Para otros errores, mantener la sesión pero marcar error
          console.log('⚠️ Error de red, manteniendo sesión local');
          if (userData) {
            try {
              setUser(JSON.parse(userData));
            } catch (parseError) {
              console.log('❌ Error parseando datos de usuario');
              clearAuthData();
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      clearAuthData();
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
   * Iniciar sesión
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Intentando login para:', email);

      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      console.log('📝 Respuesta del login:', response.data);

      if (response.data.success && response.data.token) {
        console.log('✅ Login exitoso, guardando datos');
        
        // Guardar token y datos del usuario
        localStorage.setItem('ccamem_token', response.data.token);
        localStorage.setItem('ccamem_user', JSON.stringify(response.data.user));
        
        // Actualizar estado
        setUser(response.data.user);
        setError(null);
        
        console.log('✅ Datos guardados correctamente');
        return { success: true, user: response.data.user };
      } else {
        console.log('❌ Login fallido:', response.data.error);
        setError(response.data.error || 'Error en el login');
        return { success: false, error: response.data.error };
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor. Intente más tarde.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
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