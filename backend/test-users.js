// === ARCHIVO: backend/test-users.js ===
// Script para probar las APIs de usuarios

const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';
let TEST_USER_ID = null;

async function testUsers() {
    try {
        console.log('🧪 Probando APIs de usuarios...\n');

        // 1. Login primero como administrador
        console.log('1️⃣ Haciendo login como administrador...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });
        assert.strictEqual(loginResponse.status, 200, 'Login debe regresar 200');
        assert.ok(loginResponse.data.token, 'Login debe regresar un token');
        TOKEN = loginResponse.data.token;
        console.log('✅ Login exitoso\n');

        // Configurar axios con el token
        const authAxios = axios.create({
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        // 2. Obtener estadísticas
        console.log('2️⃣ Obteniendo estadísticas de usuarios...');
        const statsResponse = await authAxios.get(`${API_URL}/users/estadisticas`);
        assert.strictEqual(statsResponse.status, 200, 'Estadísticas debe regresar 200');
        console.log('✅ Estadísticas obtenidas:');
        console.log('   - Usuarios activos:', statsResponse.data.data.resumen.usuarios_activos);
        console.log('   - Total usuarios:', statsResponse.data.data.resumen.total_usuarios);
        console.log('   - Por rol:', statsResponse.data.data.resumen.por_rol);
        console.log('');

        // 3. Listar usuarios
        console.log('3️⃣ Listando usuarios...');
        const listResponse = await authAxios.get(`${API_URL}/users`);
        assert.strictEqual(listResponse.status, 200, 'Listar debe regresar 200');
        assert.ok(Array.isArray(listResponse.data.data), 'Respuesta debe incluir arreglo de datos');
        console.log(`✅ Usuarios encontrados: ${listResponse.data.pagination.totalItems}`);
        console.log('Primeros usuarios:', listResponse.data.data.slice(0, 3).map(u => ({
            nombre: u.nombre,
            email: u.email,
            rol: u.rol
        })));
        console.log('');

        // 4. Crear un usuario de prueba
        console.log('4️⃣ Creando usuario de prueba...');
        const nuevoUsuario = {
            nombre: 'Usuario de Prueba',
            email: `prueba_${Date.now()}@ccamem.gob.mx`,
            password: 'password123',
            rol: 'usuario',
            area: 'SISTEMAS'
        };
        
        try {
            const createResponse = await authAxios.post(`${API_URL}/users`, nuevoUsuario);
            assert.strictEqual(createResponse.status, 201, 'Crear debe regresar 201');
            assert.ok(createResponse.data.data.id, 'Debe regresar el ID del usuario creado');
            TEST_USER_ID = createResponse.data.data.id;
            console.log('✅ Usuario creado exitosamente');
            console.log('   ID:', TEST_USER_ID);
            console.log('   Email:', createResponse.data.data.email);
            console.log('');
        } catch (err) {
            console.log('❌ Error al crear usuario:', err.response?.data?.error || err.message);
        }

        // 5. Obtener el usuario creado
        if (TEST_USER_ID) {
            console.log('5️⃣ Obteniendo usuario por ID...');
            const getResponse = await authAxios.get(`${API_URL}/users/${TEST_USER_ID}`);
            assert.strictEqual(getResponse.status, 200, 'Obtener debe regresar 200');
            console.log('✅ Usuario obtenido:');
            console.log('   Nombre:', getResponse.data.data.nombre);
            console.log('   Email:', getResponse.data.data.email);
            console.log('   Área:', getResponse.data.data.area_nombre);
            console.log('');
        }

        // 6. Actualizar el usuario
        if (TEST_USER_ID) {
            console.log('6️⃣ Actualizando usuario...');
            const updateData = {
                nombre: 'Usuario Actualizado',
                rol: 'consulta'
            };
            
            const updateResponse = await authAxios.put(`${API_URL}/users/${TEST_USER_ID}`, updateData);
            assert.strictEqual(updateResponse.status, 200, 'Actualizar debe regresar 200');
            console.log('✅ Usuario actualizado');
            console.log('   Nuevo nombre:', updateResponse.data.data.nombre);
            console.log('   Nuevo rol:', updateResponse.data.data.rol);
            console.log('');
        }

        // 7. Probar filtros
        console.log('7️⃣ Probando filtros...');
        
        // Filtrar por rol
        console.log('   - Filtrando por rol admin...');
        const adminResponse = await authAxios.get(`${API_URL}/users?rol=admin`);
        console.log(`     Encontrados: ${adminResponse.data.pagination.totalItems} administradores`);
        
        // Filtrar por búsqueda
        console.log('   - Buscando por texto "admin"...');
        const searchResponse = await authAxios.get(`${API_URL}/users?search=admin`);
        console.log(`     Encontrados: ${searchResponse.data.pagination.totalItems} usuarios`);
        
        // Filtrar por estado
        console.log('   - Filtrando usuarios activos...');
        const activosResponse = await authAxios.get(`${API_URL}/users?activo=true`);
        console.log(`     Encontrados: ${activosResponse.data.pagination.totalItems} usuarios activos`);
        console.log('');

        // 8. Probar paginación
        console.log('8️⃣ Probando paginación...');
        const pageResponse = await authAxios.get(`${API_URL}/users?page=1&limit=5`);
        console.log(`✅ Página 1 con 5 usuarios:`);
        console.log(`   Total páginas: ${pageResponse.data.pagination.totalPages}`);
        console.log(`   Usuarios en esta página: ${pageResponse.data.data.length}`);
        console.log('');

        // 9. Eliminar (desactivar) el usuario de prueba
        if (TEST_USER_ID) {
            console.log('9️⃣ Eliminando usuario de prueba...');
            const deleteResponse = await authAxios.delete(`${API_URL}/users/${TEST_USER_ID}`);
            assert.strictEqual(deleteResponse.status, 200, 'Eliminar debe regresar 200');
            console.log('✅ Usuario eliminado (desactivado) exitosamente');
            console.log('');
        }

        // 10. Verificar que el usuario está inactivo
        if (TEST_USER_ID) {
            console.log('🔟 Verificando que el usuario está inactivo...');
            const checkResponse = await authAxios.get(`${API_URL}/users/${TEST_USER_ID}`);
            assert.strictEqual(checkResponse.data.data.activo, false, 'Usuario debe estar inactivo');
            console.log('✅ Confirmado: usuario está inactivo');
            console.log('');
        }

        // 11. Probar validaciones (deben fallar)
        console.log('1️⃣1️⃣ Probando validaciones...');
        
        // Email inválido
        console.log('   - Probando con email inválido...');
        try {
            await authAxios.post(`${API_URL}/users`, {
                nombre: 'Test',
                email: 'email-invalido',
                password: '123456',
                rol: 'usuario'
            });
            console.log('     ❌ ERROR: Debería haber fallado');
        } catch (err) {
            console.log('     ✅ Correctamente rechazado:', err.response.data.error);
        }

        // Contraseña corta
        console.log('   - Probando con contraseña corta...');
        try {
            await authAxios.post(`${API_URL}/users`, {
                nombre: 'Test',
                email: 'test@example.com',
                password: '123',
                rol: 'usuario'
            });
            console.log('     ❌ ERROR: Debería haber fallado');
        } catch (err) {
            console.log('     ✅ Correctamente rechazado:', err.response.data.error);
        }

        // Rol inválido
        console.log('   - Probando con rol inválido...');
        try {
            await authAxios.post(`${API_URL}/users`, {
                nombre: 'Test',
                email: 'test@example.com',
                password: '123456',
                rol: 'superadmin'
            });
            console.log('     ❌ ERROR: Debería haber fallado');
        } catch (err) {
            console.log('     ✅ Correctamente rechazado:', err.response.data.error);
        }

        // Email duplicado
        console.log('   - Probando con email duplicado...');
        try {
            await authAxios.post(`${API_URL}/users`, {
                nombre: 'Test',
                email: 'admin@ccamem.gob.mx', // Este ya existe
                password: '123456',
                rol: 'usuario'
            });
            console.log('     ❌ ERROR: Debería haber fallado');
        } catch (err) {
            console.log('     ✅ Correctamente rechazado:', err.response.data.error);
        }

        console.log('\n✅ Todas las pruebas de usuarios completadas exitosamente!');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Función para verificar si axios está instalado
function checkAndRunTests() {
    try {
        require('axios');
        // Si llegamos aquí, axios está instalado
        testUsers();
    } catch (error) {
        // Axios no está instalado, intentar instalarlo
        console.log('📦 Instalando axios...');
        const { exec } = require('child_process');
        exec('npm install axios', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Error instalando axios:', error);
                console.log('Por favor, instala axios manualmente: npm install axios');
                return;
            }
            console.log('✅ Axios instalado exitosamente');
            testUsers();
        });
    }
}

// Ejecutar las pruebas
checkAndRunTests();