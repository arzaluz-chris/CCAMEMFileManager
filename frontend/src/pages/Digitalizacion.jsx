import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Snackbar,
  TextField,
  Autocomplete,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  AttachFile as AttachIcon,
  Scanner as ScannerIcon,
  FolderOpen as FolderIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from '../services/api';

/**
 * Componente para digitalización masiva de documentos
 * con soporte para drag & drop y previsualización
 */
const Digitalizacion = () => {
  // Estado principal
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para previsualización
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Cargar expedientes al montar
  useEffect(() => {
    cargarExpedientes();
  }, []);

  /**
   * Carga la lista de expedientes activos
   */
  const cargarExpedientes = async () => {
    try {
      const response = await axios.get('/expedientes?estado=activo&limit=100');
      setExpedientes(response.data.expedientes);
    } catch (error) {
      console.error('Error al cargar expedientes:', error);
      mostrarSnackbar('Error al cargar expedientes', 'error');
    }
  };

  /**
   * Configuración del dropzone
   */
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Validar archivos rechazados
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        const error = file.errors[0];
        if (error.code === 'file-too-large') {
          return `${file.file.name}: El archivo es muy grande (máx. 10MB)`;
        }
        return `${file.file.name}: Tipo de archivo no permitido`;
      }).join('\n');
      
      mostrarSnackbar(errors, 'error');
      return;
    }

    // Agregar archivos aceptados con metadata
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      descripcion: '',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10485760, // 10MB
    multiple: true
  });

  /**
   * Muestra notificación al usuario
   */
  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  /**
   * Elimina un archivo de la lista
   */
  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
    // Limpiar preview si existe
    const file = files.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  /**
   * Actualiza la descripción de un archivo
   */
  const updateFileDescription = (fileId, descripcion) => {
    setFiles(files.map(f => 
      f.id === fileId ? { ...f, descripcion } : f
    ));
  };

  /**
   * Sube todos los archivos pendientes
   */
  const uploadAllFiles = async () => {
    if (!selectedExpediente) {
      mostrarSnackbar('Debe seleccionar un expediente', 'error');
      return;
    }

    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      mostrarSnackbar('No hay archivos pendientes para subir', 'warning');
      return;
    }

    setUploading(true);

    for (const fileData of pendingFiles) {
      await uploadSingleFile(fileData);
    }

    setUploading(false);
    mostrarSnackbar('Proceso de carga completado', 'success');
  };

  /**
   * Sube un archivo individual
   */
  const uploadSingleFile = async (fileData) => {
    try {
      // Actualizar estado a uploading
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      ));

      const formData = new FormData();
      formData.append('archivo', fileData.file);
      formData.append('descripcion', fileData.descripcion || fileData.name);
      formData.append('expediente_id', selectedExpediente.id);

      // Simular progreso (el backend real debería enviar eventos de progreso)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: Math.min((prev[fileData.id] || 0) + 10, 90)
        }));
      }, 200);

      const response = await axios.post('/uploads/documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));

      // Actualizar estado a success
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'success' } : f
      ));

    } catch (error) {
      console.error('Error al subir archivo:', error);
      
      // Actualizar estado a error
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'error' } : f
      ));
    }
  };

  /**
   * Obtiene el icono según el tipo de archivo
   */
  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') return <PdfIcon />;
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.includes('word')) return <DocIcon />;
    return <AttachIcon />;
  };

  /**
   * Formatea el tamaño del archivo
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Obtiene el color del estado
   */
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'default',
      'uploading': 'primary',
      'success': 'success',
      'error': 'error'
    };
    return colors[status] || 'default';
  };

  /**
   * Obtiene el ícono del estado
   */
  const getStatusIcon = (status) => {
    if (status === 'success') return <SuccessIcon />;
    if (status === 'error') return <ErrorIcon />;
    return null;
  };

  /**
   * Maneja la previsualización de archivos
   */
  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewDialog(true);
  };

  /**
   * Limpia todos los archivos con estado success
   */
  const clearSuccessfulFiles = () => {
    const successFiles = files.filter(f => f.status === 'success');
    successFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles(files.filter(f => f.status !== 'success'));
    setUploadProgress({});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <ScannerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Digitalización de Documentos
      </Typography>

      <Grid container spacing={3}>
        {/* Panel de selección de expediente */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              1. Seleccionar Expediente
            </Typography>
            
            <Autocomplete
              options={expedientes}
              getOptionLabel={(option) => `${option.numero_expediente} - ${option.asunto}`}
              value={selectedExpediente}
              onChange={(event, newValue) => setSelectedExpediente(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar expediente"
                  placeholder="Número o asunto..."
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.numero_expediente}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.asunto}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {selectedExpediente && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Expediente Seleccionado
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número:</strong> {selectedExpediente.numero_expediente}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Asunto:</strong> {selectedExpediente.asunto}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fojas actuales:</strong> {selectedExpediente.total_hojas}
                  </Typography>
                  <Chip
                    label={selectedExpediente.estado}
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Zona de carga de archivos */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              2. Cargar Documentos
            </Typography>

            {/* Dropzone */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.400',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive
                  ? 'Suelte los archivos aquí...'
                  : 'Arrastre archivos aquí o haga clic para seleccionar'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB por archivo)
              </Typography>
            </Box>

            {/* Lista de archivos */}
            {files.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Archivos ({files.length})
                  </Typography>
                  {files.some(f => f.status === 'success') && (
                    <Button
                      size="small"
                      onClick={clearSuccessfulFiles}
                      startIcon={<DeleteIcon />}
                    >
                      Limpiar completados
                    </Button>
                  )}
                </Box>

                <List>
                  {files.map((file) => (
                    <Card key={file.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item>
                            {getFileIcon(file)}
                          </Grid>
                          <Grid item xs>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1">
                                {file.name}
                              </Typography>
                              <Chip
                                label={file.status}
                                size="small"
                                color={getStatusColor(file.status)}
                                icon={getStatusIcon(file.status)}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatFileSize(file.size)}
                            </Typography>
                            
                            {file.status === 'pending' && (
                              <TextField
                                size="small"
                                placeholder="Descripción (opcional)"
                                value={file.descripcion}
                                onChange={(e) => updateFileDescription(file.id, e.target.value)}
                                sx={{ mt: 1, width: '100%', maxWidth: 400 }}
                              />
                            )}
                            
                            {file.status === 'uploading' && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={uploadProgress[file.id] || 0}
                                />
                              </Box>
                            )}
                          </Grid>
                          <Grid item>
                            {file.preview && (
                              <Tooltip title="Vista previa">
                                <IconButton onClick={() => handlePreview(file)}>
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {file.status === 'pending' && (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  color="error"
                                  onClick={() => removeFile(file.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </List>

                {/* Botón de carga */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!selectedExpediente || uploading || files.every(f => f.status !== 'pending')}
                    onClick={uploadAllFiles}
                    startIcon={<SendIcon />}
                  >
                    {uploading ? 'Subiendo archivos...' : 'Subir todos los archivos'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Panel de información */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Instrucciones de Digitalización
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <FolderIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      1. Seleccione el expediente
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Busque y seleccione el expediente al que desea agregar documentos.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <UploadIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      2. Cargue los documentos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Arrastre los archivos o haga clic para seleccionarlos. Puede cargar múltiples archivos a la vez.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <SendIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      3. Suba los archivos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revise los archivos y haga clic en "Subir todos los archivos" para completar el proceso.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo de vista previa */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Vista previa: {previewFile?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {previewFile?.preview && (
              <img
                src={previewFile.preview}
                alt="Vista previa"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
              />
            )}
            {previewFile?.type === 'application/pdf' && (
              <Alert severity="info">
                La vista previa de PDF no está disponible. El archivo se cargará correctamente.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
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

export default Digitalizacion;