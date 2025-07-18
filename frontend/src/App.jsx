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
import CatalogoMain from './pages/catalogo/CatalogoMain'; // NUEVA PÁGINA PRINCIPAL MEJORADA
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
      main: '#1976d2', // Azul institucional
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
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
                {/* Página principal del catálogo - NUEVA RUTA MEJORADA */}
                <Route path="/catalogo" element={<CatalogoMain />} />
                
                {/* Secciones específicas del catálogo */}
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