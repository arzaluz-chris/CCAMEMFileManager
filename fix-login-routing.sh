#!/bin/bash
# === ARCHIVO: fix-login-routing.sh ===
# Script para solucionar el problema de pantalla en blanco después del login

echo "🔧 Solucionando problema de enrutamiento en CCAMEM..."
echo "===================================================="

# 1. Corregir App.jsx - Problema con la estructura de rutas
echo "1️⃣ Actualizando App.jsx con la estructura correcta de rutas..."

cat > ~/Documents/ccamem-archivo/frontend/src/App.jsx << 'EOF'
// === ARCHIVO: frontend/src/App.jsx ===
// Componente principal de la aplicación con todas las rutas configuradas

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from "./components/common/PrivateRoute";
import Layout from "./components/common/Layout";

// Importar todas las páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExpedientesList from './pages/ExpedientesList';
import ExpedienteForm from './pages/ExpedienteForm';
import ExpedienteDetail from './pages/ExpedienteDetail';
import Digitalizacion from './pages/Digitalizacion';
import Reportes from './pages/Reportes';
import SISER from './pages/SISER';

// Páginas del catálogo
import CatalogoMain from './pages/catalogo/CatalogoMain';
import Areas from "./pages/catalogo/Areas";
import Secciones from "./pages/catalogo/Secciones";
import Series from "./pages/catalogo/Series";
import Subseries from "./pages/catalogo/Subseries";

// Páginas de administración
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';

// Tema personalizado para CCAMEM
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f06292',
      dark: '#c2185b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
            '&.Mui-focused': {
              boxShadow: '0 2px 12px rgba(25, 118, 210, 0.15)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f0f0f0',
        },
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          color: '#374151',
        },
      },
    },
  },
});

