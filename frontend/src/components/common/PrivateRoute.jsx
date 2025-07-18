// === ARCHIVO: frontend/src/components/common/PrivateRoute.jsx ===
// Componente para proteger rutas que requieren autenticación

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente que protege las rutas que requieren autenticación
 * Redirige a login si el usuario no está autenticado
 */
const PrivateRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('🔒 PrivateRoute - Estado:', { 
    user: !!user, 
    loading, 
    isAuthenticated, 
    pathname: location.pathname 
  });

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!isAuthenticated || !user) {
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  console.log('✅ Usuario autenticado, renderizando rutas protegidas');

  // Si hay usuario autenticado, renderizar las rutas hijas
  return <Outlet />;
};

export default PrivateRoute;