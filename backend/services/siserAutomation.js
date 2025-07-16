// === ARCHIVO: backend/services/siserAutomation.js ===
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');

class SiserAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.loginUrl = process.env.SISER_URL || 'https://siser.secogem.gob.mx/login';
        this.tramiteUrl = 'https://siser.secogem.gob.mx/er1301archivotramite/create';
        this.email = process.env.SISER_EMAIL;
        this.password = process.env.SISER_PASSWORD;
    }

    // Inicializar navegador
    async init(headless = true) {
        try {
            console.log('🚀 Iniciando navegador...');
            this.browser = await puppeteer.launch({
                headless: headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: {
                    width: 1366,
                    height: 768
                }
            });

            this.page = await this.browser.newPage();
            
            // Configurar user agent para evitar detección
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            console.log('✅ Navegador iniciado');
            return true;
        } catch (error) {
            console.error('❌ Error al iniciar navegador:', error);
            throw error;
        }
    }

    // Hacer login en SISER
    async login() {
        try {
            console.log('🔐 Accediendo a SISER...');
            await this.page.goto(this.loginUrl, { waitUntil: 'networkidle2' });
            
            // Esperar a que cargue el formulario
            await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });
            
            console.log('📝 Ingresando credenciales...');
            // Ingresar email
            await this.page.type('input[name="email"]', this.email);
            
            // Ingresar contraseña
            await this.page.type('input[name="password"]', this.password);
            
            // Click en botón de login
            await this.page.click('input[name="entrar"], button[type="submit"]');
            
            // Esperar navegación
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            console.log('✅ Login exitoso');
            return true;
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    }

    // Navegar a sección de entrega-recepción
    async navegarAEntregaRecepcion() {
        try {
            console.log('📋 Navegando a Entrega-Recepción...');
            
            // Buscar y hacer click en el enlace
            await this.page.waitForSelector('a:contains("Presentar entrega-recepción")', { timeout: 10000 });
            await this.page.click('a:contains("Presentar entrega-recepción")');
            
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            console.log('✅ En sección de Entrega-Recepción');
            return true;
        } catch (error) {
            // Intentar con selector alternativo
            try {
                await this.page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const link = links.find(l => l.textContent.includes('Presentar entrega-recepción'));
                    if (link) link.click();
                });
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                return true;
            } catch (error2) {
                console.error('❌ Error al navegar:', error2);
                throw error2;
            }
        }
    }

    // Cargar un expediente
    async cargarExpediente(expediente) {
        try {
            console.log(`\n➡️ Cargando expediente ${expediente.clave}...`);
            
            // Navegar al formulario
            await this.page.goto(this.tramiteUrl, { waitUntil: 'networkidle2' });
            
            // Esperar a que cargue el formulario
            await this.page.waitForSelector('input[name="clave_expediente"]', { timeout: 10000 });
            
            // Llenar formulario
            await this.page.type('input[name="clave_expediente"]', expediente.clave.toString());
            await this.page.type('input[name="nombre_expediente"]', expediente.nombre.toString());
            await this.page.type('input[name="numero_legajos"]', expediente.legajos.toString());
            await this.page.type('input[name="numero_documentos"]', expediente.hojas.toString());
            
            // Fechas (formato DD/MM/YYYY)
            await this.page.type('input[name="fecha_documentos_primero"]', expediente.fecha_inicio);
            await this.page.type('input[name="fecha_documentos_ultimo"]', expediente.fecha_fin);
            
            // Buscar y hacer click en el botón guardar
            await this.page.click('button[type="submit"][name="enviar"]');
            
            // Esperar confirmación
            await this.page.waitForTimeout(3000);
            
            console.log(`✅ Expediente ${expediente.clave} guardado`);
            return { success: true, clave: expediente.clave };
            
        } catch (error) {
            console.error(`❌ Error al cargar expediente ${expediente.clave}:`, error.message);
            return { success: false, clave: expediente.clave, error: error.message };
        }
    }

    // Procesar archivo Excel
    async procesarExcel(filePath) {
        try {
            console.log('📊 Leyendo archivo Excel...');
            
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            
            const worksheet = workbook.worksheets[0];
            const expedientes = [];
            
            // Procesar filas (asumiendo que la primera fila son encabezados)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Saltar encabezados
                    const expediente = {
                        clave: row.getCell(1).value,
                        nombre: row.getCell(2).value,
                        legajos: row.getCell(3).value || 1,
                        hojas: row.getCell(4).value || 1,
                        fecha_inicio: this.formatearFecha(row.getCell(5).value),
                        fecha_fin: this.formatearFecha(row.getCell(6).value)
                    };
                    
                    // Validar datos
                    if (expediente.clave && expediente.nombre && 
                        expediente.fecha_inicio && expediente.fecha_fin) {
                        expedientes.push(expediente);
                    } else {
                        console.log(`⚠️ Fila ${rowNumber} omitida por datos incompletos`);
                    }
                }
            });
            
            console.log(`✅ ${expedientes.length} expedientes cargados del Excel`);
            return expedientes;
            
        } catch (error) {
            console.error('❌ Error al leer Excel:', error);
            throw error;
        }
    }

    // Formatear fecha a DD/MM/YYYY
    formatearFecha(fecha) {
        if (!fecha) return null;
        
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return null;
        
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const año = date.getFullYear();
        
        return `${dia}/${mes}/${año}`;
    }

    // Procesar todos los expedientes
    async procesarTodos(expedientes) {
        const resultados = {
            exitosos: 0,
            fallidos: 0,
            detalles: []
        };

        for (const expediente of expedientes) {
            const resultado = await this.cargarExpediente(expediente);
            
            if (resultado.success) {
                resultados.exitosos++;
            } else {
                resultados.fallidos++;
            }
            
            resultados.detalles.push(resultado);
            
            // Pausa entre cargas para no saturar el servidor
            await this.page.waitForTimeout(2000);
        }

        return resultados;
    }

    // Cerrar navegador
    async cerrar() {
        if (this.browser) {
            await this.browser.close();
            console.log('👋 Navegador cerrado');
        }
    }

    // Método principal para ejecutar todo el proceso
    async ejecutarCargaMasiva(filePath, options = {}) {
        try {
            // Inicializar
            await this.init(options.headless !== false);
            
            // Login
            await this.login();
            
            // Navegar a sección
            await this.navegarAEntregaRecepcion();
            
            // Leer expedientes del Excel
            const expedientes = await this.procesarExcel(filePath);
            
            if (expedientes.length === 0) {
                throw new Error('No se encontraron expedientes válidos en el archivo');
            }
            
            // Procesar expedientes
            console.log(`\n🔄 Iniciando carga de ${expedientes.length} expedientes...`);
            const resultados = await this.procesarTodos(expedientes);
            
            // Mostrar resumen
            console.log('\n📊 RESUMEN:');
            console.log(`✅ Exitosos: ${resultados.exitosos}`);
            console.log(`❌ Fallidos: ${resultados.fallidos}`);
            console.log(`📁 Total: ${expedientes.length}`);
            
            return resultados;
            
        } catch (error) {
            console.error('❌ Error en el proceso:', error);
            throw error;
        } finally {
            await this.cerrar();
        }
    }

    // Método para cargar desde la base de datos
    async cargarDesdeBaseDatos(filtros = {}) {
        try {
            // Query para obtener expedientes
            let query = `
                SELECT 
                    numero_expediente as clave,
                    nombre,
                    numero_legajos as legajos,
                    total_hojas as hojas,
                    fecha_apertura,
                    fecha_cierre
                FROM expedientes
                WHERE estado = 'activo'
            `;
            
            const params = [];
            let paramCount = 0;
            
            if (filtros.area_id) {
                paramCount++;
                query += ` AND area_id = $${paramCount}`;
                params.push(filtros.area_id);
            }
            
            if (filtros.fecha_inicio) {
                paramCount++;
                query += ` AND fecha_apertura >= $${paramCount}`;
                params.push(filtros.fecha_inicio);
            }
            
            query += ' ORDER BY created_at DESC LIMIT 100';
            
            const result = await pool.query(query, params);
            
            // Formatear expedientes
            const expedientes = result.rows.map(row => ({
                clave: row.clave,
                nombre: row.nombre,
                legajos: row.legajos || 1,
                hojas: row.hojas || 1,
                fecha_inicio: this.formatearFecha(row.fecha_apertura),
                fecha_fin: this.formatearFecha(row.fecha_cierre || row.fecha_apertura)
            }));
            
            console.log(`📊 ${expedientes.length} expedientes obtenidos de la base de datos`);
            
            // Procesar
            await this.init(false); // Mostrar navegador
            await this.login();
            await this.navegarAEntregaRecepcion();
            
            const resultados = await this.procesarTodos(expedientes);
            
            return resultados;
            
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        } finally {
            await this.cerrar();
        }
    }
}

module.exports = SiserAutomation;