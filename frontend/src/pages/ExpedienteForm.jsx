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
  IconButton,
  Alert,
  Snackbar,
  Chip,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../services/api';

/**
 * Componente para crear y editar expedientes
 * Maneja la selección jerárquica de clasificación archivística
 * y valida todos los campos requeridos
 */
const ExpedienteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Para edición
  const isEdit = !!id;

  // Estado del formulario
  const [formData, setFormData] = useState({
    numero_expediente: '',
    asunto: '',
    area_id: '',
    seccion_id: '',
    serie_id: '',
    subserie_id: '',
    fecha_apertura: new Date(),
    fecha_cierre: null,
    total_fojas: '',
    total_legajos: '',
    ubicacion_fisica: '',
    valor_documental: '',
    vigencia_documental: '',
    tiempo_conservacion_archivo_tramite: '',
    tiempo_conservacion_archivo_concentracion: '',
    destino_final: '',
    observaciones: '',
    estatus: 'ACTIVO'
  });

  // Estado para los catálogos
  const [areas, setAreas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);

  // Estado para manejo de errores y notificaciones
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar catálogos al montar el componente
  useEffect(() => {
    cargarCatalogos();
    if (isEdit) {
      cargarExpediente();
    }
  }, [id]);

  // Cargar secciones cuando cambia el área
  useEffect(() => {
    if (formData.area_id) {
      cargarSecciones(formData.area_id);
      // Limpiar selecciones dependientes
      setFormData(prev => ({
        ...prev,
        seccion_id: '',
        serie_id: '',
        subserie_id: ''
      }));
      setSeries([]);
      setSubseries([]);
    }
  }, [formData.area_id]);

  // Cargar series cuando cambia la sección
  useEffect(() => {
    if (formData.seccion_id) {
      cargarSeries(formData.seccion_id);
      // Limpiar selecciones dependientes
      setFormData(prev => ({
        ...prev,
        serie_id: '',
        subserie_id: ''
      }));
      setSubseries([]);
    }
  }, [formData.seccion_id]);

  // Cargar subseries cuando cambia la serie
  useEffect(() => {
    if (formData.serie_id) {
      cargarSubseries(formData.serie_id);
      setFormData(prev => ({
        ...prev,
        subserie_id: ''
      }));
    }
  }, [formData.serie_id]);

  /**
   * Carga los catálogos iniciales desde el backend
   */
  const cargarCatalogos = async () => {
    try {
      const response = await axios.get('/catalogo/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      mostrarSnackbar('Error al cargar los catálogos', 'error');
    }
  };

  /**
   * Carga las secciones de un área específica
   */
  const cargarSecciones = async (areaId) => {
    try {
      const response = await axios.get(`/catalogo/secciones?area_id=${areaId}`);
      setSecciones(response.data);
    } catch (error) {
      console.error('Error al cargar secciones:', error);
    }
  };

  /**
   * Carga las series de una sección específica
   */
  const cargarSeries = async (seccionId) => {
    try {
      const response = await axios.get(`/catalogo/series?seccion_id=${seccionId}`);
      setSeries(response.data);
    } catch (error) {
      console.error('Error al cargar series:', error);
    }
  };

  /**
   * Carga las subseries de una serie específica
   */
  const cargarSubseries = async (serieId) => {
    try {
      const response = await axios.get(`/catalogo/subseries?serie_id=${serieId}`);
      setSubseries(response.data);
    } catch (error) {
      console.error('Error al cargar subseries:', error);
    }
  };

  /**
   * Carga los datos del expediente para edición
   */
  const cargarExpediente = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/expedientes/${id}`);
      const expediente = response.data;
      
      // Convertir fechas de string a Date
      expediente.fecha_apertura = new Date(expediente.fecha_apertura);
      if (expediente.fecha_cierre) {
        expediente.fecha_cierre = new Date(expediente.fecha_cierre);
      }
      
      setFormData(expediente);
      
      // Cargar catálogos dependientes
      if (expediente.area_id) {
        await cargarSecciones(expediente.area_id);
      }
      if (expediente.seccion_id) {
        await cargarSeries(expediente.seccion_id);
      }
      if (expediente.serie_id) {
        await cargarSubseries(expediente.serie_id);
      }
    } catch (error) {
      console.error('Error al cargar expediente:', error);
      mostrarSnackbar('Error al cargar el expediente', 'error');
      navigate('/expedientes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Maneja cambios en las fechas
   */
  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Valida el formulario antes de enviar
   */
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Campos requeridos
    if (!formData.numero_expediente) {
      nuevosErrores.numero_expediente = 'El número de expediente es requerido';
    }
    if (!formData.asunto) {
      nuevosErrores.asunto = 'El asunto es requerido';
    }
    if (!formData.area_id) {
      nuevosErrores.area_id = 'El área es requerida';
    }
    if (!formData.seccion_id) {
      nuevosErrores.seccion_id = 'La sección es requerida';
    }
    if (!formData.serie_id) {
      nuevosErrores.serie_id = 'La serie es requerida';
    }
    if (!formData.fecha_apertura) {
      nuevosErrores.fecha_apertura = 'La fecha de apertura es requerida';
    }
    if (!formData.total_fojas || formData.total_fojas < 0) {
      nuevosErrores.total_fojas = 'El total de fojas debe ser mayor a 0';
    }
    if (!formData.total_legajos || formData.total_legajos < 0) {
      nuevosErrores.total_legajos = 'El total de legajos debe ser mayor a 0';
    }
    if (!formData.ubicacion_fisica) {
      nuevosErrores.ubicacion_fisica = 'La ubicación física es requerida';
    }
    if (!formData.valor_documental) {
      nuevosErrores.valor_documental = 'El valor documental es requerido';
    }
    if (!formData.vigencia_documental) {
      nuevosErrores.vigencia_documental = 'La vigencia documental es requerida';
    }
    if (!formData.destino_final) {
      nuevosErrores.destino_final = 'El destino final es requerido';
    }

    // Validar que fecha de cierre sea posterior a fecha de apertura
    if (formData.fecha_cierre && formData.fecha_cierre < formData.fecha_apertura) {
      nuevosErrores.fecha_cierre = 'La fecha de cierre debe ser posterior a la fecha de apertura';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      mostrarSnackbar('Por favor, corrija los errores en el formulario', 'error');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const datosEnviar = {
        ...formData,
        total_fojas: parseInt(formData.total_fojas),
        total_legajos: parseInt(formData.total_legajos),
        tiempo_conservacion_archivo_tramite: formData.tiempo_conservacion_archivo_tramite ? parseInt(formData.tiempo_conservacion_archivo_tramite) : null,
        tiempo_conservacion_archivo_concentracion: formData.tiempo_conservacion_archivo_concentracion ? parseInt(formData.tiempo_conservacion_archivo_concentracion) : null,
        // Formatear fechas a ISO string
        fecha_apertura: formData.fecha_apertura.toISOString(),
        fecha_cierre: formData.fecha_cierre ? formData.fecha_cierre.toISOString() : null
      };

      if (isEdit) {
        await axios.put(`/expedientes/${id}`, datosEnviar);
        mostrarSnackbar('Expediente actualizado exitosamente', 'success');
      } else {
        await axios.post('/expedientes', datosEnviar);
        mostrarSnackbar('Expediente creado exitosamente', 'success');
      }

      // Redirigir a la lista después de 1 segundo
      setTimeout(() => {
        navigate('/expedientes');
      }, 1000);
    } catch (error) {
      console.error('Error al guardar expediente:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el expediente';
      mostrarSnackbar(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra notificación al usuario
   */
  const mostrarSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {isEdit ? 'Editar Expediente' : 'Nuevo Expediente'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Expediente"
                  name="numero_expediente"
                  value={formData.numero_expediente}
                  onChange={handleChange}
                  error={!!errors.numero_expediente}
                  helperText={errors.numero_expediente}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.estatus}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estatus"
                    value={formData.estatus}
                    onChange={handleChange}
                    label="Estado"
                  >
                    <MenuItem value="ACTIVO">Activo</MenuItem>
                    <MenuItem value="CERRADO">Cerrado</MenuItem>
                    <MenuItem value="TRANSFERIDO">Transferido</MenuItem>
                    <MenuItem value="BAJA">Baja</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Asunto"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  error={!!errors.asunto}
                  helperText={errors.asunto}
                  required
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Clasificación Archivística */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Clasificación Archivística
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.area_id} required>
                  <InputLabel>Área</InputLabel>
                  <Select
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleChange}
                    label="Área"
                  >
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
                <FormControl 
                  fullWidth 
                  error={!!errors.seccion_id} 
                  required
                  disabled={!formData.area_id}
                >
                  <InputLabel>Sección</InputLabel>
                  <Select
                    name="seccion_id"
                    value={formData.seccion_id}
                    onChange={handleChange}
                    label="Sección"
                  >
                    {secciones.map((seccion) => (
                      <MenuItem key={seccion.id} value={seccion.id}>
                        {seccion.codigo} - {seccion.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.seccion_id && <FormHelperText>{errors.seccion_id}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  error={!!errors.serie_id} 
                  required
                  disabled={!formData.seccion_id}
                >
                  <InputLabel>Serie</InputLabel>
                  <Select
                    name="serie_id"
                    value={formData.serie_id}
                    onChange={handleChange}
                    label="Serie"
                  >
                    {series.map((serie) => (
                      <MenuItem key={serie.id} value={serie.id}>
                        {serie.codigo} - {serie.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.serie_id && <FormHelperText>{errors.serie_id}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  disabled={!formData.serie_id || subseries.length === 0}
                >
                  <InputLabel>Subserie (Opcional)</InputLabel>
                  <Select
                    name="subserie_id"
                    value={formData.subserie_id}
                    onChange={handleChange}
                    label="Subserie (Opcional)"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {subseries.map((subserie) => (
                      <MenuItem key={subserie.id} value={subserie.id}>
                        {subserie.codigo} - {subserie.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Fechas */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Fechas
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Apertura"
                  value={formData.fecha_apertura}
                  onChange={(date) => handleDateChange(date, 'fecha_apertura')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required
                      error={!!errors.fecha_apertura}
                      helperText={errors.fecha_apertura}
                    />
                  )}
                  maxDate={new Date()}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Cierre"
                  value={formData.fecha_cierre}
                  onChange={(date) => handleDateChange(date, 'fecha_cierre')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      error={!!errors.fecha_cierre}
                      helperText={errors.fecha_cierre}
                    />
                  )}
                  minDate={formData.fecha_apertura}
                />
              </Grid>

              {/* Información física */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Información Física
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total de Fojas"
                  name="total_fojas"
                  type="number"
                  value={formData.total_fojas}
                  onChange={handleChange}
                  error={!!errors.total_fojas}
                  helperText={errors.total_fojas}
                  required
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total de Legajos"
                  name="total_legajos"
                  type="number"
                  value={formData.total_legajos}
                  onChange={handleChange}
                  error={!!errors.total_legajos}
                  helperText={errors.total_legajos}
                  required
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ubicación Física"
                  name="ubicacion_fisica"
                  value={formData.ubicacion_fisica}
                  onChange={handleChange}
                  error={!!errors.ubicacion_fisica}
                  helperText={errors.ubicacion_fisica}
                  required
                  placeholder="Ej: Estante A, Caja 5"
                />
              </Grid>

              {/* Valores documentales */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Valores Documentales
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.valor_documental} required>
                  <InputLabel>Valor Documental</InputLabel>
                  <Select
                    name="valor_documental"
                    value={formData.valor_documental}
                    onChange={handleChange}
                    label="Valor Documental"
                  >
                    <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
                    <MenuItem value="LEGAL">Legal</MenuItem>
                    <MenuItem value="FISCAL">Fiscal</MenuItem>
                    <MenuItem value="CONTABLE">Contable</MenuItem>
                    <MenuItem value="HISTORICO">Histórico</MenuItem>
                  </Select>
                  {errors.valor_documental && <FormHelperText>{errors.valor_documental}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vigencia Documental"
                  name="vigencia_documental"
                  value={formData.vigencia_documental}
                  onChange={handleChange}
                  error={!!errors.vigencia_documental}
                  helperText={errors.vigencia_documental}
                  required
                  placeholder="Ej: 5 años"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tiempo en Archivo de Trámite (años)"
                  name="tiempo_conservacion_archivo_tramite"
                  type="number"
                  value={formData.tiempo_conservacion_archivo_tramite}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tiempo en Archivo de Concentración (años)"
                  name="tiempo_conservacion_archivo_concentracion"
                  type="number"
                  value={formData.tiempo_conservacion_archivo_concentracion}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.destino_final} required>
                  <InputLabel>Destino Final</InputLabel>
                  <Select
                    name="destino_final"
                    value={formData.destino_final}
                    onChange={handleChange}
                    label="Destino Final"
                  >
                    <MenuItem value="CONSERVACION">Conservación</MenuItem>
                    <MenuItem value="ELIMINACION">Eliminación</MenuItem>
                    <MenuItem value="MUESTREO">Muestreo</MenuItem>
                  </Select>
                  {errors.destino_final && <FormHelperText>{errors.destino_final}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Observaciones adicionales (opcional)"
                />
              </Grid>

              {/* Botones de acción */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/expedientes')}
                    startIcon={<CancelIcon />}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SaveIcon />}
                  >
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

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
    </LocalizationProvider>
  );
};

export default ExpedienteForm;