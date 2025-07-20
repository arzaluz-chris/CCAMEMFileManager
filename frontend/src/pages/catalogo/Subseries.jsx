import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

const Subseries = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Catálogo de Subseries
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="info">
          Página de Subseries - En construcción
        </Alert>
      </Paper>
    </Box>
  );
};

export default Subseries;
