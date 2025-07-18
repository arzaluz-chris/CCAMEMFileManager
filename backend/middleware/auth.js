// === ARCHIVO: backend/middleware/auth.js ===
// Middleware de autenticación JWT para el sistema CCAMEM

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Middleware para verificar el token JWT
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express  
 * @param {Function} next - Función next de Express
 */
const verifyToken = async (req, res, next) => {
    try {
        console.log('🔍 Middleware: Verificando token...');
        
        // Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        console.log('📋 Authorization header:', authHeader ? 'Presente' : 'Ausente');

        if (!authHeader) {
            console.log('❌ No se encontró header Authorization');
            return res.status(401).json({
                success: false,
                error: 'No se proporcionó token de autenticación'
            });
        }

        // Extraer el token (formato: "Bearer TOKEN")
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('❌ Token no encontrado en header');
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación inválido'
            });
        }

        console.log('🔑 Token encontrado, verificando...');

        // Verificar el token JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'ccamem_secret_key'
        );
        
        console.log('✅ Token válido, payload:', {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol
        });

        // Buscar el usuario en la base de datos para confirmar que sigue activo
        const userQuery = `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.rol, 
                u.area,
                u.activo,
                a.nombre as area_nombre
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE u.id = $1
        `;
        
        const userResult = await pool.query(userQuery, [decoded.id]);

        if (userResult.rows.length === 0) {
            console.log('❌ Usuario no encontrado en base de datos');
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        // Verificar que el usuario esté activo
        if (!user.activo) {
            console.log('❌ Usuario inactivo');
            return res.status(401).json({
                success: false,
                error: 'Usuario inactivo'
            });
        }

        console.log('✅ Usuario verificado:', user.email);

        // Agregar el usuario completo a la request
        req.user = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            area: user.area,
            area_nombre: user.area_nombre,
            activo: user.activo
        };

        // Continuar con el siguiente middleware
        next();

    } catch (error) {
        console.error('❌ Error en verificación de token:', error);

        // Manejar errores específicos de JWT
        if (error.name === 'JsonWebTokenError') {
            console.log('❌ Token JWT malformado');
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            console.log('❌ Token JWT expirado');
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }

        if (error.name === 'NotBeforeError') {
            console.log('❌ Token JWT no válido aún');
            return res.status(401).json({
                success: false,
                error: 'Token no válido'
            });
        }
        
        // Error de base de datos u otros
        console.error('❌ Error interno en verificación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al verificar autenticación'
        });
    }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array|string} roles - Roles permitidos
 * @returns {Function} Middleware function
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        console.log('🔍 Verificando roles...', {
            userRole: req.user?.rol,
            requiredRoles: roles
        });

        if (!req.user) {
            console.log('❌ No hay usuario en la request');
            return res.status(401).json({
                success: false,
                error: 'No autenticado'
            });
        }

        const userRoles = Array.isArray(req.user.rol) ? req.user.rol : [req.user.rol];
        const hasPermission = roles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            console.log('❌ Usuario sin permisos suficientes');
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para realizar esta acción'
            });
        }

        console.log('✅ Permisos verificados correctamente');
        next();
    };
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const requireAdmin = checkRole('admin');

/**
 * Middleware para verificar que el usuario sea administrador o supervisor
 */
const requireSupervisor = checkRole('admin', 'supervisor');

/**
 * Middleware para verificar área específica
 * @param {string} requiredArea - Área requerida
 * @returns {Function} Middleware function
 */
const checkArea = (requiredArea) => {
    return (req, res, next) => {
        console.log('🔍 Verificando área...', {
            userArea: req.user?.area,
            requiredArea: requiredArea
        });

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado'
            });
        }

        // Los administradores pueden acceder a cualquier área
        if (req.user.rol === 'admin') {
            console.log('✅ Usuario admin, acceso permitido a cualquier área');
            return next();
        }

        if (req.user.area !== requiredArea) {
            console.log('❌ Usuario sin acceso al área');
            return res.status(403).json({
                success: false,
                error: 'No tiene acceso a esta área'
            });
        }

        console.log('✅ Área verificada correctamente');
        next();
    };
};

/**
 * Middleware opcional que no falla si no hay token
 * Útil para rutas que pueden funcionar con o sin autenticación
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('ℹ️ No hay token, continuando sin autenticación');
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('ℹ️ Token malformado, continuando sin autenticación');
            return next();
        }

        // Intentar verificar el token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'ccamem_secret_key'
        );

        // Buscar usuario
        const userQuery = `
            SELECT 
                u.id, u.nombre, u.email, u.rol, u.area, u.activo,
                a.nombre as area_nombre
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE u.id = $1 AND u.activo = true
        `;
        
        const userResult = await pool.query(userQuery, [decoded.id]);

        if (userResult.rows.length > 0) {
            req.user = userResult.rows[0];
            console.log('✅ Usuario autenticado opcionalmente:', req.user.email);
        }

        next();

    } catch (error) {
        console.log('ℹ️ Token inválido en auth opcional, continuando sin autenticación');
        next();
    }
};

module.exports = {
    verifyToken,
    checkRole,
    requireAdmin,
    requireSupervisor,
    checkArea,
    optionalAuth
};