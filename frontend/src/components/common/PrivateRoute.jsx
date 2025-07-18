// === ARCHIVO: frontend/src/components/common/PrivateRoute.jsx ===
// Componente para proteger rutas que requieren autenticación

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente de ruta privada que requiere autenticación
 * @param {Object} props - Props del componente
 * @param {React.Component} props.children - Componente hijo a renderizar si está autenticado
 * @param {Array|string} props.roles - Roles requeridos para acceder a esta ruta
 * @param {string} props.redirectTo - Ruta a la que redirigir si no está autenticado
 */
const PrivateRoute = ({ 
  children, 
  roles = [], 
  redirectTo = '/login' 
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  console.log('🔒 PrivateRoute - Verificando acceso:', {
    path: location.pathname,
    user: user?.email,
    loading,
    isAuthenticated,
    requiredRoles: roles
  });

  // Mostrar cargando mientras se verifica la autenticación
  if (loading) {
    console.log('⏳ PrivateRoute - Cargando autenticación...');
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    console.log('❌ PrivateRoute - Usuario no autenticado, redirigiendo a login');
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si se especificaron roles, verificar que el usuario los tenga
  if (roles.length > 0) {
    if (!hasRole(roles)) {
      console.log('❌ PrivateRoute - Usuario sin permisos:', {
        userRole: user.rol,
        requiredRoles: roles
      });
      
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
        >
          <Typography variant="h6" color="error">
            Sin permisos suficientes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            No tiene permisos para acceder a esta página
          </Typography>
        </Box>
      );
    }
  }

  // Todo está bien, renderizar el contenido
  console.log('✅ PrivateRoute - Acceso permitido');
  return <>{children}</>;
};

/**
 * Wrapper para rutas que requieren roles específicos
 */
export const AdminRoute = ({ children }) => (
  <PrivateRoute roles={['admin']}>
    {children}
  </PrivateRoute>
);

/**
 * Wrapper para rutas que requieren rol de supervisor o admin
 */
export const SupervisorRoute = ({ children }) => (
  <PrivateRoute roles={['admin', 'supervisor']}>
    {children}
  </PrivateRoute>
);

/**
 * Wrapper para rutas que requieren cualquier rol autenticado
 */
export const AuthenticatedRoute = ({ children }) => (
  <PrivateRoute>
    {children}
  </PrivateRoute>
);

export default PrivateRoute;