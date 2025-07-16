// === ARCHIVO: backend/controllers/expedientesController.js ===
const { pool } = require('../config/database');

// Obtener todos los expedientes con filtros
const getExpedientes = async (req, res) => {
    try {
        const { 
            area_id, 
            estado, 
            fecha_inicio, 
            fecha_fin,
            busqueda,
            page = 1,
            limit = 20 
        } = req.query;

        let query = `
            SELECT 
                e.id,
                e.numero_expediente,
                e.nombre,
                e.asunto,
                e.fecha_apertura,
                e.fecha_cierre,
                e.estado,
                e.total_hojas,
                e.numero_legajos,
                e.ubicacion_fisica,
                a.nombre as area_nombre,
                s.nombre as seccion_nombre,
                se.nombre as serie_nombre,
                u.nombre as creado_por
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series se ON e.serie_id = se.id
            LEFT JOIN usuarios u ON e.created_by = u.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        // Filtros
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
                e.nombre ILIKE $${paramCount} OR
                e.asunto ILIKE $${paramCount}
            )`;
            params.push(`%${busqueda}%`);
        }

        // Ordenamiento y paginación
        query += ` ORDER BY e.created_at DESC`;
        
        // Contar total de registros
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
        const countResult = await pool.query(countQuery, params);
        const totalItems = parseInt(countResult.rows[0].count);

        // Aplicar paginación
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        // Ejecutar query principal
        const result = await pool.query(query, params);

        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener expedientes:', error);
        res.status(500).json({
            error: 'Error al obtener expedientes'
        });
    }
};

// Obtener un expediente por ID
const getExpedienteById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                e.*,
                a.nombre as area_nombre,
                f.nombre as fondo_nombre,
                s.nombre as seccion_nombre,
                se.nombre as serie_nombre,
                ss.nombre as subserie_nombre,
                u1.nombre as creado_por_nombre,
                u2.nombre as actualizado_por_nombre
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN fondos f ON e.fondo_id = f.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series se ON e.serie_id = se.id
            LEFT JOIN subseries ss ON e.subserie_id = ss.id
            LEFT JOIN usuarios u1 ON e.created_by = u1.id
            LEFT JOIN usuarios u2 ON e.updated_by = u2.id
            WHERE e.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Expediente no encontrado'
            });
        }

        // Obtener documentos del expediente
        const docsQuery = `
            SELECT id, nombre, descripcion, tipo_documento, fecha_documento, numero_hojas
            FROM documentos
            WHERE expediente_id = $1
            ORDER BY orden, created_at
        `;
        const docsResult = await pool.query(docsQuery, [id]);

        const expediente = result.rows[0];
        expediente.documentos = docsResult.rows;

        res.json(expediente);

    } catch (error) {
        console.error('Error al obtener expediente:', error);
        res.status(500).json({
            error: 'Error al obtener expediente'
        });
    }
};

// Crear nuevo expediente
const createExpediente = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            numero_expediente,
            nombre,
            asunto,
            area_id,
            seccion_id,
            serie_id,
            subserie_id,
            numero_legajos,
            total_hojas,
            fecha_apertura,
            valor_administrativo,
            valor_juridico,
            valor_fiscal,
            valor_contable,
            archivo_tramite,
            archivo_concentracion,
            destino_final,
            clasificacion_informacion,
            ubicacion_fisica,
            observaciones
        } = req.body;

        // Validar número de expediente único
        const checkQuery = 'SELECT id FROM expedientes WHERE numero_expediente = $1';
        const checkResult = await client.query(checkQuery, [numero_expediente]);
        
        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'El número de expediente ya existe'
            });
        }

        // Obtener fondo_id basado en la sección
        let fondo_id = null;
        if (seccion_id) {
            const fondoQuery = 'SELECT fondo_id FROM secciones WHERE id = $1';
            const fondoResult = await client.query(fondoQuery, [seccion_id]);
            if (fondoResult.rows.length > 0) {
                fondo_id = fondoResult.rows[0].fondo_id;
            }
        }

        // Insertar expediente
        const insertQuery = `
            INSERT INTO expedientes (
                numero_expediente, nombre, asunto, area_id,
                fondo_id, seccion_id, serie_id, subserie_id,
                numero_legajos, total_hojas, fecha_apertura,
                valor_administrativo, valor_juridico, valor_fiscal, valor_contable,
                archivo_tramite, archivo_concentracion, destino_final,
                clasificacion_informacion, ubicacion_fisica,
                estado, created_by, observaciones
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11,
                $12, $13, $14, $15,
                $16, $17, $18,
                $19, $20,
                'activo', $21, $22
            ) RETURNING *
        `;

        const values = [
            numero_expediente, nombre, asunto, area_id,
            fondo_id, seccion_id, serie_id, subserie_id,
            numero_legajos || 1, total_hojas || 0, fecha_apertura,
            valor_administrativo || true, valor_juridico || false, 
            valor_fiscal || false, valor_contable || false,
            archivo_tramite || 2, archivo_concentracion || 5, destino_final || 'conservacion',
            clasificacion_informacion || 'publica', ubicacion_fisica,
            req.user.id, observaciones
        ];

        const result = await client.query(insertQuery, values);
        const expediente = result.rows[0];

        // Registrar en historial
        await client.query(`
            INSERT INTO historial_cambios 
            (tabla_afectada, registro_id, usuario_id, tipo_cambio, valor_nuevo)
            VALUES ('expedientes', $1, $2, 'creacion', $3)
        `, [expediente.id, req.user.id, JSON.stringify(expediente)]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Expediente creado exitosamente',
            expediente
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear expediente:', error);
        res.status(500).json({
            error: 'Error al crear expediente',
            details: error.message
        });
    } finally {
        client.release();
    }
};

