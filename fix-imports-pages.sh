#!/bin/bash
# === ARCHIVO: fix-imports-pages.sh ===
# Script para corregir las importaciones de axios en las páginas problemáticas

echo "🔧 Corrigiendo importaciones en páginas de CCAMEM..."
echo "===================================================="

# 1. Primero, verificar qué archivo de API existe
echo "1️⃣ Verificando estructura de archivos de servicios..."

API_FILE=""
if [ -f ~/Documents/ccamem-archivo/frontend/src/services/api.js ]; then
    API_FILE="api"
    echo "✅ Encontrado: api.js"
elif [ -f ~/Documents/ccamem-archivo/frontend/src/services/api.service.js ]; then
    API_FILE="api.service"
    echo "✅ Encontrado: api.service.js"
else
    echo "❌ No se encontró archivo de API. Creando uno..."
    # Crear archivo api.js si no existe
    cat > ~/Documents/ccamem-archivo/frontend/src/services/api.js << 'EOF'
// === ARCHIVO: frontend/src/services/api.js ===
import axios from 'axios';

/**
 * Configuración de Axios para las peticiones al backend
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Interceptor para agregar el token JWT a todas las peticiones
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ccamem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor para manejar respuestas y errores globalmente
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('ccamem_token');
      localStorage.removeItem('ccamem_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
EOF
    API_FILE="api"
fi

echo ""
echo "2️⃣ Corrigiendo importaciones en ExpedienteForm.jsx..."

# Corregir ExpedienteForm.jsx
if [ -f ~/Documents/ccamem-archivo/frontend/src/pages/ExpedienteForm.jsx ]; then
    sed -i.bak "s|import axios from '../services/api';|import axios from '../services/${API_FILE}';|g" ~/Documents/ccamem-archivo/frontend/src/pages/ExpedienteForm.jsx
    echo "✅ ExpedienteForm.jsx corregido"
else
    echo "⚠️  ExpedienteForm.jsx no encontrado"
fi

echo ""
echo "3️⃣ Corrigiendo importaciones en páginas del catálogo..."

# Array de archivos del catálogo
CATALOG_FILES=("Areas" "Secciones" "Series" "Subseries")

for file in "${CATALOG_FILES[@]}"; do
    FILE_PATH="~/Documents/ccamem-archivo/frontend/src/pages/catalogo/${file}.jsx"
    if [ -f ~/Documents/ccamem-archivo/frontend/src/pages/catalogo/${file}.jsx ]; then
        sed -i.bak "s|import axios from '../../services/api';|import axios from '../../services/${API_FILE}';|g" ~/Documents/ccamem-archivo/frontend/src/pages/catalogo/${file}.jsx
        echo "✅ ${file}.jsx corregido"
    else
        echo "⚠️  ${file}.jsx no encontrado - Creando archivo..."
        
        # Crear directorio si no existe
        mkdir -p ~/Documents/ccamem-archivo/frontend/src/pages/catalogo
        
        # Crear archivo básico según el tipo
        case $file in
            "Areas")
                cat > ~/Documents/ccamem-archivo/frontend/src/pages/catalogo/${file}.jsx << 'EOF'
// === ARCHIVO: frontend/src/pages/catalogo/Areas.jsx ===
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  TablePagination,
  InputAdornment,
  Toolbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../../services/api';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    responsable: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/catalogo/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      mostrarSnackbar('Error al cargar las áreas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    try {
      if (editingArea) {
        await axios.put(`/catalogo/areas/${editingArea.id}`, formData);
        mostrarSnackbar('Área actualizada exitosamente');
      } else {
        await axios.post('/catalogo/areas', formData);
        mostrarSnackbar('Área creada exitosamente');
      }
      cerrarDialogo();
      cargarAreas();
    } catch (error) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        mostrarSnackbar(error.response?.data?.error || 'Error al guardar', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta área?')) {
      try {
        await axios.delete(`/catalogo/areas/${id}`);
        mostrarSnackbar('Área eliminada exitosamente');
        cargarAreas();
      } catch (error) {
        mostrarSnackbar(error.response?.data?.error || 'Error al eliminar', 'error');
      }
    }
  };

  const abrirDialogo = (area = null) => {
    setEditingArea(area);
    setFormData(area || { codigo: '', nombre: '', descripcion: '', responsable: '' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const cerrarDialogo = () => {
    setDialogOpen(false);
    setEditingArea(null);
    setFormData({ codigo: '', nombre: '', descripcion: '', responsable: '' });
    setFormErrors({});
  };

  const areasFiltradas = areas.filter(area =>
    area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Catálogo de Áreas
      </Typography>

      <Paper elevation={3}>
        <Toolbar sx={{ px: 3, py: 2 }}>
          <TextField
            placeholder="Buscar áreas..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, mr: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarAreas}
            sx={{ mr: 2 }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialogo()}
          >
            Nueva Área
          </Button>
        </Toolbar>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : areasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>No hay áreas registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                areasFiltradas
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((area) => (
                    <TableRow key={area.id} hover>
                      <TableCell>
                        <Chip label={area.codigo} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{area.nombre}</TableCell>
                      <TableCell>{area.descripcion}</TableCell>
                      <TableCell>{area.responsable || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={area.activo ? 'Activo' : 'Inactivo'}
                          color={area.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => abrirDialogo(area)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(area.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={areasFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
        <DialogTitle>{editingArea ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              error={!!formErrors.codigo}
              helperText={formErrors.codigo}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              error={!!formErrors.descripcion}
              helperText={formErrors.descripcion}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              error={!!formErrors.responsable}
              helperText={formErrors.responsable}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingArea ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

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
  );
};

export default Areas;
EOF
                ;;
            *)
                # Crear archivo básico genérico para otros componentes
                cat > ~/Documents/ccamem-archivo/frontend/src/pages/catalogo/${file}.jsx << EOF
// === ARCHIVO: frontend/src/pages/catalogo/${file}.jsx ===
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from '../../services/${API_FILE}';

const ${file} = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        ${file}
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Página de ${file} - En construcción
        </Typography>
      </Paper>
    </Box>
  );
};

export default ${file};
EOF
                ;;
        esac
        echo "✅ ${file}.jsx creado"
    fi
done

echo ""
echo "4️⃣ Corrigiendo Reportes.jsx..."

# Corregir Reportes.jsx
if [ -f ~/Documents/ccamem-archivo/frontend/src/pages/Reportes.jsx ]; then
    sed -i.bak "s|import axios from '../services/api';|import axios from '../services/${API_FILE}';|g" ~/Documents/ccamem-archivo/frontend/src/pages/Reportes.jsx
    echo "✅ Reportes.jsx corregido"
else
    echo "⚠️  Reportes.jsx no encontrado - Creando archivo básico..."
    cat > ~/Documents/ccamem-archivo/frontend/src/pages/Reportes.jsx << EOF
// === ARCHIVO: frontend/src/pages/Reportes.jsx ===
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import {
  Description as ReportIcon,
  GetApp as DownloadIcon,
  Assessment as ChartIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import axios from '../services/${API_FILE}';

const Reportes = () => {
  const [generating, setGenerating] = useState(false);

  const reportes = [
    {
      id: 'inventario',
      titulo: 'Inventario General',
      descripcion: 'Listado completo de expedientes del archivo',
      icon: <ReportIcon fontSize="large" color="primary" />
    },
    {
      id: 'transferencia',
      titulo: 'Vale de Transferencia',
      descripcion: 'Documento para transferir expedientes',
      icon: <PrintIcon fontSize="large" color="secondary" />
    },
    {
      id: 'estadisticas',
      titulo: 'Estadísticas',
      descripcion: 'Análisis estadístico del archivo',
      icon: <ChartIcon fontSize="large" color="success" />
    }
  ];

  const generarReporte = async (tipoReporte) => {
    setGenerating(true);
    try {
      const response = await axios.get(\`/reportes/\${tipoReporte}\`, {
        responseType: 'blob'
      });
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', \`\${tipoReporte}_\${new Date().toISOString().split('T')[0]}.pdf\`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Reportes del Sistema
      </Typography>

      <Grid container spacing={3}>
        {reportes.map((reporte) => (
          <Grid item xs={12} md={4} key={reporte.id}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                {reporte.icon}
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {reporte.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reporte.descripcion}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'center', py: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => generarReporte(reporte.id)}
                  disabled={generating}
                >
                  Generar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Reportes;
EOF
    echo "✅ Reportes.jsx creado"
fi

echo ""
echo "5️⃣ Corrigiendo otros archivos que puedan tener importaciones incorrectas..."

# Buscar y corregir todas las importaciones de axios incorrectas
find ~/Documents/ccamem-archivo/frontend/src -name "*.jsx" -o -name "*.js" | while read file; do
    if grep -q "import axios from.*services/api" "$file"; then
        # Obtener el número de ../ necesarios según la profundidad del archivo
        depth=$(echo "$file" | awk -F"/" '{print NF-1}' | awk -v base=$(echo ~/Documents/ccamem-archivo/frontend/src | awk -F"/" '{print NF-1}') '{print $1-base-1}')
        prefix=""
        for ((i=0; i<depth; i++)); do
            prefix="../$prefix"
        done
        
        # Corregir la importación
        sed -i.bak "s|import axios from '.*services/api';|import axios from '${prefix}services/${API_FILE}';|g" "$file"
        echo "✅ Corregido: $(basename $file)"
    fi
done

echo ""
echo "6️⃣ Verificando ExpedienteDetail.jsx..."

# Corregir ExpedienteDetail si existe
if [ -f ~/Documents/ccamem-archivo/frontend/src/pages/ExpedienteDetail.jsx ]; then
    sed -i.bak "s|import axios from '../services/api';|import axios from '../services/${API_FILE}';|g" ~/Documents/ccamem-archivo/frontend/src/pages/ExpedienteDetail.jsx
    echo "✅ ExpedienteDetail.jsx corregido"
fi

echo ""
echo "🎉 ¡Correcciones completadas!"
echo "========================================"
echo ""
echo "📋 Cambios realizados:"
echo "✅ Importaciones de axios corregidas en todos los archivos"
echo "✅ Archivos faltantes creados con estructura básica"
echo "✅ Servicio API unificado configurado"
echo ""
echo "🚀 Pasos siguientes:"
echo "1. Reinicia el frontend: cd ~/Documents/ccamem-archivo/frontend && npm run dev"
echo "2. Prueba las páginas que tenían problemas:"
echo "   - http://localhost:5173/expedientes/nuevo"
echo "   - http://localhost:5173/catalogo/areas"
echo "   - http://localhost:5173/catalogo/secciones"
echo "   - http://localhost:5173/catalogo/series"
echo "   - http://localhost:5173/catalogo/subseries"
echo "   - http://localhost:5173/reportes"
echo ""
echo "🔍 Si aún hay problemas, revisa la consola del navegador (F12)"