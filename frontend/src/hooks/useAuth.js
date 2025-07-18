// === ARCHIVO: frontend/src/hooks/useAuth.js ===
// Hook personalizado para manejar la autenticación en toda la aplicación

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personalizado para acceder al contexto de autenticación
 * Simplifica el acceso a los datos y funciones de autenticación
 * 
 * @returns {Object} Objeto con datos y funciones de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Verificar que el hook se use dentro del AuthProvider
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default useAuth;