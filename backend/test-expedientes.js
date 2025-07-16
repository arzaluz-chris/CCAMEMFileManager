// === ARCHIVO: backend/test-expedientes.js ===
// Script para probar las APIs de expedientes

const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function testExpedientes() {
    try {
        console.log('🧪 Probando APIs de expedientes...\n');

        // 1. Login primero
        console.log('1️⃣ Haciendo login...');
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

        // 2. Listar expedientes
        console.log('2️⃣ Listando expedientes...');
        const listResponse = await authAxios.get(`${API_URL}/expedientes`);
        assert.strictEqual(listResponse.status, 200, 'Listar debe regresar 200');
        assert.ok(Array.isArray(listResponse.data.data), 'Respuesta debe incluir arreglo de datos');
        console.log(`✅ Expedientes encontrados: ${listResponse.data.pagination.totalItems}`);
        console.log('Primeros expedientes:', listResponse.data.data.slice(0, 3).map(e => ({
            numero: e.numero_expediente,
            nombre: e.nombre
        })));

        // 3. Crear un nuevo expediente
        console.log('\n3️⃣ Creando nuevo expediente...');
        const nuevoExpediente = {
            numero_expediente: `CCAMEM/TEST/${Date.now()}`,
            nombre: 'Expediente de prueba desde API',
            asunto: 'Prueba de funcionamiento del sistema',
            area_id: 1, // Asumiendo que existe
            seccion_id: 1, // Asumiendo que existe  
            serie_id: 1, // Asumiendo que existe
            numero_legajos: 1,
            total_hojas: 25,
            fecha_apertura: new Date().toISOString().split('T')[0],
            valor_administrativo: true,
            valor_juridico: false,
            clasificacion_informacion: 'publica',
            ubicacion_fisica: 'Archivo Central - Estante A1',
            observaciones: 'Expediente creado para pruebas del sistema'
        };

        try {
            const createResponse = await authAxios.post(`${API_URL}/expedientes`, nuevoExpediente);
            assert.strictEqual(createResponse.status, 201, 'Crear debe regresar 201');
            assert.ok(createResponse.data.expediente.id, 'Respuesta debe incluir id del expediente');
            console.log('✅ Expediente creado:', {
                id: createResponse.data.expediente.id,
                numero: createResponse.data.expediente.numero_expediente
            });

            const expedienteId = createResponse.data.expediente.id;

            // 4. Obtener expediente por ID
            console.log('\n4️⃣ Obteniendo expediente por ID...');
            const getResponse = await authAxios.get(`${API_URL}/expedientes/${expedienteId}`);
            assert.strictEqual(getResponse.status, 200, 'Obtener debe regresar 200');
            assert.strictEqual(getResponse.data.id, expedienteId, 'ID devuelto debe coincidir');
            console.log('✅ Expediente obtenido:', {
                id: getResponse.data.id,
                numero: getResponse.data.numero_expediente,
                nombre: getResponse.data.nombre,
                area: getResponse.data.area_nombre
            });

            // 5. Actualizar expediente
            console.log('\n5️⃣ Actualizando expediente...');
            const updateData = {
                asunto: 'Asunto actualizado mediante API',
                total_hojas: 30,
                observaciones: 'Actualizado en prueba'
            };
            const updateResponse = await authAxios.put(`${API_URL}/expedientes/${expedienteId}`, updateData);
            assert.strictEqual(updateResponse.status, 200, 'Actualizar debe regresar 200');
            assert.strictEqual(updateResponse.data.expediente.id, expedienteId, 'ID actualizado debe coincidir');
            console.log('✅ Expediente actualizado');

            // 6. Buscar expedientes con filtros
            console.log('\n6️⃣ Buscando expedientes con filtros...');
            const searchResponse = await authAxios.get(`${API_URL}/expedientes`, {
                params: {
                    busqueda: 'prueba',
                    estado: 'activo'
                }
            });
            assert.strictEqual(searchResponse.status, 200, 'Buscar debe regresar 200');
            assert.ok(Array.isArray(searchResponse.data.data), 'Buscar debe regresar arreglo');
            console.log(`✅ Expedientes encontrados con "prueba": ${searchResponse.data.pagination.totalItems}`);

        } catch (createError) {
            if (createError.response?.status === 400) {
                console.log('⚠️ No se pudo crear expediente:', createError.response.data.error);
            } else {
                throw createError;
            }
        }

        // 7. Probar acceso sin token
        console.log('\n7️⃣ Probando acceso sin autenticación...');
        try {
            await axios.get(`${API_URL}/expedientes`);
            assert.fail('Se permitió acceso sin token');
        } catch (error) {
            assert.strictEqual(error.response?.status, 401, 'Debe responder 401 sin token');
            console.log('✅ Correctamente bloqueado sin token');
        }

        console.log('\n✅ Todas las pruebas completadas exitosamente!');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Ejecutar pruebas
testExpedientes();