import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  People as PeopleIcon
} from '@mui/icons-material';

/**
 * Componente para la gestión de usuarios del sistema
 * TODO: Implementar funcionalidad completa
 */
const Usuarios = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Gestión de Usuarios
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="info">
          <AlertTitle>Módulo en desarrollo</AlertTitle>
          Esta sección permitirá:
          <ul>
            <li>Crear y editar usuarios del sistema</li>
            <li>Asignar roles y permisos</li>
            <li>Gestionar accesos y contraseñas</li>
            <li>Ver historial de actividad</li>
            <li>Configurar notificaciones por usuario</li>
          </ul>
        </Alert>
      </Paper>
    </Box>
  );
};

export default Usuarios;