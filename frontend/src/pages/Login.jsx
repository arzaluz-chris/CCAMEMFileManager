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
  Paper,
  Divider
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
  const { login, user, loading, error, isAuthenticated } = useAuth();

  // Estados locales
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    console.log('🔍 Login - Verificando estado de autenticación:', {
      isAuthenticated,
      user: user?.email,
      loading
    });

    if (isAuthenticated && user && !loading) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('✅ Usuario ya autenticado, redirigiendo a:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, location]);

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

    // Limpiar error de login
    if (loginError) {
      setLoginError('');
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
      errors.email = 'El email no tiene un formato válido';
    }

    if (!formData.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 3) {
      errors.password = 'La contraseña debe tener al menos 3 caracteres';
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
    setLoginError('');
    setFormErrors({});

    try {
      console.log('🔐 Iniciando proceso de login...');
      
      const result = await login(formData.email, formData.password);
      
      console.log('📝 Resultado del login:', result);

      if (result.success) {
        console.log('✅ Login exitoso, preparando redirección...');
        
        // Pequeña demora para asegurar que el estado se actualice
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          console.log('🔄 Redirigiendo a:', from);
          navigate(from, { replace: true });
        }, 100);
        
      } else {
        console.log('❌ Login fallido:', result.error);
        setLoginError(result.error || 'Error al iniciar sesión');
      }

    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setLoginError('Error inesperado al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Alternar visibilidad de contraseña
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Manejar caso de tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Mostrar loading si se está verificando autenticación
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si ya está autenticado, no mostrar formulario
  if (isAuthenticated && user) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary">
          Redirigiendo...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        py={4}
      >
        <Paper elevation={8} sx={{ width: '100%', maxWidth: 400 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={3}>
                <Typography variant="h4" component="h1" gutterBottom>
                  CCAMEM
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Iniciar Sesión
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Error general */}
              {(loginError || error) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {loginError || error}
                </Alert>
              )}

              {/* Formulario */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  margin="normal"
                  required
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </Box>

              {/* Información adicional */}
              <Box mt={3}>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  Sistema de Gestión de Archivos CCAMEM
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;