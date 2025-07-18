// === ARCHIVO: frontend/src/pages/Usuarios.jsx ===
// Página principal para la gestión de usuarios del sistema

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import usersService from '../services/users.service';
import catalogoService from '../services/catalogo.service';

function Usuarios() {
  // Estados para la lista de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  
  // Estados para el diálogo de crear/editar
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario',
    area: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para áreas disponibles
  const [areas, setAreas] = useState([]);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
    cargarAreas();
  }, [page, rowsPerPage, searchTerm, filterRol, filterArea, filterActivo]);

  /**
   * Cargar lista de usuarios con filtros
   */
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1, // La API espera páginas comenzando en 1
        limit: rowsPerPage,
        search: searchTerm,
        rol: filterRol,
        area: filterArea,
        activo: filterActivo
      };

      const response = await usersService.getUsuarios(params);
      
      if (response.success) {
        setUsuarios(response.data);
        setTotalItems(response.pagination.totalItems);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
      mostrarSnackbar('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar lista de áreas disponibles
   */
  const cargarAreas = async () => {
    try {
      const response = await catalogoService.getAreas();
      setAreas(response.data || []);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
    }
  };

  /**
   * Manejar cambio de página
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Manejar cambio de filas por página
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Abrir diálogo para crear nuevo usuario
   */
  const handleNuevoUsuario = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'usuario',
      area: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setOpenDialog(true);
  };

  /**
   * Abrir diálogo para editar usuario
   */
  const handleEditarUsuario = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', // No mostramos la contraseña actual
      rol: usuario.rol,
      area: usuario.area_codigo || ''
    });
    setFormErrors({});
    setShowPassword(false);
    setOpenDialog(true);
  };

  /**
   * Validar formulario
   */
  const validarFormulario = () => {
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    }

    // Solo validar contraseña si es nuevo usuario o si se está cambiando
    if (!editingUser && !formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.rol) {
      errors.rol = 'El rol es requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Guardar usuario (crear o actualizar)
   */
  const handleGuardarUsuario = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      
      const datosAEnviar = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        area: formData.area || null
      };

      // Solo incluir password si hay valor
      if (formData.password) {
        datosAEnviar.password = formData.password;
      }

      let response;
      if (editingUser) {
        // Actualizar usuario existente
        response = await usersService.updateUsuario(editingUser.id, datosAEnviar);
      } else {
        // Crear nuevo usuario
        response = await usersService.createUsuario(datosAEnviar);
      }

      if (response.success) {
        mostrarSnackbar(
          editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
          'success'
        );
        setOpenDialog(false);
        cargarUsuarios();
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      const mensaje = err.response?.data?.error || 'Error al guardar usuario';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar (desactivar) usuario
   */
  const handleEliminarUsuario = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await usersService.deleteUsuario(usuario.id);
      
      if (response.success) {
        mostrarSnackbar('Usuario eliminado exitosamente', 'success');
        cargarUsuarios();
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      const mensaje = err.response?.data?.error || 'Error al eliminar usuario';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mostrar notificación
   */
  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Obtener color del chip según el rol
   */
  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin':
        return 'error';
      case 'usuario':
        return 'primary';
      case 'consulta':
        return 'default';
      default:
        return 'default';
    }
  };

  /**
   * Obtener etiqueta del rol
   */
  const getRolLabel = (rol) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'usuario':
        return 'Usuario';
      case 'consulta':
        return 'Consulta';
      default:
        return rol;
    }
  };

  return (
    <Box>
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNuevoUsuario}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Nombre o email..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={filterRol}
                  onChange={(e) => setFilterRol(e.target.value)}
                  label="Rol"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="usuario">Usuario</MenuItem>
                  <MenuItem value="consulta">Consulta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Área</InputLabel>
                <Select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  label="Área"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.codigo} value={area.codigo}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterActivo}
                  onChange={(e) => setFilterActivo(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Tooltip title="Recargar">
                <IconButton onClick={cargarUsuarios} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nombre}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRolLabel(usuario.rol)}
                          color={getRolColor(usuario.rol)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{usuario.area_nombre || 'Sin área'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={usuario.activo ? 'Activo' : 'Inactivo'}
                          color={usuario.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditarUsuario(usuario)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleEliminarUsuario(usuario)}
                            color="error"
                            disabled={!usuario.activo}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Usuarios por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </TableContainer>

      {/* Diálogo de crear/editar usuario */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                error={!!formErrors.nombre}
                helperText={formErrors.nombre}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={editingUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!formErrors.password}
                helperText={formErrors.password}
                required={!editingUser}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.rol}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="usuario">Usuario</MenuItem>
                  <MenuItem value="consulta">Consulta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  label="Área"
                >
                  <MenuItem value="">Sin área</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.codigo} value={area.codigo}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGuardarUsuario}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
}

export default Usuarios;