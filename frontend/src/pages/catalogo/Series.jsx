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
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LibraryBooks as SeriesIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';

/**
 * Componente para gestionar las series del catálogo de clasificación archivística
 */
const Series = () => {
  // Estado principal
  const [series, setSeries] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [seccionFilter, setSeccionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  
  // Estado del diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSerie, setEditingSerie] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    seccion_id: '',
    valor_documental: '',
    vigencia_documental: '',
    destino_final: ''
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

  // Filtrar secciones cuando cambia el área
  useEffect(() => {
    if (areaFilter) {
      const seccionesFiltradas = secciones.filter(s => s.area_id === areaFilter);
      if (seccionesFiltradas.length > 0 && !seccionesFiltradas.find(s => s.id === seccionFilter)) {
        setSeccionFilter('');
      }
    }
  }, [areaFilter, secciones, seccionFilter]);

  /**
   * Carga series, secciones y áreas
   */
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [seriesRes, seccionesRes, areasRes] = await Promise.all([
        axios.get('/catalogo/series'),
        axios.get('/catalogo/secciones'),
        axios.get('/catalogo/areas')
      ]);
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
  const abrirDialogo = (serie = null) => {
    if (serie) {
      setEditingSerie(serie);
      setFormData({
        codigo: serie.codigo,
        nombre: serie.nombre,
        descripcion: serie.descripcion || '',
        seccion_id: serie.seccion_id,
        valor_documental: serie.valor_documental || '',
        vigencia_documental: serie.vigencia_documental || '',
        destino_final: serie.destino_final || ''
      });
    } else {
      setEditingSerie(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        seccion_id: '',
        valor_documental: '',
        vigencia_documental: '',
        destino_final: ''
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
    setEditingSerie(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      seccion_id: '',
      valor_documental: '',
      vigencia_documental: '',
      destino_final: ''
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
    
    if (!formData.seccion_id) {
      errors.seccion_id = 'La sección es requerida';
    }
    
    if (!formData.valor_documental) {
      errors.valor_documental = 'El valor documental es requerido';
    }
    
    if (!formData.vigencia_documental.trim()) {
      errors.vigencia_documental = 'La vigencia documental es requerida';
    }
    
    if (!formData.destino_final) {
      errors.destino_final = 'El destino final es requerido';
    }
    
    // Verificar código duplicado
    if (!editingSerie || editingSerie.codigo !== formData.codigo) {
      const codigoExiste = series.some(serie => 
        serie.codigo.toLowerCase() === formData.codigo.toLowerCase() &&
        serie.seccion_id === formData.seccion_id
      );
      if (codigoExiste) {
        errors.codigo = 'Este código ya existe en la sección seleccionada';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Guarda la serie (crear o actualizar)
   */
  const guardarSerie = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      if (editingSerie) {
        await axios.put(`/catalogo/series/${editingSerie.id}`, formData);
        mostrarSnackbar('Serie actualizada correctamente', 'success');
      } else {
        await axios.post('/catalogo/series', formData);
        mostrarSnackbar('Serie creada correctamente', 'success');
      }
      
      cerrarDialogo();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar serie:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar la serie';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una serie
   */
  const eliminarSerie = async (serie) => {
    if (!window.confirm(`¿Está seguro de eliminar la serie "${serie.nombre}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/catalogo/series/${serie.id}`);
      mostrarSnackbar('Serie eliminada correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar serie:', error);
      const mensaje = error.response?.data?.message || 
        'No se puede eliminar la serie porque tiene subseries o expedientes asociados';
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
   * Filtra las series según búsqueda y filtros
   */
  const seriesFiltradas = series.filter(serie => {
    const matchSearch = 
      serie.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serie.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (serie.descripcion && serie.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchSeccion = !seccionFilter || serie.seccion_id === seccionFilter;
    const matchArea = !areaFilter || serie.seccion?.area_id === areaFilter;
    
    return matchSearch && matchSeccion && matchArea;
  });

  /**
   * Obtiene las secciones filtradas por área
   */
  const seccionesFiltradas = areaFilter 
    ? secciones.filter(s => s.area_id === areaFilter)
    : secciones;

  /**
   * Obtiene el color del valor documental
   */
  const getValorColor = (valor) => {
    const colors = {
      'ADMINISTRATIVO': 'info',
      'LEGAL': 'warning',
      'FISCAL': 'success',
      'CONTABLE': 'secondary',
      'HISTORICO': 'primary'
    };
    return colors[valor] || 'default';
  };

  /**
   * Obtiene el color del destino final
   */
  const getDestinoColor = (destino) => {
    const colors = {
      'CONSERVACION': 'success',
      'ELIMINACION': 'error',
      'MUESTREO': 'warning'
    };
    return colors[destino] || 'default';
  };

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
        <Typography color="text.primary">Series</Typography>
      </Breadcrumbs>

      <Paper elevation={3}>
        {/* Encabezado */}
        <Toolbar sx={{ p: 2 }}>
          <SeriesIcon sx={{ mr: 2 }} />
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Catálogo de Series
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
            Nueva Serie
          </Button>
        </Toolbar>

        {/* Filtros */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar por código o nombre..."
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  label="Filtrar por Área"
                >
                  <MenuItem value="">
                    <em>Todas las áreas</em>
                  </MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.codigo} - {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Sección</InputLabel>
                <Select
                  value={seccionFilter}
                  onChange={(e) => setSeccionFilter(e.target.value)}
                  label="Filtrar por Sección"
                  disabled={!areaFilter && secciones.length === 0}
                >
                  <MenuItem value="">
                    <em>Todas las secciones</em>
                  </MenuItem>
                  {seccionesFiltradas.map((seccion) => (
                    <MenuItem key={seccion.id} value={seccion.id}>
                      {seccion.codigo} - {seccion.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Información de valores documentales */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            Las series documentales definen los valores documentales, vigencia y destino final de los expedientes
          </Alert>
        </Box>

        {/* Tabla de series */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Sección</TableCell>
                <TableCell>Valor Documental</TableCell>
                <TableCell>Vigencia</TableCell>
                <TableCell>Destino Final</TableCell>
                <TableCell>Subseries</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seriesFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((serie) => (
                  <TableRow key={serie.id} hover>
                    <TableCell>
                      <Chip 
                        label={serie.codigo} 
                        color="primary"
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{serie.nombre}</TableCell>
                    <TableCell>
                      <Tooltip title={`${serie.seccion?.area?.codigo} - ${serie.seccion?.area?.nombre}`}>
                        <Chip
                          label={`${serie.seccion?.codigo} - ${serie.seccion?.nombre}`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={serie.valor_documental}
                        color={getValorColor(serie.valor_documental)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{serie.vigencia_documental}</TableCell>
                    <TableCell>
                      <Chip
                        label={serie.destino_final}
                        color={getDestinoColor(serie.destino_final)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={serie._count?.subseries || 0} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo(serie)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => eliminarSerie(serie)}
                          disabled={serie._count?.subseries > 0 || serie._count?.expedientes > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              
              {seriesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {searchTerm || seccionFilter || areaFilter
                        ? 'No se encontraron series con ese criterio'
                        : 'No hay series registradas'}
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
          count={seriesFiltradas.length}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSerie ? 'Editar Serie' : 'Nueva Serie'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  required
                  error={!!formErrors.seccion_id}
                >
                  <InputLabel>Sección</InputLabel>
                  <Select
                    value={formData.seccion_id}
                    onChange={(e) => setFormData({ ...formData, seccion_id: e.target.value })}
                    label="Sección"
                  >
                    {secciones.map((seccion) => (
                      <MenuItem key={seccion.id} value={seccion.id}>
                        {seccion.codigo} - {seccion.nombre} ({seccion.area?.codigo})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.seccion_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.seccion_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  error={!!formErrors.codigo}
                  helperText={formErrors.codigo}
                  required
                  placeholder="Ej: 1S.1.1"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  error={!!formErrors.nombre}
                  helperText={formErrors.nombre}
                  required
                  placeholder="Ej: Actas"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  multiline
                  rows={2}
                  placeholder="Descripción opcional de la serie"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Valores Documentales
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl 
                  fullWidth 
                  required
                  error={!!formErrors.valor_documental}
                >
                  <InputLabel>Valor Documental</InputLabel>
                  <Select
                    value={formData.valor_documental}
                    onChange={(e) => setFormData({ ...formData, valor_documental: e.target.value })}
                    label="Valor Documental"
                  >
                    <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
                    <MenuItem value="LEGAL">Legal</MenuItem>
                    <MenuItem value="FISCAL">Fiscal</MenuItem>
                    <MenuItem value="CONTABLE">Contable</MenuItem>
                    <MenuItem value="HISTORICO">Histórico</MenuItem>
                  </Select>
                  {formErrors.valor_documental && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.valor_documental}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Vigencia Documental"
                  value={formData.vigencia_documental}
                  onChange={(e) => setFormData({ ...formData, vigencia_documental: e.target.value })}
                  error={!!formErrors.vigencia_documental}
                  helperText={formErrors.vigencia_documental}
                  required
                  placeholder="Ej: 5 años"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl 
                  fullWidth 
                  required
                  error={!!formErrors.destino_final}
                >
                  <InputLabel>Destino Final</InputLabel>
                  <Select
                    value={formData.destino_final}
                    onChange={(e) => setFormData({ ...formData, destino_final: e.target.value })}
                    label="Destino Final"
                  >
                    <MenuItem value="CONSERVACION">Conservación</MenuItem>
                    <MenuItem value="ELIMINACION">Eliminación</MenuItem>
                    <MenuItem value="MUESTREO">Muestreo</MenuItem>
                  </Select>
                  {formErrors.destino_final && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.destino_final}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            
            {/* Información adicional */}
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Información sobre valores documentales:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>Administrativo:</strong> Documentos de gestión interna<br/>
                  • <strong>Legal:</strong> Documentos con valor jurídico<br/>
                  • <strong>Fiscal:</strong> Documentos tributarios<br/>
                  • <strong>Contable:</strong> Documentos financieros<br/>
                  • <strong>Histórico:</strong> Documentos de valor permanente
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarSerie} 
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

export default Series;