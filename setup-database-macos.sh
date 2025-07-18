#!/bin/bash
# === ARCHIVO: setup-database-macos.sh ===
# Script para configurar base de datos CCAMEM en macOS con Homebrew

echo "🚀 Configurando base de datos CCAMEM en macOS..."
echo "================================================"

# Detectar el usuario actual del sistema
CURRENT_USER=$(whoami)
echo "👤 Usuario del sistema: $CURRENT_USER"

# Verificar que PostgreSQL esté funcionando
echo "1️⃣ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    echo "💡 Instala PostgreSQL con: brew install postgresql"
    exit 1
fi

# Verificar que el servicio esté corriendo
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL no está corriendo. Iniciando..."
    brew services start postgresql
    sleep 3
fi

echo "✅ PostgreSQL está funcionando"

# Intentar conectar con diferentes usuarios posibles
echo "2️⃣ Detectando usuario de PostgreSQL..."

POSTGRES_USER=""
for user in "$CURRENT_USER" "postgres" "_postgres"; do
    if psql -U "$user" -l >/dev/null 2>&1; then
        POSTGRES_USER="$user"
        echo "✅ Conectando como usuario: $POSTGRES_USER"
        break
    fi
done

if [ -z "$POSTGRES_USER" ]; then
    echo "❌ No se puede conectar a PostgreSQL"
    echo "💡 Opciones para solucionarlo:"
    echo "   1. Crear usuario postgres: createuser -s postgres"
    echo "   2. O usar tu usuario: createdb ccamem_archivo"
    echo ""
    echo "🔧 Intentando crear usuario postgres..."
    createuser -s postgres 2>/dev/null
    POSTGRES_USER="postgres"
fi

