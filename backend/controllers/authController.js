// === ARCHIVO: backend/controllers/authController.js ===
// Controlador de autenticación para el sistema CCAMEM

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Login de usuario
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Intento de login: ${email}`);
        
        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        console.log('🔍 Buscando usuario en la base de datos...');
        
        // Buscar usuario por email
        const userQuery = `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.password, 
                u.rol, 
                u.area,
                u.activo,
                a.nombre as area_nombre
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE LOWER(u.email) = LOWER($1)
        `;
        
        const userResult = await pool.query(userQuery, [email]);
        
        console.log(`📊 Usuarios encontrados: ${userResult.rows.length}`);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas'
            });
        }
        
        const user = userResult.rows[0];
        console.log(`✅ Usuario encontrado: ${user.email}`);
        
        // Verificar que el usuario esté activo
        if (!user.activo) {
            console.log('❌ Usuario inactivo');
            return res.status(401).json({
                success: false,
                error: 'Usuario inactivo. Contacta al administrador.'
            });
        }
        
        // Verificar contraseña
        console.log('🔑 Verificando contraseña...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`🔑 Contraseña válida: ${isValidPassword}`);
        
        if (!isValidPassword) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas'
            });
        }
        
        // Generar JWT token
        console.log('🎫 Generando token JWT...');
        const tokenPayload = {
            id: user.id,
            email: user.email,
            rol: user.rol,
            area: user.area
        };
        
        const token = jwt.sign(
            tokenPayload, 
            process.env.JWT_SECRET || 'ccamem_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Actualizar último acceso
        try {
            await pool.query(
                'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );
        } catch (updateError) {
            console.log('⚠️ No se pudo actualizar último acceso');
        }
        
        // Intentar registrar en historial (si existe la tabla)
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('usuarios', $1, $2, 'LOGIN', $3)
            `, [user.id, user.id, JSON.stringify({ 
                timestamp: new Date(),
                ip: req.ip || req.connection.remoteAddress 
            })]);
        } catch (historialError) {
            console.log('⚠️ Error al registrar historial (no crítico):', historialError.message);
        }
        
        // Preparar datos del usuario para la respuesta (sin contraseña)
        const userData = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            area: user.area,
            area_nombre: user.area_nombre,
            activo: user.activo
        };
        
        console.log(`✅ Login exitoso para: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: userData
        });
        
    } catch (error) {
        console.error('❌ Error detallado en login:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

/**
 * Verificar token JWT
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }
        
        // Verificar y decodificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ccamem_secret_key');
        
        // Buscar usuario actual en la base de datos
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
            WHERE u.id = $1 AND u.activo = true
        `;
        
        const userResult = await pool.query(userQuery, [decoded.id]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no válido o inactivo'
            });
        }
        
        const user = userResult.rows[0];
        
        res.json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                area: user.area,
                area_nombre: user.area_nombre,
                activo: user.activo
            }
        });
        
    } catch (error) {
        console.error('❌ Error al verificar token:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al verificar token'
        });
    }
};

/**
 * Logout de usuario
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const logout = async (req, res) => {
    try {
        // En un sistema con JWT, el logout se maneja en el frontend
        // removiendo el token del localStorage
        
        // Registrar logout en historial (si existe la tabla)
        try {
            if (req.user) {
                await pool.query(`
                    INSERT INTO historial_cambios 
                    (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                    VALUES ('usuarios', $1, $2, 'LOGOUT', $3)
                `, [req.user.id, req.user.id, JSON.stringify({ 
                    timestamp: new Date(),
                    ip: req.ip || req.connection.remoteAddress 
                })]);
            }
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar logout en historial');
        }
        
        res.json({
            success: true,
            message: 'Logout exitoso'
        });
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error al hacer logout'
        });
    }
};

/**
 * Cambiar contraseña
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        // Validar campos
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Obtener usuario actual
        const userQuery = 'SELECT password FROM usuarios WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const user = userResult.rows[0];
        
        // Verificar contraseña actual
        const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidCurrentPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }
        
        // Hashear nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        await pool.query(
            'UPDATE usuarios SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedNewPassword, userId]
        );
        
        // Registrar cambio en historial (si existe la tabla)
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('usuarios', $1, $2, 'PASSWORD_CHANGE', $3)
            `, [userId, userId, JSON.stringify({ 
                timestamp: new Date(),
                ip: req.ip || req.connection.remoteAddress 
            })]);
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar cambio de contraseña en historial');
        }
        
        console.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña'
        });
    }
};

/**
 * Obtener información del usuario actual
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userQuery = `
            SELECT 
                u.id, 
                u.nombre, 
                u.email, 
                u.rol, 
                u.area,
                u.activo,
                u.created_at,
                u.ultimo_acceso,
                a.nombre as area_nombre
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE u.id = $1
        `;
        
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const user = userResult.rows[0];
        
        res.json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                area: user.area,
                area_nombre: user.area_nombre,
                activo: user.activo,
                created_at: user.created_at,
                ultimo_acceso: user.ultimo_acceso
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil del usuario'
        });
    }
};

/**
 * Actualizar perfil del usuario
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, email } = req.body;
        
        // Validar campos
        if (!nombre || !email) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y email son requeridos'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }
        
        // Verificar que el email no esté en uso por otro usuario
        const emailCheckQuery = 'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id != $2';
        const emailCheckResult = await pool.query(emailCheckQuery, [email, userId]);
        
        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está en uso por otro usuario'
            });
        }
        
        // Actualizar perfil
        const updateQuery = `
            UPDATE usuarios 
            SET nombre = $1, email = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, nombre, email, rol, area
        `;
        
        const result = await pool.query(updateQuery, [nombre, email, userId]);
        const updatedUser = result.rows[0];
        
        // Registrar cambio en historial (si existe la tabla)
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('usuarios', $1, $2, 'PROFILE_UPDATE', $3)
            `, [userId, userId, JSON.stringify({ 
                nombre, 
                email,
                timestamp: new Date()
            })]);
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar actualización de perfil en historial');
        }
        
        console.log(`✅ Perfil actualizado para usuario ID: ${userId}`);
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar perfil'
        });
    }
};

module.exports = {
    login,
    verifyToken,
    logout,
    changePassword,
    getProfile,
    updateProfile
};