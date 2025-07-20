import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';

const Series = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Catálogo de Series
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="info">
          Página de Series - En construcción
        </Alert>
      </Paper>
    </Box>
  );
};

export default Series;