# Verificar si la base de datos ya existe
echo "3️⃣ Verificando si la base de datos existe..."
DB_EXISTS=$(psql -U "$POSTGRES_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -w ccamem_archivo | wc -l)

if [ $DB_EXISTS -eq 1 ]; then
    echo "⚠️  La base de datos 'ccamem_archivo' ya existe"
    read -p "¿Deseas recrearla? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🗑️  Eliminando base de datos existente..."
        psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS ccamem_archivo;" 2>/dev/null
        psql -U "$POSTGRES_USER" -c "DROP USER IF EXISTS ccamem_user;" 2>/dev/null
    else
        echo "❌ Operación cancelada"
        exit 1
    fi
fi

# Crear usuario y base de datos
echo "4️⃣ Creando usuario y base de datos..."

# Crear usuario ccamem_user
echo "   - Creando usuario ccamem_user..."
psql -U "$POSTGRES_USER" -c "CREATE USER ccamem_user WITH PASSWORD 'ccamem2024';" 2>/dev/null || {
    echo "⚠️  Usuario ccamem_user ya existe, continuando..."
}

# Crear base de datos
echo "   - Creando base de datos ccamem_archivo..."
psql -U "$POSTGRES_USER" -c "CREATE DATABASE ccamem_archivo OWNER ccamem_user;" || {
    echo "❌ Error creando la base de datos"
    echo "💡 Intentando alternativa..."
    
    # Alternativa: crear con el usuario actual y luego cambiar owner
    createdb ccamem_archivo
    psql -U "$POSTGRES_USER" -c "ALTER DATABASE ccamem_archivo OWNER TO ccamem_user;" 2>/dev/null
}

# Otorgar privilegios
echo "   - Otorgando privilegios..."
psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE ccamem_archivo TO ccamem_user;" 2>/dev/null

echo "✅ Usuario y base de datos configurados"

# Crear tablas ejecutando SQL directamente
echo "5️⃣ Creando tablas y estructura..."

psql -U "$POSTGRES_USER" -d ccamem_archivo << 'EOF'
-- Conectarse como ccamem_user para las siguientes operaciones
SET ROLE ccamem_user;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'jefe', 'usuario', 'consulta')),
    area VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Áreas
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    responsable VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Fondos Documentales
CREATE TABLE IF NOT EXISTS fondos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Secciones
CREATE TABLE IF NOT EXISTS secciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fondo_id INTEGER REFERENCES fondos(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Series
CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    seccion_id INTEGER REFERENCES secciones(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    archivo_tramite INTEGER DEFAULT 0,
    archivo_concentracion INTEGER DEFAULT 0,
    destino_final VARCHAR(50) DEFAULT 'Conservación permanente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Subseries
CREATE TABLE IF NOT EXISTS subseries (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    serie_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Expedientes
CREATE TABLE IF NOT EXISTS expedientes (
    id SERIAL PRIMARY KEY,
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    descripcion TEXT,
    area_id INTEGER REFERENCES areas(id),
    fondo_id INTEGER REFERENCES fondos(id),
    seccion_id INTEGER REFERENCES secciones(id),
    serie_id INTEGER REFERENCES series(id),
    subserie_id INTEGER REFERENCES subseries(id),
    fecha_apertura DATE NOT NULL,
    fecha_cierre DATE,
    numero_legajos INTEGER DEFAULT 1,
    total_hojas INTEGER DEFAULT 0,
    ubicacion_fisica VARCHAR(200),
    archivo_tramite INTEGER DEFAULT 0,
    archivo_concentracion INTEGER DEFAULT 0,
    destino_final VARCHAR(50) DEFAULT 'Conservación permanente',
    clasificacion_informacion VARCHAR(50) DEFAULT 'Pública' CHECK (clasificacion_informacion IN ('Pública', 'Reservada', 'Confidencial')),
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Cerrado', 'Transferido', 'Baja')),
    observaciones TEXT,
    usuario_creador INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(10) NOT NULL,
    tamaño_archivo BIGINT NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    descripcion TEXT,
    usuario_subida INTEGER REFERENCES usuarios(id),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    texto_extraido TEXT,
    paginas INTEGER DEFAULT 1
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO configuracion (clave, valor, descripcion, categoria) VALUES
('sistema_nombre', 'CCAMEM - Sistema de Gestión de Archivos', 'Nombre del sistema', 'general'),
('sistema_version', '1.0.0', 'Versión del sistema', 'general'),
('max_file_size', '10485760', 'Tamaño máximo de archivo en bytes (10MB)', 'archivos')
ON CONFLICT (clave) DO NOTHING;

-- Insertar fondo documental
INSERT INTO fondos (codigo, nombre, descripcion) VALUES
('CCAMEM', 'Comisión de Conciliación y Arbitraje Médico del Estado de México', 'Fondo documental principal de la CCAMEM')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar áreas básicas
INSERT INTO areas (codigo, nombre, descripcion) VALUES
('DIR', 'Dirección General', 'Dirección General de la CCAMEM'),
('ADM', 'Administración', 'Área de Administración y Recursos Humanos'),
('JUR', 'Jurídico', 'Área Jurídica y Legal'),
('CON', 'Conciliación', 'Área de Conciliación'),
('ARB', 'Arbitraje', 'Área de Arbitraje'),
('SIS', 'Sistemas', 'Área de Sistemas y Tecnología')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar secciones básicas
INSERT INTO secciones (codigo, nombre, descripcion, fondo_id, orden) VALUES
('01', 'Dirección y Planeación', 'Documentos de dirección estratégica', 1, 1),
('02', 'Administración y Finanzas', 'Documentos administrativos y financieros', 1, 2),
('03', 'Recursos Humanos', 'Gestión de personal y recursos humanos', 1, 3),
('04', 'Servicios Médicos', 'Expedientes de servicios médicos', 1, 4),
('05', 'Asuntos Jurídicos', 'Documentos legales y jurídicos', 1, 5)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar series básicas
INSERT INTO series (codigo, nombre, descripcion, seccion_id, orden, archivo_tramite, archivo_concentracion) VALUES
('01.01', 'Planes y Programas', 'Planes estratégicos y programas institucionales', 1, 1, 2, 3),
('02.01', 'Presupuesto', 'Documentos presupuestales', 2, 1, 1, 5),
('03.01', 'Expedientes de Personal', 'Expedientes laborales del personal', 3, 1, 5, 20),
('04.01', 'Expedientes de Conciliación', 'Casos de conciliación médica', 4, 1, 3, 7),
('05.01', 'Contratos y Convenios', 'Instrumentos jurídicos', 5, 1, 5, 10)
ON CONFLICT (codigo) DO NOTHING;

-- Insertar usuario administrador (contraseña: admin123)
INSERT INTO usuarios (nombre, email, password, rol, area, activo) VALUES
('Administrador del Sistema', 'admin@ccamem.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'SIS', true)
ON CONFLICT (email) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Estructura creada exitosamente"
else
    echo "❌ Error ejecutando las queries SQL"
    exit 1
fi

# Otorgar permisos finales
echo "6️⃣ Configurando permisos finales..."
psql -U "$POSTGRES_USER" -d ccamem_archivo -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ccamem_user;" 2>/dev/null
psql -U "$POSTGRES_USER" -d ccamem_archivo -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ccamem_user;" 2>/dev/null

# Verificar la configuración
echo "7️⃣ Verificando configuración..."
TABLES_COUNT=$(psql -U ccamem_user -d ccamem_archivo -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
USERS_COUNT=$(psql -U ccamem_user -d ccamem_archivo -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | tr -d ' ')

echo "📊 Estadísticas:"
echo "   - Tablas creadas: $TABLES_COUNT"
echo "   - Usuarios creados: $USERS_COUNT"

# Probar conexión final
echo "8️⃣ Probando conexión final..."
if psql -U ccamem_user -d ccamem_archivo -c "SELECT 'Conexión exitosa con ccamem_user' as resultado;" >/dev/null 2>&1; then
    echo "✅ Conexión exitosa con ccamem_user"
else
    echo "❌ Error en la conexión con ccamem_user"
    
    # Intentar solucionarlo
    echo "🔧 Intentando solucionar permisos..."
    psql -U "$POSTGRES_USER" -d ccamem_archivo -c "ALTER USER ccamem_user CREATEDB;" 2>/dev/null
    psql -U "$POSTGRES_USER" -d ccamem_archivo -c "GRANT ALL ON SCHEMA public TO ccamem_user;" 2>/dev/null
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo "============================"
echo ""
echo "📋 Información de conexión:"
echo "   Host: localhost"
echo "   Puerto: 5432"
echo "   Base de datos: ccamem_archivo"
echo "   Usuario: ccamem_user"
echo "   Contraseña: ccamem2024"
echo ""
echo "👤 Usuario administrador:"
echo "   Email: admin@ccamem.gob.mx"
echo "   Contraseña: admin123"
echo ""
echo "🚀 Ahora ejecuta: cd backend && npm run dev"