// === ARCHIVO: frontend/src/App.jsx ===
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esLocale from 'date-fns/locale/es';

import theme from './styles/theme';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/common/Layout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExpedientesList from './pages/ExpedientesList';
import ExpedienteForm from './pages/ExpedienteForm';
import ExpedienteDetail from './pages/ExpedienteDetail';
import Reportes from './pages/Reportes';
import Digitalizacion from './pages/Digitalizacion';
import SISER from './pages/SISER';
import Perfil from './pages/Perfil';

// Catálogo
import Areas from './pages/catalogo/Areas';
import Secciones from './pages/catalogo/Secciones';
import Series from './pages/catalogo/Series';
import Subseries from './pages/catalogo/Subseries';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Expedientes */}
                  <Route path="/expedientes" element={<ExpedientesList />} />
                  <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
                  <Route path="/expedientes/:id" element={<ExpedienteDetail />} />
                  <Route path="/expedientes/:id/editar" element={<ExpedienteForm />} />
                  
                  {/* Catálogo */}
                  <Route path="/catalogo/areas" element={<Areas />} />
                  <Route path="/catalogo/secciones" element={<Secciones />} />
                  <Route path="/catalogo/series" element={<Series />} />
                  <Route path="/catalogo/subseries" element={<Subseries />} />
                  
                  {/* Otras secciones */}
                  <Route path="/digitalizacion" element={<Digitalizacion />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/siser" element={<SISER />} />
                  <Route path="/perfil" element={<Perfil />} />
                </Route>
              </Route>
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;