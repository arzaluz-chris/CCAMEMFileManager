// === ARCHIVO: frontend/src/context/AuthContext.jsx ===
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

// Hook de conveniencia para consumir el contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        // Verificar si el token sigue siendo válido
        const result = await authService.verifyToken();
        if (result.valid) {
          setUser(currentUser);
        } else {
          authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
