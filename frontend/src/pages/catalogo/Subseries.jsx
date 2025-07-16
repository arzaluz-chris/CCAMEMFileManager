import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  TablePagination,
  InputAdornment,
  Toolbar,
  Breadcrumbs,
  Link,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FolderSpecial as SubseriesIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';

/**
 * Componente para gestionar las subseries del catálogo de clasificación archivística
 */
const Subseries = () => {
  // Estado principal
  const [subseries, setSubseries] = useState([]);
  const [series, setSeries] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serieFilter, setSerieFilter] = useState('');
  const [seccionFilter, setSeccionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  
  // Estado del diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubserie, setEditingSubserie] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    serie_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Estado de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const navigate = useNavigate();

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar series cuando cambia la sección
  useEffect(() => {
    if (seccionFilter) {
      const seriesFiltradas = series.filter(s => s.seccion_id === seccionFilter);
      if (seriesFiltradas.length > 0 && !seriesFiltradas.find(s => s.id === serieFilter)) {
        setSerieFilter('');
      }
    }
  }, [seccionFilter, series, serieFilter]);

  // Filtrar secciones cuando cambia el área
  useEffect(() => {
    if (areaFilter) {
      const seccionesFiltradas = secciones.filter(s => s.area_id === areaFilter);
      if (seccionesFiltradas.length > 0) {
        if (!seccionesFiltradas.find(s => s.id === seccionFilter)) {
          setSeccionFilter('');
          setSerieFilter('');
        }
      }
    }
  }, [areaFilter, secciones, seccionFilter]);

  /**
   * Carga subseries, series, secciones y áreas
   */
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [subseriesRes, seriesRes, seccionesRes, areasRes] = await Promise.all([
        axios.get('/catalogo/subseries'),
        axios.get('/catalogo/series'),
        axios.get('/catalogo/secciones'),
        axios.get('/catalogo/areas')
      ]);
      setSubseries(subseriesRes.data);
      setSeries(seriesRes.data);
      setSecciones(seccionesRes.data);
      setAreas(areasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre el diálogo para crear o editar
   */
  const abrirDialogo = (subserie = null) => {
    if (subserie) {
      setEditingSubserie(subserie);
      setFormData({
        codigo: subserie.codigo,
        nombre: subserie.nombre,
        descripcion: subserie.descripcion || '',
        serie_id: subserie.serie_id
      });
    } else {
      setEditingSubserie(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        serie_id: ''
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  /**
   * Cierra el diálogo y limpia el estado
   */
  const cerrarDialogo = () => {
    setDialogOpen(false);
    setEditingSubserie(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      serie_id: ''
    });
    setFormErrors({});
  };

  /**
   * Valida el formulario
   */
  const validarFormulario = () => {
    const errors = {};
    
    if (!formData.codigo.trim()) {
      errors.codigo = 'El código es requerido';
    }
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.serie_id) {
      errors.serie_id = 'La serie es requerida';
    }
    
    // Verificar código duplicado
    if (!editingSubserie || editingSubserie.codigo !== formData.codigo) {
      const codigoExiste = subseries.some(subserie => 
        subserie.codigo.toLowerCase() === formData.codigo.toLowerCase() &&
        subserie.serie_id === formData.serie_id
      );
      if (codigoExiste) {
        errors.codigo = 'Este código ya existe en la serie seleccionada';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Guarda la subserie (crear o actualizar)
   */
  const guardarSubserie = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      if (editingSubserie) {
        await axios.put(`/catalogo/subseries/${editingSubserie.id}`, formData);
        mostrarSnackbar('Subserie actualizada correctamente', 'success');
      } else {
        await axios.post('/catalogo/subseries', formData);
        mostrarSnackbar('Subserie creada correctamente', 'success');
      }
      
      cerrarDialogo();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar subserie:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar la subserie';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una subserie
   */
  const eliminarSubserie = async (subserie) => {
    if (!window.confirm(`¿Está seguro de eliminar la subserie "${subserie.nombre}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/catalogo/subseries/${subserie.id}`);
      mostrarSnackbar('Subserie eliminada correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar subserie:', error);
      const mensaje = error.response?.data?.message || 
        'No se puede eliminar la subserie porque tiene expedientes asociados';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra notificación
   */
  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  /**
   * Filtra las subseries según búsqueda y filtros
   */
  const subseriesFiltradas = subseries.filter(subserie => {
    const matchSearch = 
      subserie.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subserie.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subserie.descripcion && subserie.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchSerie = !serieFilter || subserie.serie_id === serieFilter;
    const matchSeccion = !seccionFilter || subserie.serie?.seccion_id === seccionFilter;
    const matchArea = !areaFilter || subserie.serie?.seccion?.area_id === areaFilter;
    
    return matchSearch && matchSerie && matchSeccion && matchArea;
  });

  /**
   * Obtiene las series filtradas
   */
  const seriesFiltradas = seccionFilter 
    ? series.filter(s => s.seccion_id === seccionFilter)
    : series;

  /**
   * Obtiene las secciones filtradas
   */
  const seccionesFiltradas = areaFilter 
    ? secciones.filter(s => s.area_id === areaFilter)
    : secciones;

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          underline="hover"
          color="inherit"
        >
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/catalogo/areas')}
          underline="hover"
          color="inherit"
        >
          Áreas
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/catalogo/secciones')}
          underline="hover"
          color="inherit"
        >
          Secciones
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/catalogo/series')}
          underline="hover"
          color="inherit"
        >
          Series
        </Link>
        <Typography color="text.primary">Subseries</Typography>
      </Breadcrumbs>

      <Paper elevation={3}>
        {/* Encabezado */}
        <Toolbar sx={{ p: 2 }}>
          <SubseriesIcon sx={{ mr: 2 }} />
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Catálogo de Subseries
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton onClick={cargarDatos} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialogo()}
            sx={{ ml: 2 }}
          >
            Nueva Subserie
          </Button>
        </Toolbar>

        {/* Filtros */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  label="Área"
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.codigo} - {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sección</InputLabel>
                <Select
                  value={seccionFilter}
                  onChange={(e) => setSeccionFilter(e.target.value)}
                  label="Sección"
                  disabled={!areaFilter && secciones.length === 0}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {seccionesFiltradas.map((seccion) => (
                    <MenuItem key={seccion.id} value={seccion.id}>
                      {seccion.codigo} - {seccion.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Serie</InputLabel>
                <Select
                  value={serieFilter}
                  onChange={(e) => setSerieFilter(e.target.value)}
                  label="Serie"
                  disabled={!seccionFilter && series.length === 0}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {seriesFiltradas.map((serie) => (
                    <MenuItem key={serie.id} value={serie.id}>
                      {serie.codigo} - {serie.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Información */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            Las subseries son divisiones opcionales de las series documentales para una clasificación más específica
          </Alert>
        </Box>

        {/* Tabla de subseries */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Serie</TableCell>
                <TableCell>Sección</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Expedientes</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subseriesFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((subserie) => (
                  <TableRow key={subserie.id} hover>
                    <TableCell>
                      <Chip 
                        label={subserie.codigo} 
                        color="secondary"
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{subserie.nombre}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${subserie.serie?.codigo} - ${subserie.serie?.nombre}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {subserie.serie?.seccion?.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {subserie.serie?.seccion?.area?.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={subserie._count?.expedientes || 0} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo(subserie)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => eliminarSubserie(subserie)}
                          disabled={subserie._count?.expedientes > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              
              {subseriesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {searchTerm || serieFilter || seccionFilter || areaFilter
                        ? 'No se encontraron subseries con ese criterio'
                        : 'No hay subseries registradas'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={subseriesFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo de crear/editar */}
      <Dialog 
        open={dialogOpen} 
        onClose={cerrarDialogo}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSubserie ? 'Editar Subserie' : 'Nueva Subserie'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl 
              fullWidth 
              margin="normal"
              required
              error={!!formErrors.serie_id}
            >
              <InputLabel>Serie</InputLabel>
              <Select
                value={formData.serie_id}
                onChange={(e) => setFormData({ ...formData, serie_id: e.target.value })}
                label="Serie"
              >
                {series.map((serie) => (
                  <MenuItem key={serie.id} value={serie.id}>
                    {serie.codigo} - {serie.nombre} 
                    ({serie.seccion?.codigo} / {serie.seccion?.area?.codigo})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.serie_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {formErrors.serie_id}
                </Typography>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              error={!!formErrors.codigo}
              helperText={formErrors.codigo}
              margin="normal"
              required
              placeholder="Ej: 1S.1.1.1"
            />
            
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              margin="normal"
              required
              placeholder="Ej: Actas ordinarias"
            />
            
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              placeholder="Descripción opcional de la subserie"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarSubserie} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Subseries;