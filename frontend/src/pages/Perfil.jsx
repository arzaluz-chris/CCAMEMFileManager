// === ARCHIVO: frontend/src/pages/Perfil.jsx ===
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Perfil = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4">Mi Perfil</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Esta página está en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Perfil;