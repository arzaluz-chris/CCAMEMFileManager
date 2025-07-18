// === ARCHIVO: backend/controllers/configuracionController.js ===
// Controlador para la gestión de configuración del sistema CCAMEM

const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const { manejarErrorDB } = require('../utils/helpers');
const { validarFormulario } = require('../utils/validators');

/**
 * Obtener todas las configuraciones agrupadas por categoría
 */
const obtenerConfiguraciones = async (req, res) => {
    try {
        console.log('📋 Obteniendo configuraciones del sistema...');
        
        const query = `
            SELECT 
                id, clave, valor, tipo, categoria, descripcion, editable
            FROM configuracion_sistema
            ORDER BY categoria, clave
        `;
        
        const result = await pool.query(query);
        
        // Agrupar por categoría
        const configuracionesAgrupadas = result.rows.reduce((acc, config) => {
            if (!acc[config.categoria]) {
                acc[config.categoria] = [];
            }
            
            // Convertir valor según el tipo
            let valorConvertido = config.valor;
            switch (config.tipo) {
                case 'numero':
                    valorConvertido = Number(config.valor);
                    break;
                case 'booleano':
                    valorConvertido = config.valor === 'true';
                    break;
                case 'json':
                    try {
                        valorConvertido = JSON.parse(config.valor);
                    } catch (e) {
                        valorConvertido = config.valor;
                    }
                    break;
            }
            
            acc[config.categoria].push({
                ...config,
                valor: valorConvertido
            });
            
            return acc;
        }, {});
        
        console.log(`✅ ${result.rows.length} configuraciones encontradas`);
        
        res.json({
            success: true,
            data: configuracionesAgrupadas
        });
        
    } catch (error) {
        console.error('❌ Error al obtener configuraciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las configuraciones'
        });
    }
};

/**
 * Actualizar una configuración específica
 */
const actualizarConfiguracion = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { clave } = req.params;
        const { valor } = req.body;
        
        console.log(`📝 Actualizando configuración: ${clave}`);
        
        await client.query('BEGIN');
        
        // Verificar que la configuración existe y es editable
        const configResult = await client.query(
            'SELECT * FROM configuracion_sistema WHERE clave = $1',
            [clave]
        );
        
        if (configResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Configuración no encontrada'
            });
        }
        
        const config = configResult.rows[0];
        
        if (!config.editable) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                error: 'Esta configuración no es editable'
            });
        }
        
        // Validar el valor según el tipo
        let valorFinal = valor;
        switch (config.tipo) {
            case 'numero':
                if (isNaN(valor)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: 'El valor debe ser un número'
                    });
                }
                valorFinal = valor.toString();
                break;
                
            case 'booleano':
                if (typeof valor !== 'boolean') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: 'El valor debe ser verdadero o falso'
                    });
                }
                valorFinal = valor.toString();
                break;
                
            case 'json':
                try {
                    valorFinal = JSON.stringify(valor);
                } catch (e) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        error: 'El valor debe ser un JSON válido'
                    });
                }
                break;
                
            default:
                valorFinal = valor.toString();
        }
        
        // Actualizar la configuración
        await client.query(
            'UPDATE configuracion_sistema SET valor = $1, updated_at = NOW() WHERE clave = $2',
            [valorFinal, clave]
        );
        
        // Registrar en auditoría
        await client.query(
            `SELECT registrar_auditoria($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                'actualizar_configuracion',
                'configuracion',
                `Configuración actualizada: ${clave}`,
                JSON.stringify({ valor: config.valor }),
                JSON.stringify({ valor: valorFinal })
            ]
        );
        
        await client.query('COMMIT');
        
        console.log(`✅ Configuración ${clave} actualizada exitosamente`);
        
        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la configuración'
        });
    } finally {
        client.release();
    }
};

/**
 * Obtener configuraciones de notificaciones
 */
const obtenerNotificaciones = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, tipo_notificacion, activa, enviar_email, 
                enviar_sistema, asunto_email, roles_destino
            FROM configuracion_notificaciones
            ORDER BY tipo_notificacion
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las configuraciones de notificaciones'
        });
    }
};

/**
 * Actualizar configuración de notificación
 */
const actualizarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { activa, enviar_email, enviar_sistema, asunto_email } = req.body;
        
        const query = `
            UPDATE configuracion_notificaciones 
            SET activa = $1, enviar_email = $2, enviar_sistema = $3, 
                asunto_email = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            activa,
            enviar_email,
            enviar_sistema,
            asunto_email,
            id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Notificación actualizada exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar notificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la notificación'
        });
    }
};

