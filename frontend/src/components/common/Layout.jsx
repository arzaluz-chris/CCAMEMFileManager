// === ARCHIVO: frontend/src/components/common/Layout.jsx ===
// Layout principal de la aplicación con menú lateral y barra superior

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Folder,
  Assessment,
  CloudUpload,
  Settings,
  ExitToApp,
  ExpandLess,
  ExpandMore,
  Description,
  Category,
  Archive,
  Person,
  Add as AddIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 280;

/**
 * Componente Layout principal
 * Contiene el menú lateral, barra superior y área de contenido
 */
const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados locales
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [catalogoOpen, setCatalogoOpen] = useState(false);

  /**
   * Alternar menú móvil
   */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /**
   * Abrir menú de usuario
   */
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Cerrar menú de usuario
   */
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * Cerrar sesión
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  /**
   * Navegar a una ruta específica
   */
  const navigateTo = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  /**
   * Verificar si una ruta está activa
   */
  const isRouteActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  /**
   * Alternar sección del catálogo
   */
  const toggleCatalogo = () => {
    setCatalogoOpen(!catalogoOpen);
  };

  // Configuración del menú principal
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      description: 'Panel principal del sistema'
    },
    {
      text: 'Expedientes',
      icon: <Folder />,
      path: '/expedientes',
      description: 'Gestión de expedientes'
    },
    {
      text: 'Catálogo',
      icon: <Category />,
      path: '/catalogo',
      description: 'Clasificación archivística',
      hasSubmenu: true,
      subItems: [
        { text: 'Ver Catálogo', path: '/catalogo', icon: <Category /> },
        { text: 'Áreas', path: '/catalogo/areas', icon: <BusinessIcon /> },
        { text: 'Secciones', path: '/catalogo/secciones', icon: <Folder /> },
        { text: 'Series', path: '/catalogo/series', icon: <Description /> },
        { text: 'Subseries', path: '/catalogo/subseries', icon: <AccountTreeIcon /> }
      ]
    },
    {
      text: 'Digitalización',
      icon: <CloudUpload />,
      path: '/digitalizacion',
      description: 'Digitalización de documentos'
    },
    {
      text: 'Reportes',
      icon: <Assessment />,
      path: '/reportes',
      description: 'Generación de reportes'
    }
  ];

  // Menú de administración (solo para admin)
  const adminMenuItems = user?.rol === 'admin' ? [
    {
      text: 'Usuarios',
      icon: <Person />,
      path: '/usuarios',
      description: 'Gestión de usuarios'
    },
    {
      text: 'SISER',
      icon: <AutoAwesomeIcon />,
      path: '/siser',
      description: 'Automatización SISER'
    },
    {
      text: 'Configuración',
      icon: <Settings />,
      path: '/configuracion',
      description: 'Configuración del sistema'
    }
  ] : [];

  /**
   * Renderizar elemento del menú
   */
  const renderMenuItem = (item) => {
    const isActive = isRouteActive(item.path);
    
    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={item.hasSubmenu ? toggleCatalogo : () => navigateTo(item.path)}
            sx={{
              minHeight: 48,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              backgroundColor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? 'primary.contrastText' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              secondary={!item.hasSubmenu ? item.description : null}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
                color: isActive ? 'primary.contrastText' : 'text.secondary'
              }}
            />
            {item.hasSubmenu && (
              catalogoOpen ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>

        {/* Submenú del catálogo */}
        {item.hasSubmenu && (
          <Collapse in={catalogoOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {item.subItems.map((subItem) => (
                <ListItem key={subItem.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigateTo(subItem.path)}
                    sx={{
                      minHeight: 40,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      backgroundColor: isRouteActive(subItem.path) ? 'primary.light' : 'transparent',
                      color: isRouteActive(subItem.path) ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isRouteActive(subItem.path) ? 'primary.main' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isRouteActive(subItem.path) ? 'primary.contrastText' : 'text.secondary',
                      }}
                    >
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={subItem.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  /**
   * Contenido del drawer/menú lateral
   */
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header del drawer */}
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Archive sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          CCAMEM
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sistema de Archivos
        </Typography>
      </Box>

      {/* Acciones rápidas */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => navigateTo('/expedientes/nuevo')}
          sx={{
            borderRadius: 2,
            backgroundColor: 'success.main',
            color: 'success.contrastText',
            '&:hover': {
              backgroundColor: 'success.dark',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'success.contrastText' }}>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Nuevo Expediente" />
        </ListItemButton>
      </Box>

      <Divider />

      {/* Menú principal */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List>
          {menuItems.map(renderMenuItem)}
        </List>

        {/* Menú de administración */}
        {adminMenuItems.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography 
              variant="overline" 
              sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}
            >
              Administración
            </Typography>
            <List>
              {adminMenuItems.map(renderMenuItem)}
            </List>
          </>
        )}
      </Box>

      {/* Información del usuario */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
          >
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.nombre || 'Usuario'}
            </Typography>
            <Chip 
              label={user?.rol || 'usuario'} 
              size="small" 
              color={user?.rol === 'admin' ? 'primary' : 'default'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barra superior */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Título dinámico basado en la ruta actual */}
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/expedientes' && 'Gestión de Expedientes'}
            {location.pathname === '/expedientes/nuevo' && 'Nuevo Expediente'}
            {location.pathname === '/catalogo' && 'Catálogo de Clasificación'}
            {location.pathname === '/catalogo/areas' && 'Áreas'}
            {location.pathname === '/catalogo/secciones' && 'Secciones'}
            {location.pathname === '/catalogo/series' && 'Series'}
            {location.pathname === '/catalogo/subseries' && 'Subseries'}
            {location.pathname === '/digitalizacion' && 'Digitalización'}
            {location.pathname === '/reportes' && 'Reportes'}
            {location.pathname === '/usuarios' && 'Gestión de Usuarios'}
            {location.pathname === '/siser' && 'Automatización SISER'}
            {location.pathname === '/configuracion' && 'Configuración'}
          </Typography>

          {/* Botón de usuario */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
            >
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          
          {/* Menú de usuario */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={() => { navigateTo('/perfil'); handleUserMenuClose(); }}>
              <Person sx={{ mr: 1 }} /> Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} /> Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer lateral */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="menu principal"
      >
        {/* Drawer móvil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Drawer desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar /> {/* Espaciador para la barra superior */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;