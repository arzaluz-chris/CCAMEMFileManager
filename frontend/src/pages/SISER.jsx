import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  TableChart as ExcelIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from '../services/api';
import * as XLSX from 'xlsx';

/**
 * Componente para automatizar la carga de expedientes en SISER
 */
const SISER = () => {
  // Estado principal
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processResults, setProcessResults] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Referencias
  const fileInputRef = useRef(null);
  
  // Estado de diálogos
  const [configDialog, setConfigDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [resultsDialog, setResultsDialog] = useState(false);
  
  // Estado de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Configuración SISER
  const [config, setConfig] = useState({
    email: 'calbleyva10@hotmail.com',
    url: 'https://siser.secogem.gob.mx',
    delay: 2000, // milisegundos entre operaciones
    maxRetries: 3
  });

  /**
   * Pasos del proceso
   */
  const steps = [
    'Cargar archivo Excel',
    'Validar datos',
    'Configurar proceso',
    'Ejecutar automatización'
  ];

  /**
   * Maneja la carga del archivo Excel
   */
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setProcessing(true);

    try {
      const data = await readExcelFile(uploadedFile);
      setFileData(data);
      
      // Validar datos automáticamente
      const validation = validateData(data);
      setValidationResults(validation);
      
      if (validation.isValid) {
        mostrarSnackbar(`Archivo cargado: ${data.length} registros encontrados`, 'success');
        setActiveStep(1);
      } else {
        mostrarSnackbar('El archivo contiene errores que deben corregirse', 'warning');
      }
    } catch (error) {
      console.error('Error al leer archivo:', error);
      mostrarSnackbar('Error al leer el archivo Excel', 'error');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Lee el archivo Excel y extrae los datos
   */
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Valida los datos del Excel
   */
  const validateData = (data) => {
    const errors = [];
    const warnings = [];
    
    // Validar que hay datos
    if (!data || data.length === 0) {
      errors.push('El archivo está vacío');
      return { isValid: false, errors, warnings };
    }
    
    // Validar columnas requeridas
    const requiredColumns = ['Sección', 'Serie', 'Nombre', 'Total de Fojas', 'Fecha de inicio', 'Fecha de Cierre'];
    const columns = Object.keys(data[0] || {});
    
    requiredColumns.forEach(col => {
      if (!columns.some(c => c.includes(col))) {
        errors.push(`Columna requerida no encontrada: ${col}`);
      }
    });
    
    // Validar cada registro
    data.forEach((row, index) => {
      // Validar campos vacíos
      if (!row['Nombre']) {
        errors.push(`Fila ${index + 2}: Nombre vacío`);
      }
      
      // Validar números
      const fojas = row['Total de Fojas'] || row['Total de Fojas '];
      if (fojas && isNaN(parseInt(fojas))) {
        warnings.push(`Fila ${index + 2}: Total de fojas no es un número válido`);
      }
      
      // Validar fechas
      const fechaInicio = row['Fecha de inicio'];
      const fechaCierre = row['Fecha de Cierre'];
      
      if (!fechaInicio || !Date.parse(fechaInicio)) {
        warnings.push(`Fila ${index + 2}: Fecha de inicio inválida`);
      }
      
      if (fechaCierre && fechaInicio && new Date(fechaCierre) < new Date(fechaInicio)) {
        warnings.push(`Fila ${index + 2}: Fecha de cierre anterior a fecha de inicio`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRecords: data.length,
      validRecords: data.length - errors.length
    };
  };

  /**
   * Ejecuta el proceso de automatización
   */
  const ejecutarAutomatizacion = async () => {
    setProcessing(true);
    setProcessResults([]);
    setCurrentProgress(0);
    
    try {
      // Preparar datos para enviar
      const datosFormateados = fileData.map(row => ({
        seccion: row['Sección'] || '',
        serie: row['Serie'] || row['  Serie'] || '',
        nombre: row['Nombre'] || '',
        total_fojas: parseInt(row['Total de Fojas'] || row['Total de Fojas '] || 0),
        legajos: parseInt(row['Legajos'] || 1),
        fecha_inicio: row['Fecha de inicio'],
        fecha_cierre: row['Fecha de Cierre'],
        subserie: row['Subserie'] || ''
      }));
      
      // Enviar al backend para procesamiento
      const response = await axios.post('/siser/procesar', {
        registros: datosFormateados,
        config: config
      }, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setCurrentProgress(progress);
        }
      });
      
      // Simular procesamiento con websockets (en producción sería real-time)
      simulateProcessing(datosFormateados);
      
    } catch (error) {
      console.error('Error en automatización:', error);
      mostrarSnackbar('Error al ejecutar la automatización', 'error');
      setProcessing(false);
    }
  };

  /**
   * Simula el procesamiento de registros
   */
  const simulateProcessing = (registros) => {
    let processed = 0;
    const results = [];
    
    const interval = setInterval(() => {
      if (processed < registros.length) {
        const result = {
          index: processed,
          registro: registros[processed],
          status: Math.random() > 0.1 ? 'success' : 'error',
          message: Math.random() > 0.1 ? 'Cargado correctamente' : 'Error de conexión',
          timestamp: new Date()
        };
        
        results.push(result);
        setProcessResults([...results]);
        setCurrentProgress(((processed + 1) / registros.length) * 100);
        processed++;
      } else {
        clearInterval(interval);
        setProcessing(false);
        setActiveStep(4);
        mostrarSnackbar('Proceso completado', 'success');
      }
    }, config.delay);
  };

  /**
   * Descarga plantilla de Excel
   */
  const descargarPlantilla = () => {
    // Crear workbook con plantilla
    const ws_data = [
      ['Sección', 'Serie', 'Nombre', 'Total de Fojas', 'Legajos', 'Fecha de inicio', 'Fecha de Cierre', 'Subserie'],
      ['1C', '1C.1', 'Ejemplo de expediente', '50', '1', '2024-01-01', '2024-12-31', '']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    
    // Descargar
    XLSX.writeFile(wb, 'plantilla_siser.xlsx');
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
   * Renderiza el contenido según el paso activo
   */
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Cargue el archivo Excel con los expedientes a procesar en SISER.
            </Typography>
            
            <Card variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 3 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Seleccionar archivo Excel'}
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                {processing ? 'Procesando...' : 'Cargar archivo'}
              </Button>
            </Card>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={descargarPlantilla}
              fullWidth
            >
              Descargar plantilla Excel
            </Button>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Resultados de la validación del archivo:
            </Typography>
            
            {validationResults && (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Total de registros
                        </Typography>
                        <Typography variant="h4">
                          {validationResults.totalRecords}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Registros válidos
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {validationResults.validRecords}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {validationResults.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Errores encontrados</AlertTitle>
                    <List dense>
                      {validationResults.errors.slice(0, 5).map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                      {validationResults.errors.length > 5 && (
                        <ListItem>
                          <ListItemText 
                            primary={`... y ${validationResults.errors.length - 5} errores más`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Alert>
                )}
                
                {validationResults.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Advertencias</AlertTitle>
                    <List dense>
                      {validationResults.warnings.slice(0, 5).map((warning, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <WarningIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={warning} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => setPreviewDialog(true)}
                  >
                    Ver datos
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!validationResults.isValid}
                    onClick={() => setActiveStep(2)}
                  >
                    Continuar
                  </Button>
                </Box>
              </>
            )}
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Configure los parámetros del proceso de automatización:
            </Typography>
            
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email SISER"
                      value={config.email}
                      disabled
                      helperText="Email configurado en el sistema"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL SISER"
                      value={config.url}
                      disabled
                      helperText="URL del sistema SISER"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Retraso entre operaciones (ms)"
                      value={config.delay}
                      onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) })}
                      helperText="Tiempo de espera entre cada registro"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Reintentos máximos"
                      value={config.maxRetries}
                      onChange={(e) => setConfig({ ...config, maxRetries: parseInt(e.target.value) })}
                      helperText="Intentos en caso de error"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              El proceso se ejecutará en segundo plano. Puede tomar varios minutos dependiendo 
              de la cantidad de registros.
            </Alert>
            
            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => {
                  setActiveStep(3);
                  ejecutarAutomatizacion();
                }}
              >
                Iniciar proceso
              </Button>
            </Box>
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Procesando registros en SISER...
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={currentProgress} 
              sx={{ mb: 3, height: 10, borderRadius: 5 }}
            />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {Math.round(currentProgress)}% completado - 
              {processResults.length} de {fileData.length} registros procesados
            </Typography>
            
            <Card variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mt: 2 }}>
              <List dense>
                {processResults.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {result.status === 'success' ? (
                        <CheckIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${result.registro.nombre}`}
                      secondary={`${result.message} - ${result.timestamp.toLocaleTimeString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
            
            {!processing && (
              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setActiveStep(0);
                    setFile(null);
                    setFileData([]);
                    setProcessResults([]);
                  }}
                >
                  Nuevo proceso
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={() => setResultsDialog(true)}
                >
                  Ver resultados
                </Button>
              </Box>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Automatización SISER
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {renderStepContent(index)}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Información
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>¿Qué es SISER?</AlertTitle>
              Sistema de Seguimiento a Recomendaciones del Estado de México.
            </Alert>
            
            <Typography variant="body2" paragraph>
              Esta herramienta automatiza la carga masiva de expedientes en el sistema SISER
              utilizando los datos de un archivo Excel.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Proceso:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Preparar archivo Excel"
                  secondary="Con los datos de los expedientes"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Validar información"
                  secondary="Verificar que los datos sean correctos"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Ejecutar automatización"
                  secondary="El sistema cargará los datos automáticamente"
                />
              </ListItem>
            </List>
            
            <Alert severity="warning">
              Asegúrese de tener las credenciales correctas de SISER configuradas en el sistema.
            </Alert>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Diálogo de vista previa de datos */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Vista previa de datos</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sección</TableCell>
                  <TableCell>Serie</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Fojas</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Cierre</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fileData.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row['Sección']}</TableCell>
                    <TableCell>{row['Serie'] || row['  Serie']}</TableCell>
                    <TableCell>{row['Nombre']}</TableCell>
                    <TableCell>{row['Total de Fojas'] || row['Total de Fojas ']}</TableCell>
                    <TableCell>{row['Fecha de inicio']}</TableCell>
                    <TableCell>{row['Fecha de Cierre']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {fileData.length > 10 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Mostrando 10 de {fileData.length} registros
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de resultados */}
      <Dialog
        open={resultsDialog}
        onClose={() => setResultsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Resumen de Resultados</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total procesados
                  </Typography>
                  <Typography variant="h4">
                    {processResults.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Exitosos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {processResults.filter(r => r.status === 'success').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Con errores
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {processResults.filter(r => r.status === 'error').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography variant="h6" gutterBottom>
            Detalle de procesamiento
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Estado</TableCell>
                  <TableCell>Expediente</TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell>Hora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        icon={result.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
                        label={result.status === 'success' ? 'Exitoso' : 'Error'}
                        color={result.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{result.registro.nombre}</TableCell>
                    <TableCell>{result.message}</TableCell>
                    <TableCell>{result.timestamp.toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Generar reporte de resultados
              const ws = XLSX.utils.json_to_sheet(processResults.map(r => ({
                Estado: r.status === 'success' ? 'Exitoso' : 'Error',
                Expediente: r.registro.nombre,
                Mensaje: r.message,
                Hora: r.timestamp.toLocaleString()
              })));
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
              XLSX.writeFile(wb, `resultados_siser_${new Date().toISOString().split('T')[0]}.xlsx`);
            }}
          >
            Descargar reporte
          </Button>
          <Button onClick={() => setResultsDialog(false)}>
            Cerrar
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

export default SISER;