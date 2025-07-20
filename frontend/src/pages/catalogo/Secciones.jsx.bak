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
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';

/**
 * Componente para gestionar las secciones del catálogo de clasificación archivística
 */
const Secciones = () => {
  // Estado principal
  const [secciones, setSecciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  
  // Estado del diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    area_id: ''
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

  /**
   * Carga secciones y áreas
   */
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [seccionesRes, areasRes] = await Promise.all([
        axios.get('/catalogo/secciones'),
        axios.get('/catalogo/areas')
      ]);
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
  const abrirDialogo = (seccion = null) => {
    if (seccion) {
      setEditingSeccion(seccion);
      setFormData({
        codigo: seccion.codigo,
        nombre: seccion.nombre,
        descripcion: seccion.descripcion || '',
        area_id: seccion.area_id
      });
    } else {
      setEditingSeccion(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        area_id: ''
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
    setEditingSeccion(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      area_id: ''
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
    } else if (formData.codigo.length > 20) {
      errors.codigo = 'El código no puede tener más de 20 caracteres';
    }
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.area_id) {
      errors.area_id = 'El área es requerida';
    }
    
    // Verificar código duplicado
    if (!editingSeccion || editingSeccion.codigo !== formData.codigo) {
      const codigoExiste = secciones.some(seccion => 
        seccion.codigo.toLowerCase() === formData.codigo.toLowerCase() &&
        seccion.area_id === formData.area_id
      );
      if (codigoExiste) {
        errors.codigo = 'Este código ya existe en el área seleccionada';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Guarda la sección (crear o actualizar)
   */
  const guardarSeccion = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      if (editingSeccion) {
        await axios.put(`/catalogo/secciones/${editingSeccion.id}`, formData);
        mostrarSnackbar('Sección actualizada correctamente', 'success');
      } else {
        await axios.post('/catalogo/secciones', formData);
        mostrarSnackbar('Sección creada correctamente', 'success');
      }
      
      cerrarDialogo();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar sección:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar la sección';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una sección
   */
  const eliminarSeccion = async (seccion) => {
    if (!window.confirm(`¿Está seguro de eliminar la sección "${seccion.nombre}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/catalogo/secciones/${seccion.id}`);
      mostrarSnackbar('Sección eliminada correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar sección:', error);
      const mensaje = error.response?.data?.message || 
        'No se puede eliminar la sección porque tiene series asociadas';
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
   * Filtra las secciones según búsqueda y área
   */
  const seccionesFiltradas = secciones.filter(seccion => {
    const matchSearch = 
      seccion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seccion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (seccion.descripcion && seccion.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchArea = !areaFilter || seccion.area_id === areaFilter;
    
    return matchSearch && matchArea;
  });

  /**
   * Obtiene el color del chip según el tipo de sección
   */
  const getChipColor = (codigo) => {
    if (codigo.includes('S')) return 'primary';
    if (codigo.includes('C')) return 'secondary';
    return 'default';
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
        <Typography color="text.primary">Secciones</Typography>
      </Breadcrumbs>

      <Paper elevation={3}>
        {/* Encabezado */}
        <Toolbar sx={{ p: 2 }}>
          <FolderIcon sx={{ mr: 2 }} />
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Catálogo de Secciones
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
            Nueva Sección
          </Button>
        </Toolbar>

        {/* Filtros */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
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
          </Grid>
        </Box>

        {/* Tabla de secciones */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Series</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seccionesFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((seccion) => (
                  <TableRow key={seccion.id} hover>
                    <TableCell>
                      <Chip 
                        label={seccion.codigo} 
                        color={getChipColor(seccion.codigo)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{seccion.nombre}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${seccion.area?.codigo} - ${seccion.area?.nombre}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{seccion.descripcion || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={seccion._count?.series || 0} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo(seccion)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => eliminarSeccion(seccion)}
                          disabled={seccion._count?.series > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              
              {seccionesFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {searchTerm || areaFilter
                        ? 'No se encontraron secciones con ese criterio'
                        : 'No hay secciones registradas'}
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
          count={seccionesFiltradas.length}
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
          {editingSeccion ? 'Editar Sección' : 'Nueva Sección'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              error={!!formErrors.area_id}
            >
              <InputLabel>Área</InputLabel>
              <Select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                label="Área"
              >
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.codigo} - {area.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.area_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {formErrors.area_id}
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
              inputProps={{ maxLength: 20 }}
              placeholder="Ej: 1S.1, 2C.3"
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
              placeholder="Ej: Gobierno"
            />
            
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              placeholder="Descripción opcional de la sección"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarSeccion} 
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

export default Secciones;