// === ARCHIVO: backend/controllers/authController.js ===
// Versión mejorada con más información de debugging

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Función para generar JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'default_secret_key',
        { expiresIn: '24h' }
    );
};

// Login de usuario
const login = async (req, res) => {
    try {
        console.log('🔐 Intento de login:', req.body.email);
        const { email, password } = req.body;

        // Validar entrada
        if (!email || !password) {
            console.log('❌ Email o contraseña faltantes');
            return res.status(400).json({
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        console.log('🔍 Buscando usuario en la base de datos...');
        const result = await pool.query(
            'SELECT id, nombre, email, password, rol, area, activo FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );

        console.log(`📊 Usuarios encontrados: ${result.rows.length}`);

        if (result.rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];
        console.log('✅ Usuario encontrado:', user.email);

        // Verificar si el usuario está activo
        if (!user.activo) {
            console.log('❌ Usuario inactivo');
            return res.status(401).json({
                error: 'Usuario inactivo'
            });
        }

        // Verificar contraseña
        console.log('🔑 Verificando contraseña...');
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('🔑 Contraseña válida:', validPassword);
        
        if (!validPassword) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Generar token
        console.log('🎫 Generando token JWT...');
        const token = generateToken(user.id);

        // Registrar el acceso
        try {
            await pool.query(
                `INSERT INTO historial_cambios 
                 (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_nuevo)
                 VALUES ('usuarios', $1, $1, 'modificacion', 'ultimo_acceso', NOW())`,
                [user.id]
            );
        } catch (historialError) {
            console.log('⚠️ Error al registrar historial (no crítico):', historialError.message);
        }

        console.log('✅ Login exitoso para:', user.email);

        // Responder con usuario y token
        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                area: user.area
            }
        });

    } catch (error) {
        console.error('❌ Error detallado en login:', error);
        console.error('Stack trace:', error.stack);
        
        // Devolver error más específico en desarrollo
        if (process.env.NODE_ENV === 'development') {
            res.status(500).json({
                error: 'Error al iniciar sesión',
                details: error.message,
                stack: error.stack
            });
        } else {
            res.status(500).json({
                error: 'Error al iniciar sesión'
            });
        }
    }
};

// Obtener perfil del usuario actual
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT u.id, u.nombre, u.email, u.rol, u.area, u.created_at,
                    a.nombre as area_nombre
             FROM usuarios u
             LEFT JOIN areas a ON u.area = a.codigo
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            error: 'Error al obtener perfil'
        });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validar entrada
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Se requiere la contraseña actual y la nueva'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario actual
        const userResult = await pool.query(
            'SELECT password FROM usuarios WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({
                error: 'Contraseña actual incorrecta'
            });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await pool.query(
            'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, userId]
        );

        // Registrar el cambio
        await pool.query(
            `INSERT INTO historial_cambios 
             (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado)
             VALUES ('usuarios', $1, $1, 'modificacion', 'password')`,
            [userId]
        );

        res.json({
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error al cambiar contraseña'
        });
    }
};

// Verificar token (para el frontend)
const verifyToken = async (req, res) => {
    // Si llegó aquí, el middleware ya verificó el token
    res.json({
        valid: true,
        user: req.user
    });
};

// Logout (opcional - principalmente para registrar)
const logout = async (req, res) => {
    try {
        // Registrar el logout
        await pool.query(
            `INSERT INTO historial_cambios 
             (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_nuevo)
             VALUES ('usuarios', $1, $1, 'modificacion', 'ultimo_logout', NOW())`,
            [req.user.id]
        );

        res.json({
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            error: 'Error al cerrar sesión'
        });
    }
};

module.exports = {
    login,
    getProfile,
    changePassword,
    verifyToken,
    logout
};