// === ARCHIVO: backend/routes/expedientes.js ===
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

// Importar el controlador
let expedientesController;
try {
    expedientesController = require('../controllers/expedientesController');
} catch (error) {
    console.error('Error al cargar expedientesController:', error.message);
    // Controlador temporal mientras se crea el real
    expedientesController = {
        getExpedientes: (req, res) => res.json({ data: [], pagination: { totalItems: 0 } }),
        getExpedienteById: (req, res) => res.json({ id: req.params.id }),
        createExpediente: (req, res) => res.status(201).json({ message: 'Creado', expediente: req.body }),
        updateExpediente: (req, res) => res.json({ message: 'Actualizado' }),
        deleteExpediente: (req, res) => res.json({ message: 'Eliminado' })
    };
}

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