// Actualizar expediente
const updateExpediente = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const updates = req.body;
        
        // Verificar que existe
        const checkQuery = 'SELECT * FROM expedientes WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Expediente no encontrado'
            });
        }
        
        const oldData = checkResult.rows[0];
        
        // Construir query de actualización dinámica
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        // Lista de campos actualizables
        const updatableFields = [
            'nombre', 'asunto', 'area_id', 'seccion_id', 'serie_id', 'subserie_id',
            'numero_legajos', 'total_hojas', 'fecha_apertura', 'fecha_cierre',
            'valor_administrativo', 'valor_juridico', 'valor_fiscal', 'valor_contable',
            'archivo_tramite', 'archivo_concentracion', 'destino_final',
            'clasificacion_informacion', 'ubicacion_fisica', 'estado', 'observaciones'
        ];
        
        for (const field of updatableFields) {
            if (updates.hasOwnProperty(field)) {
                fields.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
                paramCount++;
            }
        }
        
        if (fields.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'No se proporcionaron campos para actualizar'
            });
        }
        
        // Agregar campos de auditoría
        fields.push(`updated_by = $${paramCount}`);
        values.push(req.user.id);
        paramCount++;
        
        fields.push(`updated_at = NOW()`);
        
        // Agregar ID al final
        values.push(id);
        
        const updateQuery = `
            UPDATE expedientes 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, values);
        const updatedExpediente = result.rows[0];
        
        // Registrar cambios en historial
        for (const field of Object.keys(updates)) {
            if (oldData[field] !== updates[field]) {
                await client.query(`
                    INSERT INTO historial_cambios 
                    (tabla_afectada, registro_id, usuario_id, tipo_cambio, 
                     campo_modificado, valor_anterior, valor_nuevo)
                    VALUES ('expedientes', $1, $2, 'modificacion', $3, $4, $5)
                `, [id, req.user.id, field, oldData[field], updates[field]]);
            }
        }
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Expediente actualizado exitosamente',
            expediente: updatedExpediente
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar expediente:', error);
        res.status(500).json({
            error: 'Error al actualizar expediente'
        });
    } finally {
        client.release();
    }
};

// Eliminar expediente (soft delete)
const deleteExpediente = async (req, res) => {
    try {
        const { id } = req.params;
        
        // En lugar de eliminar, cambiar estado a "baja"
        const query = `
            UPDATE expedientes 
            SET estado = 'baja', 
                updated_by = $1, 
                updated_at = NOW()
            WHERE id = $2
            RETURNING numero_expediente
        `;
        
        const result = await pool.query(query, [req.user.id, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Expediente no encontrado'
            });
        }
        
        // Registrar en historial
        await pool.query(`
            INSERT INTO historial_cambios 
            (tabla_afectada, registro_id, usuario_id, tipo_cambio, campo_modificado, valor_nuevo)
            VALUES ('expedientes', $1, $2, 'eliminacion', 'estado', 'baja')
        `, [id, req.user.id]);
        
        res.json({
            message: 'Expediente dado de baja exitosamente',
            numero_expediente: result.rows[0].numero_expediente
        });
        
    } catch (error) {
        console.error('Error al eliminar expediente:', error);
        res.status(500).json({
            error: 'Error al eliminar expediente'
        });
    }
};

module.exports = {
    getExpedientes,
    getExpedienteById,
    createExpediente,
    updateExpediente,
    deleteExpediente
};