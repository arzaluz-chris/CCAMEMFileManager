-- === ARCHIVO: fix-database-schema.sql ===
-- Script para solucionar los problemas restantes de la base de datos

-- 1. Crear tabla historial_cambios (para auditoría)
CREATE TABLE IF NOT EXISTS historial_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    accion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,
    user_agent TEXT
);

-- 2. Verificar estructura de la tabla expedientes
-- Si no tiene la columna usuario_creador, agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expedientes' AND column_name = 'usuario_creador'
    ) THEN
        ALTER TABLE expedientes ADD COLUMN usuario_creador INTEGER REFERENCES usuarios(id);
    END IF;
END $$;

-- 3. Si existe la columna created_by incorrecta, cambiarle el nombre
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expedientes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE expedientes RENAME COLUMN created_by TO usuario_creador;
    END IF;
END $$;

-- 4. Verificar que todas las columnas necesarias existan en expedientes
ALTER TABLE expedientes 
    ADD COLUMN IF NOT EXISTS numero_expediente VARCHAR(50),
    ADD COLUMN IF NOT EXISTS titulo VARCHAR(300),
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id),
    ADD COLUMN IF NOT EXISTS fondo_id INTEGER REFERENCES fondos(id),
    ADD COLUMN IF NOT EXISTS seccion_id INTEGER REFERENCES secciones(id),
    ADD COLUMN IF NOT EXISTS serie_id INTEGER REFERENCES series(id),
    ADD COLUMN IF NOT EXISTS subserie_id INTEGER REFERENCES subseries(id),
    ADD COLUMN IF NOT EXISTS fecha_apertura DATE,
    ADD COLUMN IF NOT EXISTS fecha_cierre DATE,
    ADD COLUMN IF NOT EXISTS numero_legajos INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS total_hojas INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ubicacion_fisica VARCHAR(200),
    ADD COLUMN IF NOT EXISTS archivo_tramite INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS archivo_concentracion INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS destino_final VARCHAR(50) DEFAULT 'Conservación permanente',
    ADD COLUMN IF NOT EXISTS clasificacion_informacion VARCHAR(50) DEFAULT 'Pública',
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo',
    ADD COLUMN IF NOT EXISTS observaciones TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 5. Asegurar que numero_expediente sea único si ya existe data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expedientes') THEN
        -- Solo agregar constraint si la tabla no está vacía y no existe ya
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'expedientes' AND constraint_name = 'expedientes_numero_expediente_key'
        ) THEN
            -- Solo si no hay duplicados
            IF (SELECT COUNT(DISTINCT numero_expediente) FROM expedientes) = (SELECT COUNT(*) FROM expedientes) THEN
                ALTER TABLE expedientes ADD CONSTRAINT expedientes_numero_expediente_key UNIQUE (numero_expediente);
            END IF;
        END IF;
    END IF;
END $$;

-- 6. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX IF NOT EXISTS idx_expedientes_area ON expedientes(area_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_serie ON expedientes(serie_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expedientes_fechas ON expedientes(fecha_apertura, fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_expedientes_usuario ON expedientes(usuario_creador);

-- 7. Crear índices para historial_cambios
CREATE INDEX IF NOT EXISTS idx_historial_tabla ON historial_cambios(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_cambios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_cambios(fecha_cambio);

-- 8. Insertar algunos expedientes de ejemplo (opcional)
INSERT INTO expedientes (
    numero_expediente, 
    titulo, 
    descripcion, 
    area_id, 
    fondo_id, 
    seccion_id, 
    serie_id,
    fecha_apertura,
    estado,
    usuario_creador
) VALUES 
(
    'CCAMEM-2024-001', 
    'Expediente de ejemplo', 
    'Expediente creado para pruebas del sistema',
    1, -- DIR
    1, -- CCAMEM
    1, -- Dirección y Planeación
    1, -- Planes y Programas
    CURRENT_DATE,
    'Activo',
    1  -- Usuario admin
),
(
    'CCAMEM-2024-002', 
    'Segundo expediente de prueba', 
    'Otro expediente para verificar que el sistema funciona correctamente',
    2, -- ADM
    1, -- CCAMEM
    2, -- Administración y Finanzas
    2, -- Presupuesto
    CURRENT_DATE,
    'Activo',
    1  -- Usuario admin
)
ON CONFLICT (numero_expediente) DO NOTHING;

-- 9. Verificar que todo esté correcto
SELECT 'Verificación de estructura completada' AS mensaje;

-- Mostrar estructura de expedientes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expedientes' 
ORDER BY ordinal_position;

-- Contar registros
SELECT 
    'usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL
SELECT 
    'areas' AS tabla, COUNT(*) AS registros FROM areas
UNION ALL
SELECT 
    'expedientes' AS tabla, COUNT(*) AS registros FROM expedientes
UNION ALL
SELECT 
    'historial_cambios' AS tabla, COUNT(*) AS registros FROM historial_cambios;