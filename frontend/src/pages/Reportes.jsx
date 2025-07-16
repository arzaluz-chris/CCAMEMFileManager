import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as XmlIcon,
  DateRange as DateIcon,
  FilterList as FilterIcon,
  Preview as PreviewIcon,
  Schedule as ScheduleIcon,
  Archive as ArchiveIcon,
  FolderOpen as FolderIcon,
  Description as DescriptionIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import axios from '../services/api';

/**
 * Componente para generación de reportes del sistema de archivo
 */
const Reportes = () => {
  // Estado para filtros
  const [filters, setFilters] = useState({
    tipo_reporte: 'inventario',
    fecha_inicio: startOfMonth(new Date()),
    fecha_fin: endOfMonth(new Date()),
    area_id: '',
    seccion_id: '',
    serie_id: '',
    estatus: '',
    formato: 'excel'
  });

  // Estado para catálogos
  const [areas, setAreas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [series, setSeries] = useState([]);

  // Estado de UI
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Tipos de reportes disponibles
  const tiposReporte = [
    {
      id: 'inventario',
      nombre: 'Inventario General',
      descripcion: 'Listado completo de expedientes con toda su información',
      icon: <ArchiveIcon />
    },
    {
      id: 'transferencia',
      nombre: 'Vale de Transferencia',
      descripcion: 'Documentos para transferencia al archivo de concentración',
      icon: <FolderIcon />
    },
    {
      id: 'prestamo',
      nombre: 'Vale de Préstamo',
      descripcion: 'Control de expedientes prestados',
      icon: <DescriptionIcon />
    },
    {
      id: 'caratulas',
      nombre: 'Carátulas de Expedientes',
      descripcion: 'Etiquetas para identificación física',
      icon: <PrintIcon />
    },
    {
      id: 'estadisticas',
      nombre: 'Estadísticas',
      descripcion: 'Resumen estadístico del archivo',
      icon: <ReportIcon />
    }
  ];

  // Cargar catálogos al montar
  useEffect(() => {
    cargarCatalogos();
    cargarHistorial();
  }, []);

  // Actualizar secciones cuando cambia el área
  useEffect(() => {
    if (filters.area_id) {
      cargarSecciones(filters.area_id);
    } else {
      setSecciones([]);
      setSeries([]);
    }
  }, [filters.area_id]);

  // Actualizar series cuando cambia la sección
  useEffect(() => {
    if (filters.seccion_id) {
      cargarSeries(filters.seccion_id);
    } else {
      setSeries([]);
    }
  }, [filters.seccion_id]);

  /**
   * Carga los catálogos desde el backend
   */
  const cargarCatalogos = async () => {
    try {
      const response = await axios.get('/catalogo/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  /**
   * Carga las secciones de un área
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
   * Carga las series de una sección
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
   * Carga el historial de reportes generados
   */
  const cargarHistorial = async () => {
    // Simulación de historial (en producción vendría del backend)
    setReportHistory([
      {
        id: 1,
        tipo: 'inventario',
        fecha: new Date(),
        usuario: 'Admin',
        formato: 'excel',
        archivo: 'inventario_2024.xlsx'
      },
      {
        id: 2,
        tipo: 'transferencia',
        fecha: new Date(Date.now() - 86400000),
        usuario: 'Admin',
        formato: 'pdf',
        archivo: 'transferencia_001.pdf'
      }
    ]);
  };

  /**
   * Maneja cambios en los filtros
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Establece rangos de fecha predefinidos
   */
  const setDateRange = (range) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case 'mes':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'año':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'todo':
        start = new Date(2020, 0, 1);
        end = now;
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      fecha_inicio: start,
      fecha_fin: end
    }));
  };

  /**
   * Genera el reporte con los filtros actuales
   */
  const generarReporte = async () => {
    setGenerating(true);
    
    try {
      const params = {
        tipo: filters.tipo_reporte,
        formato: filters.formato,
        fecha_inicio: format(filters.fecha_inicio, 'yyyy-MM-dd'),
        fecha_fin: format(filters.fecha_fin, 'yyyy-MM-dd'),
        ...(filters.area_id && { area_id: filters.area_id }),
        ...(filters.seccion_id && { seccion_id: filters.seccion_id }),
        ...(filters.serie_id && { serie_id: filters.serie_id }),
        ...(filters.estatus && { estatus: filters.estatus })
      };

      const response = await axios.get('/reportes/generar', {
        params,
        responseType: filters.formato === 'preview' ? 'json' : 'blob'
      });

      if (filters.formato === 'preview') {
        setPreviewData(response.data);
        setPreviewDialog(true);
      } else {
        // Descargar archivo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        const extension = filters.formato === 'pdf' ? 'pdf' : 
                         filters.formato === 'excel' ? 'xlsx' : 'xml';
        link.setAttribute('download', `reporte_${filters.tipo_reporte}_${format(new Date(), 'yyyyMMdd')}.${extension}`);
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      // Actualizar historial
      await cargarHistorial();
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Obtiene el ícono del formato
   */
  const getFormatIcon = (formato) => {
    switch (formato) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'xml': return <XmlIcon />;
      default: return <DescriptionIcon />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Generación de Reportes
        </Typography>

        <Grid container spacing={3}>
          {/* Panel de tipos de reporte */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tipo de Reporte
              </Typography>
              
              <List>
                {tiposReporte.map((tipo) => (
                  <ListItemButton
                    key={tipo.id}
                    selected={filters.tipo_reporte === tipo.id}
                    onClick={() => handleFilterChange('tipo_reporte', tipo.id)}
                  >
                    <ListItemIcon>
                      {tipo.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={tipo.nombre}
                      secondary={tipo.descripcion}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Panel de filtros */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filtros del Reporte
              </Typography>

              <Grid container spacing={2}>
                {/* Rango de fechas */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rango de Fechas
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setDateRange('mes')}
                    >
                      Este mes
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setDateRange('año')}
                    >
                      Este año
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setDateRange('todo')}
                    >
                      Todo
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={filters.fecha_inicio}
                    onChange={(date) => handleFilterChange('fecha_inicio', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha Fin"
                    value={filters.fecha_fin}
                    onChange={(date) => handleFilterChange('fecha_fin', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={filters.fecha_inicio}
                  />
                </Grid>

                {/* Filtros de clasificación */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Área</InputLabel>
                    <Select
                      value={filters.area_id}
                      onChange={(e) => handleFilterChange('area_id', e.target.value)}
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

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!filters.area_id}>
                    <InputLabel>Sección</InputLabel>
                    <Select
                      value={filters.seccion_id}
                      onChange={(e) => handleFilterChange('seccion_id', e.target.value)}
                      label="Sección"
                    >
                      <MenuItem value="">
                        <em>Todas</em>
                      </MenuItem>
                      {secciones.map((seccion) => (
                        <MenuItem key={seccion.id} value={seccion.id}>
                          {seccion.codigo} - {seccion.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!filters.seccion_id}>
                    <InputLabel>Serie</InputLabel>
                    <Select
                      value={filters.serie_id}
                      onChange={(e) => handleFilterChange('serie_id', e.target.value)}
                      label="Serie"
                    >
                      <MenuItem value="">
                        <em>Todas</em>
                      </MenuItem>
                      {series.map((serie) => (
                        <MenuItem key={serie.id} value={serie.id}>
                          {serie.codigo} - {serie.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={filters.estatus}
                      onChange={(e) => handleFilterChange('estatus', e.target.value)}
                      label="Estado"
                    >
                      <MenuItem value="">
                        <em>Todos</em>
                      </MenuItem>
                      <MenuItem value="ACTIVO">Activo</MenuItem>
                      <MenuItem value="CERRADO">Cerrado</MenuItem>
                      <MenuItem value="TRANSFERIDO">Transferido</MenuItem>
                      <MenuItem value="BAJA">Baja</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Formato de salida */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Formato de Salida
                  </Typography>
                  <ToggleButtonGroup
                    value={filters.formato}
                    exclusive
                    onChange={(e, value) => value && handleFilterChange('formato', value)}
                    fullWidth
                  >
                    <ToggleButton value="excel">
                      <ExcelIcon sx={{ mr: 1 }} />
                      Excel
                    </ToggleButton>
                    <ToggleButton value="pdf">
                      <PdfIcon sx={{ mr: 1 }} />
                      PDF
                    </ToggleButton>
                    <ToggleButton value="xml">
                      <XmlIcon sx={{ mr: 1 }} />
                      XML
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                {/* Botones de acción */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                    <Button
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={() => {
                        handleFilterChange('formato', 'preview');
                        generarReporte();
                      }}
                    >
                      Vista Previa
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={generating ? <CircularProgress size={20} /> : <DownloadIcon />}
                      onClick={generarReporte}
                      disabled={generating}
                    >
                      {generating ? 'Generando...' : 'Generar Reporte'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Historial de reportes */}
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Reportes Recientes
              </Typography>

              {reportHistory.length === 0 ? (
                <Alert severity="info">
                  No hay reportes generados recientemente
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Formato</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportHistory.map((reporte) => (
                        <TableRow key={reporte.id}>
                          <TableCell>
                            {tiposReporte.find(t => t.id === reporte.tipo)?.nombre}
                          </TableCell>
                          <TableCell>
                            {format(reporte.fecha, 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>{reporte.usuario}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getFormatIcon(reporte.formato)}
                              label={reporte.formato.toUpperCase()}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Descargar">
                              <IconButton size="small">
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Diálogo de vista previa */}
        <Dialog
          open={previewDialog}
          onClose={() => setPreviewDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Vista Previa del Reporte
          </DialogTitle>
          <DialogContent>
            {previewData && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No. Expediente</TableCell>
                      <TableCell>Asunto</TableCell>
                      <TableCell>Clasificación</TableCell>
                      <TableCell>Fecha Apertura</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fojas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.numero_expediente}</TableCell>
                        <TableCell>{row.asunto}</TableCell>
                        <TableCell>
                          {row.serie_codigo} - {row.serie_nombre}
                        </TableCell>
                        <TableCell>
                          {format(new Date(row.fecha_apertura), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.estatus}
                            size="small"
                            color={row.estatus === 'ACTIVO' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{row.total_fojas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {previewData && previewData.length > 10 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Mostrando solo los primeros 10 registros de {previewData.length} totales
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>
              Cerrar
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                setPreviewDialog(false);
                generarReporte();
              }}
            >
              Descargar Completo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Reportes;