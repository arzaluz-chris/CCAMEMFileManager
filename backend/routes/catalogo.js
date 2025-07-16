// === ARCHIVO: backend/routes/catalogo.js ===
const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas del catálogo requieren autenticación
router.use(verifyToken);

// Rutas de consulta
router.get('/areas', catalogoController.getAreas);
router.get('/fondos', catalogoController.getFondos);
router.get('/secciones', catalogoController.getSecciones);
router.get('/series', catalogoController.getSeries);
router.get('/subseries', catalogoController.getSubseries);

// Rutas especiales
router.get('/completo', catalogoController.getCatalogoCompleto);
router.get('/buscar', catalogoController.buscarEnCatalogo);
router.get('/valores-documentales', catalogoController.getValoresDocumentales);

module.exports = router;