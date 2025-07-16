// === ARCHIVO: backend/middleware/auth.js ===
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware para verificar el token JWT
const verifyToken = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'No se proporcionó token de autenticación'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar el usuario en la base de datos
        const result = await pool.query(
            'SELECT id, nombre, email, rol, area FROM usuarios WHERE id = $1 AND activo = true',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Usuario no encontrado o inactivo'
            });
        }

        // Agregar el usuario a la request
        req.user = result.rows[0];
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado'
            });
        }
        
        console.error('Error en verificación de token:', error);
        return res.status(500).json({
            error: 'Error al verificar autenticación'
        });
    }
};

// Middleware para verificar roles específicos
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado'
            });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

// Middleware opcional - no bloquea si no hay token
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const result = await pool.query(
                'SELECT id, nombre, email, rol, area FROM usuarios WHERE id = $1 AND activo = true',
                [decoded.userId]
            );
            
            if (result.rows.length > 0) {
                req.user = result.rows[0];
            }
        }
        
        next();
    } catch (error) {
        // Simplemente continuar sin usuario autenticado
        next();
    }
};

module.exports = {
    verifyToken,
    checkRole,
    optionalAuth
};