/**
 * Obtener logs de auditoría con filtros
 */
const obtenerAuditoria = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            usuario_id,
            modulo,
            accion,
            fecha_inicio,
            fecha_fin,
            resultado
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        // Construir query dinámicamente
        let queryBase = `
            FROM logs_auditoria
            WHERE 1=1
        `;
        const queryParams = [];
        let paramCounter = 1;
        
        if (usuario_id) {
            queryBase += ` AND usuario_id = $${paramCounter}`;
            queryParams.push(usuario_id);
            paramCounter++;
        }
        
        if (modulo) {
            queryBase += ` AND modulo = $${paramCounter}`;
            queryParams.push(modulo);
            paramCounter++;
        }
        
        if (accion) {
            queryBase += ` AND accion = $${paramCounter}`;
            queryParams.push(accion);
            paramCounter++;
        }
        
        if (resultado) {
            queryBase += ` AND resultado = $${paramCounter}`;
            queryParams.push(resultado);
            paramCounter++;
        }
        
        if (fecha_inicio) {
            queryBase += ` AND created_at >= $${paramCounter}`;
            queryParams.push(fecha_inicio);
            paramCounter++;
        }
        
        if (fecha_fin) {
            queryBase += ` AND created_at <= $${paramCounter}`;
            queryParams.push(fecha_fin);
            paramCounter++;
        }
        
        // Contar total
        const countQuery = `SELECT COUNT(*) ${queryBase}`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);
        
        // Obtener datos
        queryParams.push(limit, offset);
        const dataQuery = `
            SELECT 
                id, usuario_id, usuario_email, usuario_nombre,
                accion, modulo, descripcion, ip_address,
                resultado, mensaje_error, duracion_ms,
                created_at
            ${queryBase}
            ORDER BY created_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;
        
        const dataResult = await pool.query(dataQuery, queryParams);
        
        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener auditoría:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los logs de auditoría'
        });
    }
};

/**
 * Obtener estadísticas de auditoría
 */
const obtenerEstadisticasAuditoria = async (req, res) => {
    try {
        // Estadísticas generales
        const statsQuery = `
            SELECT 
                COUNT(*) as total_logs,
                COUNT(DISTINCT usuario_id) as usuarios_activos,
                COUNT(DISTINCT modulo) as modulos_usados,
                COUNT(*) FILTER (WHERE resultado = 'exitoso') as acciones_exitosas,
                COUNT(*) FILTER (WHERE resultado = 'error') as acciones_error,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as ultimas_24h,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as ultimos_7d
            FROM logs_auditoria
        `;
        
        const stats = await pool.query(statsQuery);
        
        // Acciones más comunes
        const accionesQuery = `
            SELECT accion, COUNT(*) as total
            FROM logs_auditoria
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY accion
            ORDER BY total DESC
            LIMIT 10
        `;
        
        const acciones = await pool.query(accionesQuery);
        
        // Actividad por módulo
        const modulosQuery = `
            SELECT modulo, COUNT(*) as total
            FROM logs_auditoria
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY modulo
            ORDER BY total DESC
        `;
        
        const modulos = await pool.query(modulosQuery);
        
        res.json({
            success: true,
            data: {
                estadisticas: stats.rows[0],
                acciones_frecuentes: acciones.rows,
                actividad_modulos: modulos.rows
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las estadísticas de auditoría'
        });
    }
};

/**
 * Probar configuración de email
 */
const probarEmail = async (req, res) => {
    try {
        const { email_destino } = req.body;
        
        console.log('📧 Probando configuración de email...');
        
        // Obtener configuración SMTP
        const configQuery = `
            SELECT clave, valor 
            FROM configuracion_sistema 
            WHERE clave LIKE 'email_%'
        `;
        
        const configResult = await pool.query(configQuery);
        const config = configResult.rows.reduce((acc, row) => {
            acc[row.clave] = row.valor;
            return acc;
        }, {});
        
        // Crear transporte de nodemailer
        const transporter = nodemailer.createTransport({
            host: config.email_smtp_host,
            port: parseInt(config.email_smtp_port),
            secure: config.email_smtp_secure === 'true',
            auth: {
                user: config.email_smtp_user,
                pass: config.email_smtp_pass || process.env.EMAIL_PASSWORD
            }
        });
        
        // Enviar email de prueba
        const info = await transporter.sendMail({
            from: `"${config.email_from_name}" <${config.email_from}>`,
            to: email_destino,
            subject: 'Prueba de configuración de email - CCAMEM',
            html: `
                <h2>Prueba exitosa</h2>
                <p>Este es un email de prueba del sistema CCAMEM.</p>
                <p>Si recibes este mensaje, la configuración de email está funcionando correctamente.</p>
                <hr>
                <small>Enviado desde el sistema de gestión de archivos CCAMEM</small>
            `
        });
        
        console.log('✅ Email enviado:', info.messageId);
        
        res.json({
            success: true,
            message: 'Email de prueba enviado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error al enviar email de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar email de prueba: ' + error.message
        });
    }
};

/**
 * Obtener información del sistema
 */
const obtenerInfoSistema = async (req, res) => {
    try {
        // Información de la base de datos
        const dbInfoQuery = `
            SELECT 
                (SELECT COUNT(*) FROM usuarios) as total_usuarios,
                (SELECT COUNT(*) FROM expedientes) as total_expedientes,
                (SELECT COUNT(*) FROM documentos) as total_documentos,
                (SELECT pg_database_size(current_database())) as tamaño_db,
                (SELECT version()) as version_postgres
        `;
        
        const dbInfo = await pool.query(dbInfoQuery);
        
        // Información del servidor
        const os = require('os');
        const serverInfo = {
            plataforma: os.platform(),
            arquitectura: os.arch(),
            version_node: process.version,
            memoria_total: os.totalmem(),
            memoria_libre: os.freemem(),
            cpus: os.cpus().length,
            uptime: os.uptime()
        };
        
        // Espacio en disco para uploads
        let espacioUploads = { disponible: 0, total: 0 };
        try {
            const { execSync } = require('child_process');
            const dfOutput = execSync('df -B1 uploads/').toString();
            const lines = dfOutput.trim().split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                espacioUploads = {
                    total: parseInt(parts[1]),
                    usado: parseInt(parts[2]),
                    disponible: parseInt(parts[3])
                };
            }
        } catch (e) {
            console.error('Error obteniendo espacio en disco:', e);
        }
        
        res.json({
            success: true,
            data: {
                base_datos: {
                    ...dbInfo.rows[0],
                    tamaño_db_mb: Math.round(dbInfo.rows[0].tamaño_db / 1024 / 1024)
                },
                servidor: serverInfo,
                almacenamiento: espacioUploads
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener información del sistema:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener información del sistema'
        });
    }
};

/**
 * Configurar respaldo automático
 */
const configurarRespaldo = async (req, res) => {
    try {
        const {
            nombre,
            tipo,
            frecuencia,
            hora_ejecucion,
            dia_semana,
            dia_mes,
            incluir_documentos,
            incluir_base_datos,
            ruta_destino
        } = req.body;
        
        // Validar datos
        const reglas = {
            nombre: { tipo: 'texto', opciones: { requerido: true } },
            tipo: { tipo: 'texto', opciones: { requerido: true } },
            frecuencia: { tipo: 'texto', opciones: { requerido: true } }
        };
        
        const validacion = validarFormulario(req.body, reglas);
        if (!validacion.esValido) {
            return res.status(400).json({
                success: false,
                errores: validacion.errores
            });
        }
        
        // Calcular próxima ejecución
        const proximaEjecucion = calcularProximaEjecucion(frecuencia, hora_ejecucion, dia_semana, dia_mes);
        
        const query = `
            INSERT INTO configuracion_respaldos 
            (nombre, tipo, frecuencia, hora_ejecucion, dia_semana, 
             dia_mes, incluir_documentos, incluir_base_datos, 
             ruta_destino, proximo_ejecucion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            nombre,
            tipo,
            frecuencia,
            hora_ejecucion,
            dia_semana,
            dia_mes,
            incluir_documentos,
            incluir_base_datos,
            ruta_destino,
            proximaEjecucion
        ]);
        
        res.json({
            success: true,
            message: 'Respaldo configurado exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error al configurar respaldo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al configurar el respaldo'
        });
    }
};

