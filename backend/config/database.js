// === ARCHIVO: backend/config/database.js ===
// Configuración de conexión a PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuración de la base de datos PostgreSQL
 */
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ccamem_archivo',
    user: process.env.DB_USER || 'ccamem_user',
    password: process.env.DB_PASSWORD || 'ccamem2024',
    max: 20, // Máximo número de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexiones inactivas
    connectionTimeoutMillis: 2000, // Tiempo máximo para conectar
};

/**
 * Pool de conexiones a PostgreSQL
 */
const pool = new Pool(dbConfig);

/**
 * Evento cuando se establece una nueva conexión
 */
pool.on('connect', (client) => {
    console.log('✅ Nueva conexión a PostgreSQL establecida');
});

/**
 * Evento cuando hay un error en el pool
 */
pool.on('error', (err) => {
    console.error('❌ Error en pool de PostgreSQL:', err);
});

/**
 * Función para probar la conexión a la base de datos
 */
const testConnection = async () => {
    try {
        console.log('🔍 Probando conexión a PostgreSQL...');
        
        const client = await pool.connect();
        
        // Probar una consulta simple
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].current_time);
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        console.error('🔧 Verifica que PostgreSQL esté corriendo y las credenciales sean correctas');
        return false;
    }
};

/**
 * Función para ejecutar consultas con manejo de errores
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Consulta ejecutada:', {
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: res.rowCount
            });
        }
        
        return res;
    } catch (error) {
        console.error('❌ Error en consulta SQL:', error.message);
        throw error;
    }
};

/**
 * Función para obtener un cliente del pool (para transacciones)
 */
const getClient = async () => {
    try {
        return await pool.connect();
    } catch (error) {
        console.error('❌ Error obteniendo cliente del pool:', error);
        throw error;
    }
};

/**
 * Función para cerrar todas las conexiones del pool
 */
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error cerrando pool:', error);
    }
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    closePool
};