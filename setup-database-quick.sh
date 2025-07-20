#!/bin/bash
# === ARCHIVO: setup-database-quick.sh ===
# Script para crear la base de datos CCAMEM rápidamente

echo "🚀 Configurando base de datos CCAMEM..."
echo "======================================"

# Configurar variables
DB_NAME="ccamem_archivo"
DB_USER="ccamem_user"
DB_PASSWORD="ccamem2024"

echo "1️⃣ Creando usuario y base de datos..."

# Crear usuario y base de datos
psql -d postgres << EOF
-- Crear usuario si no existe
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Crear base de datos si no existe
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Usuario y base de datos creados"
else
    echo "❌ Error creando usuario/base de datos"
    exit 1
fi

echo "2️⃣ Creando tablas..."

# Crear tablas básicas
psql -U $DB_USER -d $DB_NAME << EOF

-- Tabla de áreas
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'supervisor', 'usuario', 'consulta')),
    area VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de expedientes (básica)
CREATE TABLE IF NOT EXISTS expedientes (
    id SERIAL PRIMARY KEY,
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    area VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'activo',
    usuario_creador INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos básicos
INSERT INTO areas (codigo, nombre, descripcion) VALUES
('SIS', 'Sistemas', 'Área de Sistemas y Tecnología'),
('ADM', 'Administración', 'Área Administrativa'),
('JUR', 'Jurídico', 'Área Jurídica'),
('CON', 'Conciliación', 'Área de Conciliación'),
('ARB', 'Arbitraje', 'Área de Arbitraje')
ON CONFLICT (codigo) DO NOTHING;

-- Crear usuario administrador
-- Contraseña hasheada para 'admin123'
INSERT INTO usuarios (nombre, email, password, rol, area, activo) VALUES
('Administrador del Sistema', 'admin@ccamem.gob.mx', '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'SIS', true)
ON CONFLICT (email) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Tablas creadas exitosamente"
else
    echo "❌ Error creando tablas"
    exit 1
fi

echo "3️⃣ Verificando configuración..."

# Verificar que todo funciona
TABLES_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
USER_EXISTS=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM usuarios WHERE email = 'admin@ccamem.gob.mx';" 2>/dev/null | tr -d ' ')

echo "📊 Estadísticas:"
echo "   - Tablas creadas: $TABLES_COUNT"
echo "   - Usuario admin creado: $([ "$USER_EXISTS" = "1" ] && echo "✅ Sí" || echo "❌ No")"

# Probar conexión final
if psql -U $DB_USER -d $DB_NAME -c "SELECT 'Base de datos funcionando!' as resultado;" >/dev/null 2>&1; then
    echo "✅ Conexión exitosa"
else
    echo "❌ Error en la conexión"
    exit 1
fi

echo ""
echo "🎉 ¡Base de datos configurada exitosamente!"
echo "==========================================="
echo ""
echo "📋 Información de conexión:"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"
echo "   Contraseña: $DB_PASSWORD"
echo ""
echo "🔑 Usuario administrador:"
echo "   Email: admin@ccamem.gob.mx"
echo "   Contraseña: admin123"
echo ""
echo "🚀 Reinicia el backend: cd backend && npm run dev"