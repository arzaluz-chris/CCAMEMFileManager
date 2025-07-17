import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Tooltip,
  Fab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from '../services/api';

/**
 * Componente para visualizar el detalle completo de un expediente
 * incluyendo sus documentos adjuntos
 */
const ExpedienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estado principal
  const [expediente, setExpediente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para el diálogo de upload
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Estado para el diálogo de visualización
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    cargarExpediente();
    cargarDocumentos();
  }, [id]);

  /**
   * Carga los datos del expediente
   */
  const cargarExpediente = async () => {
    try {
      const response = await axios.get(`/expedientes/${id}`);
      setExpediente(response.data);
    } catch (error) {
      console.error('Error al cargar expediente:', error);
      setError('Error al cargar el expediente');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga los documentos asociados al expediente
   */
  const cargarDocumentos = async () => {
    try {
      const response = await axios.get(`/uploads/expediente/${id}/documentos`);
      setDocumentos(response.data.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  };

  /**
   * Maneja la subida de documentos
   */
  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('archivo', uploadFile);
    formData.append('descripcion', uploadDescription);
    formData.append('expediente_id', id);

    try {
      await axios.post('/uploads/documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Recargar documentos
      await cargarDocumentos();
      
      // Cerrar diálogo y limpiar estado
      setUploadDialog(false);
      setUploadFile(null);
      setUploadDescription('');
      
      // Actualizar contador de fojas si es necesario
      await cargarExpediente();
    } catch (error) {
      console.error('Error al subir documento:', error);
      alert('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Descarga un documento
   */
  const handleDownload = async (documento) => {
    try {
      const response = await axios.get(`/uploads/documento/${documento.id}`, {
        responseType: 'blob'
      });
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documento.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      alert('Error al descargar el documento');
    }
  };

  /**
   * Elimina un documento
   */
  const handleDeleteDocument = async (documentoId) => {
    if (!window.confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      await axios.delete(`/uploads/documento/${documentoId}`);
      await cargarDocumentos();
      await cargarExpediente(); // Actualizar contador de fojas
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      alert('Error al eliminar el documento');
    }
  };

  /**
   * Obtiene el icono según el tipo de archivo
   */
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <PdfIcon />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon />;
    return <DocIcon />;
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
   * Obtiene el color del chip según el estado
   */
  const getStatusColor = (status) => {
    const colors = {
      'ACTIVO': 'success',
      'CERRADO': 'default',
      'TRANSFERIDO': 'warning',
      'BAJA': 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/expedientes')} sx={{ mt: 2 }}>
          Volver a expedientes
        </Button>
      </Box>
    );
  }

  if (!expediente) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate('/expedientes')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">
              Expediente {expediente.numero_expediente}
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Editar expediente">
              <IconButton 
                color="primary" 
                onClick={() => navigate(`/expedientes/editar/${id}`)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Imprimir carátula">
              <IconButton color="primary">
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Compartir">
              <IconButton color="primary">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {expediente.asunto}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign="right">
            <Chip
              label={expediente.estado?.toUpperCase()}
              color={getStatusColor(expediente.estado?.toUpperCase())}
              size="large"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper elevation={3}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Información General" />
          <Tab label={`Documentos (${documentos.length})`} />
          <Tab label="Historial" />
        </Tabs>

        {/* Tab 1: Información General */}
        {tabValue === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              {/* Clasificación Archivística */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Clasificación Archivística
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary" variant="body2">
                          Área
                        </Typography>
                        <Typography variant="body1">
                          {expediente.area?.codigo} - {expediente.area?.nombre}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary" variant="body2">
                          Sección
                        </Typography>
                        <Typography variant="body1">
                          {expediente.seccion?.codigo} - {expediente.seccion?.nombre}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary" variant="body2">
                          Serie
                        </Typography>
                        <Typography variant="body1">
                          {expediente.serie?.codigo} - {expediente.serie?.nombre}
                        </Typography>
                      </Grid>
                      {expediente.subserie && (
                        <Grid item xs={12} md={3}>
                          <Typography color="text.secondary" variant="body2">
                            Subserie
                          </Typography>
                          <Typography variant="body1">
                            {expediente.subserie?.codigo} - {expediente.subserie?.nombre}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fechas */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Fechas
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fecha de Apertura"
                      secondary={format(new Date(expediente.fecha_apertura), 'dd/MM/yyyy', { locale: es })}
                    />
                  </ListItem>
                  {expediente.fecha_cierre && (
                    <ListItem>
                      <ListItemIcon>
                        <TimeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Fecha de Cierre"
                        secondary={format(new Date(expediente.fecha_cierre), 'dd/MM/yyyy', { locale: es })}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              {/* Información Física */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información Física
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fojas / Legajos"
                      secondary={`${expediente.total_hojas} fojas en ${expediente.numero_legajos} legajo(s)`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Ubicación Física"
                      secondary={expediente.ubicacion_fisica}
                    />
                  </ListItem>
                </List>
              </Grid>

              {/* Valores Documentales */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Valores Documentales
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary" variant="body2">
                          Archivo de Trámite
                        </Typography>
                        <Typography variant="body1">
                          {expediente.archivo_tramite || 0} años
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary" variant="body2">
                          Archivo de Concentración
                        </Typography>
                        <Typography variant="body1">
                          {expediente.archivo_concentracion || 0} años
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography color="text.secondary" variant="body2">
                          Destino Final
                        </Typography>
                        <Typography variant="body1">
                          {expediente.destino_final}
                        </Typography>
                      </Grid>
                        <Grid item xs="12">
                          <Typography color="text.secondary" variant="body2">
                            Clasificación
                          </Typography>
                          <Typography variant="body1">
                            {expediente.clasificacion_informacion}
                          </Typography>
                        </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Observaciones */}
              {expediente.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Observaciones
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body1">
                        {expediente.observaciones}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Tab 2: Documentos */}
        {tabValue === 1 && (
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Documentos del Expediente
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialog(true)}
              >
                Subir Documento
              </Button>
            </Box>

            {documentos.length === 0 ? (
              <Alert severity="info">
                No hay documentos adjuntos a este expediente.
              </Alert>
            ) : (
              <List>
                {documentos.map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        {getFileIcon(doc.nombre_archivo)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.nombre_archivo}
                        secondary={
                          <React.Fragment>
                            {doc.descripcion && <span>{doc.descripcion} • </span>}
                            {formatFileSize(doc.tamaño)} • 
                            Subido el {format(new Date(doc.fecha_carga), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Ver documento">
                          <IconButton 
                            edge="end" 
                            onClick={() => {
                              setSelectedDocument(doc);
                              setViewDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar">
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDownload(doc)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDeleteDocument(doc.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Tab 3: Historial */}
        {tabValue === 2 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Historial del Expediente
            </Typography>
            <Alert severity="info">
              El historial de movimientos estará disponible próximamente.
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Diálogo para subir documentos */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ marginBottom: '16px' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <TextField
              fullWidth
              label="Descripción del documento"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="Breve descripción del contenido del documento"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para visualizar documentos */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          {selectedDocument?.nombre_archivo}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {selectedDocument && (
              selectedDocument.nombre_archivo.endsWith('.pdf') ? (
                <iframe
                  src={`${axios.defaults.baseURL}/uploads/documento/${selectedDocument.id}/preview`}
                  width="100%"
                  height="100%"
                  title="Vista previa del documento"
                />
              ) : selectedDocument.nombre_archivo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={`${axios.defaults.baseURL}/uploads/documento/${selectedDocument.id}/preview`}
                  alt="Vista previa"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Alert severity="info">
                  Vista previa no disponible para este tipo de archivo
                </Alert>
              )
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDownload(selectedDocument)}>
            Descargar
          </Button>
          <Button onClick={() => setViewDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para subir documentos */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setUploadDialog(true)}
      >
        <AttachFileIcon />
      </Fab>
    </Box>
  );
};

export default ExpedienteDetail;