// === ARCHIVO: frontend/src/pages/catalogo/CatalogoMain.jsx ===
// Página principal del catálogo con navegación mejorada y búsqueda

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
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Fab,
  Tooltip,
  Container
} from '@mui/material';
import {
  Category as CategoryIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  AccountTree as AccountTreeIcon,
  Business as BusinessIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import catalogoService from '../../services/catalogo.service';

/**
 * Página principal del catálogo de clasificación archivística
 * Interfaz mejorada con búsqueda y estadísticas en tiempo real
 */
function CatalogoMain() {
  const navigate = useNavigate();
  
  // Estados para datos
  const [estadisticas, setEstadisticas] = useState({
    areas: 0,
    secciones: 0,
    series: 0,
    subseries: 0
  });
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Buscar cuando cambie el término de búsqueda (con debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        buscarEnCatalogo();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Carga las estadísticas del catálogo
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
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
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos del catálogo');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar en todo el catálogo
   */
  const buscarEnCatalogo = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const response = await catalogoService.buscarEnCatalogo(searchTerm);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Navegar a una sección específica del catálogo
   */
  const navegarA = (ruta) => {
    navigate(ruta);
  };

  /**
   * Limpiar búsqueda
   */
  const limpiarBusqueda = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  // Configuración de las secciones del catálogo
  const secciones = [
    {
      id: 'areas',
      titulo: 'Áreas',
      descripcion: 'Gestión de áreas organizacionales que generan documentos',
      icon: <BusinessIcon sx={{ fontSize: 48 }} />,
      color: '#1976d2',
      ruta: '/catalogo/areas',
      estadistica: estadisticas.areas,
      acciones: ['Ver', 'Crear', 'Editar']
    },
    {
      id: 'secciones',
      titulo: 'Secciones',
      descripcion: 'Secciones documentales dentro de cada área',
      icon: <FolderIcon sx={{ fontSize: 48 }} />,
      color: '#388e3c',
      ruta: '/catalogo/secciones',
      estadistica: estadisticas.secciones,
      acciones: ['Ver', 'Crear', 'Editar']
    },
    {
      id: 'series',
      titulo: 'Series',
      descripcion: 'Series documentales por tipo de trámite o función',
      icon: <DescriptionIcon sx={{ fontSize: 48 }} />,
      color: '#f57c00',
      ruta: '/catalogo/series',
      estadistica: estadisticas.series,
      acciones: ['Ver', 'Crear', 'Editar']
    },
    {
      id: 'subseries',
      titulo: 'Subseries',
      descripcion: 'Subdivisiones especializadas de las series documentales',
      icon: <AccountTreeIcon sx={{ fontSize: 48 }} />,
      color: '#7b1fa2',
      ruta: '/catalogo/subseries',
      estadistica: estadisticas.subseries,
      acciones: ['Ver', 'Crear', 'Editar']
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Encabezado con breadcrumbs */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: 'white' } }}>
          <Link 
            color="inherit" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            Dashboard
          </Link>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Catálogo de Clasificación
          </Typography>
        </Breadcrumbs>

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
          Catálogo de Clasificación Archivística
        </Typography>
        
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Sistema integral de organización y clasificación documental de la CCAMEM
        </Typography>
      </Paper>

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <IconButton 
            size="small" 
            onClick={cargarDatos}
            sx={{ ml: 1, color: 'inherit' }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Alert>
      )}

      {/* Barra de búsqueda */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Búsqueda en el Catálogo
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Buscar en áreas, secciones, series o subseries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isSearching && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {searchResults.length} resultado(s) encontrado(s):
            </Typography>
            <Stack spacing={1}>
              {searchResults.slice(0, 5).map((resultado, index) => (
                <Paper 
                  key={index}
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => navegarA(resultado.ruta)}
                >
                  <Typography variant="subtitle2">
                    {resultado.tipo}: {resultado.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {resultado.codigo} - {resultado.descripcion}
                  </Typography>
                </Paper>
              ))}
              {searchResults.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  ... y {searchResults.length - 5} más
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Estadísticas generales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          Resumen del Catálogo
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {estadisticas.areas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Áreas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {estadisticas.secciones}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Secciones
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  {estadisticas.series}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Series
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary.main" fontWeight={700}>
                  {estadisticas.subseries}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Subseries
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Grid de secciones del catálogo */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        📁 Gestión del Catálogo
      </Typography>
      
      <Grid container spacing={3}>
        {secciones.map((seccion) => (
          <Grid item xs={12} sm={6} lg={3} key={seccion.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.shadows[12],
                  '& .seccion-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                  }
                }
              }}
            >
              <CardActionArea 
                onClick={() => navegarA(seccion.ruta)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  {/* Icono principal con animación */}
                  <Box 
                    className="seccion-icon"
                    sx={{ 
                      color: seccion.color,
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: `${seccion.color}15`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: `linear-gradient(45deg, ${seccion.color}20, ${seccion.color}10)`,
                        animation: 'pulse 2s infinite',
                      }
                    }}
                  >
                    {seccion.icon}
                  </Box>

                  {/* Título */}
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {seccion.titulo}
                  </Typography>

                  {/* Descripción */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, minHeight: 40, lineHeight: 1.4 }}
                  >
                    {seccion.descripcion}
                  </Typography>

                  {/* Estadística destacada */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={`${seccion.estadistica} registros`}
                      size="medium"
                      sx={{ 
                        backgroundColor: `${seccion.color}20`,
                        color: seccion.color,
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    />
                  </Box>

                  {/* Acciones disponibles */}
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {seccion.acciones.map((accion, index) => (
                      <Chip
                        key={index}
                        label={accion}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.75rem',
                          borderColor: `${seccion.color}60`,
                          color: seccion.color
                        }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Información adicional y guías */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ArchiveIcon sx={{ mr: 1, color: 'primary.main' }} />
              Jerarquía del Catálogo
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              El catálogo sigue una estructura jerárquica organizada de la siguiente manera:
            </Typography>

            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1, fontSize: 16, color: '#1976d2' }} />
                <strong>Área</strong> → Unidad organizacional
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', pl: 2 }}>
                <FolderIcon sx={{ mr: 1, fontSize: 16, color: '#388e3c' }} />
                <strong>Sección</strong> → División funcional
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', pl: 4 }}>
                <DescriptionIcon sx={{ mr: 1, fontSize: 16, color: '#f57c00' }} />
                <strong>Serie</strong> → Tipo documental
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', pl: 6 }}>
                <AccountTreeIcon sx={{ mr: 1, fontSize: 16, color: '#7b1fa2' }} />
                <strong>Subserie</strong> → Especialización
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              Gestión de Clasificaciones
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Utiliza cada sección para crear, editar y organizar la estructura de clasificación 
              documental de acuerdo a las necesidades de la CCAMEM.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>Recomendaciones:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Mantén la consistencia en la nomenclatura
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Revisa periódicamente la estructura
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Documenta los cambios realizados
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Botón flotante para acciones rápidas */}
      <Tooltip title="Acciones rápidas">
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          onClick={() => navigate('/expedientes/nuevo')}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Estilos CSS personalizados */}
      <style>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Container>
  );
}

export default CatalogoMain;