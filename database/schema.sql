-- Esquema de Base de Datos para CCAMEM
-- Sistema de Gestión de Archivos

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'usuario', 'consulta')),
    area VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Áreas (Departamentos)
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Fondos Documentales
CREATE TABLE fondos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Secciones
CREATE TABLE secciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fondo_id INTEGER REFERENCES fondos(id),
    orden INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Series
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    seccion_id INTEGER REFERENCES secciones(id),
    orden INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Subseries
CREATE TABLE subseries (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    serie_id INTEGER REFERENCES series(id),
    orden INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Principal de Expedientes
CREATE TABLE expedientes (
    id SERIAL PRIMARY KEY,
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(300) NOT NULL,
    asunto TEXT,
    area_id INTEGER REFERENCES areas(id),
    
    -- Clasificación archivística
    fondo_id INTEGER REFERENCES fondos(id),
    seccion_id INTEGER REFERENCES secciones(id),
    serie_id INTEGER REFERENCES series(id),
    subserie_id INTEGER REFERENCES subseries(id),
    
    -- Información del expediente
    numero_legajos INTEGER DEFAULT 1,
    total_hojas INTEGER,
    fecha_apertura DATE NOT NULL,
    fecha_cierre DATE,
    
    -- Valores documentales
    valor_administrativo BOOLEAN DEFAULT true,
    valor_juridico BOOLEAN DEFAULT false,
    valor_fiscal BOOLEAN DEFAULT false,
    valor_contable BOOLEAN DEFAULT false,
    
    -- Tiempos de conservación
    archivo_tramite INTEGER DEFAULT 2, -- años
    archivo_concentracion INTEGER DEFAULT 5, -- años
    destino_final VARCHAR(20) CHECK (destino_final IN ('conservacion', 'baja')),
    
    -- Información de seguridad
    clasificacion_informacion VARCHAR(20) CHECK (clasificacion_informacion IN ('publica', 'reservada', 'confidencial')),
    
    -- Ubicación física
    ubicacion_fisica VARCHAR(100),
    
    -- Estado del expediente
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'transferido', 'baja')),
    
    -- Auditoría
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Observaciones
    observaciones TEXT
);

-- Tabla de Documentos dentro de expedientes
CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id) ON DELETE CASCADE,
    nombre VARCHAR(300) NOT NULL,
    descripcion TEXT,
    tipo_documento VARCHAR(100),
    fecha_documento DATE,
    numero_hojas INTEGER,
    archivo_digital VARCHAR(500), -- ruta del archivo si está digitalizado
    orden INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Transferencias
CREATE TABLE transferencias (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id),
    tipo_transferencia VARCHAR(20) CHECK (tipo_transferencia IN ('primaria', 'secundaria')),
    fecha_transferencia DATE NOT NULL,
    origen VARCHAR(100),
    destino VARCHAR(100),
    responsable_envia INTEGER REFERENCES usuarios(id),
    responsable_recibe INTEGER REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Préstamos
CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    expediente_id INTEGER REFERENCES expedientes(id),
    usuario_solicita INTEGER REFERENCES usuarios(id),
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_prevista DATE NOT NULL,
    fecha_devolucion_real DATE,
    motivo TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para el histórico de cambios
CREATE TABLE historial_cambios (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_cambio VARCHAR(20) CHECK (tipo_cambio IN ('creacion', 'modificacion', 'eliminacion'))
);

-- Tabla para almacenar los datos del Excel subido
CREATE TABLE expedientes_excel_temp (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100),
    nombre VARCHAR(300),
    legajos INTEGER,
    hojas INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    procesado BOOLEAN DEFAULT false,
    error_mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX idx_expedientes_area ON expedientes(area_id);
CREATE INDEX idx_expedientes_estado ON expedientes(estado);
CREATE INDEX idx_expedientes_fechas ON expedientes(fecha_apertura, fecha_cierre);
CREATE INDEX idx_documentos_expediente ON documentos(expediente_id);
CREATE INDEX idx_prestamos_expediente ON prestamos(expediente_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_expedientes_updated_at BEFORE UPDATE ON expedientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();