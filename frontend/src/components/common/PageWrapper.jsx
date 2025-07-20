// === ARCHIVO: frontend/src/components/common/PageWrapper.jsx ===
import React from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

class PageWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en página:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Alert severity="error">
            <Typography variant="h6">Error al cargar la página</Typography>
            <Typography variant="body2">{this.state.error?.message}</Typography>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const withPageWrapper = (Component) => {
  return (props) => (
    <PageWrapper>
      <Component {...props} />
    </PageWrapper>
  );
};

export default PageWrapper;