/**
 * Obtener respaldos configurados
 */
const obtenerRespaldos = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, nombre, tipo, frecuencia, hora_ejecucion,
                dia_semana, dia_mes, activo, ultima_ejecucion,
                proximo_ejecucion, incluir_documentos, incluir_base_datos,
                ruta_destino, retener_dias
            FROM configuracion_respaldos
            ORDER BY nombre
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error al obtener respaldos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los respaldos configurados'
        });
    }
};

/**
 * Ejecutar respaldo manual
 */
const ejecutarRespaldo = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🔄 Ejecutando respaldo manual ID: ${id}`);
        
        // Obtener configuración del respaldo
        const configResult = await pool.query(
            'SELECT * FROM configuracion_respaldos WHERE id = $1',
            [id]
        );
        
        if (configResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Respaldo no encontrado'
            });
        }
        
        const config = configResult.rows[0];
        
        // Crear nombre único para el respaldo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nombreArchivo = `respaldo_${config.nombre}_${timestamp}`;
        
        // Ejecutar respaldo en segundo plano
        ejecutarProcesoRespaldo(config, nombreArchivo, req.user.id);
        
        res.json({
            success: true,
            message: 'Respaldo iniciado. Recibirás una notificación cuando termine.',
            archivo: nombreArchivo
        });
        
    } catch (error) {
        console.error('❌ Error al ejecutar respaldo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al ejecutar el respaldo'
        });
    }
};

/**
 * Limpiar logs antiguos
 */
const limpiarLogs = async (req, res) => {
    try {
        const { dias = 90 } = req.body;
        
        console.log(`🧹 Limpiando logs mayores a ${dias} días...`);
        
        const deleteQuery = `
            DELETE FROM logs_auditoria 
            WHERE created_at < NOW() - INTERVAL '${dias} days'
        `;
        
        const result = await pool.query(deleteQuery);
        
        // Registrar la acción
        await pool.query(
            `SELECT registrar_auditoria($1, $2, $3, $4)`,
            [
                req.user.id,
                'limpiar_logs',
                'configuracion',
                `Logs eliminados: ${result.rowCount} (mayores a ${dias} días)`
            ]
        );
        
        res.json({
            success: true,
            message: `Se eliminaron ${result.rowCount} logs antiguos`
        });
        
    } catch (error) {
        console.error('❌ Error al limpiar logs:', error);
        res.status(500).json({
            success: false,
            error: 'Error al limpiar los logs'
        });
    }
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Calcular próxima ejecución de un respaldo
 */
function calcularProximaEjecucion(frecuencia, hora, diaSemana, diaMes) {
    const ahora = new Date();
    let proxima = new Date(ahora);
    
    // Establecer la hora
    if (hora) {
        const [horas, minutos] = hora.split(':');
        proxima.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    }
    
    switch (frecuencia) {
        case 'diario':
            // Si ya pasó la hora hoy, programar para mañana
            if (proxima <= ahora) {
                proxima.setDate(proxima.getDate() + 1);
            }
            break;
            
        case 'semanal':
            // Buscar el próximo día de la semana
            const diasHastaProximo = (diaSemana - proxima.getDay() + 7) % 7 || 7;
            proxima.setDate(proxima.getDate() + diasHastaProximo);
            break;
            
        case 'mensual':
            // Establecer el día del mes
            proxima.setDate(diaMes);
            // Si ya pasó este mes, ir al siguiente
            if (proxima <= ahora) {
                proxima.setMonth(proxima.getMonth() + 1);
            }
            break;
    }
    
    return proxima;
}

/**
 * Ejecutar proceso de respaldo en segundo plano
 */
async function ejecutarProcesoRespaldo(config, nombreArchivo, usuarioId) {
    const client = await pool.connect();
    
    try {
        console.log(`🔄 Iniciando proceso de respaldo: ${nombreArchivo}`);
        
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        let comandos = [];
        
        // Respaldo de base de datos
        if (config.incluir_base_datos) {
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'ccamem_archivo',
                username: process.env.DB_USER || 'ccamem_user'
            };
            
            const archivoSQL = path.join(config.ruta_destino, `${nombreArchivo}.sql`);
            comandos.push(
                `PGPASSWORD="${process.env.DB_PASSWORD}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${archivoSQL}"`
            );
        }
        
        // Respaldo de documentos
        if (config.incluir_documentos) {
            const archivoTar = path.join(config.ruta_destino, `${nombreArchivo}_docs.tar.gz`);
            comandos.push(
                `tar -czf "${archivoTar}" -C uploads/ .`
            );
        }
        
        // Ejecutar comandos
        for (const comando of comandos) {
            await execPromise(comando);
        }
        
        // Actualizar última ejecución
        await client.query(
            `UPDATE configuracion_respaldos 
             SET ultima_ejecucion = NOW(), 
                 proximo_ejecucion = $1
             WHERE id = $2`,
            [
                calcularProximaEjecucion(
                    config.frecuencia,
                    config.hora_ejecucion,
                    config.dia_semana,
                    config.dia_mes
                ),
                config.id
            ]
        );
        
        // Registrar éxito
        await client.query(
            `SELECT registrar_auditoria($1, $2, $3, $4, NULL, NULL, $5)`,
            [
                usuarioId,
                'respaldo_ejecutado',
                'respaldos',
                `Respaldo completado: ${nombreArchivo}`,
                'exitoso'
            ]
        );
        
        console.log(`✅ Respaldo completado: ${nombreArchivo}`);
        
    } catch (error) {
        // Registrar error
        await client.query(
            `SELECT registrar_auditoria($1, $2, $3, $4, NULL, NULL, $5)`,
            [
                usuarioId,
                'respaldo_error',
                'respaldos',
                `Error en respaldo: ${nombreArchivo} - ${error.message}`,
                'error'
            ]
        );
        
        console.error(`❌ Error en respaldo ${nombreArchivo}:`, error);
    } finally {
        client.release();
    }
}

// Exportar funciones
module.exports = {
    obtenerConfiguraciones,
    actualizarConfiguracion,
    obtenerNotificaciones,
    actualizarNotificacion,
    obtenerAuditoria,
    obtenerEstadisticasAuditoria,
    probarEmail,
    obtenerInfoSistema,
    configurarRespaldo,
    obtenerRespaldos,
    ejecutarRespaldo,
    limpiarLogs
};