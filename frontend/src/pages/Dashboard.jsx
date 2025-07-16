// === ARCHIVO: frontend/src/pages/Dashboard.jsx ===
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';
import {
  Folder,
  Description,
  Assessment,
  CloudUpload,
  CheckCircle,
  Archive,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import expedientesService from '../services/expedientes.service';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpedientes: 0,
    expedientesActivos: 0,
    expedientesCerrados: 0,
    documentosDigitalizados: 0,
  });
  const [recentExpedientes, setRecentExpedientes] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar expedientes
      const expedientesResponse = await expedientesService.getExpedientes({ limit: 100 });
      const expedientes = expedientesResponse.data;
      
      // Calcular estadísticas
      const activos = expedientes.filter(e => e.estado === 'activo').length;
      const cerrados = expedientes.filter(e => e.estado === 'cerrado').length;
      const totalDocs = expedientes.reduce((sum, e) => sum + (e.total_hojas || 0), 0);
      
      setStats({
        totalExpedientes: expedientesResponse.pagination.totalItems,
        expedientesActivos: activos,
        expedientesCerrados: cerrados,
        documentosDigitalizados: totalDocs,
      });
      
      // Últimos 5 expedientes
      setRecentExpedientes(expedientes.slice(0, 5));
      
      // Datos para el gráfico (expedientes por área)
      const areaCount = {};
      expedientes.forEach(exp => {
        const area = exp.area_nombre || 'Sin área';
        areaCount[area] = (areaCount[area] || 0) + 1;
      });
      
      const chartArray = Object.entries(areaCount).map(([area, count]) => ({
        area: area.length > 20 ? area.substring(0, 20) + '...' : area,
        expedientes: count
      }));
      
      setChartData(chartArray);
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {loading ? '-' : value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {user?.nombre}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Panel de Control - Sistema de Gestión de Archivos CCAMEM
      </Typography>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Expedientes"
            value={stats.totalExpedientes}
            icon={<Folder sx={{ color: 'primary.main' }} />}
            color="primary"
            onClick={() => navigate('/expedientes')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expedientes Activos"
            value={stats.expedientesActivos}
            icon={<CheckCircle sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expedientes Cerrados"
            value={stats.expedientesCerrados}
            icon={<Archive sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Documentos Digitalizados"
            value={stats.documentosDigitalizados}
            icon={<Description sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Gráfico y expedientes recientes */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Gráfico de expedientes por área */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Expedientes por Área
            </Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="expedientes" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No hay datos para mostrar
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Expedientes recientes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Expedientes Recientes
            </Typography>
            <Box sx={{ mt: 2 }}>
              {recentExpedientes.map((exp) => (
                <Box
                  key={exp.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                  onClick={() => navigate(`/expedientes/${exp.id}`)}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {exp.numero_expediente}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {exp.nombre}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Chip
                      label={exp.estado}
                      size="small"
                      color={exp.estado === 'activo' ? 'success' : 'default'}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {new Date(exp.fecha_apertura).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {recentExpedientes.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No hay expedientes recientes
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Acciones rápidas */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<Folder />}
                  onClick={() => navigate('/expedientes/nuevo')}
                >
                  Nuevo Expediente
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/expedientes')}
                >
                  Digitalizar Documentos
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => navigate('/reportes')}
                >
                  Generar Reportes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;