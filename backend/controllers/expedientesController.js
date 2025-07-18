// === ARCHIVO: backend/controllers/expedientesController.js ===
// Controlador para la gestión de expedientes del sistema CCAMEM

const { pool } = require('../config/database');

/**
 * Obtener todos los expedientes con filtros y paginación
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getExpedientes = async (req, res) => {
    try {
        console.log('📋 Obteniendo expedientes...');
        
        const { 
            area_id, 
            estado, 
            fecha_inicio, 
            fecha_fin,
            busqueda,
            page = 1,
            limit = 20 
        } = req.query;

        // Query principal corregida - usando usuario_creador en lugar de created_by
        let query = `
            SELECT 
                e.id,
                e.numero_expediente,
                e.titulo,
                e.descripcion,
                e.fecha_apertura,
                e.fecha_cierre,
                e.estado,
                e.total_hojas,
                e.numero_legajos,
                e.ubicacion_fisica,
                e.clasificacion_informacion,
                e.archivo_tramite,
                e.archivo_concentracion,
                e.destino_final,
                e.observaciones,
                e.created_at,
                e.updated_at,
                a.nombre as area_nombre,
                a.codigo as area_codigo,
                f.nombre as fondo_nombre,
                s.nombre as seccion_nombre,
                se.nombre as serie_nombre,
                ss.nombre as subserie_nombre,
                u.nombre as creado_por
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN fondos f ON e.fondo_id = f.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series se ON e.serie_id = se.id
            LEFT JOIN subseries ss ON e.subserie_id = ss.id
            LEFT JOIN usuarios u ON e.usuario_creador = u.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        // Aplicar filtros dinámicamente
        if (area_id) {
            paramCount++;
            query += ` AND e.area_id = $${paramCount}`;
            params.push(area_id);
        }

        if (estado) {
            paramCount++;
            query += ` AND e.estado = $${paramCount}`;
            params.push(estado);
        }

        if (fecha_inicio) {
            paramCount++;
            query += ` AND e.fecha_apertura >= $${paramCount}`;
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            paramCount++;
            query += ` AND e.fecha_apertura <= $${paramCount}`;
            params.push(fecha_fin);
        }

        if (busqueda) {
            paramCount++;
            query += ` AND (
                e.numero_expediente ILIKE $${paramCount} OR
                e.titulo ILIKE $${paramCount} OR
                e.descripcion ILIKE $${paramCount}
            )`;
            params.push(`%${busqueda}%`);
        }

        // Contar total de registros para paginación
        const countQuery = query.replace(
            /SELECT[\s\S]*FROM/, 
            'SELECT COUNT(*) as total FROM'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Aplicar paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), offset);

        // Ejecutar query principal
        const result = await pool.query(query, params);

        console.log(`✅ Expedientes obtenidos: ${result.rows.length} de ${total}`);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
                hasNext: offset + parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener expedientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener expedientes',
            details: error.message
        });
    }
};

/**
 * Obtener un expediente específico por ID
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getExpedienteById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Obteniendo expediente ID: ${id}`);

        // Query para obtener expediente completo
        const query = `
            SELECT 
                e.*,
                a.nombre as area_nombre,
                a.codigo as area_codigo,
                f.nombre as fondo_nombre,
                s.nombre as seccion_nombre,
                se.nombre as serie_nombre,
                ss.nombre as subserie_nombre,
                u1.nombre as creado_por_nombre,
                u1.email as creado_por_email
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN fondos f ON e.fondo_id = f.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series se ON e.serie_id = se.id
            LEFT JOIN subseries ss ON e.subserie_id = ss.id
            LEFT JOIN usuarios u1 ON e.usuario_creador = u1.id
            WHERE e.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            console.log(`❌ Expediente ${id} no encontrado`);
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }

        // Obtener documentos del expediente
        const docsQuery = `
            SELECT 
                id, 
                nombre_archivo,
                nombre_original,
                tipo_archivo,
                tamaño_archivo,
                descripcion,
                fecha_subida,
                paginas
            FROM documentos
            WHERE expediente_id = $1
            ORDER BY fecha_subida DESC
        `;
        
        const docsResult = await pool.query(docsQuery, [id]);

        const expediente = result.rows[0];
        expediente.documentos = docsResult.rows;

        console.log(`✅ Expediente encontrado: ${expediente.numero_expediente}`);

        res.json({
            success: true,
            data: expediente
        });

    } catch (error) {
        console.error('❌ Error al obtener expediente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener expediente'
        });
    }
};

/**
 * Crear nuevo expediente
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const createExpediente = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        console.log('➕ Creando nuevo expediente...');

        const {
            numero_expediente,
            titulo,
            descripcion,
            area_id,
            fondo_id,
            seccion_id,
            serie_id,
            subserie_id,
            fecha_apertura,
            fecha_cierre,
            numero_legajos = 1,
            total_hojas = 0,
            ubicacion_fisica,
            archivo_tramite = 2,
            archivo_concentracion = 5,
            destino_final = 'Conservación permanente',
            clasificacion_informacion = 'Pública',
            estado = 'Activo',
            observaciones
        } = req.body;

        // Validar campos requeridos
        if (!numero_expediente || !titulo || !fecha_apertura) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Número de expediente, título y fecha de apertura son requeridos'
            });
        }

        // Verificar que el número de expediente no exista
        const checkQuery = 'SELECT id FROM expedientes WHERE numero_expediente = $1';
        const checkResult = await client.query(checkQuery, [numero_expediente]);
        
        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Ya existe un expediente con ese número'
            });
        }

        // Query de inserción
        const insertQuery = `
            INSERT INTO expedientes (
                numero_expediente, titulo, descripcion, area_id, fondo_id,
                seccion_id, serie_id, subserie_id, fecha_apertura, fecha_cierre,
                numero_legajos, total_hojas, ubicacion_fisica, archivo_tramite,
                archivo_concentracion, destino_final, clasificacion_informacion,
                estado, observaciones, usuario_creador
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            ) RETURNING *
        `;

        const values = [
            numero_expediente, titulo, descripcion, area_id, fondo_id,
            seccion_id, serie_id, subserie_id, fecha_apertura, fecha_cierre,
            numero_legajos, total_hojas, ubicacion_fisica, archivo_tramite,
            archivo_concentracion, destino_final, clasificacion_informacion,
            estado, observaciones, req.user.id
        ];

        const result = await client.query(insertQuery, values);
        const expediente = result.rows[0];

        // Registrar en historial (si existe la tabla)
        try {
            await client.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('expedientes', $1, $2, 'INSERT', $3)
            `, [expediente.id, req.user.id, JSON.stringify(expediente)]);
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar en historial (tabla no existe)');
        }

        await client.query('COMMIT');

        console.log(`✅ Expediente creado: ${expediente.numero_expediente}`);

        res.status(201).json({
            success: true,
            message: 'Expediente creado exitosamente',
            data: expediente
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al crear expediente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear expediente',
            details: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Actualizar expediente existente
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const updateExpediente = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const updates = req.body;
        
        console.log(`🔧 Actualizando expediente ID: ${id}`);

        // Verificar que existe el expediente
        const checkQuery = 'SELECT * FROM expedientes WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        const oldData = checkResult.rows[0];
        
        // Construir query de actualización dinámica
        const setClause = [];
        const values = [];
        let paramCount = 0;

        // Campos actualizables
        const allowedFields = [
            'titulo', 'descripcion', 'area_id', 'fondo_id', 'seccion_id',
            'serie_id', 'subserie_id', 'fecha_apertura', 'fecha_cierre',
            'numero_legajos', 'total_hojas', 'ubicacion_fisica',
            'archivo_tramite', 'archivo_concentracion', 'destino_final',
            'clasificacion_informacion', 'estado', 'observaciones'
        ];

        // Construir SET clause dinámicamente
        for (const field of allowedFields) {
            if (updates.hasOwnProperty(field)) {
                paramCount++;
                setClause.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
            }
        }

        if (setClause.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }

        // Agregar updated_at y parámetros finales
        paramCount++;
        setClause.push(`updated_at = $${paramCount}`);
        values.push(new Date());

        values.push(id); // Para el WHERE

        const updateQuery = `
            UPDATE expedientes 
            SET ${setClause.join(', ')}
            WHERE id = $${paramCount + 1}
            RETURNING *
        `;

        const result = await client.query(updateQuery, values);
        const updatedExpediente = result.rows[0];

        // Registrar cambios en historial (si existe la tabla)
        try {
            for (const field of Object.keys(updates)) {
                if (allowedFields.includes(field) && oldData[field] !== updates[field]) {
                    await client.query(`
                        INSERT INTO historial_cambios 
                        (tabla_afectada, registro_id, usuario_id, accion, datos_anteriores, datos_nuevos)
                        VALUES ('expedientes', $1, $2, 'UPDATE', $3, $4)
                    `, [id, req.user.id, 
                        JSON.stringify({ [field]: oldData[field] }),
                        JSON.stringify({ [field]: updates[field] })
                    ]);
                }
            }
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar en historial');
        }
        
        await client.query('COMMIT');

        console.log(`✅ Expediente actualizado: ${updatedExpediente.numero_expediente}`);
        
        res.json({
            success: true,
            message: 'Expediente actualizado exitosamente',
            data: updatedExpediente
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al actualizar expediente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar expediente'
        });
    } finally {
        client.release();
    }
};

/**
 * Eliminar expediente (soft delete)
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const deleteExpediente = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Eliminando expediente ID: ${id}`);
        
        // En lugar de eliminar, cambiar estado a "Baja"
        const query = `
            UPDATE expedientes 
            SET estado = 'Baja', 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING numero_expediente, titulo
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Expediente no encontrado'
            });
        }
        
        const expediente = result.rows[0];

        // Registrar en historial (si existe la tabla)
        try {
            await pool.query(`
                INSERT INTO historial_cambios 
                (tabla_afectada, registro_id, usuario_id, accion, datos_nuevos)
                VALUES ('expedientes', $1, $2, 'DELETE', $3)
            `, [id, req.user.id, JSON.stringify({ estado: 'Baja' })]);
        } catch (historialError) {
            console.log('⚠️ No se pudo registrar en historial');
        }

        console.log(`✅ Expediente dado de baja: ${expediente.numero_expediente}`);
        
        res.json({
            success: true,
            message: 'Expediente dado de baja exitosamente',
            data: {
                numero_expediente: expediente.numero_expediente,
                titulo: expediente.titulo
            }
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar expediente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar expediente'
        });
    }
};

/**
 * Obtener estadísticas de expedientes
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 */
const getEstadisticas = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de expedientes...');

        const estadisticasQuery = `
            SELECT 
                COUNT(*) as total_expedientes,
                COUNT(*) FILTER (WHERE estado = 'Activo') as activos,
                COUNT(*) FILTER (WHERE estado = 'Cerrado') as cerrados,
                COUNT(*) FILTER (WHERE estado = 'Transferido') as transferidos,
                COUNT(*) FILTER (WHERE estado = 'Baja') as dados_baja,
                SUM(total_hojas) as total_hojas,
                SUM(numero_legajos) as total_legajos,
                COUNT(*) FILTER (WHERE fecha_apertura >= CURRENT_DATE - INTERVAL '30 days') as creados_ultimo_mes
            FROM expedientes
        `;

        const result = await pool.query(estadisticasQuery);
        const estadisticas = result.rows[0];

        // Convertir a números
        Object.keys(estadisticas).forEach(key => {
            estadisticas[key] = parseInt(estadisticas[key]) || 0;
        });

        console.log('✅ Estadísticas obtenidas');

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
};

module.exports = {
    getExpedientes,
    getExpedienteById,
    createExpediente,
    updateExpediente,
    deleteExpediente,
    getEstadisticas
};