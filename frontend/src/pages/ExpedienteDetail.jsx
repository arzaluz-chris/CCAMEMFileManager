import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const ExpedienteDetail = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4">Detalle de Expediente</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Esta página está en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default ExpedienteDetail;