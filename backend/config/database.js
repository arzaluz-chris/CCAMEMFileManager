// === ARCHIVO: backend/config/database.js ===
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ccamem_archivo',
    user: process.env.DB_USER || 'ccamem_user',
    password: process.env.DB_PASSWORD || 'ccamem2024',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Verificar la conexión
pool.on('connect', () => {
    console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error en la base de datos:', err);
    process.exit(-1);
});

// Función helper para queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Consulta ejecutada', { text: text.substring(0, 50), duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error en query:', error);
        throw error;
    }
};

// Función para obtener un cliente (para transacciones)
const getClient = () => {
    return pool.connect();
};

module.exports = {
    query,
    getClient,
    pool
};