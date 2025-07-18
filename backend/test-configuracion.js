// === ARCHIVO: backend/test-configuracion.js ===
// Script para probar las APIs de configuración

const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function testConfiguracion() {
    try {
        console.log('🧪 Probando APIs de configuración...\n');

        // 1. Login como administrador
        console.log('1️⃣ Haciendo login como administrador...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });
        assert.strictEqual(loginResponse.status, 200, 'Login debe regresar 200');
        TOKEN = loginResponse.data.token;
        console.log('✅ Login exitoso\n');

        // Configurar axios con el token
        const authAxios = axios.create({
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        // 2. Obtener configuraciones del sistema
        console.log('2️⃣ Obteniendo configuraciones del sistema...');
        const configResponse = await authAxios.get(`${API_URL}/configuracion/sistema`);
        assert.strictEqual(configResponse.status, 200, 'Debe regresar 200');
        assert.ok(configResponse.data.data, 'Debe incluir data');
        
        const categorias = Object.keys(configResponse.data.data);
        console.log('✅ Categorías encontradas:', categorias);
        console.log('   Total de configuraciones:', 
            Object.values(configResponse.data.data).flat().length);
        console.log('');

        // 3. Actualizar una configuración
        console.log('3️⃣ Actualizando configuración de prueba...');
        const claveTest = 'sesion_timeout_minutos';
        const valorOriginal = 120;
        const valorNuevo = 180;
        
        try {
            await authAxios.put(`${API_URL}/configuracion/sistema/${claveTest}`, {
                valor: valorNuevo
            });
            console.log(`✅ Configuración '${claveTest}' actualizada a ${valorNuevo}`);
            
            // Restaurar valor original
            await authAxios.put(`${API_URL}/configuracion/sistema/${claveTest}`, {
                valor: valorOriginal
            });
            console.log(`✅ Configuración restaurada a ${valorOriginal}`);
        } catch (err) {
            console.log('❌ Error actualizando configuración:', err.response?.data?.error);
        }
        console.log('');

        // 4. Obtener notificaciones
        console.log('4️⃣ Obteniendo configuración de notificaciones...');
        const notifResponse = await authAxios.get(`${API_URL}/configuracion/notificaciones`);
        assert.strictEqual(notifResponse.status, 200, 'Debe regresar 200');
        console.log(`✅ Notificaciones encontradas: ${notifResponse.data.data.length}`);
        notifResponse.data.data.slice(0, 3).forEach(notif => {
            console.log(`   - ${notif.tipo_notificacion}: ${notif.activa ? 'Activa' : 'Inactiva'}`);
        });
        console.log('');

        // 5. Actualizar una notificación
        console.log('5️⃣ Actualizando notificación de prueba...');
        if (notifResponse.data.data.length > 0) {
            const notifTest = notifResponse.data.data[0];
            const estadoOriginal = notifTest.enviar_email;
            
            await authAxios.put(`${API_URL}/configuracion/notificaciones/${notifTest.id}`, {
                ...notifTest,
                enviar_email: !estadoOriginal
            });
            console.log(`✅ Notificación '${notifTest.tipo_notificacion}' actualizada`);
            
            // Restaurar
            await authAxios.put(`${API_URL}/configuracion/notificaciones/${notifTest.id}`, {
                ...notifTest,
                enviar_email: estadoOriginal
            });
            console.log('✅ Notificación restaurada');
        }
        console.log('');

        // 6. Obtener logs de auditoría
        console.log('6️⃣ Obteniendo logs de auditoría...');
        const auditResponse = await authAxios.get(`${API_URL}/configuracion/auditoria?limit=10`);
        assert.strictEqual(auditResponse.status, 200, 'Debe regresar 200');
        console.log(`✅ Logs encontrados: ${auditResponse.data.pagination.totalItems}`);
        console.log('   Últimas acciones:');
        auditResponse.data.data.slice(0, 3).forEach(log => {
            console.log(`   - ${log.accion} en ${log.modulo} por ${log.usuario_nombre}`);
        });
        console.log('');

        // 7. Obtener estadísticas de auditoría
        console.log('7️⃣ Obteniendo estadísticas de auditoría...');
        const statsResponse = await authAxios.get(`${API_URL}/configuracion/auditoria/estadisticas`);
        assert.strictEqual(statsResponse.status, 200, 'Debe regresar 200');
        const stats = statsResponse.data.data.estadisticas;
        console.log('✅ Estadísticas:');
        console.log(`   - Total logs: ${stats.total_logs}`);
        console.log(`   - Usuarios activos: ${stats.usuarios_activos}`);
        console.log(`   - Acciones exitosas: ${stats.acciones_exitosas}`);
        console.log(`   - Últimas 24h: ${stats.ultimas_24h}`);
        console.log('');

        // 8. Obtener respaldos configurados
        console.log('8️⃣ Obteniendo respaldos configurados...');
        const respaldosResponse = await authAxios.get(`${API_URL}/configuracion/respaldos`);
        assert.strictEqual(respaldosResponse.status, 200, 'Debe regresar 200');
        console.log(`✅ Respaldos encontrados: ${respaldosResponse.data.data.length}`);
        respaldosResponse.data.data.forEach(respaldo => {
            console.log(`   - ${respaldo.nombre}: ${respaldo.frecuencia} (${respaldo.activo ? 'Activo' : 'Inactivo'})`);
        });
        console.log('');

        // 9. Obtener información del sistema
        console.log('9️⃣ Obteniendo información del sistema...');
        const infoResponse = await authAxios.get(`${API_URL}/configuracion/info-sistema`);
        assert.strictEqual(infoResponse.status, 200, 'Debe regresar 200');
        const info = infoResponse.data.data;
        console.log('✅ Información del sistema:');
        console.log('   Base de datos:');
        console.log(`   - Usuarios: ${info.base_datos.total_usuarios}`);
        console.log(`   - Expedientes: ${info.base_datos.total_expedientes}`);
        console.log(`   - Tamaño BD: ${info.base_datos.tamaño_db_mb} MB`);
        console.log('   Servidor:');
        console.log(`   - Plataforma: ${info.servidor.plataforma}`);
        console.log(`   - Node.js: ${info.servidor.version_node}`);
        console.log(`   - CPUs: ${info.servidor.cpus}`);
        console.log('');

        // 10. Probar email (solo si está configurado)
        console.log('🔟 Probando configuración de email...');
        try {
            await authAxios.post(`${API_URL}/configuracion/email/probar`, {
                email_destino: 'prueba@ccamem.gob.mx'
            });
            console.log('✅ Email de prueba enviado exitosamente');
        } catch (err) {
            console.log('⚠️  Email no configurado o error:', err.response?.data?.error || err.message);
        }

        console.log('\n✅ Todas las pruebas de configuración completadas!');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Verificar e instalar axios si es necesario
function checkAndRunTests() {
    try {
        require('axios');
        testConfiguracion();
    } catch (error) {
        console.log('📦 Instalando axios...');
        const { exec } = require('child_process');
        exec('npm install axios', (error) => {
            if (error) {
                console.error('❌ Error instalando axios:', error);
                return;
            }
            console.log('✅ Axios instalado');
            testConfiguracion();
        });
    }
}

// Ejecutar
checkAndRunTests();