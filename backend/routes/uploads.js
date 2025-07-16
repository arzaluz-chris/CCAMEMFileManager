// === ARCHIVO: backend/routes/uploads.js ===
const express = require('express');
const router = express.Router();
const uploadsController = require('../controllers/uploadsController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Subir un documento a un expediente
router.post(
    '/expediente/:expediente_id/documento',
    uploadsController.upload.single('archivo'),
    uploadsController.subirDocumento
);

// Subir múltiples documentos
router.post(
    '/expediente/:expediente_id/documentos',
    uploadsController.upload.array('archivos', 10), // Máximo 10 archivos
    uploadsController.subirMultiplesDocumentos
);

// Obtener documentos de un expediente
router.get('/expediente/:expediente_id/documentos', uploadsController.obtenerDocumentos);

// Descargar un documento
router.get('/documento/:documento_id/descargar', uploadsController.descargarDocumento);

// Eliminar un documento
router.delete('/documento/:documento_id', uploadsController.eliminarDocumento);

module.exports = router;