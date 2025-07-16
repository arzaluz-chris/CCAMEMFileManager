// === ARCHIVO: backend/controllers/catalogoController.js ===
const { pool } = require('../config/database');

// Obtener todas las áreas
const getAreas = async (req, res) => {
    try {
        const query = `
            SELECT id, codigo, nombre, descripcion, activo
            FROM areas
            WHERE activo = true
            ORDER BY nombre
        `;
        
        const result = await pool.query(query);
        
        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({
            error: 'Error al obtener áreas'
        });
    }
};

// Obtener todos los fondos
const getFondos = async (req, res) => {
    try {
        const query = `
            SELECT id, codigo, nombre, descripcion
            FROM fondos
            ORDER BY nombre
        `;
        
        const result = await pool.query(query);
        
        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener fondos:', error);
        res.status(500).json({
            error: 'Error al obtener fondos'
        });
    }
};

// Obtener todas las secciones (con opción de filtrar por fondo)
const getSecciones = async (req, res) => {
    try {
        const { fondo_id } = req.query;
        
        let query = `
            SELECT s.id, s.codigo, s.nombre, s.descripcion, s.fondo_id, s.orden,
                   f.nombre as fondo_nombre
            FROM secciones s
            LEFT JOIN fondos f ON s.fondo_id = f.id
            WHERE s.activo = true
        `;
        
        const params = [];
        if (fondo_id) {
            query += ' AND s.fondo_id = $1';
            params.push(fondo_id);
        }
        
        query += ' ORDER BY s.orden, s.codigo';
        
        const result = await pool.query(query, params);
        
        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener secciones:', error);
        res.status(500).json({
            error: 'Error al obtener secciones'
        });
    }
};

// Obtener todas las series (con opción de filtrar por sección)
const getSeries = async (req, res) => {
    try {
        const { seccion_id } = req.query;
        
        let query = `
            SELECT sr.id, sr.codigo, sr.nombre, sr.descripcion, sr.seccion_id, sr.orden,
                   s.nombre as seccion_nombre, s.codigo as seccion_codigo
            FROM series sr
            LEFT JOIN secciones s ON sr.seccion_id = s.id
            WHERE sr.activo = true
        `;
        
        const params = [];
        if (seccion_id) {
            query += ' AND sr.seccion_id = $1';
            params.push(seccion_id);
        }
        
        query += ' ORDER BY sr.orden, sr.codigo';
        
        const result = await pool.query(query, params);
        
        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener series:', error);
        res.status(500).json({
            error: 'Error al obtener series'
        });
    }
};

// Obtener todas las subseries (con opción de filtrar por serie)
const getSubseries = async (req, res) => {
    try {
        const { serie_id } = req.query;
        
        let query = `
            SELECT ss.id, ss.codigo, ss.nombre, ss.descripcion, ss.serie_id, ss.orden,
                   sr.nombre as serie_nombre, sr.codigo as serie_codigo
            FROM subseries ss
            LEFT JOIN series sr ON ss.serie_id = sr.id
            WHERE ss.activo = true
        `;
        
        const params = [];
        if (serie_id) {
            query += ' AND ss.serie_id = $1';
            params.push(serie_id);
        }
        
        query += ' ORDER BY ss.orden, ss.codigo';
        
        const result = await pool.query(query, params);
        
        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener subseries:', error);
        res.status(500).json({
            error: 'Error al obtener subseries'
        });
    }
};

