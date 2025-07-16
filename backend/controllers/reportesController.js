// === ARCHIVO: backend/controllers/reportesController.js ===
const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

// Generar reporte de expedientes en Excel
const generarReporteExcel = async (req, res) => {
    try {
        const { 
            area_id, 
            estado, 
            fecha_inicio, 
            fecha_fin,
            incluir_documentos = false
        } = req.query;

        // Construir query
        let query = `
            SELECT 
                e.numero_expediente,
                e.nombre,
                e.asunto,
                a.nombre as area,
                s.codigo as seccion_codigo,
                s.nombre as seccion,
                sr.codigo as serie_codigo,
                sr.nombre as serie,
                e.numero_legajos,
                e.total_hojas,
                e.fecha_apertura,
                e.fecha_cierre,
                e.estado,
                e.ubicacion_fisica,
                e.clasificacion_informacion,
                e.destino_final,
                e.observaciones,
                u.nombre as creado_por,
                e.created_at
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series sr ON e.serie_id = sr.id
            LEFT JOIN usuarios u ON e.created_by = u.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        // Aplicar filtros
        if (area_id) {
            paramCount++;
            query += ` AND e.area_id = $${paramCount}`;
            params.push(area_id);
        }

        if (estado) {
            paramCount++;
            query += ` AND e.estado = $${paramCount}`;
            params.push(estado);
        }

        if (fecha_inicio) {
            paramCount++;
            query += ` AND e.fecha_apertura >= $${paramCount}`;
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            paramCount++;
            query += ` AND e.fecha_apertura <= $${paramCount}`;
            params.push(fecha_fin);
        }

        query += ' ORDER BY e.created_at DESC';

        // Ejecutar query
        const result = await pool.query(query, params);
        const expedientes = result.rows;

        // Crear workbook de Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'CCAMEM - Sistema de Gestión de Archivos';
        workbook.created = new Date();

        // Hoja principal de expedientes
        const worksheet = workbook.addWorksheet('Expedientes');

        // Definir columnas
        worksheet.columns = [
            { header: 'No. Expediente', key: 'numero_expediente', width: 20 },
            { header: 'Nombre', key: 'nombre', width: 40 },
            { header: 'Asunto', key: 'asunto', width: 50 },
            { header: 'Área', key: 'area', width: 30 },
            { header: 'Sección', key: 'seccion_codigo', width: 10 },
            { header: 'Nombre Sección', key: 'seccion', width: 40 },
            { header: 'Serie', key: 'serie_codigo', width: 10 },
            { header: 'Nombre Serie', key: 'serie', width: 40 },
            { header: 'Legajos', key: 'numero_legajos', width: 10 },
            { header: 'Hojas', key: 'total_hojas', width: 10 },
            { header: 'Fecha Apertura', key: 'fecha_apertura', width: 15 },
            { header: 'Fecha Cierre', key: 'fecha_cierre', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Ubicación Física', key: 'ubicacion_fisica', width: 25 },
            { header: 'Clasificación', key: 'clasificacion_informacion', width: 15 },
            { header: 'Destino Final', key: 'destino_final', width: 15 },
            { header: 'Observaciones', key: 'observaciones', width: 40 },
            { header: 'Creado Por', key: 'creado_por', width: 20 },
            { header: 'Fecha Creación', key: 'created_at', width: 20 }
        ];

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };

        // Agregar datos
        expedientes.forEach(exp => {
            worksheet.addRow(exp);
        });

        // Aplicar autofilter
        worksheet.autoFilter = {
            from: 'A1',
            to: `S${expedientes.length + 1}`
        };

        // Hoja de resumen
        const summarySheet = workbook.addWorksheet('Resumen');
        
        // Estadísticas
        const stats = {
            total: expedientes.length,
            por_estado: {},
            por_area: {},
            por_clasificacion: {}
        };

        expedientes.forEach(exp => {
            stats.por_estado[exp.estado] = (stats.por_estado[exp.estado] || 0) + 1;
            stats.por_area[exp.area] = (stats.por_area[exp.area] || 0) + 1;
            stats.por_clasificacion[exp.clasificacion_informacion] = 
                (stats.por_clasificacion[exp.clasificacion_informacion] || 0) + 1;
        });

        // Agregar resumen
        summarySheet.addRow(['RESUMEN DE EXPEDIENTES']);
        summarySheet.addRow([]);
        summarySheet.addRow(['Total de expedientes:', stats.total]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Por Estado:']);
        Object.entries(stats.por_estado).forEach(([estado, count]) => {
            summarySheet.addRow(['', estado, count]);
        });
        summarySheet.addRow([]);
        summarySheet.addRow(['Por Área:']);
        Object.entries(stats.por_area).forEach(([area, count]) => {
            summarySheet.addRow(['', area, count]);
        });

        // Formato del resumen
        summarySheet.getRow(1).font = { bold: true, size: 16 };
        summarySheet.getColumn(2).width = 30;
        summarySheet.getColumn(3).width = 15;

        // Generar el archivo
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=expedientes_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar reporte Excel:', error);
        res.status(500).json({
            error: 'Error al generar reporte Excel'
        });
    }
};

// Generar reporte de expedientes en PDF
const generarReportePDF = async (req, res) => {
    try {
        const { area_id, estado } = req.query;

        // Query simplificada para PDF
        let query = `
            SELECT 
                e.numero_expediente,
                e.nombre,
                e.asunto,
                a.nombre as area,
                e.fecha_apertura,
                e.estado,
                e.ubicacion_fisica
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        if (area_id) {
            paramCount++;
            query += ` AND e.area_id = $${paramCount}`;
            params.push(area_id);
        }

        if (estado) {
            paramCount++;
            query += ` AND e.estado = $${paramCount}`;
            params.push(estado);
        }

        query += ' ORDER BY e.created_at DESC LIMIT 100'; // Limitar para PDF

        const result = await pool.query(query, params);
        const expedientes = result.rows;

        // Crear documento PDF
        const doc = new PDFDocument({
            size: 'LETTER',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=expedientes_${new Date().toISOString().split('T')[0]}.pdf`
        );

        doc.pipe(res);

        // Título
        doc.fontSize(20)
           .text('COMISIÓN DE CONCILIACIÓN Y ARBITRAJE MÉDICO', { align: 'center' });
        doc.fontSize(16)
           .text('DEL ESTADO DE MÉXICO', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14)
           .text('Reporte de Expedientes', { align: 'center' });
        doc.fontSize(10)
           .text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
        doc.moveDown(2);

        // Tabla de expedientes
        let yPosition = doc.y;
        const pageHeight = doc.page.height - 100;

        expedientes.forEach((exp, index) => {
            // Verificar si necesitamos nueva página
            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 50;
            }

            // Dibujar expediente
            doc.fontSize(10)
               .text(`${index + 1}. ${exp.numero_expediente}`, 50, yPosition, { width: 500 });
            
            yPosition += 15;
            doc.fontSize(9)
               .text(`Nombre: ${exp.nombre}`, 70, yPosition);
            
            yPosition += 12;
            doc.text(`Área: ${exp.area} | Estado: ${exp.estado} | Fecha: ${new Date(exp.fecha_apertura).toLocaleDateString('es-MX')}`, 70, yPosition);
            
            yPosition += 12;
            doc.text(`Asunto: ${exp.asunto}`, 70, yPosition, { width: 450 });
            
            yPosition += 25;
            
            // Línea separadora
            doc.moveTo(50, yPosition - 5)
               .lineTo(550, yPosition - 5)
               .stroke('#cccccc');
        });

        // Finalizar documento
        doc.end();

    } catch (error) {
        console.error('Error al generar reporte PDF:', error);
        res.status(500).json({
            error: 'Error al generar reporte PDF'
        });
    }
};

// Generar reporte en XML
const generarReporteXML = async (req, res) => {
    try {
        const { area_id, estado } = req.query;

        // Query para XML
        let query = `
            SELECT 
                e.*,
                a.nombre as area_nombre,
                a.codigo as area_codigo,
                s.nombre as seccion_nombre,
                s.codigo as seccion_codigo,
                sr.nombre as serie_nombre,
                sr.codigo as serie_codigo
            FROM expedientes e
            LEFT JOIN areas a ON e.area_id = a.id
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series sr ON e.serie_id = sr.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        if (area_id) {
            paramCount++;
            query += ` AND e.area_id = $${paramCount}`;
            params.push(area_id);
        }

        if (estado) {
            paramCount++;
            query += ` AND e.estado = $${paramCount}`;
            params.push(estado);
        }

        query += ' ORDER BY e.numero_expediente';

        const result = await pool.query(query, params);
        const expedientes = result.rows;

        // Construir objeto para XML
        const xmlData = {
            expedientes: {
                $: {
                    xmlns: 'http://ccamem.gob.mx/archivo',
                    generado: new Date().toISOString(),
                    total: expedientes.length
                },
                expediente: expedientes.map(exp => ({
                    $: {
                        id: exp.id,
                        numero: exp.numero_expediente
                    },
                    nombre: exp.nombre,
                    asunto: exp.asunto,
                    area: {
                        $: { codigo: exp.area_codigo },
                        _: exp.area_nombre
                    },
                    clasificacion: {
                        seccion: {
                            $: { codigo: exp.seccion_codigo },
                            _: exp.seccion_nombre
                        },
                        serie: {
                            $: { codigo: exp.serie_codigo },
                            _: exp.serie_nombre
                        }
                    },
                    datos: {
                        legajos: exp.numero_legajos,
                        hojas: exp.total_hojas,
                        fechaApertura: exp.fecha_apertura,
                        fechaCierre: exp.fecha_cierre || '',
                        estado: exp.estado,
                        ubicacionFisica: exp.ubicacion_fisica || '',
                        clasificacionInformacion: exp.clasificacion_informacion,
                        destinoFinal: exp.destino_final
                    },
                    observaciones: exp.observaciones || ''
                }))
            }
        };

        // Convertir a XML
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
        const xml = builder.buildObject(xmlData);

        // Enviar respuesta
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=expedientes_${new Date().toISOString().split('T')[0]}.xml`
        );
        res.send(xml);

    } catch (error) {
        console.error('Error al generar reporte XML:', error);
        res.status(500).json({
            error: 'Error al generar reporte XML'
        });
    }
};

// Generar inventario general de archivo (formato oficial)
const generarInventarioGeneral = async (req, res) => {
    try {
        const { year } = req.query;

        // Este sería el formato oficial del inventario
        // Basado en la imagen que compartiste
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('INVENTARIO GENERAL DE ARCHIVO');

        // Configurar página
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape'
        };

        // Encabezados institucionales
        worksheet.mergeCells('A1:S1');
        worksheet.getCell('A1').value = 'COMISIÓN DE CONCILIACIÓN Y ARBITRAJE MÉDICO DEL ESTADO DE MÉXICO';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:S2');
        worksheet.getCell('A2').value = 'INVENTARIO GENERAL DE ARCHIVO';
        worksheet.getCell('A2').font = { bold: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A3:S3');
        worksheet.getCell('A3').value = `AÑO ${year || new Date().getFullYear()}`;
        worksheet.getCell('A3').alignment = { horizontal: 'center' };

        // Encabezados de columnas (fila 5)
        const headers = [
            'NO. PROGRESIVO',
            'NO. DEL EXPEDIENTE',
            'SECCIÓN Y/O SUBSECCIÓN',
            'SERIE Y/O SUBSERIE DOCUMENTAL',
            'FÓRMULA CLASIFICADORA',
            'NOMBRE DEL EXPEDIENTE',
            'TOTAL DE LEGAJOS',
            'TOTAL DE DOCS',
            'FECHA DE LOS DOCUMENTOS (APERTURA)',
            'FECHA DE LOS DOCUMENTOS (CIERRE)',
            'UBICACIÓN FÍSICA DEL ARCHIVO',
            'OBSERVACIONES'
        ];

        worksheet.getRow(5).values = headers;
        worksheet.getRow(5).font = { bold: true };
        worksheet.getRow(5).alignment = { horizontal: 'center', vertical: 'middle' };

        // Obtener datos
        const query = `
            SELECT 
                e.numero_expediente,
                s.codigo as seccion_codigo,
                s.nombre as seccion_nombre,
                sr.codigo as serie_codigo,
                sr.nombre as serie_nombre,
                CONCAT(s.codigo, '.', sr.codigo) as formula_clasificadora,
                e.nombre,
                e.numero_legajos,
                e.total_hojas,
                e.fecha_apertura,
                e.fecha_cierre,
                e.ubicacion_fisica,
                e.observaciones
            FROM expedientes e
            LEFT JOIN secciones s ON e.seccion_id = s.id
            LEFT JOIN series sr ON e.serie_id = sr.id
            WHERE e.estado != 'baja'
            ${year ? `AND EXTRACT(YEAR FROM e.fecha_apertura) = $1` : ''}
            ORDER BY s.codigo, sr.codigo, e.numero_expediente
        `;

        const params = year ? [year] : [];
        const result = await pool.query(query, params);

        // Agregar datos
        result.rows.forEach((row, index) => {
            worksheet.addRow([
                index + 1,
                row.numero_expediente,
                `${row.seccion_codigo} ${row.seccion_nombre}`,
                `${row.serie_codigo} ${row.serie_nombre}`,
                row.formula_clasificadora,
                row.nombre,
                row.numero_legajos,
                row.total_hojas,
                row.fecha_apertura ? new Date(row.fecha_apertura).toLocaleDateString('es-MX') : '',
                row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleDateString('es-MX') : '',
                row.ubicacion_fisica || '',
                row.observaciones || ''
            ]);
        });

        // Ajustar anchos de columna
        worksheet.columns = [
            { width: 12 }, // No. progresivo
            { width: 20 }, // No. expediente
            { width: 40 }, // Sección
            { width: 40 }, // Serie
            { width: 15 }, // Fórmula
            { width: 50 }, // Nombre
            { width: 10 }, // Legajos
            { width: 10 }, // Docs
            { width: 12 }, // Fecha apertura
            { width: 12 }, // Fecha cierre
            { width: 25 }, // Ubicación
            { width: 30 }  // Observaciones
        ];

        // Bordes
        const lastRow = worksheet.lastRow.number;
        for (let i = 5; i <= lastRow; i++) {
            for (let j = 1; j <= 12; j++) {
                worksheet.getCell(i, j).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }

        // Pie de página con firmas
        worksheet.addRow([]);
        worksheet.addRow([]);
        worksheet.mergeCells(`A${lastRow + 3}:F${lastRow + 3}`);
        worksheet.getCell(`A${lastRow + 3}`).value = 'RESPONSABLE DEL ARCHIVO';
        worksheet.getCell(`A${lastRow + 3}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`G${lastRow + 3}:L${lastRow + 3}`);
        worksheet.getCell(`G${lastRow + 3}`).value = 'TITULAR DE LA UNIDAD ADMINISTRATIVA';
        worksheet.getCell(`G${lastRow + 3}`).alignment = { horizontal: 'center' };

        // Enviar archivo
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=inventario_general_archivo_${year || new Date().getFullYear()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar inventario general:', error);
        res.status(500).json({
            error: 'Error al generar inventario general'
        });
    }
};

module.exports = {
    generarReporteExcel,
    generarReportePDF,
    generarReporteXML,
    generarInventarioGeneral
};