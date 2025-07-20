import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
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
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/expedientes" element={<ExpedientesList />} />
                  <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
                  <Route path="/expedientes/editar/:id" element={<ExpedienteForm />} />
                  <Route path="/expedientes/:id" element={<ExpedienteDetail />} />
                  <Route path="/catalogo" element={<CatalogoMain />} />
                  <Route path="/catalogo/areas" element={<Areas />} />
                  <Route path="/catalogo/secciones" element={<Secciones />} />
                  <Route path="/catalogo/series" element={<Series />} />
                  <Route path="/catalogo/subseries" element={<Subseries />} />
                  <Route path="/digitalizacion" element={<Digitalizacion />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/siser" element={<SISER />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
