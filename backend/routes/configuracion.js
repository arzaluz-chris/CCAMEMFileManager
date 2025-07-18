// === ARCHIVO: backend/routes/configuracion.js ===
// Rutas para la gestión de configuración del sistema CCAMEM

const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de administrador
router.use(verifyToken);
router.use(checkRole('admin'));

// Rutas de configuración general
router.get('/sistema', configuracionController.obtenerConfiguraciones);
router.put('/sistema/:clave', configuracionController.actualizarConfiguracion);

// Rutas de notificaciones
router.get('/notificaciones', configuracionController.obtenerNotificaciones);
router.put('/notificaciones/:id', configuracionController.actualizarNotificacion);

// Rutas de auditoría
router.get('/auditoria', configuracionController.obtenerAuditoria);
router.get('/auditoria/estadisticas', configuracionController.obtenerEstadisticasAuditoria);
router.post('/auditoria/limpiar', configuracionController.limpiarLogs);

// Rutas de respaldos
router.get('/respaldos', configuracionController.obtenerRespaldos);
router.post('/respaldos', configuracionController.configurarRespaldo);
router.post('/respaldos/:id/ejecutar', configuracionController.ejecutarRespaldo);

// Rutas de utilidades
router.post('/email/probar', configuracionController.probarEmail);
router.get('/info-sistema', configuracionController.obtenerInfoSistema);

module.exports = router;