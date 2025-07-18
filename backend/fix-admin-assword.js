// === ARCHIVO: fix-admin-password.js ===
// Script para actualizar la contraseña del usuario admin

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ccamem_archivo',
    user: 'ccamem_user',
    password: 'ccamem2024'
});

async function updateAdminPassword() {
    try {
        console.log('🔧 Actualizando contraseña del usuario admin...');
        
        // Generar hash correcto para 'admin123'
        const password = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('🔑 Contraseña original:', password);
        console.log('🔐 Hash generado:', hashedPassword);
        
        // Actualizar en la base de datos
        const updateQuery = `
            UPDATE usuarios 
            SET password = $1, updated_at = CURRENT_TIMESTAMP
            WHERE email = 'admin@ccamem.gob.mx'
        `;
        
        const result = await pool.query(updateQuery, [hashedPassword]);
        
        if (result.rowCount > 0) {
            console.log('✅ Contraseña actualizada exitosamente');
            
            // Verificar que se actualizó
            const checkQuery = `
                SELECT email, rol, activo, created_at, updated_at 
                FROM usuarios 
                WHERE email = 'admin@ccamem.gob.mx'
            `;
            
            const checkResult = await pool.query(checkQuery);
            const user = checkResult.rows[0];
            
            console.log('\n📋 Información del usuario admin:');
            console.log('   Email:', user.email);
            console.log('   Rol:', user.rol);
            console.log('   Activo:', user.activo);
            console.log('   Creado:', user.created_at);
            console.log('   Actualizado:', user.updated_at);
            
            // Probar el hash
            const testPassword = await bcrypt.compare('admin123', hashedPassword);
            console.log('\n🧪 Prueba de verificación:');
            console.log('   Contraseña admin123 válida:', testPassword ? '✅ SÍ' : '❌ NO');
            
        } else {
            console.log('❌ No se encontró el usuario admin@ccamem.gob.mx');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Si no existe el usuario, crearlo
        if (error.message.includes('no rows') || error.code === '42P01') {
            console.log('\n🔧 Creando usuario admin...');
            await createAdminUser();
        }
    } finally {
        await pool.end();
    }
}

async function createAdminUser() {
    try {
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const insertQuery = `
            INSERT INTO usuarios (nombre, email, password, rol, area, activo)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) 
            DO UPDATE SET 
                password = EXCLUDED.password,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        const values = [
            'Administrador del Sistema',
            'admin@ccamem.gob.mx',
            hashedPassword,
            'admin',
            'SIS',
            true
        ];
        
        await pool.query(insertQuery, values);
        console.log('✅ Usuario admin creado/actualizado exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando usuario admin:', error.message);
    }
}

// Verificar que bcrypt esté instalado
try {
    require('bcrypt');
    updateAdminPassword();
} catch (error) {
    console.log('📦 bcrypt no está instalado. Instalando...');
    const { exec } = require('child_process');
    exec('npm install bcrypt', (error) => {
        if (error) {
            console.error('❌ Error instalando bcrypt:', error);
            return;
        }
        console.log('✅ bcrypt instalado');
        updateAdminPassword();
    });
}