// === ARCHIVO: frontend/src/pages/Login.jsx ===
// Página de login para el sistema CCAMEM

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Componente de página de login
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading, error } = useAuth();

  // Estados locales
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('✅ Usuario ya autenticado, redirigiendo a:', from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  /**
   * Manejar cambios en el formulario
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores del campo al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    return errors;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔐 Enviando datos de login...');
      
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log('✅ Login exitoso');
        
        // Redirigir al dashboard o a la página solicitada
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        console.log('❌ Login fallido:', result.error);
        setFormErrors({ 
          general: result.error || 'Error al iniciar sesión' 
        });
      }

    } catch (err) {
      console.error('❌ Error inesperado en login:', err);
      setFormErrors({ 
        general: 'Error inesperado. Intenta nuevamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Alternar visibilidad de contraseña
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Mostrar spinner mientras se verifica autenticación inicial
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              color: 'white',
              py: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              CCAMEM
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Sistema de Gestión de Archivos
            </Typography>
          </Box>

          {/* Formulario */}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom textAlign="center" mb={3}>
              Iniciar Sesión
            </Typography>

            {/* Error general */}
            {(error || formErrors.general) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || formErrors.general}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Campo de email */}
              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color={formErrors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />

              {/* Campo de contraseña */}
              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color={formErrors.password ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
                autoComplete="current-password"
                sx={{ mb: 3 }}
              />

              {/* Botón de envío */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  }
                }}
              >
                {isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </Box>

            {/* Información adicional */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Comisión de Conciliación y Arbitraje Médico del Estado de México
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Versión 1.0.0 - Sistema de Gestión Documental
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;