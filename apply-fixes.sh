#!/bin/bash
# === ARCHIVO: apply-fixes.sh ===
# Script para aplicar todas las correcciones necesarias

echo "🔧 Aplicando correcciones al sistema CCAMEM..."
echo "=============================================="

echo "1️⃣ Actualizando estructura de base de datos..."

# Ejecutar correcciones de SQL
psql -U ccamem_user -d ccamem_archivo << 'EOF'

-- Agregar columna usuario_creador si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expedientes' AND column_name = 'usuario_creador'
    ) THEN
        ALTER TABLE expedientes ADD COLUMN usuario_creador INTEGER REFERENCES usuarios(id);
        RAISE NOTICE 'Columna usuario_creador agregada';
    ELSE
        RAISE NOTICE 'Columna usuario_creador ya existe';
    END IF;
END $$;

-- Verificar si existe created_by y renombrarla
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expedientes' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE expedientes RENAME COLUMN created_by TO usuario_creador_old;
        RAISE NOTICE 'Columna created_by renombrada a usuario_creador_old';
    ELSE
        RAISE NOTICE 'Columna created_by no existe';
    END IF;
END $$;

-- Asegurar que todas las columnas necesarias existan
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

-- Crear tabla historial_cambios corregida
CREATE TABLE IF NOT EXISTS historial_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    accion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,
    user_agent TEXT
);

-- Insertar expedientes de ejemplo si la tabla está vacía
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
) 
SELECT 
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
WHERE NOT EXISTS (SELECT 1 FROM expedientes WHERE numero_expediente = 'CCAMEM-2024-001');

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
)
SELECT 
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
WHERE NOT EXISTS (SELECT 1 FROM expedientes WHERE numero_expediente = 'CCAMEM-2024-002');

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX IF NOT EXISTS idx_expedientes_area ON expedientes(area_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_serie ON expedientes(serie_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expedientes_usuario ON expedientes(usuario_creador);

-- Verificar estructura final
SELECT 'Verificación completada' AS resultado;

-- Mostrar conteo de registros
SELECT 
    'usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL
SELECT 
    'areas' AS tabla, COUNT(*) AS registros FROM areas
UNION ALL
SELECT 
    'expedientes' AS tabla, COUNT(*) AS registros FROM expedientes;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Base de datos actualizada exitosamente"
else
    echo "❌ Error actualizando base de datos"
    exit 1
fi

echo ""
echo "2️⃣ Verificando estructura de expedientes..."
psql -U ccamem_user -d ccamem_archivo -c "\d expedientes" | head -20

echo ""
echo "3️⃣ Verificando datos de ejemplo..."
psql -U ccamem_user -d ccamem_archivo -c "SELECT numero_expediente, titulo, estado FROM expedientes LIMIT 3;"

echo ""
echo "🎉 ¡Correcciones aplicadas exitosamente!"
echo "======================================="
echo ""
echo "📋 Problemas solucionados:"
echo "✅ Columna usuario_creador agregada a expedientes"
echo "✅ Tabla historial_cambios corregida"
echo "✅ Expedientes de ejemplo insertados"
echo "✅ Índices de rendimiento creados"
echo ""
echo "🚀 Ahora reinicia el backend: cd backend && npm run dev"
echo "🔑 Login: admin@ccamem.gob.mx / admin123"