// Obtener el catálogo completo en estructura jerárquica
const getCatalogoCompleto = async (req, res) => {
    try {
        // Obtener fondos
        const fondosQuery = 'SELECT * FROM fondos ORDER BY codigo';
        const fondosResult = await pool.query(fondosQuery);
        
        const catalogo = [];
        
        for (const fondo of fondosResult.rows) {
            const fondoData = {
                id: fondo.id,
                codigo: fondo.codigo,
                nombre: fondo.nombre,
                descripcion: fondo.descripcion,
                secciones: []
            };
            
            // Obtener secciones del fondo
            const seccionesQuery = `
                SELECT * FROM secciones 
                WHERE fondo_id = $1 AND activo = true 
                ORDER BY orden, codigo
            `;
            const seccionesResult = await pool.query(seccionesQuery, [fondo.id]);
            
            for (const seccion of seccionesResult.rows) {
                const seccionData = {
                    id: seccion.id,
                    codigo: seccion.codigo,
                    nombre: seccion.nombre,
                    descripcion: seccion.descripcion,
                    series: []
                };
                
                // Obtener series de la sección
                const seriesQuery = `
                    SELECT * FROM series 
                    WHERE seccion_id = $1 AND activo = true 
                    ORDER BY orden, codigo
                `;
                const seriesResult = await pool.query(seriesQuery, [seccion.id]);
                
                for (const serie of seriesResult.rows) {
                    const serieData = {
                        id: serie.id,
                        codigo: serie.codigo,
                        nombre: serie.nombre,
                        descripcion: serie.descripcion,
                        subseries: []
                    };
                    
                    // Obtener subseries de la serie
                    const subseriesQuery = `
                        SELECT * FROM subseries 
                        WHERE serie_id = $1 AND activo = true 
                        ORDER BY orden, codigo
                    `;
                    const subseriesResult = await pool.query(subseriesQuery, [serie.id]);
                    
                    serieData.subseries = subseriesResult.rows;
                    seccionData.series.push(serieData);
                }
                
                fondoData.secciones.push(seccionData);
            }
            
            catalogo.push(fondoData);
        }
        
        res.json({
            data: catalogo,
            total: catalogo.length
        });
        
    } catch (error) {
        console.error('Error al obtener catálogo completo:', error);
        res.status(500).json({
            error: 'Error al obtener catálogo completo'
        });
    }
};

// Buscar en el catálogo
const buscarEnCatalogo = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({
                error: 'La búsqueda debe tener al menos 2 caracteres'
            });
        }
        
        const searchTerm = `%${q}%`;
        
        // Buscar en secciones
        const seccionesQuery = `
            SELECT 'seccion' as tipo, id, codigo, nombre, descripcion
            FROM secciones
            WHERE activo = true AND (
                codigo ILIKE $1 OR 
                nombre ILIKE $1 OR 
                descripcion ILIKE $1
            )
        `;
        
        // Buscar en series
        const seriesQuery = `
            SELECT 'serie' as tipo, id, codigo, nombre, descripcion
            FROM series
            WHERE activo = true AND (
                codigo ILIKE $1 OR 
                nombre ILIKE $1 OR 
                descripcion ILIKE $1
            )
        `;
        
        // Buscar en subseries
        const subseriesQuery = `
            SELECT 'subserie' as tipo, id, codigo, nombre, descripcion
            FROM subseries
            WHERE activo = true AND (
                codigo ILIKE $1 OR 
                nombre ILIKE $1 OR 
                descripcion ILIKE $1
            )
        `;
        
        // Ejecutar todas las búsquedas
        const [seccionesResult, seriesResult, subseriesResult] = await Promise.all([
            pool.query(seccionesQuery, [searchTerm]),
            pool.query(seriesQuery, [searchTerm]),
            pool.query(subseriesQuery, [searchTerm])
        ]);
        
        const resultados = [
            ...seccionesResult.rows,
            ...seriesResult.rows,
            ...subseriesResult.rows
        ];
        
        res.json({
            data: resultados,
            total: resultados.length,
            query: q
        });
        
    } catch (error) {
        console.error('Error al buscar en catálogo:', error);
        res.status(500).json({
            error: 'Error al buscar en catálogo'
        });
    }
};

// Obtener valores documentales permitidos
const getValoresDocumentales = async (req, res) => {
    res.json({
        data: {
            valores: ['administrativo', 'juridico', 'fiscal', 'contable'],
            destino_final: ['conservacion', 'baja'],
            clasificacion_informacion: ['publica', 'reservada', 'confidencial'],
            estados_expediente: ['activo', 'cerrado', 'transferido', 'baja']
        }
    });
};

module.exports = {
    getAreas,
    getFondos,
    getSecciones,
    getSeries,
    getSubseries,
    getCatalogoCompleto,
    buscarEnCatalogo,
    getValoresDocumentales
};