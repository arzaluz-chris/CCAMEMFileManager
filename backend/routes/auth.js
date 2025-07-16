// === ARCHIVO: backend/routes/auth.js ===
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', verifyToken, authController.getProfile);
router.post('/change-password', verifyToken, authController.changePassword);
router.get('/verify', verifyToken, authController.verifyToken);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;