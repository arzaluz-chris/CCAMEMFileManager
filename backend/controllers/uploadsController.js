// === ARCHIVO: backend/controllers/uploadsController.js ===
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../config/database');

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'documentos');
        
        // Crear directorio si no existe
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // Generar nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, imágenes, Word y Excel.'), false);
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Subir documento a un expediente
const subirDocumento = async (req, res) => {
    try {
        const { expediente_id } = req.params;
        const { descripcion, tipo_documento, fecha_documento } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: 'No se proporcionó ningún archivo'
            });
        }

        // Verificar que el expediente existe
        const expResult = await pool.query(
            'SELECT id FROM expedientes WHERE id = $1',
            [expediente_id]
        );

        if (expResult.rows.length === 0) {
            // Eliminar archivo subido
            await fs.unlink(req.file.path);
            return res.status(404).json({
                error: 'Expediente no encontrado'
            });
        }

        // Guardar información en la base de datos
        const query = `
            INSERT INTO documentos (
                expediente_id, nombre, descripcion, tipo_documento,
                fecha_documento, archivo_digital, numero_hojas, orden
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 
                (SELECT COALESCE(MAX(orden), 0) + 1 FROM documentos WHERE expediente_id = $1)
            )
            RETURNING *
        `;

        const values = [
            expediente_id,
            req.file.originalname,
            descripcion || '',
            tipo_documento || 'Documento',
            fecha_documento || new Date(),
            req.file.filename,
            1 // Por defecto 1 hoja, se puede actualizar después
        ];

        const result = await pool.query(query, values);

        // Actualizar contador de hojas del expediente si es necesario
        await pool.query(
            'UPDATE expedientes SET total_hojas = total_hojas + 1 WHERE id = $1',
            [expediente_id]
        );

        res.status(201).json({
            message: 'Documento subido exitosamente',
            documento: result.rows[0],
            archivo: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });

    } catch (error) {
        console.error('Error al subir documento:', error);
        
        // Intentar eliminar el archivo si hubo error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error al eliminar archivo:', unlinkError);
            }
        }
        
        res.status(500).json({
            error: 'Error al subir documento'
        });
    }
};

// Obtener documentos de un expediente
const obtenerDocumentos = async (req, res) => {
    try {
        const { expediente_id } = req.params;

        const query = `
            SELECT id, nombre, descripcion, tipo_documento, 
                   fecha_documento, numero_hojas, archivo_digital,
                   created_at
            FROM documentos
            WHERE expediente_id = $1
            ORDER BY orden, created_at
        `;

        const result = await pool.query(query, [expediente_id]);

        res.json({
            data: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({
            error: 'Error al obtener documentos'
        });
    }
};

// Descargar un documento
const descargarDocumento = async (req, res) => {
    try {
        const { documento_id } = req.params;

        // Obtener información del documento
        const query = `
            SELECT d.*, e.created_by
            FROM documentos d
            JOIN expedientes e ON d.expediente_id = e.id
            WHERE d.id = $1
        `;

        const result = await pool.query(query, [documento_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Documento no encontrado'
            });
        }

        const documento = result.rows[0];
        const filePath = path.join(__dirname, '..', 'uploads', 'documentos', documento.archivo_digital);

        // Verificar que el archivo existe
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                error: 'Archivo no encontrado en el servidor'
            });
        }

        // Enviar archivo
        res.download(filePath, documento.nombre, (err) => {
            if (err) {
                console.error('Error al descargar archivo:', err);
                res.status(500).json({
                    error: 'Error al descargar archivo'
                });
            }
        });

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({
            error: 'Error al descargar documento'
        });
    }
};

// Eliminar un documento
const eliminarDocumento = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { documento_id } = req.params;

        // Obtener información del documento
        const docResult = await client.query(
            'SELECT * FROM documentos WHERE id = $1',
            [documento_id]
        );

        if (docResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Documento no encontrado'
            });
        }

        const documento = docResult.rows[0];

        // Verificar permisos (solo el creador o admin puede eliminar)
        const expResult = await client.query(
            'SELECT created_by FROM expedientes WHERE id = $1',
            [documento.expediente_id]
        );

        if (req.user.rol !== 'admin' && expResult.rows[0].created_by !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'No tienes permisos para eliminar este documento'
            });
        }

        // Eliminar archivo físico
        const filePath = path.join(__dirname, '..', 'uploads', 'documentos', documento.archivo_digital);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error al eliminar archivo físico:', error);
            // Continuar aunque no se pueda eliminar el archivo
        }

        // Eliminar de la base de datos
        await client.query('DELETE FROM documentos WHERE id = $1', [documento_id]);

        // Actualizar contador de hojas del expediente
        await client.query(
            'UPDATE expedientes SET total_hojas = total_hojas - $1 WHERE id = $2',
            [documento.numero_hojas || 1, documento.expediente_id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Documento eliminado exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar documento:', error);
        res.status(500).json({
            error: 'Error al eliminar documento'
        });
    } finally {
        client.release();
    }
};

// Subir múltiples documentos
const subirMultiplesDocumentos = async (req, res) => {
    try {
        const { expediente_id } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No se proporcionaron archivos'
            });
        }

        // Verificar que el expediente existe
        const expResult = await pool.query(
            'SELECT id FROM expedientes WHERE id = $1',
            [expediente_id]
        );

        if (expResult.rows.length === 0) {
            // Eliminar archivos subidos
            for (const file of req.files) {
                await fs.unlink(file.path);
            }
            return res.status(404).json({
                error: 'Expediente no encontrado'
            });
        }

        const documentosCreados = [];

        // Procesar cada archivo
        for (const file of req.files) {
            const query = `
                INSERT INTO documentos (
                    expediente_id, nombre, descripcion, tipo_documento,
                    fecha_documento, archivo_digital, numero_hojas, orden
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 
                    (SELECT COALESCE(MAX(orden), 0) + 1 FROM documentos WHERE expediente_id = $1)
                )
                RETURNING *
            `;

            const values = [
                expediente_id,
                file.originalname,
                `Carga múltiple - ${new Date().toLocaleDateString()}`,
                'Documento',
                new Date(),
                file.filename,
                1
            ];

            const result = await pool.query(query, values);
            documentosCreados.push(result.rows[0]);
        }

        // Actualizar contador de hojas del expediente
        await pool.query(
            'UPDATE expedientes SET total_hojas = total_hojas + $1 WHERE id = $2',
            [req.files.length, expediente_id]
        );

        res.status(201).json({
            message: `${req.files.length} documentos subidos exitosamente`,
            documentos: documentosCreados
        });

    } catch (error) {
        console.error('Error al subir múltiples documentos:', error);
        
        // Intentar eliminar archivos si hubo error
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Error al eliminar archivo:', unlinkError);
                }
            }
        }
        
        res.status(500).json({
            error: 'Error al subir documentos'
        });
    }
};

module.exports = {
    upload,
    subirDocumento,
    obtenerDocumentos,
    descargarDocumento,
    eliminarDocumento,
    subirMultiplesDocumentos
};