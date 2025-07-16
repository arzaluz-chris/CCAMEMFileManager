// === ARCHIVO: backend/routes/siser.js ===
const express = require('express');
const router = express.Router();
const siserController = require('../controllers/siserController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(verifyToken);
router.use(checkRole('admin'));

// Verificar estado de SISER
router.get('/estado', siserController.verificarEstado);

// Generar plantilla Excel
router.get('/plantilla', siserController.generarPlantillaExcel);

// Cargar desde archivo Excel
router.post(
    '/cargar-excel',
    siserController.upload.single('archivo'),
    siserController.cargarDesdeExcel
);

// Cargar desde base de datos
router.post('/cargar-db', siserController.cargarDesdeDB);

module.exports = router;