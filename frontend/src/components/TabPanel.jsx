// === ARCHIVO: frontend/src/components/TabPanel.jsx ===
// Componente auxiliar para los tabs de Material UI

import { Box } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Componente TabPanel para mostrar contenido de tabs
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del panel
 * @param {number} props.value - Valor actual del tab
 * @param {number} props.index - Índice de este panel
 * @param {Object} props.other - Otras propiedades
 */
export function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default TabPanel;