// === ARCHIVO: backend/test-reportes.js ===
// Script para probar la generación de reportes

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function testReportes() {
    try {
        console.log('🧪 Probando generación de reportes...\n');

        // 1. Login
        console.log('1️⃣ Haciendo login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ccamem.gob.mx',
            password: 'admin123'
        });
        TOKEN = loginResponse.data.token;
        console.log('✅ Login exitoso\n');

        // Crear directorio para reportes si no existe
        const reportsDir = path.join(__dirname, 'reportes_generados');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }

        // 2. Generar reporte Excel
        console.log('2️⃣ Generando reporte Excel...');
        try {
            const excelResponse = await axios.get(`${API_URL}/reportes/excel`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                },
                responseType: 'arraybuffer'
            });

            const excelPath = path.join(reportsDir, `expedientes_${new Date().toISOString().split('T')[0]}.xlsx`);
            fs.writeFileSync(excelPath, excelResponse.data);
            console.log(`✅ Reporte Excel guardado en: ${excelPath}`);
        } catch (error) {
            console.log('❌ Error generando Excel:', error.message);
        }

        // 3. Generar reporte PDF
        console.log('\n3️⃣ Generando reporte PDF...');
        try {
            const pdfResponse = await axios.get(`${API_URL}/reportes/pdf`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                },
                responseType: 'arraybuffer'
            });

            const pdfPath = path.join(reportsDir, `expedientes_${new Date().toISOString().split('T')[0]}.pdf`);
            fs.writeFileSync(pdfPath, pdfResponse.data);
            console.log(`✅ Reporte PDF guardado en: ${pdfPath}`);
        } catch (error) {
            console.log('❌ Error generando PDF:', error.message);
        }

        // 4. Generar reporte XML
        console.log('\n4️⃣ Generando reporte XML...');
        try {
            const xmlResponse = await axios.get(`${API_URL}/reportes/xml`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });

            const xmlPath = path.join(reportsDir, `expedientes_${new Date().toISOString().split('T')[0]}.xml`);
            fs.writeFileSync(xmlPath, xmlResponse.data);
            console.log(`✅ Reporte XML guardado en: ${xmlPath}`);
        } catch (error) {
            console.log('❌ Error generando XML:', error.message);
        }

        // 5. Generar inventario general
        console.log('\n5️⃣ Generando inventario general de archivo...');
        try {
            const inventarioResponse = await axios.get(`${API_URL}/reportes/inventario-general`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                },
                params: {
                    year: 2025
                },
                responseType: 'arraybuffer'
            });

            const inventarioPath = path.join(reportsDir, `inventario_general_2025.xlsx`);
            fs.writeFileSync(inventarioPath, inventarioResponse.data);
            console.log(`✅ Inventario general guardado en: ${inventarioPath}`);
        } catch (error) {
            console.log('❌ Error generando inventario:', error.message);
        }

        console.log('\n✅ Pruebas de reportes completadas!');
        console.log(`📁 Reportes guardados en: ${reportsDir}`);

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

// Ejecutar
testReportes();