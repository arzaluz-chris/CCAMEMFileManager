// === ARCHIVO: backend/check-users.js ===
// Script para verificar los usuarios en la base de datos

const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function checkUsers() {
    try {
        console.log('🔍 Verificando usuarios en la base de datos...\n');
        
        // 1. Contar usuarios
        const countResult = await pool.query('SELECT COUNT(*) FROM usuarios');
        console.log(`📊 Total de usuarios: ${countResult.rows[0].count}`);
        
        // 2. Listar todos los usuarios
        const usersResult = await pool.query(
            'SELECT id, nombre, email, rol, area, activo, created_at FROM usuarios ORDER BY id'
        );
        
        console.log('\n👥 Usuarios registrados:');
        console.log('━'.repeat(80));
        usersResult.rows.forEach(user => {
            console.log(`ID: ${user.id}`);
            console.log(`Nombre: ${user.nombre}`);
            console.log(`Email: ${user.email}`);
            console.log(`Rol: ${user.rol}`);
            console.log(`Área: ${user.area || 'N/A'}`);
            console.log(`Activo: ${user.activo ? 'Sí' : 'No'}`);
            console.log(`Creado: ${user.created_at}`);
            console.log('─'.repeat(40));
        });
        
        // 3. Verificar específicamente el admin
        console.log('\n🔐 Verificando usuario admin@ccamem.gob.mx...');
        const adminResult = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            ['admin@ccamem.gob.mx']
        );
        
        if (adminResult.rows.length > 0) {
            console.log('✅ Usuario admin encontrado');
            
            // Verificar la contraseña
            const testPassword = 'admin123';
            const hashedPassword = adminResult.rows[0].password;
            const isValid = await bcrypt.compare(testPassword, hashedPassword);
            
            console.log(`🔑 Verificación de contraseña 'admin123': ${isValid ? '✅ Correcta' : '❌ Incorrecta'}`);
            
            if (!isValid) {
                console.log('\n⚠️  La contraseña no coincide. Vamos a resetearla...');
                const newHashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(
                    'UPDATE usuarios SET password = $1 WHERE email = $2',
                    [newHashedPassword, 'admin@ccamem.gob.mx']
                );
                console.log('✅ Contraseña reseteada a: admin123');
            }
        } else {
            console.log('❌ Usuario admin NO encontrado');
            console.log('\n📝 Creando usuario admin...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                `INSERT INTO usuarios (nombre, email, password, rol, area, activo)
                 VALUES ('Administrador', 'admin@ccamem.gob.mx', $1, 'admin', 'Sistemas', true)`,
                [hashedPassword]
            );
            
            console.log('✅ Usuario admin creado con contraseña: admin123');
        }
        
        console.log('\n✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Ejecutar
checkUsers();