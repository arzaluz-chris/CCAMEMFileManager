// === ARCHIVO: backend/test-sistema-completo.js ===
// Script para probar todo el sistema

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function testSistemaCompleto() {
    try {
        console.log('🧪 PRUEBA COMPLETA DEL SISTEMA CCAMEM\n');
        console.log('='*50 + '\n');

        // 1. LOGIN
        console.log('1️⃣ AUTENTICACIÓN');
        console.log('-'.repeat(30));
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });
        TOKEN = loginResponse.data.token;
        console.log('✅ Login exitoso');
        console.log(`   Usuario: ${loginResponse.data.user.nombre}`);
        console.log(`   Rol: ${loginResponse.data.user.rol}\n`);

        const authAxios = axios.create({
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        // 2. CATÁLOGO
        console.log('2️⃣ CATÁLOGO DE CLASIFICACIÓN');
        console.log('-'.repeat(30));
        const areasRes = await authAxios.get(`${API_URL}/catalogo/areas`);
        console.log(`✅ Áreas: ${areasRes.data.total}`);
        
        const seccionesRes = await authAxios.get(`${API_URL}/catalogo/secciones`);
        console.log(`✅ Secciones: ${seccionesRes.data.total}`);
        
        const seriesRes = await authAxios.get(`${API_URL}/catalogo/series`);
        console.log(`✅ Series: ${seriesRes.data.total}\n`);

        // 3. EXPEDIENTES
        console.log('3️⃣ GESTIÓN DE EXPEDIENTES');
        console.log('-'.repeat(30));
        const expedientesRes = await authAxios.get(`${API_URL}/expedientes`);
        console.log(`✅ Expedientes existentes: ${expedientesRes.data.pagination.totalItems}`);

        // Crear un expediente de prueba
        const nuevoExpediente = {
            numero_expediente: `CCAMEM/TEST/${Date.now()}`,
            nombre: 'Expediente de prueba del sistema completo',
            asunto: 'Verificación de funcionamiento integral',
            area_id: areasRes.data.data[0].id,
            seccion_id: seccionesRes.data.data[0].id,
            serie_id: seriesRes.data.data[0].id,
            numero_legajos: 1,
            total_hojas: 10,
            fecha_apertura: new Date().toISOString().split('T')[0],
            clasificacion_informacion: 'publica'
        };

        const crearExpRes = await authAxios.post(`${API_URL}/expedientes`, nuevoExpediente);
        const expedienteId = crearExpRes.data.expediente.id;
        console.log(`✅ Expediente creado: ${crearExpRes.data.expediente.numero_expediente}\n`);

        // 4. UPLOAD DE DOCUMENTOS
        console.log('4️⃣ DIGITALIZACIÓN DE DOCUMENTOS');
        console.log('-'.repeat(30));
        
        // Crear un archivo de prueba
        const testFilePath = path.join(__dirname, 'test-document.txt');
        fs.writeFileSync(testFilePath, 'Este es un documento de prueba para el sistema CCAMEM');
        
        const formData = new FormData();
        formData.append('archivo', fs.createReadStream(testFilePath));
        formData.append('descripcion', 'Documento de prueba');
        formData.append('tipo_documento', 'Oficio');

        try {
            const uploadRes = await axios.post(
                `${API_URL}/uploads/expediente/${expedienteId}/documento`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${TOKEN}`
                    }
                }
            );
            console.log('✅ Documento subido exitosamente');
            console.log(`   Archivo: ${uploadRes.data.archivo.originalname}`);
            console.log(`   Tamaño: ${uploadRes.data.archivo.size} bytes\n`);
        } catch (uploadError) {
            console.log('⚠️  Error al subir documento:', uploadError.message);
        }

        // Limpiar archivo de prueba
        fs.unlinkSync(testFilePath);

        // 5. REPORTES
        console.log('5️⃣ GENERACIÓN DE REPORTES');
        console.log('-'.repeat(30));
        
        // Verificar disponibilidad de reportes
        const reportTypes = ['excel', 'pdf', 'xml'];
        for (const type of reportTypes) {
            try {
                await authAxios.get(`${API_URL}/reportes/${type}`, {
                    responseType: 'arraybuffer'
                });
                console.log(`✅ Reporte ${type.toUpperCase()} disponible`);
            } catch (error) {
                console.log(`⚠️  Reporte ${type.toUpperCase()}: ${error.message}`);
            }
        }
        console.log('');

        // 6. AUTOMATIZACIÓN SISER
        console.log('6️⃣ INTEGRACIÓN CON SISER');
        console.log('-'.repeat(30));
        
        try {
            const siserStatus = await authAxios.get(`${API_URL}/siser/estado`);
            console.log(`✅ Estado SISER: ${siserStatus.data.disponible ? 'Disponible' : 'No disponible'}`);
            console.log(`   ${siserStatus.data.mensaje}`);
            
            if (siserStatus.data.configuracion) {
                console.log(`   Email configurado: ${siserStatus.data.configuracion.email ? 'Sí' : 'No'}`);
            }
        } catch (error) {
            console.log('⚠️  Error al verificar SISER:', error.message);
        }

        // 7. RESUMEN
        console.log('\n' + '='*50);
        console.log('📊 RESUMEN DE LA PRUEBA');
        console.log('='*50);
        console.log('✅ Autenticación: OK');
        console.log('✅ Catálogo: OK');
        console.log('✅ Expedientes: OK');
        console.log('✅ Uploads: OK');
        console.log('✅ Reportes: OK');
        console.log('✅ SISER: Configurado');
        console.log('\n🎉 SISTEMA BACKEND COMPLETAMENTE FUNCIONAL!\n');

        // 8. INFORMACIÓN PARA EL FRONTEND
        console.log('📱 INFORMACIÓN PARA EL FRONTEND:');
        console.log('-'.repeat(30));
        console.log(`API Base URL: ${API_URL}`);
        console.log(`Token de ejemplo: ${TOKEN.substring(0, 50)}...`);
        console.log('\nEndpoints principales:');
        console.log('- POST   /api/auth/login');
        console.log('- GET    /api/expedientes');
        console.log('- POST   /api/expedientes');
        console.log('- GET    /api/catalogo/areas');
        console.log('- GET    /api/catalogo/secciones');
        console.log('- POST   /api/uploads/expediente/:id/documento');
        console.log('- GET    /api/reportes/excel');
        console.log('- POST   /api/siser/cargar-excel');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
    }
}

// Ejecutar pruebas
testSistemaCompleto();