// === ARCHIVO: frontend/src/pages/Configuracion.jsx ===
// Página principal del módulo de configuración del sistema

import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Card,
  CardContent,
  TextField,
  Switch,
  Button,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  FormHelperText
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { TabPanel } from '../components/TabPanel';
import configuracionService from '../services/configuracion.service';
import { formatearFecha, formatearTamanoArchivo, formatearDuracion } from '../utils/formatters';
import { MENSAJES_EXITO, MENSAJES_ERROR } from '../utils/constants';

function Configuracion() {
  // Estados principales
  const [tabActual, setTabActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados para configuraciones
  const [configuraciones, setConfiguraciones] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [respaldos, setRespaldos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [infoSistema, setInfoSistema] = useState(null);
  
  // Estados para paginación de auditoría
  const [pageAuditoria, setPageAuditoria] = useState(0);
  const [rowsPerPageAuditoria, setRowsPerPageAuditoria] = useState(50);
  const [totalAuditoria, setTotalAuditoria] = useState(0);
  
  // Estados para diálogos
  const [dialogoRespaldo, setDialogoRespaldo] = useState(false);
  const [dialogoEmail, setDialogoEmail] = useState(false);
  const [emailPrueba, setEmailPrueba] = useState('');
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para cambios pendientes
  const [cambiosPendientes, setCambiosPendientes] = useState({});

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar auditoría cuando cambie la paginación
  useEffect(() => {
    if (tabActual === 3) {
      cargarAuditoria();
    }
  }, [pageAuditoria, rowsPerPageAuditoria, tabActual]);

  /**
   * Cargar todos los datos de configuración
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [configRes, notifRes, respaldosRes, infoRes] = await Promise.all([
        configuracionService.obtenerConfiguraciones(),
        configuracionService.obtenerNotificaciones(),
        configuracionService.obtenerRespaldos(),
        configuracionService.obtenerInfoSistema()
      ]);
      
      setConfiguraciones(configRes.data);
      setNotificaciones(notifRes.data);
      setRespaldos(respaldosRes.data);
      setInfoSistema(infoRes.data);
      
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      mostrarSnackbar('Error al cargar las configuraciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar logs de auditoría
   */
  const cargarAuditoria = async () => {
    try {
      const params = {
        page: pageAuditoria + 1,
        limit: rowsPerPageAuditoria
      };
      
      const response = await configuracionService.obtenerAuditoria(params);
      setAuditoria(response.data);
      setTotalAuditoria(response.pagination.totalItems);
      
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
      mostrarSnackbar('Error al cargar los logs de auditoría', 'error');
    }
  };

  /**
   * Manejar cambio de tab
   */
  const handleTabChange = (event, newValue) => {
    setTabActual(newValue);
  };

  /**
   * Manejar cambio en configuración
   */
  const handleConfigChange = (categoria, clave, valor) => {
    setCambiosPendientes(prev => ({
      ...prev,
      [`${categoria}.${clave}`]: valor
    }));
  };

  /**
   * Guardar cambios de configuración
   */
  const guardarConfiguraciones = async () => {
    try {
      setGuardando(true);
      
      const promises = Object.entries(cambiosPendientes).map(([key, valor]) => {
        const [categoria, clave] = key.split('.');
        return configuracionService.actualizarConfiguracion(clave, valor);
      });
      
      await Promise.all(promises);
      
      mostrarSnackbar('Configuraciones guardadas exitosamente', 'success');
      setCambiosPendientes({});
      cargarDatos();
      
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      mostrarSnackbar('Error al guardar las configuraciones', 'error');
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Actualizar notificación
   */
  const actualizarNotificacion = async (id, datos) => {
    try {
      await configuracionService.actualizarNotificacion(id, datos);
      mostrarSnackbar('Notificación actualizada', 'success');
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, ...datos } : n)
      );
      
    } catch (error) {
      console.error('Error al actualizar notificación:', error);
      mostrarSnackbar('Error al actualizar la notificación', 'error');
    }
  };

  /**
   * Ejecutar respaldo manual
   */
  const ejecutarRespaldo = async (id) => {
    if (!window.confirm('¿Deseas ejecutar este respaldo ahora?')) {
      return;
    }
    
    try {
      const response = await configuracionService.ejecutarRespaldo(id);
      mostrarSnackbar(response.message, 'success');
      
    } catch (error) {
      console.error('Error al ejecutar respaldo:', error);
      mostrarSnackbar('Error al ejecutar el respaldo', 'error');
    }
  };

  /**
   * Probar configuración de email
   */
  const probarEmail = async () => {
    try {
      await configuracionService.probarEmail(emailPrueba);
      mostrarSnackbar('Email de prueba enviado exitosamente', 'success');
      setDialogoEmail(false);
      setEmailPrueba('');
      
    } catch (error) {
      console.error('Error al enviar email de prueba:', error);
      mostrarSnackbar(error.response?.data?.error || 'Error al enviar email de prueba', 'error');
    }
  };

  /**
   * Limpiar logs antiguos
   */
  const limpiarLogs = async () => {
    const dias = window.prompt('¿Cuántos días de logs deseas conservar?', '90');
    
    if (!dias || isNaN(dias)) {
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de eliminar todos los logs mayores a ${dias} días?`)) {
      return;
    }
    
    try {
      const response = await configuracionService.limpiarLogs(parseInt(dias));
      mostrarSnackbar(response.message, 'success');
      cargarAuditoria();
      
    } catch (error) {
      console.error('Error al limpiar logs:', error);
      mostrarSnackbar('Error al limpiar los logs', 'error');
    }
  };

  /**
   * Mostrar notificación
   */
  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Renderizar campo de configuración según su tipo
   */
  const renderizarCampoConfig = (config, categoria) => {
    const key = `${categoria}.${config.clave}`;
    const valor = cambiosPendientes[key] !== undefined 
      ? cambiosPendientes[key] 
      : config.valor;
    
    if (!config.editable) {
      return (
        <TextField
          fullWidth
          value={valor}
          disabled
          size="small"
          helperText="No editable"
        />
      );
    }
    
    switch (config.tipo) {
      case 'booleano':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={valor}
                onChange={(e) => handleConfigChange(categoria, config.clave, e.target.checked)}
              />
            }
            label={valor ? 'Activo' : 'Inactivo'}
          />
        );
        
      case 'numero':
        return (
          <TextField
            fullWidth
            type="number"
            value={valor}
            onChange={(e) => handleConfigChange(categoria, config.clave, Number(e.target.value))}
            size="small"
          />
        );
        
      default:
        return (
          <TextField
            fullWidth
            value={valor}
            onChange={(e) => handleConfigChange(categoria, config.clave, e.target.value)}
            size="small"
            multiline={config.clave.includes('mensaje') || config.clave.includes('direccion')}
            rows={config.clave.includes('mensaje') ? 3 : 1}
          />
        );
    }
  };

  /**
   * Obtener icono según resultado de auditoría
   */
  const getIconoResultado = (resultado) => {
    switch (resultado) {
      case 'exitoso':
        return <CheckIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'advertencia':
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
        Configuración del Sistema
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabActual} onChange={handleTabChange} variant="scrollable">
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<NotificationsIcon />} label="Notificaciones" />
          <Tab icon={<BackupIcon />} label="Respaldos" />
          <Tab icon={<HistoryIcon />} label="Auditoría" />
          <Tab icon={<InfoIcon />} label="Sistema" />
        </Tabs>

        {/* Tab 1: Configuración General */}
        <TabPanel value={tabActual} index={0}>
          <Box p={3}>
            {Object.entries(configuraciones).map(([categoria, configs]) => (
              <Card key={categoria} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {categoria.replace(/_/g, ' ')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {configs.map((config) => (
                      <Grid item xs={12} md={6} key={config.id}>
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {config.descripcion}
                          </Typography>
                          {renderizarCampoConfig(config, categoria)}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ))}
            
            {Object.keys(cambiosPendientes).length > 0 && (
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={guardarConfiguraciones}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Notificaciones */}
        <TabPanel value={tabActual} index={1}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Configuración de Notificaciones
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => setDialogoEmail(true)}
              >
                Probar Email
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo de Notificación</TableCell>
                    <TableCell align="center">Activa</TableCell>
                    <TableCell align="center">Email</TableCell>
                    <TableCell align="center">Sistema</TableCell>
                    <TableCell>Asunto Email</TableCell>
                    <TableCell>Roles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notificaciones.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {notif.tipo_notificacion.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={notif.activa}
                          onChange={(e) => actualizarNotificacion(notif.id, {
                            ...notif,
                            activa: e.target.checked
                          })}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={notif.enviar_email}
                          onChange={(e) => actualizarNotificacion(notif.id, {
                            ...notif,
                            enviar_email: e.target.checked
                          })}
                          disabled={!notif.activa}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={notif.enviar_sistema}
                          onChange={(e) => actualizarNotificacion(notif.id, {
                            ...notif,
                            enviar_sistema: e.target.checked
                          })}
                          disabled={!notif.activa}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={notif.asunto_email || ''}
                          onChange={(e) => actualizarNotificacion(notif.id, {
                            ...notif,
                            asunto_email: e.target.value
                          })}
                          disabled={!notif.enviar_email}
                        />
                      </TableCell>
                      <TableCell>
                        {notif.roles_destino?.map(rol => (
                          <Chip key={rol} label={rol} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Tab 3: Respaldos */}
        <TabPanel value={tabActual} index={2}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Respaldos Programados
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<BackupIcon />}
                onClick={() => setDialogoRespaldo(true)}
              >
                Nuevo Respaldo
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {respaldos.map((respaldo) => (
                <Grid item xs={12} md={6} key={respaldo.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{respaldo.nombre}</Typography>
                        <Chip
                          label={respaldo.activo ? 'Activo' : 'Inactivo'}
                          color={respaldo.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Tipo"
                            secondary={respaldo.tipo}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Frecuencia"
                            secondary={`${respaldo.frecuencia} a las ${respaldo.hora_ejecucion}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Incluye"
                            secondary={
                              <>
                                {respaldo.incluir_base_datos && 'Base de datos'}
                                {respaldo.incluir_base_datos && respaldo.incluir_documentos && ', '}
                                {respaldo.incluir_documentos && 'Documentos'}
                              </>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Última ejecución"
                            secondary={respaldo.ultima_ejecucion 
                              ? formatearFecha(respaldo.ultima_ejecucion, true)
                              : 'Nunca'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Próxima ejecución"
                            secondary={formatearFecha(respaldo.proximo_ejecucion, true)}
                          />
                        </ListItem>
                      </List>
                      
                      <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                          size="small"
                          startIcon={<PlayIcon />}
                          onClick={() => ejecutarRespaldo(respaldo.id)}
                        >
                          Ejecutar Ahora
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 4: Auditoría */}
        <TabPanel value={tabActual} index={3}>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Logs de Auditoría
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={limpiarLogs}
              >
                Limpiar Logs Antiguos
              </Button>
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Módulo</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="center">Resultado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditoria.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {formatearFecha(log.created_at, true)}
                      </TableCell>
                      <TableCell>{log.usuario_nombre}</TableCell>
                      <TableCell>
                        <Chip label={log.modulo} size="small" />
                      </TableCell>
                      <TableCell>{log.accion}</TableCell>
                      <TableCell>{log.descripcion}</TableCell>
                      <TableCell align="center">
                        {getIconoResultado(log.resultado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={totalAuditoria}
              page={pageAuditoria}
              onPageChange={(e, newPage) => setPageAuditoria(newPage)}
              rowsPerPage={rowsPerPageAuditoria}
              onRowsPerPageChange={(e) => {
                setRowsPerPageAuditoria(parseInt(e.target.value, 10));
                setPageAuditoria(0);
              }}
              labelRowsPerPage="Logs por página:"
            />
          </Box>
        </TabPanel>

        {/* Tab 5: Información del Sistema */}
        <TabPanel value={tabActual} index={4}>
          <Box p={3}>
            {infoSistema && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <StorageIcon sx={{ mr: 1 }} />
                        Base de Datos
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Usuarios"
                            secondary={formatearNumero(infoSistema.base_datos.total_usuarios)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Expedientes"
                            secondary={formatearNumero(infoSistema.base_datos.total_expedientes)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Documentos"
                            secondary={formatearNumero(infoSistema.base_datos.total_documentos)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Tamaño BD"
                            secondary={`${infoSistema.base_datos.tamaño_db_mb} MB`}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <MemoryIcon sx={{ mr: 1 }} />
                        Servidor
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Plataforma"
                            secondary={`${infoSistema.servidor.plataforma} ${infoSistema.servidor.arquitectura}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Node.js"
                            secondary={infoSistema.servidor.version_node}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="CPUs"
                            secondary={infoSistema.servidor.cpus}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Memoria"
                            secondary={
                              <>
                                {formatearTamanoArchivo(infoSistema.servidor.memoria_libre)} / 
                                {formatearTamanoArchivo(infoSistema.servidor.memoria_total)}
                              </>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Uptime"
                            secondary={formatearDuracion(infoSistema.servidor.uptime)}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <StorageIcon sx={{ mr: 1 }} />
                        Almacenamiento
                      </Typography>
                      {infoSistema.almacenamiento.total > 0 ? (
                        <>
                          <Box mb={2}>
                            <LinearProgress
                              variant="determinate"
                              value={(infoSistema.almacenamiento.usado / infoSistema.almacenamiento.total) * 100}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {formatearTamanoArchivo(infoSistema.almacenamiento.usado)} usado de {' '}
                            {formatearTamanoArchivo(infoSistema.almacenamiento.total)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatearTamanoArchivo(infoSistema.almacenamiento.disponible)} disponible
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Información no disponible
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Diálogo para probar email */}
      <Dialog open={dialogoEmail} onClose={() => setDialogoEmail(false)}>
        <DialogTitle>Probar Configuración de Email</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email de destino"
            type="email"
            value={emailPrueba}
            onChange={(e) => setEmailPrueba(e.target.value)}
            margin="normal"
            helperText="Se enviará un email de prueba a esta dirección"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoEmail(false)}>Cancelar</Button>
          <Button
            onClick={probarEmail}
            variant="contained"
            color="primary"
            disabled={!emailPrueba}
          >
            Enviar Prueba
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

export default Configuracion;