import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Backup as BackupIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';

/**
 * Componente para la configuración general del sistema
 * TODO: Implementar funcionalidad completa
 */
const Configuracion = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Configuración del Sistema
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              avatar={<BusinessIcon />}
              title="Información Institucional"
            />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Nombre de la institución"
                    secondary="Comisión de Conciliación y Arbitraje Médico del Estado de México"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Siglas"
                    secondary="CCAMEM"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Dirección"
                    secondary="Por configurar"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              avatar={<EmailIcon />}
              title="Configuración de Correo"
            />
            <CardContent>
              <Alert severity="warning">
                Configuración de servidor SMTP pendiente
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              avatar={<BackupIcon />}
              title="Respaldos"
            />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <BackupIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Respaldos automáticos"
                    secondary="Diarios a las 2:00 AM"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              avatar={<SecurityIcon />}
              title="Seguridad"
            />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Tiempo de sesión"
                    secondary="30 minutos de inactividad"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Intentos de login"
                    secondary="3 intentos máximo"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Alert severity="info">
              <AlertTitle>Funcionalidades pendientes</AlertTitle>
              <ul>
                <li>Configuración de parámetros del sistema</li>
                <li>Personalización de la interfaz</li>
                <li>Gestión de catálogos auxiliares</li>
                <li>Configuración de notificaciones</li>
                <li>Logs y auditoría del sistema</li>
                <li>Importación/Exportación de datos</li>
                <li>Configuración de respaldos automáticos</li>
              </ul>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Configuracion;