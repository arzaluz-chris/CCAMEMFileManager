-- === ARCHIVO: setup-database.sql ===
-- Script completo para configurar la base de datos CCAMEM desde cero

-- PASO 1: Crear el usuario de PostgreSQL
-- Ejecuta esto como superusuario (postgres)

-- Crear el usuario ccamem_user
CREATE USER ccamem_user WITH PASSWORD 'ccamem2024';

-- Crear la base de datos
CREATE DATABASE ccamem_archivo OWNER ccamem_user;

-- Otorgar todos los privilegios al usuario
GRANT ALL PRIVILEGES ON DATABASE ccamem_archivo TO ccamem_user;

-- Conectarse a la base de datos ccamem_archivo
\c ccamem_archivo;

-- Otorgar privilegios sobre el esquema public
GRANT ALL ON SCHEMA public TO ccamem_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ccamem_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ccamem_user;

-- PASO 2: Crear las tablas del sistema

-- Tabla de Usuarios
CREATE TABLE usuarios (
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

-- Tabla de Áreas (Departamentos organizacionales)
CREATE TABLE areas (
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
CREATE TABLE fondos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Secciones (dentro de cada fondo)
CREATE TABLE secciones (
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

-- Tabla de Series (dentro de cada sección)
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    seccion_id INTEGER REFERENCES secciones(id) ON DELETE CASCADE,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    
    -- Valores documentales
    archivo_tramite INTEGER DEFAULT 0, -- años en archivo de trámite
    archivo_concentracion INTEGER DEFAULT 0, -- años en archivo de concentración
    destino_final VARCHAR(50) DEFAULT 'Conservación permanente', -- Baja o Conservación permanente
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Subseries (dentro de cada serie)
CREATE TABLE subseries (
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
CREATE TABLE expedientes (
    id SERIAL PRIMARY KEY,
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    descripcion TEXT,
    
    -- Referencias a catálogo
    area_id INTEGER REFERENCES areas(id),
    fondo_id INTEGER REFERENCES fondos(id),
    seccion_id INTEGER REFERENCES secciones(id),
    serie_id INTEGER REFERENCES series(id),
    subserie_id INTEGER REFERENCES subseries(id),
    
    -- Fechas
    fecha_apertura DATE NOT NULL,
    fecha_cierre DATE,
    
    -- Información física
    numero_legajos INTEGER DEFAULT 1,
    total_hojas INTEGER DEFAULT 0,
    ubicacion_fisica VARCHAR(200),
    
    -- Valores documentales
    archivo_tramite INTEGER DEFAULT 0,
    archivo_concentracion INTEGER DEFAULT 0,
    destino_final VARCHAR(50) DEFAULT 'Conservación permanente',
    
    -- Clasificación de información
    clasificacion_informacion VARCHAR(50) DEFAULT 'Pública' CHECK (clasificacion_informacion IN ('Pública', 'Reservada', 'Confidencial')),
    
    -- Estado y metadatos
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Cerrado', 'Transferido', 'Baja')),
    observaciones TEXT,
    
    -- Auditoría
    usuario_creador INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Documentos digitalizados
CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(10) NOT NULL,
    tamaño_archivo BIGINT NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    descripcion TEXT,
    
    -- Metadatos
    usuario_subida INTEGER REFERENCES usuarios(id),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda
    texto_extraido TEXT, -- Para búsqueda full-text
    paginas INTEGER DEFAULT 1
);

-- Tabla de Auditoría/Logs
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    accion VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,
    user_agent TEXT
);

-- Tabla de Configuración del sistema
CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    categoria VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PASO 3: Crear índices para rendimiento

-- Índices para expedientes
CREATE INDEX idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX idx_expedientes_area ON expedientes(area_id);
CREATE INDEX idx_expedientes_serie ON expedientes(serie_id);
CREATE INDEX idx_expedientes_estado ON expedientes(estado);
CREATE INDEX idx_expedientes_fechas ON expedientes(fecha_apertura, fecha_cierre);

-- Índices para documentos
CREATE INDEX idx_documentos_expediente ON documentos(expediente_id);
CREATE INDEX idx_documentos_usuario ON documentos(usuario_subida);

-- Índices para catálogo
CREATE INDEX idx_secciones_fondo ON secciones(fondo_id);
CREATE INDEX idx_series_seccion ON series(seccion_id);
CREATE INDEX idx_subseries_serie ON subseries(serie_id);

-- Índices para auditoría
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_accion);

-- PASO 4: Insertar datos iniciales

-- Insertar configuraciones básicas
INSERT INTO configuracion (clave, valor, descripcion, categoria) VALUES
('sistema_nombre', 'CCAMEM - Sistema de Gestión de Archivos', 'Nombre del sistema', 'general'),
('sistema_version', '1.0.0', 'Versión del sistema', 'general'),
('max_file_size', '10485760', 'Tamaño máximo de archivo en bytes (10MB)', 'archivos'),
('backup_enabled', 'true', 'Respaldos automáticos habilitados', 'respaldos'),
('email_enabled', 'false', 'Notificaciones por email habilitadas', 'email');

-- Insertar fondo documental básico
INSERT INTO fondos (codigo, nombre, descripcion) VALUES
('CCAMEM', 'Comisión de Conciliación y Arbitraje Médico del Estado de México', 'Fondo documental principal de la CCAMEM');

-- Insertar áreas básicas
INSERT INTO areas (codigo, nombre, descripcion) VALUES
('DIR', 'Dirección General', 'Dirección General de la CCAMEM'),
('ADM', 'Administración', 'Área de Administración y Recursos Humanos'),
('JUR', 'Jurídico', 'Área Jurídica y Legal'),
('CON', 'Conciliación', 'Área de Conciliación'),
('ARB', 'Arbitraje', 'Área de Arbitraje'),
('COM', 'Comunicación', 'Área de Comunicación Social'),
('SIS', 'Sistemas', 'Área de Sistemas y Tecnología');

-- Insertar secciones básicas
INSERT INTO secciones (codigo, nombre, descripcion, fondo_id, orden) VALUES
('01', 'Dirección y Planeación', 'Documentos de dirección estratégica', 1, 1),
('02', 'Administración y Finanzas', 'Documentos administrativos y financieros', 1, 2),
('03', 'Recursos Humanos', 'Gestión de personal y recursos humanos', 1, 3),
('04', 'Servicios Médicos', 'Expedientes de servicios médicos', 1, 4),
('05', 'Asuntos Jurídicos', 'Documentos legales y jurídicos', 1, 5);

-- Insertar series básicas
INSERT INTO series (codigo, nombre, descripcion, seccion_id, orden, archivo_tramite, archivo_concentracion) VALUES
('01.01', 'Planes y Programas', 'Planes estratégicos y programas institucionales', 1, 1, 2, 3),
('01.02', 'Informes Institucionales', 'Informes anuales y de gestión', 1, 2, 2, 8),
('02.01', 'Presupuesto', 'Documentos presupuestales', 2, 1, 1, 5),
('02.02', 'Contrataciones', 'Procesos de adquisiciones y contrataciones', 2, 2, 2, 3),
('03.01', 'Expedientes de Personal', 'Expedientes laborales del personal', 3, 1, 5, 20),
('04.01', 'Expedientes de Conciliación', 'Casos de conciliación médica', 4, 1, 3, 7),
('04.02', 'Expedientes de Arbitraje', 'Casos de arbitraje médico', 4, 2, 3, 7),
('05.01', 'Contratos y Convenios', 'Instrumentos jurídicos', 5, 1, 5, 10);

-- PASO 5: Crear usuario administrador
-- La contraseña 'admin123' será hasheada por el backend
INSERT INTO usuarios (nombre, email, password, rol, area, activo) VALUES
('Administrador del Sistema', 'admin@ccamem.gob.mx', '$2b$10$X8p1qXxGzKZgqFrK8yFwwux8KGR.9K7vKe2QdQd5ZJr7XhF2YJ9XS', 'admin', 'SIS', true);

-- NOTA: El hash de arriba corresponde a la contraseña 'admin123'
-- Se generó con: bcrypt.hashSync('admin123', 10)

-- PASO 6: Otorgar permisos finales al usuario
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ccamem_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ccamem_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ccamem_user;

-- Mensaje de confirmación
SELECT 'Base de datos CCAMEM configurada exitosamente!' AS resultado;