/**
 * Componente principal de la aplicación
 * Maneja el enrutamiento y la configuración global del tema
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* ==================== RUTAS PÚBLICAS ==================== */}
            <Route path="/login" element={<Login />} />
            
            {/* ==================== RUTAS PROTEGIDAS ==================== */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                
                {/* ========== RUTAS PRINCIPALES ========== */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* ========== GESTIÓN DE EXPEDIENTES ========== */}
                <Route path="/expedientes" element={<ExpedientesList />} />
                <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
                <Route path="/expedientes/editar/:id" element={<ExpedienteForm />} />
                <Route path="/expedientes/:id" element={<ExpedienteDetail />} />
                
                {/* ========== CATÁLOGO DE CLASIFICACIÓN ARCHIVÍSTICA ========== */}
                <Route path="/catalogo" element={<CatalogoMain />} />
                <Route path="/catalogo/areas" element={<Areas />} />
                <Route path="/catalogo/secciones" element={<Secciones />} />
                <Route path="/catalogo/series" element={<Series />} />
                <Route path="/catalogo/subseries" element={<Subseries />} />
                
                {/* ========== DIGITALIZACIÓN ========== */}
                <Route path="/digitalizacion" element={<Digitalizacion />} />
                
                {/* ========== REPORTES ========== */}
                <Route path="/reportes" element={<Reportes />} />
                
                {/* ========== AUTOMATIZACIÓN SISER ========== */}
                <Route path="/siser" element={<SISER />} />
                
                {/* ========== ADMINISTRACIÓN (Solo Admins) ========== */}
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/configuracion" element={<Configuracion />} />
                
              </Route>
            </Route>
            
            {/* ==================== RUTA 404 ==================== */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
EOF

# 2. Corregir PrivateRoute.jsx - Usar Outlet en lugar de children
echo "2️⃣ Actualizando PrivateRoute.jsx..."

cat > ~/Documents/ccamem-archivo/frontend/src/components/common/PrivateRoute.jsx << 'EOF'
// === ARCHIVO: frontend/src/components/common/PrivateRoute.jsx ===
// Componente para proteger rutas que requieren autenticación

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente de ruta privada que requiere autenticación
 */
const PrivateRoute = ({ roles = [] }) => {
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
        to="/login" 
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

  // Todo está bien, renderizar el contenido usando Outlet
  console.log('✅ PrivateRoute - Acceso permitido');
  return <Outlet />;
};

export default PrivateRoute;
EOF

# 3. Verificar y corregir el contexto de autenticación
echo "3️⃣ Corrigiendo AuthContext para manejar mejor el estado inicial..."

cat > ~/Documents/ccamem-archivo/frontend/src/context/AuthContext.jsx << 'EOF'
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
EOF

# 4. Agregar ruta de verificación en el backend si no existe
echo "4️⃣ Verificando ruta /auth/verify en el backend..."

# Verificar si la ruta existe en authController.js
if ! grep -q "const verify" ~/Documents/ccamem-archivo/backend/controllers/authController.js; then
  echo "Agregando función verify al authController..."
  
  # Agregar la función verify antes del module.exports
  sed -i.bak '/module.exports = {/i\
/**\
 * Verificar token JWT\
 * @param {Request} req - Request de Express\
 * @param {Response} res - Response de Express\
 */\
const verify = async (req, res) => {\
    try {\
        // El middleware verifyToken ya validó el token y agregó req.user\
        if (!req.user) {\
            return res.status(401).json({\
                success: false,\
                error: "Token inválido"\
            });\
        }\
        \
        // Buscar datos actualizados del usuario\
        const userQuery = `\
            SELECT \
                u.id, \
                u.nombre, \
                u.email, \
                u.rol, \
                u.area,\
                u.activo,\
                a.nombre as area_nombre\
            FROM usuarios u\
            LEFT JOIN areas a ON u.area = a.codigo\
            WHERE u.id = $1\
        `;\
        \
        const userResult = await pool.query(userQuery, [req.user.id]);\
        \
        if (userResult.rows.length === 0) {\
            return res.status(404).json({\
                success: false,\
                error: "Usuario no encontrado"\
            });\
        }\
        \
        const user = userResult.rows[0];\
        \
        // Verificar que el usuario esté activo\
        if (!user.activo) {\
            return res.status(401).json({\
                success: false,\
                error: "Usuario inactivo"\
            });\
        }\
        \
        res.json({\
            success: true,\
            user: {\
                id: user.id,\
                nombre: user.nombre,\
                email: user.email,\
                rol: user.rol,\
                area: user.area,\
                area_nombre: user.area_nombre\
            }\
        });\
        \
    } catch (error) {\
        console.error("Error en verify:", error);\
        res.status(500).json({\
            success: false,\
            error: "Error al verificar token"\
        });\
    }\
};\
\
' ~/Documents/ccamem-archivo/backend/controllers/authController.js

  # Agregar verify al module.exports
  sed -i.bak 's/module.exports = {/module.exports = {\
    verify,/' ~/Documents/ccamem-archivo/backend/controllers/authController.js
fi

# 5. Verificar que la ruta esté en auth.js
if ! grep -q "router.get('/verify'" ~/Documents/ccamem-archivo/backend/routes/auth.js; then
  echo "Agregando ruta /verify a auth.js..."
  
  # Agregar la ruta después de la línea de login
  sed -i.bak '/router.post.*login/a\
\
// Verificar token\
router.get("/verify", verifyToken, authController.verify);' ~/Documents/ccamem-archivo/backend/routes/auth.js
fi

echo ""
echo "🎉 ¡Correcciones aplicadas exitosamente!"
echo "========================================"
echo ""
echo "📋 Cambios realizados:"
echo "✅ App.jsx actualizado con estructura correcta de rutas"
echo "✅ PrivateRoute corregido para usar Outlet"
echo "✅ AuthContext mejorado con mejor manejo de estado"
echo "✅ Ruta /auth/verify agregada al backend (si faltaba)"
echo ""
echo "🚀 Pasos siguientes:"
echo "1. Reinicia el backend: cd ~/Documents/ccamem-archivo/backend && npm run dev"
echo "2. Reinicia el frontend: cd ~/Documents/ccamem-archivo/frontend && npm run dev"
echo "3. Intenta hacer login nuevamente"
echo ""
echo "🔍 Si aún hay problemas, revisa la consola del navegador (F12)"