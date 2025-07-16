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
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  TablePagination,
  InputAdornment,
  Toolbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from "../../services/api";

/**
 * Componente para gestionar las áreas del catálogo de clasificación archivística
 */
const Areas = () => {
  // Estado principal
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: ''
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

  // Cargar áreas al montar el componente
  useEffect(() => {
    cargarAreas();
  }, []);

  /**
   * Carga la lista de áreas desde el backend
   */
  const cargarAreas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/catalogo/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      mostrarSnackbar('Error al cargar las áreas', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre el diálogo para crear o editar
   */
  const abrirDialogo = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        codigo: area.codigo,
        nombre: area.nombre,
        descripcion: area.descripcion || ''
      });
    } else {
      setEditingArea(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: ''
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
    setEditingArea(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: ''
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
    } else if (formData.codigo.length > 10) {
      errors.codigo = 'El código no puede tener más de 10 caracteres';
    }
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    // Verificar código duplicado (solo si es nuevo o cambió)
    if (!editingArea || editingArea.codigo !== formData.codigo) {
      const codigoExiste = areas.some(area => 
        area.codigo.toLowerCase() === formData.codigo.toLowerCase()
      );
      if (codigoExiste) {
        errors.codigo = 'Este código ya existe';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Guarda el área (crear o actualizar)
   */
  const guardarArea = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      if (editingArea) {
        // Actualizar
        await axios.put(`/catalogo/areas/${editingArea.id}`, formData);
        mostrarSnackbar('Área actualizada correctamente', 'success');
      } else {
        // Crear
        await axios.post('/catalogo/areas', formData);
        mostrarSnackbar('Área creada correctamente', 'success');
      }
      
      cerrarDialogo();
      cargarAreas();
    } catch (error) {
      console.error('Error al guardar área:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el área';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina un área
   */
  const eliminarArea = async (area) => {
    if (!window.confirm(`¿Está seguro de eliminar el área "${area.nombre}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/catalogo/areas/${area.id}`);
      mostrarSnackbar('Área eliminada correctamente', 'success');
      cargarAreas();
    } catch (error) {
      console.error('Error al eliminar área:', error);
      const mensaje = error.response?.data?.message || 
        'No se puede eliminar el área porque tiene secciones asociadas';
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
   * Filtra las áreas según el término de búsqueda
   */
  const areasFiltradas = areas.filter(area =>
    area.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.descripcion && area.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /**
   * Maneja el cambio de página
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Maneja el cambio de filas por página
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3}>
        {/* Encabezado */}
        <Toolbar sx={{ p: 2 }}>
          <BusinessIcon sx={{ mr: 2 }} />
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Catálogo de Áreas
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton onClick={cargarAreas} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialogo()}
            sx={{ ml: 2 }}
          >
            Nueva Área
          </Button>
        </Toolbar>

        {/* Barra de búsqueda */}
        <Box sx={{ px: 3, pb: 2 }}>
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
        </Box>

        {/* Tabla de áreas */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Secciones</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {areasFiltradas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((area) => (
                  <TableRow key={area.id} hover>
                    <TableCell>
                      <Chip label={area.codigo} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{area.nombre}</TableCell>
                    <TableCell>{area.descripcion || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={area._count?.secciones || 0} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogo(area)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => eliminarArea(area)}
                          disabled={area._count?.secciones > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              
              {areasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {searchTerm 
                        ? 'No se encontraron áreas con ese criterio de búsqueda'
                        : 'No hay áreas registradas'}
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
          count={areasFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
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
          {editingArea ? 'Editar Área' : 'Nueva Área'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              error={!!formErrors.codigo}
              helperText={formErrors.codigo}
              margin="normal"
              required
              inputProps={{ maxLength: 10 }}
              placeholder="Ej: 1S, 2C"
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
              placeholder="Ej: Sustantivo"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              placeholder="Descripción opcional del área"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarArea} 
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

export default Areas;