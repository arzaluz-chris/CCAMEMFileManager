import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
  Alert,
  Snackbar,
  Chip,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const ExpedienteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    numero_expediente: '',
    titulo: '',
    descripcion: '',
    area_id: '',
    seccion_id: '',
    serie_id: '',
    subserie_id: '',
    fecha_apertura: new Date(),
    fecha_cierre: null,
    ubicacion_fisica: '',
    observaciones: '',
    estado: 'activo'
  });

  const [areas, setAreas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    cargarCatalogos();
    if (isEdit) {
      cargarExpediente();
    }
  }, [id]);

  const cargarCatalogos = async () => {
    try {
      const response = await api.get('/catalogo/areas');
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const cargarExpediente = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/expedientes/${id}`);
      const data = response.data;
      setFormData({
        ...data,
        fecha_apertura: data.fecha_apertura ? new Date(data.fecha_apertura) : new Date(),
        fecha_cierre: data.fecha_cierre ? new Date(data.fecha_cierre) : null
      });
    } catch (error) {
      console.error('Error al cargar expediente:', error);
      mostrarSnackbar('Error al cargar el expediente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEdit) {
        await api.put(`/expedientes/${id}`, formData);
        mostrarSnackbar('Expediente actualizado exitosamente');
      } else {
        await api.post('/expedientes', formData);
        mostrarSnackbar('Expediente creado exitosamente');
      }
      
      setTimeout(() => navigate('/expedientes'), 1000);
    } catch (error) {
      console.error('Error al guardar:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      mostrarSnackbar(error.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          {isEdit ? 'Editar Expediente' : 'Nuevo Expediente'}
        </Typography>

        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Expediente"
                  name="numero_expediente"
                  value={formData.numero_expediente}
                  onChange={handleInputChange}
                  error={!!errors.numero_expediente}
                  helperText={errors.numero_expediente}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Título"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  error={!!errors.titulo}
                  helperText={errors.titulo}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.area_id}>
                  <InputLabel>Área</InputLabel>
                  <Select
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleInputChange}
                    label="Área"
                  >
                    <MenuItem value="">Seleccione...</MenuItem>
                    {areas.map((area) => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.codigo} - {area.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.area_id && <FormHelperText>{errors.area_id}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Apertura"
                  value={formData.fecha_apertura}
                  onChange={(date) => setFormData({ ...formData, fecha_apertura: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ubicación Física"
                  name="ubicacion_fisica"
                  value={formData.ubicacion_fisica}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/expedientes')}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ExpedienteForm;
