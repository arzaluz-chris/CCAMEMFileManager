// === ARCHIVO: backend/database/seed.js ===
// Script para poblar la base de datos con datos iniciales

const bcrypt = require('bcrypt');
const path = require('path');
const { pool } = require(path.join(__dirname, '..', 'config', 'database'));

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        console.log('🌱 Iniciando proceso de seed...');

        // 1. Crear usuario administrador
        console.log('\n📤 Insertando usuarios...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await client.query(`
            INSERT INTO usuarios (nombre, email, password, rol, area)
            VALUES 
                ('Administrador', 'admin@ccamem.gob.mx', $1, 'admin', 'Sistemas'),
                ('Christian Arzaluz', 'christian@ccamem.gob.mx', $1, 'admin', 'Sistemas')
            ON CONFLICT (email) DO NOTHING
        `, [hashedPassword]);

        // 2. Insertar áreas/departamentos
        console.log('\n📤 Insertando áreas...');
        await client.query(`
            INSERT INTO areas (codigo, nombre, descripcion)
            VALUES 
                ('DG', 'Dirección General', 'Dirección General de la CCAMEM'),
                ('UA', 'Unidad de Apoyo Administrativo', 'Área administrativa y de recursos'),
                ('UM', 'Unidad Médica', 'Área de dictámenes médicos'),
                ('UJ', 'Unidad Jurídica', 'Área legal y jurídica'),
                ('SISTEMAS', 'Sistemas', 'Área de tecnologías de la información')
            ON CONFLICT (codigo) DO NOTHING
        `);

        // 3. Insertar el fondo documental
        console.log('\n📤 Insertando fondo documental...');
        await client.query(`
            INSERT INTO fondos (codigo, nombre, descripcion)
            VALUES ('CCAMEM', 'Comisión de Conciliación y Arbitraje Médico del Estado de México', 
                    'Fondo documental de la CCAMEM')
            ON CONFLICT (codigo) DO NOTHING
        `);

        // 4. Insertar secciones basadas en tu Cuadro de Clasificación
        console.log('\n📤 Insertando secciones...');
        const fondoResult = await client.query('SELECT id FROM fondos WHERE codigo = $1', ['CCAMEM']);
        const fondoId = fondoResult.rows[0].id;

        await client.query(`
            INSERT INTO secciones (codigo, nombre, descripcion, fondo_id, orden)
            VALUES 
                ('1S', 'Recepción y seguimiento de quejas sobre prestación de servicios de salud', 
                 'Gestión de quejas médicas', $1, 1),
                ('2S', 'Atención de inconformidades y solución de conflictos', 
                 'Resolución de conflictos médicos', $1, 2),
                ('3S', 'Programa operativo anual e información estadística', 
                 'Planeación y estadísticas', $1, 3),
                ('4S', 'Dictámenes técnico-médico institucionales', 
                 'Dictámenes médicos especializados', $1, 4),
                ('1C', 'Administración del capital humano, recursos materiales y financieros', 
                 'Gestión administrativa', $1, 5),
                ('2C', 'Control y evaluación', 
                 'Auditoría y control interno', $1, 6),
                ('3C', 'Gestión documental y administración de archivos', 
                 'Gestión de archivos institucionales', $1, 7),
                ('4C', 'Planeación y coordinación de actividades de la persona titular', 
                 'Actividades de dirección', $1, 8),
                ('5C', 'Transparencia, acceso a la información y protección de datos personales', 
                 'Transparencia y datos personales', $1, 9)
            ON CONFLICT (codigo) DO NOTHING
        `, [fondoId]);

        // 5. Insertar algunas series para la sección 1S
        console.log('\n📤 Insertando series...');
        const seccion1SResult = await client.query('SELECT id FROM secciones WHERE codigo = $1', ['1S']);
        const seccion1SId = seccion1SResult.rows[0].id;

        await client.query(`
            INSERT INTO series (codigo, nombre, descripcion, seccion_id, orden)
            VALUES 
                ('1S.1', 'Asesoría y orientación a usuarios y prestadores de servicios sobre sus derechos y obligaciones', 
                 NULL, $1, 1),
                ('1S.2', 'Resolución de inconformidades entre usuarios y prestadores de servicios de salud', 
                 NULL, $1, 2),
                ('1S.3', 'Quejas derivadas de la prestación de los servicios de salud', 
                 NULL, $1, 3),
                ('1S.4', 'Pláticas, conferencias y otros mecanismos de comunicación', 
                 NULL, $1, 4)
            ON CONFLICT (codigo) DO NOTHING
        `, [seccion1SId]);

        // 6. Insertar subseries para la serie 1S.3
        console.log('\n📤 Insertando subseries...');
        const serie1S3Result = await client.query('SELECT id FROM series WHERE codigo = $1', ['1S.3']);
        const serie1S3Id = serie1S3Result.rows[0].id;

        await client.query(`
            INSERT INTO subseries (codigo, nombre, descripcion, serie_id, orden)
            VALUES 
                ('1S.3.1', 'Quejas', NULL, $1, 1),
                ('1S.3.2', 'Asesorías', NULL, $1, 2),
                ('1S.3.3', 'Orientaciones', NULL, $1, 3),
                ('1S.3.4', 'Gestiones inmediatas', NULL, $1, 4)
            ON CONFLICT (codigo) DO NOTHING
        `, [serie1S3Id]);

        // 7. Insertar series para otras secciones importantes
        console.log('\n📤 Insertando más series del catálogo...');
        
        // Series para sección 2S
        const seccion2SResult = await client.query('SELECT id FROM secciones WHERE codigo = $1', ['2S']);
        const seccion2SId = seccion2SResult.rows[0].id;

        await client.query(`
            INSERT INTO series (codigo, nombre, descripcion, seccion_id, orden)
            VALUES 
                ('2S.1', 'Solicitud de datos y documentos para la atención de los asuntos', NULL, $1, 1),
                ('2S.2', 'Promoción de juicios', NULL, $1, 2),
                ('2S.3', 'Asesoría y representación en asuntos jurídicos y administrativos', NULL, $1, 3),
                ('2S.4', 'Desempeño de las y los consultores jurídicos', NULL, $1, 4),
                ('2S.5', 'Certificación de documentos', NULL, $1, 5),
                ('2S.6', 'Igualdad de género', NULL, $1, 6),
                ('2S.7', 'Coordinación de Sesiones de Consejo', NULL, $1, 7),
                ('2S.8', 'Actualizaciones al ordenamiento institucional', NULL, $1, 8),
                ('2S.9', 'Comité de Mejora Regulatoria', NULL, $1, 9),
                ('2S.10', 'Informe de rendición de cuentas', NULL, $1, 10)
            ON CONFLICT (codigo) DO NOTHING
        `, [seccion2SId]);

        // Crear algunos expedientes de ejemplo
        console.log('\n📤 Insertando expedientes de ejemplo...');
        const areaResult = await client.query('SELECT id FROM areas WHERE codigo = $1', ['UJ']);
        const areaId = areaResult.rows[0].id;
        const usuarioResult = await client.query('SELECT id FROM usuarios WHERE email = $1', ['admin@ccamem.gob.mx']);
        const usuarioId = usuarioResult.rows[0].id;

        await client.query(`
            INSERT INTO expedientes (
                numero_expediente, nombre, asunto, area_id,
                fondo_id, seccion_id, serie_id, subserie_id,
                numero_legajos, total_hojas, fecha_apertura,
                valor_administrativo, valor_juridico,
                archivo_tramite, archivo_concentracion,
                destino_final, clasificacion_informacion,
                created_by
            ) VALUES 
                ('CCAMEM/001/2025', 'Expediente de prueba - Queja médica', 
                 'Queja por mala atención médica en hospital general', $2,
                 $3, $4, $5, $6,
                 1, 50, '2025-01-15',
                 true, true,
                 2, 5,
                 'conservacion', 'publica',
                 $1)
            ON CONFLICT (numero_expediente) DO NOTHING
        `, [usuarioId, areaId, fondoId, seccion1SId, serie1S3Id, serie1S3Result.rows[0].id]);

        await client.query('COMMIT');
        console.log('\n✅ Base de datos poblada exitosamente!');
        
        // Mostrar resumen
        const userCount = await client.query('SELECT COUNT(*) FROM usuarios');
        const areaCount = await client.query('SELECT COUNT(*) FROM areas');
        const seccionCount = await client.query('SELECT COUNT(*) FROM secciones');
        const serieCount = await client.query('SELECT COUNT(*) FROM series');
        
        console.log('\n📊 Resumen de datos insertados:');
        console.log(`  - Usuarios: ${userCount.rows[0].count}`);
        console.log(`  - Áreas: ${areaCount.rows[0].count}`);
        console.log(`  - Secciones: ${seccionCount.rows[0].count}`);
        console.log(`  - Series: ${serieCount.rows[0].count}`);
        
        console.log('\n🔑 Usuario administrador creado:');
        console.log('  Email: admin@ccamem.gob.mx');
        console.log('  Password: admin123');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante el seed:', error);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('\n✅ Proceso completado');
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ Error fatal:', err);
            process.exit(1);
        });
}

module.exports = seedDatabase;