// === ARCHIVO: frontend/src/pages/ExpedientesList.jsx ===
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Typography,
  Chip,
  InputAdornment,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Visibility,
  Edit,
  Delete,
  CloudDownload,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import expedientesService from '../services/expedientes.service';
import { useAuth } from '../hooks/useAuth';

const ExpedientesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    area_id: '',
  });

  useEffect(() => {
    loadExpedientes();
  }, [page, rowsPerPage, searchTerm]);

  const loadExpedientes = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { busqueda: searchTerm }),
        ...filters,
      };

      const response = await expedientesService.getExpedientes(params);
      setExpedientes(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const getEstadoChip = (estado) => {
    const config = {
      activo: { color: 'success', label: 'Activo' },
      cerrado: { color: 'default', label: 'Cerrado' },
      transferido: { color: 'info', label: 'Transferido' },
      baja: { color: 'error', label: 'Baja' },
    };

    const { color, label } = config[estado] || { color: 'default', label: estado };
    return <Chip label={label} color={color} size="small" />;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de dar de baja este expediente?')) {
      return;
    }

    try {
      await expedientesService.deleteExpediente(id);
      loadExpedientes();
    } catch (error) {
      console.error('Error al eliminar expediente:', error);
      alert('Error al eliminar el expediente');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Expedientes</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/expedientes/nuevo')}
        >
          Nuevo Expediente
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Buscar expedientes..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Filtros avanzados">
            <IconButton>
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar">
            <IconButton>
              <CloudDownload />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Expediente</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Fecha Apertura</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Legajos</TableCell>
                <TableCell>Hojas</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expedientes.map((expediente) => (
                <TableRow
                  key={expediente.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/expedientes/${expediente.id}`)}
                >
                  <TableCell>{expediente.numero_expediente}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {expediente.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>{expediente.area_nombre}</TableCell>
                  <TableCell>
                    {format(new Date(expediente.fecha_apertura), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{getEstadoChip(expediente.estado)}</TableCell>
                  <TableCell align="center">{expediente.numero_legajos}</TableCell>
                  <TableCell align="center">{expediente.total_hojas}</TableCell>
                  <TableCell align="center">
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/expedientes/${expediente.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/expedientes/${expediente.id}/editar`)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {user?.rol === 'admin' && (
                        <Tooltip title="Dar de baja">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(expediente.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {expedientes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary" py={3}>
                      No se encontraron expedientes
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
};

export default ExpedientesList;