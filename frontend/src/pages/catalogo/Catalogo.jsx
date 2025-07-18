// === ARCHIVO: frontend/src/pages/catalogo/Catalogo.jsx ===
// Página principal del Catálogo de Clasificación Archivística CCAMEM

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Category as CategoryIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  AccountTree as AccountTreeIcon,
  Business as BusinessIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import catalogoService from '../../services/catalogo.service';

/**
 * Componente principal del catálogo de clasificación archivística
 * Muestra un dashboard con acceso a todas las secciones del catálogo
 */
function Catalogo() {
  const navigate = useNavigate();
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    areas: 0,
    secciones: 0,
    series: 0,
    subseries: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  /**
   * Carga las estadísticas del catálogo
   */
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas de cada nivel del catálogo
      const [areasRes, seccionesRes, seriesRes, subseriesRes] = await Promise.all([
        catalogoService.getAreas(),
        catalogoService.getSecciones(),
        catalogoService.getSeries(),
        catalogoService.getSubseries()
      ]);

      setEstadisticas({
        areas: areasRes.data?.length || 0,
        secciones: seccionesRes.data?.length || 0,
        series: seriesRes.data?.length || 0,
        subseries: subseriesRes.data?.length || 0
      });

    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas del catálogo');
    } finally {
      setLoading(false);
    }
  };

  // Configuración de las secciones del catálogo
  const secciones = [
    {
      id: 'areas',
      titulo: 'Áreas',
      descripcion: 'Gestión de áreas organizacionales que generan documentos',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      ruta: '/catalogo/areas',
      estadistica: estadisticas.areas
    },
    {
      id: 'secciones',
      titulo: 'Secciones',
      descripcion: 'Secciones documentales dentro de cada área',
      icon: <FolderIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      ruta: '/catalogo/secciones',
      estadistica: estadisticas.secciones
    },
    {
      id: 'series',
      titulo: 'Series',
      descripcion: 'Series documentales por tipo de trámite o función',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      ruta: '/catalogo/series',
      estadistica: estadisticas.series
    },
    {
      id: 'subseries',
      titulo: 'Subseries',
      descripcion: 'Subdivisiones especializadas de las series documentales',
      icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      ruta: '/catalogo/subseries',
      estadistica: estadisticas.subseries
    }
  ];

  /**
   * Navegar a una sección específica del catálogo
   */
  const navegarA = (ruta) => {
    navigate(ruta);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado con breadcrumbs */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="/dashboard" 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Catálogo
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          Catálogo de Clasificación Archivística
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          Sistema de organización y clasificación de documentos de la CCAMEM. 
          Gestiona la estructura jerárquica de áreas, secciones, series y subseries documentales.
        </Typography>
      </Paper>

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas generales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen del Catálogo
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip 
              icon={<BusinessIcon />} 
              label={`${estadisticas.areas} Áreas`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<FolderIcon />} 
              label={`${estadisticas.secciones} Secciones`} 
              color="success" 
              variant="outlined" 
            />
            <Chip 
              icon={<DescriptionIcon />} 
              label={`${estadisticas.series} Series`} 
              color="warning" 
              variant="outlined" 
            />
            <Chip 
              icon={<AccountTreeIcon />} 
              label={`${estadisticas.subseries} Subseries`} 
              color="secondary" 
              variant="outlined" 
            />
          </Stack>
        )}
      </Paper>

      {/* Grid de secciones del catálogo */}
      <Grid container spacing={3}>
        {secciones.map((seccion) => (
          <Grid item xs={12} sm={6} md={3} key={seccion.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              <CardActionArea 
                onClick={() => navegarA(seccion.ruta)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  {/* Icono principal */}
                  <Box 
                    sx={{ 
                      color: seccion.color,
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: `${seccion.color}15`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {seccion.icon}
                  </Box>

                  {/* Título */}
                  <Typography variant="h6" component="h2" gutterBottom>
                    {seccion.titulo}
                  </Typography>

                  {/* Descripción */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, minHeight: 60 }}
                  >
                    {seccion.descripcion}
                  </Typography>

                  {/* Estadística */}
                  <Box>
                    <Chip
                      label={`${seccion.estadistica} registros`}
                      size="small"
                      sx={{ 
                        backgroundColor: `${seccion.color}20`,
                        color: seccion.color,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Información adicional */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          ℹ️ Información del Catálogo
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              <ArchiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Jerarquía del Catálogo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              El catálogo sigue una estructura jerárquica: <strong>Área → Sección → Serie → Subserie</strong>. 
              Cada nivel permite una clasificación más específica de los documentos.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gestión de Clasificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Utiliza cada sección para crear, editar y organizar la estructura de clasificación 
              documental de acuerdo a las necesidades de la CCAMEM.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Catalogo;