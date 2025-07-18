// === ARCHIVO: backend/controllers/authController.js ===
// Controlador de autenticación para el sistema CCAMEM

const bcrypt = require('bcryptjs');
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
        
        console.log('🔐 Intento de login para:', email);
        
        // Validar que se proporcionen email y password
        if (!email || !password) {
            console.log('❌ Email o password faltantes');
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }
        
        // Buscar usuario en la base de datos
        console.log('🔍 Buscando usuario en base de datos...');
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
        
        const userResult = await pool.query(userQuery, [email.trim()]);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas'
            });
        }
        
        const user = userResult.rows[0];
        console.log('✅ Usuario encontrado:', user.email);
        
        // Verificar que el usuario esté activo
        if (!user.activo) {
            console.log('❌ Usuario inactivo:', user.email);
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
            console.log('❌ Contraseña incorrecta para:', user.email);
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
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                issuer: 'ccamem-system',
                audience: 'ccamem-users'
            }
        );
        
        console.log('✅ Token generado exitosamente');
        
        // Actualizar último acceso
        try {
            await pool.query(
                'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );
            console.log('✅ Último acceso actualizado');
        } catch (updateError) {
            console.log('⚠️ No se pudo actualizar último acceso:', updateError.message);
        }
        
        // Registrar en historial (si existe la tabla)
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('usuarios', $1, $2, 'LOGIN', $3)
            `, [user.id, user.id, JSON.stringify({ 
                timestamp: new Date(),
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            })]);
            console.log('✅ Login registrado en historial');
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar en historial:', historialError.message);
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
        
        // Respuesta exitosa
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
        console.log('🔍 Verificando token JWT...');
        
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('❌ No se encontró header Authorization');
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            console.log('❌ Token vacío');
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }
        
        console.log('🔑 Verificando token...');
        
        // Verificar y decodificar token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'ccamem_secret_key',
            {
                issuer: 'ccamem-system',
                audience: 'ccamem-users'
            }
        );
        
        console.log('✅ Token válido, buscando usuario actual...');
        
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
            WHERE u.id = $1
        `;
        
        const userResult = await pool.query(userQuery, [decoded.id]);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuario no encontrado para token válido');
            return res.status(401).json({
                success: false,
                error: 'Usuario no válido'
            });
        }
        
        const user = userResult.rows[0];
        
        // Verificar que el usuario siga activo
        if (!user.activo) {
            console.log('❌ Usuario inactivo:', user.email);
            return res.status(401).json({
                success: false,
                error: 'Usuario inactivo'
            });
        }
        
        console.log('✅ Token verificado exitosamente para:', user.email);
        
        // Respuesta exitosa
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
        
        console.error('❌ Error interno al verificar token');
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
        console.log('🚪 Procesando logout...');
        
        // En un sistema con JWT, el logout se maneja principalmente en el frontend
        // removiendo el token del localStorage. Aquí podemos registrar el logout.
        
        // Registrar logout en historial si el usuario está disponible
        if (req.user) {
            try {
                await pool.query(`
                    INSERT INTO historial_cambios 
                    (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                    VALUES ('usuarios', $1, $2, 'LOGOUT', $3)
                `, [req.user.id, req.user.id, JSON.stringify({ 
                    timestamp: new Date(),
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent')
                })]);
                console.log('✅ Logout registrado en historial para:', req.user.email);
            } catch (historialError) {
                console.log('⚠️ No se pudo registrar logout en historial:', historialError.message);
            }
        }
        
        console.log('✅ Logout procesado exitosamente');
        
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
        
        console.log('🔑 Cambiando contraseña para usuario:', req.user.email);
        
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
        
        // Buscar usuario actual
        const userResult = await pool.query(
            'SELECT password FROM usuarios WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const user = userResult.rows[0];
        
        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña en base de datos
        await pool.query(
            'UPDATE usuarios SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );
        
        // Registrar cambio en historial
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('usuarios', $1, $2, 'CHANGE_PASSWORD', $3)
            `, [userId, userId, JSON.stringify({ 
                timestamp: new Date(),
                ip: req.ip || req.connection.remoteAddress
            })]);
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar cambio de contraseña en historial');
        }
        
        console.log('✅ Contraseña cambiada exitosamente para:', req.user.email);
        
        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
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
 * Obtener perfil del usuario actual
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getProfile = async (req, res) => {
    try {
        console.log('👤 Obteniendo perfil para:', req.user.email);
        
        // El usuario ya está disponible en req.user gracias al middleware
        const userData = {
            id: req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            rol: req.user.rol,
            area: req.user.area,
            area_nombre: req.user.area_nombre,
            activo: req.user.activo
        };
        
        res.json({
            success: true,
            user: userData
        });
        
    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
};

module.exports = {
    login,
    verifyToken,
    logout,
    changePassword,
    getProfile
};