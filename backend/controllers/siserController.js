// === ARCHIVO: backend/controllers/siserController.js ===
const SiserAutomation = require('../services/siserAutomation');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configurar multer para archivos Excel
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'temp');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, `siser-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    }
});

// Cargar expedientes desde Excel a SISER
const cargarDesdeExcel = async (req, res) => {
    let filePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No se proporcionó archivo Excel'
            });
        }
        
        filePath = req.file.path;
        
        // Verificar credenciales SISER
        if (!process.env.SISER_EMAIL || !process.env.SISER_PASSWORD) {
            return res.status(500).json({
                error: 'Credenciales SISER no configuradas'
            });
        }
        
        console.log('🚀 Iniciando carga a SISER...');
        
        // Crear instancia de automatización
        const siser = new SiserAutomation();
        
        // Ejecutar carga masiva
        const resultados = await siser.ejecutarCargaMasiva(filePath, {
            headless: process.env.NODE_ENV === 'production'
        });
        
        // Eliminar archivo temporal
        await fs.unlink(filePath);
        
        res.json({
            message: 'Carga a SISER completada',
            resultados: {
                exitosos: resultados.exitosos,
                fallidos: resultados.fallidos,
                total: resultados.detalles.length,
                detalles: resultados.detalles
            }
        });
        
    } catch (error) {
        console.error('Error en carga a SISER:', error);
        
        // Intentar eliminar archivo temporal
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('Error al eliminar archivo temporal:', unlinkError);
            }
        }
        
        res.status(500).json({
            error: 'Error al procesar carga a SISER',
            details: error.message
        });
    }
};

// Cargar expedientes desde la base de datos a SISER
const cargarDesdeDB = async (req, res) => {
    try {
        const { area_id, fecha_inicio, limite = 50 } = req.query;
        
        // Verificar credenciales SISER
        if (!process.env.SISER_EMAIL || !process.env.SISER_PASSWORD) {
            return res.status(500).json({
                error: 'Credenciales SISER no configuradas'
            });
        }
        
        console.log('🚀 Iniciando carga a SISER desde base de datos...');
        
        // Crear instancia de automatización
        const siser = new SiserAutomation();
        
        // Ejecutar carga desde DB
        const resultados = await siser.cargarDesdeBaseDatos({
            area_id,
            fecha_inicio,
            limite: parseInt(limite)
        });
        
        res.json({
            message: 'Carga a SISER completada',
            resultados: {
                exitosos: resultados.exitosos,
                fallidos: resultados.fallidos,
                total: resultados.detalles.length,
                detalles: resultados.detalles
            }
        });
        
    } catch (error) {
        console.error('Error en carga a SISER:', error);
        res.status(500).json({
            error: 'Error al procesar carga a SISER',
            details: error.message
        });
    }
};

// Verificar estado de SISER
const verificarEstado = async (req, res) => {
    try {
        // Verificar credenciales
        const configurado = !!(process.env.SISER_EMAIL && process.env.SISER_PASSWORD);
        
        if (!configurado) {
            return res.json({
                disponible: false,
                mensaje: 'Credenciales SISER no configuradas',
                configuracion: {
                    email: !!process.env.SISER_EMAIL,
                    password: !!process.env.SISER_PASSWORD,
                    url: process.env.SISER_URL || 'https://siser.secogem.gob.mx/login'
                }
            });
        }
        
        // Intentar acceder a SISER para verificar disponibilidad
        const siser = new SiserAutomation();
        let disponible = false;
        let mensaje = '';
        
        try {
            await siser.init(true); // Headless
            await siser.page.goto(siser.loginUrl, { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            disponible = true;
            mensaje = 'SISER está disponible y accesible';
        } catch (error) {
            mensaje = 'SISER no está accesible: ' + error.message;
        } finally {
            await siser.cerrar();
        }
        
        res.json({
            disponible,
            mensaje,
            configuracion: {
                email: process.env.SISER_EMAIL,
                url: process.env.SISER_URL || 'https://siser.secogem.gob.mx/login'
            }
        });
        
    } catch (error) {
        console.error('Error al verificar SISER:', error);
        res.status(500).json({
            error: 'Error al verificar estado de SISER',
            details: error.message
        });
    }
};

// Generar plantilla Excel
const generarPlantillaExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Expedientes SISER');
        
        // Definir columnas
        worksheet.columns = [
            { header: 'Clave', key: 'clave', width: 20 },
            { header: 'Nombre', key: 'nombre', width: 50 },
            { header: 'Legajos', key: 'legajos', width: 10 },
            { header: 'Hojas', key: 'hojas', width: 10 },
            { header: 'Inicio', key: 'inicio', width: 15 },
            { header: 'Fin', key: 'fin', width: 15 }
        ];
        
        // Estilo de encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Agregar ejemplos
        worksheet.addRow({
            clave: 'CCAMEM/001/2025',
            nombre: 'Expediente de ejemplo',
            legajos: 1,
            hojas: 50,
            inicio: '01/01/2025',
            fin: '31/12/2025'
        });
        
        worksheet.addRow({
            clave: 'CCAMEM/002/2025',
            nombre: 'Otro expediente de ejemplo',
            legajos: 2,
            hojas: 100,
            inicio: '15/01/2025',
            fin: '15/06/2025'
        });
        
        // Agregar instrucciones
        const instrucciones = workbook.addWorksheet('Instrucciones');
        instrucciones.columns = [{ width: 80 }];
        
        instrucciones.addRow(['INSTRUCCIONES PARA CARGA A SISER']);
        instrucciones.addRow(['']);
        instrucciones.addRow(['1. Complete los datos en la hoja "Expedientes SISER"']);
        instrucciones.addRow(['2. Clave: Número único del expediente']);
        instrucciones.addRow(['3. Nombre: Descripción del expediente']);
        instrucciones.addRow(['4. Legajos: Número de legajos (mínimo 1)']);
        instrucciones.addRow(['5. Hojas: Número total de hojas']);
        instrucciones.addRow(['6. Inicio: Fecha del primer documento (DD/MM/AAAA)']);
        instrucciones.addRow(['7. Fin: Fecha del último documento (DD/MM/AAAA)']);
        instrucciones.addRow(['']);
        instrucciones.addRow(['IMPORTANTE:']);
        instrucciones.addRow(['- No modifique los nombres de las columnas']);
        instrucciones.addRow(['- Las fechas deben estar en formato DD/MM/AAAA']);
        instrucciones.addRow(['- Todos los campos son obligatorios']);
        
        instrucciones.getRow(1).font = { bold: true, size: 14 };
        instrucciones.getRow(10).font = { bold: true };
        
        // Generar archivo
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=plantilla_siser.xlsx'
        );
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error al generar plantilla:', error);
        res.status(500).json({
            error: 'Error al generar plantilla Excel'
        });
    }
};

module.exports = {
    upload,
    cargarDesdeExcel,
    cargarDesdeDB,
    verificarEstado,
    generarPlantillaExcel
};