// === ARCHIVO: fix-admin-password.js ===
// Script para generar el hash correcto de la contraseña admin123 y actualizarla

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ccamem_db',
    user: process.env.DB_USER || 'ccamem_user',
    password: process.env.DB_PASSWORD || 'ccamem_password'
});

async function fixAdminPassword() {
    try {
        console.log('🔧 Generando hash correcto para la contraseña admin123...');
        
        // Generar hash para 'admin123'
        const password = 'admin123';
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('✅ Hash generado:', hashedPassword);
        
        // Verificar que el hash funciona
        const isValid = await bcrypt.compare(password, hashedPassword);
        console.log('✅ Verificación del hash:', isValid ? 'Correcto' : 'Incorrecto');
        
        if (!isValid) {
            throw new Error('El hash generado no es válido');
        }
        
        console.log('🔄 Conectando a la base de datos...');
        
        // Conectar a la base de datos
        const client = await pool.connect();
        
        // Actualizar la contraseña del usuario admin
        const updateQuery = `
            UPDATE usuarios 
            SET password = $1, updated_at = CURRENT_TIMESTAMP
            WHERE email = 'admin@ccamem.gob.mx'
            RETURNING email, rol, activo, updated_at;
        `;
        
        const result = await client.query(updateQuery, [hashedPassword]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Contraseña actualizada exitosamente para:', user.email);
            console.log('📋 Información del usuario:');
            console.log('   - Email:', user.email);
            console.log('   - Rol:', user.rol);
            console.log('   - Activo:', user.activo);
            console.log('   - Actualizado:', user.updated_at);
        } else {
            console.log('❌ No se encontró el usuario admin@ccamem.gob.mx');
        }
        
        // Verificar que la actualización funcionó
        console.log('\n🔍 Verificando la contraseña actualizada...');
        
        const verifyQuery = `
            SELECT email, password, rol 
            FROM usuarios 
            WHERE email = 'admin@ccamem.gob.mx';
        `;
        
        const verifyResult = await client.query(verifyQuery);
        
        if (verifyResult.rows.length > 0) {
            const user = verifyResult.rows[0];
            const passwordMatch = await bcrypt.compare('admin123', user.password);
            
            console.log('🔑 Verificación final:');
            console.log('   - Usuario encontrado:', user.email);
            console.log('   - Contraseña coincide:', passwordMatch ? '✅ Sí' : '❌ No');
            
            if (passwordMatch) {
                console.log('\n🎉 ¡Contraseña corregida exitosamente!');
                console.log('Ahora puedes hacer login con:');
                console.log('   Email: admin@ccamem.gob.mx');
                console.log('   Contraseña: admin123');
            } else {
                console.log('\n❌ La contraseña aún no coincide');
            }
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Detalles:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar la función
fixAdminPassword();
