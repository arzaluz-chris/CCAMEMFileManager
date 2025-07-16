// === ARCHIVO: backend/routes/reportes.js ===
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas de generación de reportes
router.get('/excel', reportesController.generarReporteExcel);
router.get('/pdf', reportesController.generarReportePDF);
router.get('/xml', reportesController.generarReporteXML);
router.get('/inventario-general', reportesController.generarInventarioGeneral);

module.exports = router;