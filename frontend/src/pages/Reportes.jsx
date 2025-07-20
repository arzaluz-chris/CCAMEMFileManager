import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import {
  Description as ReportIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';

const Reportes = () => {
  const reportes = [
    {
      id: 'inventario',
      titulo: 'Inventario General',
      descripcion: 'Listado completo de expedientes'
    },
    {
      id: 'transferencia',
      titulo: 'Vale de Transferencia',
      descripcion: 'Documento para transferencia de expedientes'
    },
    {
      id: 'estadisticas',
      titulo: 'Estadísticas',
      descripcion: 'Análisis estadístico del archivo'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Reportes del Sistema
      </Typography>

      <Grid container spacing={3}>
        {reportes.map((reporte) => (
          <Grid item xs={12} md={4} key={reporte.id}>
            <Card elevation={3}>
              <CardContent>
                <ReportIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {reporte.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reporte.descripcion}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                >
                  Generar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reportes;
