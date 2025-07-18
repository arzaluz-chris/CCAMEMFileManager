// === ARCHIVO: backend/routes/users.js ===
// Rutas para la gestión de usuarios del sistema CCAMEM

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas disponibles para todos los usuarios autenticados
router.get('/estadisticas', usersController.getEstadisticas);

// Rutas que requieren rol de administrador
router.use(checkRole('admin')); // A partir de aquí, solo administradores

// CRUD de usuarios
router.get('/', usersController.getUsuarios);              // Listar usuarios
router.get('/:id', usersController.getUsuarioById);        // Obtener un usuario
router.post('/', usersController.createUsuario);           // Crear usuario
router.put('/:id', usersController.updateUsuario);         // Actualizar usuario
router.delete('/:id', usersController.deleteUsuario);      // Eliminar (desactivar) usuario

// Exportar el router
module.exports = router;