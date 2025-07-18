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
    checkAuthStatus();
  }, []);

  /**
   * Verificar el estado de autenticación
   */
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      console.log('🔍 Verificando estado de autenticación...');
      console.log('Token encontrado:', !!token);
      console.log('Datos de usuario encontrados:', !!userData);

      if (!token || !userData) {
        console.log('❌ No hay token o datos de usuario');
        setLoading(false);
        return;
      }

      // Verificar si el token es válido
      try {
        const response = await apiClient.get('/auth/verify');
        
        if (response.data.success && response.data.user) {
          console.log('✅ Token válido, usuario autenticado:', response.data.user.email);
          setUser(response.data.user);
        } else {
          console.log('❌ Token inválido, limpiando sesión');
          clearAuthData();
        }
      } catch (verifyError) {
        console.log('❌ Error verificando token:', verifyError.message);
        clearAuthData();
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

      if (response.data.success && response.data.token && response.data.user) {
        // Guardar token y datos del usuario
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Actualizar estado
        setUser(response.data.user);
        setError(null);

        console.log('✅ Login exitoso, usuario:', response.data.user.email);

        return {
          success: true,
          user: response.data.user
        };
      } else {
        throw new Error('Respuesta de login inválida');
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error al iniciar sesión';
      
      setError(errorMessage);
      clearAuthData();

      return {
        success: false,
        error: errorMessage
      };
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

      // Intentar notificar al backend (opcional)
      try {
        await apiClient.post('/auth/logout');
      } catch (logoutError) {
        console.log('⚠️ Error notificando logout al backend (no crítico)');
      }

      // Limpiar datos locales
      clearAuthData();

      console.log('✅ Sesión cerrada exitosamente');

    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Limpiar datos aunque haya error
      clearAuthData();
    }
  };

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (userData) => {
    console.log('🔄 Actualizando datos del usuario');
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Cambiar contraseña
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);

      const response = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      return {
        success: true,
        message: response.data.message || 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al cambiar contraseña';
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role) => {
    return user?.rol === role;
  };

  /**
   * Verificar si el usuario tiene permisos de administrador
   */
  const isAdmin = () => {
    return hasRole('admin');
  };

  /**
   * Verificar si el usuario está autenticado
   */
  const isAuthenticated = () => {
    return !!user;
  };

  // Valor del contexto
  const contextValue = {
    // Estado
    user,
    loading,
    error,
    
    // Funciones de autenticación
    login,
    logout,
    updateUser,
    changePassword,
    checkAuthStatus,
    
    // Funciones de verificación
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    hasRole,
    
    // Datos del usuario
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.rol,
    userArea: user?.area,
    userName: user?.nombre
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;