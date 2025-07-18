// === ARCHIVO: backend/controllers/usersController.js ===
// Controlador para la gestión de usuarios del sistema CCAMEM

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

/**
 * Obtener lista de usuarios con paginación y filtros
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getUsuarios = async (req, res) => {
    try {
        console.log('📋 Obteniendo lista de usuarios...');
        
        // Obtener parámetros de consulta para paginación y filtros
        const { 
            page = 1, 
            limit = 10, 
            search = '',
            rol = '',
            area = '',
            activo = ''
        } = req.query;

        // Convertir a números y validar
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Construir la consulta base
        let queryBase = `
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCounter = 1;

        // Agregar filtros dinámicamente
        if (search) {
            queryBase += ` AND (LOWER(u.nombre) LIKE $${paramCounter} OR LOWER(u.email) LIKE $${paramCounter})`;
            queryParams.push(`%${search.toLowerCase()}%`);
            paramCounter++;
        }

        if (rol) {
            queryBase += ` AND u.rol = $${paramCounter}`;
            queryParams.push(rol);
            paramCounter++;
        }

        if (area) {
            queryBase += ` AND u.area = $${paramCounter}`;
            queryParams.push(area);
            paramCounter++;
        }

        if (activo !== '') {
            queryBase += ` AND u.activo = $${paramCounter}`;
            queryParams.push(activo === 'true');
            paramCounter++;
        }

        // Consulta para contar total de registros
        const countQuery = `SELECT COUNT(*) ${queryBase}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);

        // Consulta principal con paginación
        const dataQuery = `
            SELECT 
                u.id,
                u.nombre,
                u.email,
                u.rol,
                u.area as area_codigo,
                a.nombre as area_nombre,
                u.activo,
                u.created_at,
                u.updated_at
            ${queryBase}
            ORDER BY u.created_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        // Agregar parámetros de paginación
        queryParams.push(limitNum, offset);

        const dataResult = await pool.query(dataQuery, queryParams);

        console.log(`✅ Usuarios encontrados: ${dataResult.rows.length} de ${totalItems} totales`);

        // Responder con datos y metadatos de paginación
        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages: Math.ceil(totalItems / limitNum),
                hasNextPage: pageNum < Math.ceil(totalItems / limitNum),
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la lista de usuarios'
        });
    }
};

/**
 * Obtener un usuario por ID
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando usuario con ID: ${id}`);

        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.email,
                u.rol,
                u.area as area_codigo,
                a.nombre as area_nombre,
                u.activo,
                u.created_at,
                u.updated_at
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE u.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            console.log(`❌ Usuario con ID ${id} no encontrado`);
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        console.log(`✅ Usuario encontrado: ${result.rows[0].email}`);
        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el usuario'
        });
    }
};

/**
 * Crear un nuevo usuario
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const createUsuario = async (req, res) => {
    try {
        console.log('➕ Creando nuevo usuario...');
        const { nombre, email, password, rol, area } = req.body;

        // Validar campos requeridos
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email, contraseña y rol son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'El formato del email no es válido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar rol
        const rolesPermitidos = ['admin', 'usuario', 'consulta'];
        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                success: false,
                error: 'El rol debe ser: admin, usuario o consulta'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await pool.query(
            'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un usuario con ese correo electrónico'
            });
        }

        // Si se especificó área, verificar que exista
        if (area) {
            const areaExists = await pool.query(
                'SELECT id FROM areas WHERE codigo = $1',
                [area]
            );

            if (areaExists.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El área especificada no existe'
                });
            }
        }

        // Hashear la contraseña
        console.log('🔐 Hasheando contraseña...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario
        const insertQuery = `
            INSERT INTO usuarios (nombre, email, password, rol, area)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nombre, email, rol, area, activo, created_at
        `;

        const result = await pool.query(insertQuery, [
            nombre,
            email.toLowerCase(),
            hashedPassword,
            rol,
            area || null
        ]);

        const nuevoUsuario = result.rows[0];

        // Registrar en el historial
        await pool.query(
            `INSERT INTO historial_cambios 
             (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_nuevo)
             VALUES ('usuarios', $1, $2, 'creacion', 'nuevo_usuario', $3)`,
            [nuevoUsuario.id, req.user.id, email]
        );

        console.log(`✅ Usuario creado exitosamente: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                area: nuevoUsuario.area,
                activo: nuevoUsuario.activo,
                created_at: nuevoUsuario.created_at
            }
        });

    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el usuario'
        });
    }
};

/**
 * Actualizar un usuario existente
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol, area, activo, password } = req.body;

        console.log(`📝 Actualizando usuario ID: ${id}`);

        // Verificar que el usuario existe
        const userExists = await pool.query(
            'SELECT id, email FROM usuarios WHERE id = $1',
            [id]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // No permitir que un usuario se modifique a sí mismo ciertos campos críticos
        if (req.user.id === parseInt(id)) {
            if (rol && rol !== req.user.rol) {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes cambiar tu propio rol'
                });
            }
            if (activo === false) {
                return res.status(403).json({
                    success: false,
                    error: 'No puedes desactivar tu propia cuenta'
                });
            }
        }

        // Construir la consulta de actualización dinámicamente
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (nombre !== undefined) {
            updates.push(`nombre = $${paramCounter}`);
            values.push(nombre);
            paramCounter++;
        }

        if (email !== undefined) {
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'El formato del email no es válido'
                });
            }

            // Verificar que el nuevo email no esté en uso
            const emailInUse = await pool.query(
                'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id != $2',
                [email, id]
            );

            if (emailInUse.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Ya existe otro usuario con ese correo electrónico'
                });
            }

            updates.push(`email = $${paramCounter}`);
            values.push(email.toLowerCase());
            paramCounter++;
        }

        if (rol !== undefined) {
            const rolesPermitidos = ['admin', 'usuario', 'consulta'];
            if (!rolesPermitidos.includes(rol)) {
                return res.status(400).json({
                    success: false,
                    error: 'El rol debe ser: admin, usuario o consulta'
                });
            }
            updates.push(`rol = $${paramCounter}`);
            values.push(rol);
            paramCounter++;
        }

        if (area !== undefined) {
            if (area && area !== '') {
                // Verificar que el área existe
                const areaExists = await pool.query(
                    'SELECT id FROM areas WHERE codigo = $1',
                    [area]
                );

                if (areaExists.rows.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'El área especificada no existe'
                    });
                }
                updates.push(`area = $${paramCounter}`);
                values.push(area);
            } else {
                updates.push(`area = $${paramCounter}`);
                values.push(null);
            }
            paramCounter++;
        }

        if (activo !== undefined) {
            updates.push(`activo = $${paramCounter}`);
            values.push(activo);
            paramCounter++;
        }

        if (password !== undefined && password !== '') {
            // Validar longitud de contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password = $${paramCounter}`);
            values.push(hashedPassword);
            paramCounter++;
        }

        // Si no hay nada que actualizar
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron campos para actualizar'
            });
        }

        // Agregar el timestamp de actualización
        updates.push(`updated_at = NOW()`);

        // Agregar el ID al final de los valores
        values.push(id);

        // Ejecutar la actualización
        const updateQuery = `
            UPDATE usuarios 
            SET ${updates.join(', ')}
            WHERE id = $${paramCounter}
            RETURNING id, nombre, email, rol, area, activo, updated_at
        `;

        const result = await pool.query(updateQuery, values);

        // Registrar en el historial
        await pool.query(
            `INSERT INTO historial_cambios 
             (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo)
             VALUES ('usuarios', $1, $2, 'modificacion', 'datos_usuario', $3, $4)`,
            [id, req.user.id, userExists.rows[0].email, result.rows[0].email]
        );

        console.log(`✅ Usuario actualizado: ${result.rows[0].email}`);

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el usuario'
        });
    }
};

/**
 * Eliminar (desactivar) un usuario
 * Solo los administradores pueden eliminar usuarios
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Eliminando usuario ID: ${id}`);

        // Verificar que no sea el mismo usuario
        if (req.user.id === parseInt(id)) {
            return res.status(403).json({
                success: false,
                error: 'No puedes eliminar tu propia cuenta'
            });
        }

        // Verificar que el usuario existe
        const userExists = await pool.query(
            'SELECT id, nombre, email, activo FROM usuarios WHERE id = $1',
            [id]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const usuario = userExists.rows[0];

        // Si ya está inactivo, informar
        if (!usuario.activo) {
            return res.status(400).json({
                success: false,
                error: 'El usuario ya está inactivo'
            });
        }

        // Realizar soft delete (marcar como inactivo)
        await pool.query(
            'UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1',
            [id]
        );

        // Registrar en el historial
        await pool.query(
            `INSERT INTO historial_cambios 
             (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_anterior, valor_nuevo)
             VALUES ('usuarios', $1, $2, 'eliminacion', 'activo', 'true', 'false')`,
            [id, req.user.id]
        );

        console.log(`✅ Usuario desactivado: ${usuario.email}`);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente',
            data: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el usuario'
        });
    }
};

/**
 * Obtener estadísticas de usuarios
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getEstadisticas = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de usuarios...');

        // Consulta para obtener estadísticas
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE activo = true) as usuarios_activos,
                COUNT(*) FILTER (WHERE activo = false) as usuarios_inactivos,
                COUNT(*) as total_usuarios,
                COUNT(*) FILTER (WHERE rol = 'admin') as total_admins,
                COUNT(*) FILTER (WHERE rol = 'usuario') as total_usuarios_normales,
                COUNT(*) FILTER (WHERE rol = 'consulta') as total_consulta,
                COUNT(DISTINCT area) FILTER (WHERE area IS NOT NULL) as areas_con_usuarios
            FROM usuarios
        `;

        const result = await pool.query(query);
        const stats = result.rows[0];

        // Obtener usuarios por área
        const usuariosPorArea = await pool.query(`
            SELECT 
                COALESCE(a.nombre, 'Sin área') as area_nombre,
                COUNT(u.id) as cantidad
            FROM usuarios u
            LEFT JOIN areas a ON u.area = a.codigo
            WHERE u.activo = true
            GROUP BY a.nombre
            ORDER BY cantidad DESC
        `);

        console.log('✅ Estadísticas generadas exitosamente');

        res.json({
            success: true,
            data: {
                resumen: {
                    usuarios_activos: parseInt(stats.usuarios_activos),
                    usuarios_inactivos: parseInt(stats.usuarios_inactivos),
                    total_usuarios: parseInt(stats.total_usuarios),
                    por_rol: {
                        administradores: parseInt(stats.total_admins),
                        usuarios: parseInt(stats.total_usuarios_normales),
                        consulta: parseInt(stats.total_consulta)
                    },
                    areas_con_usuarios: parseInt(stats.areas_con_usuarios)
                },
                usuarios_por_area: usuariosPorArea.rows
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las estadísticas'
        });
    }
};

// Exportar todas las funciones del controlador
module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    getEstadisticas
};