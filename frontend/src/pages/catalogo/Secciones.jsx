import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

const Secciones = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Catálogo de Secciones
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="info">
          Página de Secciones - En construcción
        </Alert>
      </Paper>
    </Box>
  );
};

export default Secciones;
