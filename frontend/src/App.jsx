import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from "./components/common/PrivateRoute";
import Layout from "./components/common/Layout";
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expedientes from './pages/Expedientes';
import ExpedienteForm from './pages/ExpedienteForm';
import ExpedienteDetail from './pages/ExpedienteDetail';
import Digitalizacion from './pages/Digitalizacion';
import Reportes from './pages/Reportes';
import SISER from './pages/SISER';
import Areas from "./pages/catalogo/Areas";
import Secciones from "./pages/catalogo/Secciones";
import Series from "./pages/catalogo/Series";
import Subseries from "./pages/catalogo/Subseries";
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';

// Tema personalizado para CCAMEM
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul institucional
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

/**
 * Componente principal de la aplicación
 * Maneja el enrutamiento y la configuración global
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                {/* Dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Gestión de Expedientes */}
                <Route path="/expedientes" element={<Expedientes />} />
                <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
                <Route path="/expedientes/editar/:id" element={<ExpedienteForm />} />
                <Route path="/expedientes/:id" element={<ExpedienteDetail />} />
                
                {/* Digitalización */}
                <Route path="/digitalizacion" element={<Digitalizacion />} />
                
                {/* Reportes */}
                <Route path="/reportes" element={<Reportes />} />
                
                {/* Automatización SISER */}
                <Route path="/siser" element={<SISER />} />
                
                {/* Catálogo de Clasificación Archivística */}
                <Route path="/catalogo/areas" element={<Areas />} />
                <Route path="/catalogo/secciones" element={<Secciones />} />
                <Route path="/catalogo/series" element={<Series />} />
                <Route path="/catalogo/subseries" element={<Subseries />} />
                
                {/* Administración */}
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>
            </Route>
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;