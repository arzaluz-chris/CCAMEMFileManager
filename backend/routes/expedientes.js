// === ARCHIVO: backend/routes/expedientes.js ===
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

// Controlador principal
const expedientesController = require('../controllers/expedientesController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas CRUD
router.get('/', expedientesController.getExpedientes);
router.get('/:id', expedientesController.getExpedienteById);
router.post('/', expedientesController.createExpediente);
router.put('/:id', expedientesController.updateExpediente);
router.delete('/:id', checkRole('admin'), expedientesController.deleteExpediente);

// IMPORTANTE: Exportar el router
module.exports = router;