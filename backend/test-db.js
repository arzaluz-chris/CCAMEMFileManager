// === ARCHIVO: backend/test-db.js ===
// Script para probar la conexión a PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

// Crear pool de conexiones
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ccamem_archivo',
    user: process.env.DB_USER || 'ccamem_user',
    password: process.env.DB_PASSWORD || 'ccamem2024'
});

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('🔄 Intentando conectar a PostgreSQL...');
        console.log('📍 Host:', process.env.DB_HOST || 'localhost');
        console.log('📍 Puerto:', process.env.DB_PORT || 5432);
        console.log('📍 Base de datos:', process.env.DB_NAME || 'ccamem_archivo');
        console.log('📍 Usuario:', process.env.DB_USER || 'ccamem_user');
        
        // Probar conexión básica
        const client = await pool.connect();
        console.log('✅ Conexión exitosa!');
        
        // Probar query simple
        const result = await client.query('SELECT NOW() as ahora');
        console.log('🕐 Hora del servidor:', result.rows[0].ahora);
        
        // Verificar que las tablas existen
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('\n📋 Tablas encontradas:');
        tablesResult.rows.forEach(row => {
            console.log('  - ' + row.table_name);
        });
        
        // Contar registros en algunas tablas
        const tables = ['usuarios', 'areas', 'expedientes'];
        console.log('\n📊 Conteo de registros:');
        
        for (const table of tables) {
            try {
                const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`  - ${table}: ${countResult.rows[0].count} registros`);
            } catch (e) {
                console.log(`  - ${table}: No existe o error`);
            }
        }
        
        client.release();
        console.log('\n✅ Todas las pruebas pasaron correctamente!');
        
    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message);
        console.error('Detalles:', error);
        
        console.log('\n💡 Posibles soluciones:');
        console.log('1. Verifica que PostgreSQL esté corriendo: brew services list');
        console.log('2. Verifica que la base de datos exista: psql -l');
        console.log('3. Verifica las credenciales en el archivo .env');
        console.log('4. Intenta conectar manualmente: psql -U ' + (process.env.DB_USER || 'ccamem_user') + ' -d ' + (process.env.DB_NAME || 'ccamem_archivo'));
    } finally {
        await pool.end();
    }
}

// Ejecutar la prueba
testConnection();