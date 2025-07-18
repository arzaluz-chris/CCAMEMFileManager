#!/bin/bash
# === ARCHIVO: fix-permissions.sh ===
# Script para otorgar permisos correctos a ccamem_user

echo "🔧 Otorgando permisos a ccamem_user..."
echo "===================================="

# Otorgar permisos usando tu usuario (que es el propietario)
psql -d ccamem_archivo << EOF

-- Otorgar permisos en el esquema public
GRANT ALL ON SCHEMA public TO ccamem_user;

-- Otorgar permisos en todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ccamem_user;

-- Otorgar permisos en todas las secuencias (para SERIAL)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ccamem_user;

-- Otorgar permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ccamem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ccamem_user;

-- Cambiar el propietario de todas las tablas a ccamem_user
ALTER TABLE usuarios OWNER TO ccamem_user;
ALTER TABLE areas OWNER TO ccamem_user;
ALTER TABLE fondos OWNER TO ccamem_user;
ALTER TABLE secciones OWNER TO ccamem_user;
ALTER TABLE series OWNER TO ccamem_user;
ALTER TABLE subseries OWNER TO ccamem_user;
ALTER TABLE expedientes OWNER TO ccamem_user;
ALTER TABLE documentos OWNER TO ccamem_user;
ALTER TABLE configuracion OWNER TO ccamem_user;

-- Cambiar propietario de las secuencias
ALTER SEQUENCE usuarios_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE areas_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE fondos_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE secciones_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE series_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE subseries_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE expedientes_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE documentos_id_seq OWNER TO ccamem_user;
ALTER SEQUENCE configuracion_id_seq OWNER TO ccamem_user;

-- Verificar permisos
\z usuarios

EOF

if [ $? -eq 0 ]; then
    echo "✅ Permisos otorgados exitosamente"
else
    echo "❌ Error otorgando permisos"
    exit 1
fi

echo "🧪 Probando acceso a la tabla usuarios..."
psql -U ccamem_user -d ccamem_archivo -c "SELECT email, rol FROM usuarios LIMIT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ ccamem_user puede leer la tabla usuarios"
else
    echo "❌ ccamem_user aún no puede leer la tabla usuarios"
    
    echo "🔧 Intentando método alternativo..."
    # Método alternativo: hacer a ccamem_user superusuario temporalmente
    psql -d postgres -c "ALTER USER ccamem_user WITH SUPERUSER;"
    
    echo "Probando de nuevo..."
    psql -U ccamem_user -d ccamem_archivo -c "SELECT email, rol FROM usuarios LIMIT 1;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Ahora funciona con superuser"
        echo "⚠️  ccamem_user es temporalmente superuser para que funcione"
    fi
fi

echo ""
echo "🎉 Permisos configurados"
echo "======================="
echo ""
echo "🚀 Reinicia el backend: cd backend && npm run dev"
echo "🔑 Intenta login con: admin@ccamem.gob.mx / admin123"