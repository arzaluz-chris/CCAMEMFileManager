// === ARCHIVO: backend/test-catalogo.js ===
// Script para probar las APIs del catálogo

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function testCatalogo() {
    try {
        console.log('🧪 Probando APIs del catálogo...\n');

        // 1. Login
        console.log('1️⃣ Haciendo login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });
        TOKEN = loginResponse.data.token;
        console.log('✅ Login exitoso\n');

        const authAxios = axios.create({
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        // 2. Obtener áreas
        console.log('2️⃣ Obteniendo áreas...');
        const areasResponse = await authAxios.get(`${API_URL}/catalogo/areas`);
        console.log(`✅ Áreas encontradas: ${areasResponse.data.total}`);
        console.log('Áreas:', areasResponse.data.data.map(a => `${a.codigo} - ${a.nombre}`));

        // 3. Obtener fondos
        console.log('\n3️⃣ Obteniendo fondos...');
        const fondosResponse = await authAxios.get(`${API_URL}/catalogo/fondos`);
        console.log(`✅ Fondos encontrados: ${fondosResponse.data.total}`);

        // 4. Obtener secciones
        console.log('\n4️⃣ Obteniendo secciones...');
        const seccionesResponse = await authAxios.get(`${API_URL}/catalogo/secciones`);
        console.log(`✅ Secciones encontradas: ${seccionesResponse.data.total}`);
        console.log('Primeras 3 secciones:', seccionesResponse.data.data.slice(0, 3).map(s => ({
            codigo: s.codigo,
            nombre: s.nombre.substring(0, 50) + '...'
        })));

        // 5. Obtener series de una sección específica
        if (seccionesResponse.data.data.length > 0) {
            const primeraSeccion = seccionesResponse.data.data[0];
            console.log(`\n5️⃣ Obteniendo series de la sección ${primeraSeccion.codigo}...`);
            const seriesResponse = await authAxios.get(`${API_URL}/catalogo/series?seccion_id=${primeraSeccion.id}`);
            console.log(`✅ Series encontradas: ${seriesResponse.data.total}`);
        }

        // 6. Buscar en el catálogo
        console.log('\n6️⃣ Buscando en el catálogo...');
        const busquedaResponse = await authAxios.get(`${API_URL}/catalogo/buscar?q=queja`);
        console.log(`✅ Resultados encontrados para "queja": ${busquedaResponse.data.total}`);
        busquedaResponse.data.data.forEach(item => {
            console.log(`  - [${item.tipo}] ${item.codigo}: ${item.nombre}`);
        });

        // 7. Obtener valores documentales
        console.log('\n7️⃣ Obteniendo valores documentales...');
        const valoresResponse = await authAxios.get(`${API_URL}/catalogo/valores-documentales`);
        console.log('✅ Valores documentales:', valoresResponse.data.data);

        // 8. Obtener catálogo completo
        console.log('\n8️⃣ Obteniendo catálogo completo (estructura jerárquica)...');
        const catalogoCompletoResponse = await authAxios.get(`${API_URL}/catalogo/completo`);
        console.log(`✅ Fondos en el catálogo: ${catalogoCompletoResponse.data.total}`);
        
        // Mostrar estructura
        catalogoCompletoResponse.data.data.forEach(fondo => {
            console.log(`\n📁 ${fondo.codigo} - ${fondo.nombre}`);
            fondo.secciones.slice(0, 2).forEach(seccion => {
                console.log(`  📂 ${seccion.codigo} - ${seccion.nombre.substring(0, 40)}...`);
                seccion.series.slice(0, 2).forEach(serie => {
                    console.log(`    📄 ${serie.codigo} - ${serie.nombre.substring(0, 35)}...`);
                });
            });
        });

        console.log('\n✅ Todas las pruebas del catálogo completadas!');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

// Ejecutar
testCatalogo();