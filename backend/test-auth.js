// === ARCHIVO: backend/test-auth.js ===
// Script para probar el sistema de autenticación

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        console.log('🧪 Probando sistema de autenticación...\n');

        // 1. Probar login
        console.log('1️⃣ Probando login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });

        console.log('✅ Login exitoso!');
        console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
        console.log('Usuario:', loginResponse.data.user);

        const token = loginResponse.data.token;

        // 2. Probar obtener perfil
        console.log('\n2️⃣ Probando obtener perfil...');
        const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Perfil obtenido:');
        console.log(profileResponse.data);

        // 3. Probar verificar token
        console.log('\n3️⃣ Probando verificación de token...');
        const verifyResponse = await axios.get(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Token válido:', verifyResponse.data);

        // 4. Probar sin token (debe fallar)
        console.log('\n4️⃣ Probando acceso sin token (debe fallar)...');
        try {
            await axios.get(`${API_URL}/auth/profile`);
        } catch (error) {
            console.log('✅ Correctamente rechazado:', error.response.data.error);
        }

        // 5. Probar con credenciales incorrectas
        console.log('\n5️⃣ Probando login con credenciales incorrectas...');
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@ccamem.gob.mx',
                password: 'contraseña_incorrecta'
            });
        } catch (error) {
            console.log('✅ Correctamente rechazado:', error.response.data.error);
        }

        console.log('\n✅ Todas las pruebas pasaron correctamente!');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
    }
}

// Instalar axios si no está instalado
const { exec } = require('child_process');
exec('npm list axios', (error) => {
    if (error) {
        console.log('📦 Instalando axios...');
        exec('npm install axios', (error) => {
            if (error) {
                console.error('Error instalando axios:', error);
                return;
            }
            testAuth();
        });
    } else {
        testAuth();
    }
});