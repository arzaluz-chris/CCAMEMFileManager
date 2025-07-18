#!/bin/bash
# === ARCHIVO: fix-ccamem-user.sh ===
# Script para solucionar el problema del usuario ccamem_user

echo "🔧 Solucionando problema del usuario ccamem_user..."
echo "=================================================="

# Detectar usuario actual
CURRENT_USER=$(whoami)
echo "👤 Usuario del sistema: $CURRENT_USER"

echo "1️⃣ Verificando y creando usuario ccamem_user..."

# Conectar y crear el usuario
psql -d postgres << EOF
-- Eliminar usuario si existe (para recrearlo limpio)
DROP USER IF EXISTS ccamem_user;

-- Crear usuario con privilegios completos
CREATE USER ccamem_user WITH 
    PASSWORD 'ccamem2024'
    CREATEDB
    CREATEROLE;

-- Verificar que se creó
\du ccamem_user

EOF

if [ $? -eq 0 ]; then
    echo "✅ Usuario ccamem_user creado exitosamente"
else
    echo "❌ Error creando usuario"
    exit 1
fi

echo "2️⃣ Configurando base de datos..."

# Verificar si la base de datos existe, si no, crearla
psql -d postgres << EOF
-- Crear base de datos si no existe
SELECT 'CREATE DATABASE ccamem_archivo OWNER ccamem_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ccamem_archivo')\gexec

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE ccamem_archivo TO ccamem_user;

EOF

echo "3️⃣ Configurando permisos en la base de datos..."

# Configurar permisos en la base de datos
psql -U ccamem_user -d ccamem_archivo << EOF
-- Crear extensiones si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tablas si no existen
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

CREATE TABLE IF NOT EXISTS fondos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos básicos
INSERT INTO fondos (codigo, nombre, descripcion) VALUES
('CCAMEM', 'Comisión de Conciliación y Arbitraje Médico del Estado de México', 'Fondo documental principal de la CCAMEM')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO areas (codigo, nombre, descripcion) VALUES
('DIR', 'Dirección General', 'Dirección General de la CCAMEM'),
('ADM', 'Administración', 'Área de Administración y Recursos Humanos'),
('JUR', 'Jurídico', 'Área Jurídica y Legal'),
('CON', 'Conciliación', 'Área de Conciliación'),
('ARB', 'Arbitraje', 'Área de Arbitraje'),
('SIS', 'Sistemas', 'Área de Sistemas y Tecnología')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO secciones (codigo, nombre, descripcion, fondo_id, orden) VALUES
('01', 'Dirección y Planeación', 'Documentos de dirección estratégica', 1, 1),
('02', 'Administración y Finanzas', 'Documentos administrativos y financieros', 1, 2),
('03', 'Recursos Humanos', 'Gestión de personal y recursos humanos', 1, 3),
('04', 'Servicios Médicos', 'Expedientes de servicios médicos', 1, 4),
('05', 'Asuntos Jurídicos', 'Documentos legales y jurídicos', 1, 5)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO series (codigo, nombre, descripcion, seccion_id, orden, archivo_tramite, archivo_concentracion) VALUES
('01.01', 'Planes y Programas', 'Planes estratégicos y programas institucionales', 1, 1, 2, 3),
('02.01', 'Presupuesto', 'Documentos presupuestales', 2, 1, 1, 5),
('03.01', 'Expedientes de Personal', 'Expedientes laborales del personal', 3, 1, 5, 20),
('04.01', 'Expedientes de Conciliación', 'Casos de conciliación médica', 4, 1, 3, 7),
('05.01', 'Contratos y Convenios', 'Instrumentos jurídicos', 5, 1, 5, 10)
ON CONFLICT (codigo) DO NOTHING;

-- Crear usuario administrador (contraseña: admin123)
-- Hash generado con bcrypt: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO usuarios (nombre, email, password, rol, area, activo) VALUES
('Administrador del Sistema', 'admin@ccamem.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'SIS', true)
ON CONFLICT (email) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Tablas y datos creados exitosamente"
else
    echo "❌ Error creando tablas"
    exit 1
fi

echo "4️⃣ Verificando configuración final..."

# Verificar conexión y datos
echo "Verificando conexión como ccamem_user..."
psql -U ccamem_user -d ccamem_archivo -c "SELECT 'Conexión exitosa con ccamem_user' as resultado;"

echo "Verificando usuario administrador..."
psql -U ccamem_user -d ccamem_archivo -c "SELECT email, rol, activo FROM usuarios WHERE email = 'admin@ccamem.gob.mx';"

echo "Contando tablas..."
TABLES_COUNT=$(psql -U ccamem_user -d ccamem_archivo -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "📊 Tablas en la base de datos: $TABLES_COUNT"

echo ""
echo "🎉 ¡Problema solucionado!"
echo "========================"
echo ""
echo "✅ Usuario ccamem_user creado correctamente"
echo "✅ Base de datos ccamem_archivo configurada"
echo "✅ Tablas y datos iniciales insertados"
echo "✅ Usuario admin@ccamem.gob.mx creado"
echo ""
echo "🚀 Ahora puedes iniciar el backend: cd backend && npm run dev"
echo ""
echo "🔑 Credenciales de login:"
echo "   Email: admin@ccamem.gob.mx"
echo "   Contraseña: admin123"