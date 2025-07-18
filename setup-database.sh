#!/bin/bash
# === ARCHIVO: setup-database.sh ===
# Script para configurar automáticamente la base de datos CCAMEM

echo "🚀 Configurando base de datos CCAMEM..."
echo "========================================"

# Verificar que PostgreSQL esté funcionando
echo "1️⃣ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado o no está en el PATH"
    echo "💡 Instala PostgreSQL primero:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# Verificar que el servicio esté corriendo
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL no está corriendo. Intentando iniciar..."
    
    # En macOS con Homebrew
    if command -v brew &> /dev/null; then
        brew services start postgresql
    # En sistemas con systemctl
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo "❌ No se puede iniciar PostgreSQL automáticamente"
        echo "💡 Inicia el servicio manualmente e intenta de nuevo"
        exit 1
    fi
    
    # Esperar un momento para que inicie
    sleep 2
fi

echo "✅ PostgreSQL está funcionando"

# Verificar si la base de datos ya existe
echo "2️⃣ Verificando si la base de datos existe..."
DB_EXISTS=$(psql -U postgres -lqt | cut -d \| -f 1 | grep -w ccamem_archivo | wc -l)

if [ $DB_EXISTS -eq 1 ]; then
    echo "⚠️  La base de datos 'ccamem_archivo' ya existe"
    read -p "¿Deseas recrearla? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🗑️  Eliminando base de datos existente..."
        psql -U postgres -c "DROP DATABASE IF EXISTS ccamem_archivo;"
        psql -U postgres -c "DROP USER IF EXISTS ccamem_user;"
    else
        echo "❌ Operación cancelada"
        exit 1
    fi
fi

# Crear usuario y base de datos
echo "3️⃣ Creando usuario y base de datos..."
psql -U postgres -c "CREATE USER ccamem_user WITH PASSWORD 'ccamem2024';" 2>/dev/null || {
    echo "⚠️  Usuario ccamem_user ya existe, continuando..."
}

psql -U postgres -c "CREATE DATABASE ccamem_archivo OWNER ccamem_user;" || {
    echo "❌ Error creando la base de datos"
    exit 1
}

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ccamem_archivo TO ccamem_user;"

echo "✅ Usuario y base de datos creados"

# Ejecutar el script SQL
echo "4️⃣ Ejecutando script de configuración..."
if [ -f "setup-database.sql" ]; then
    psql -U postgres -d ccamem_archivo -f setup-database.sql
    if [ $? -eq 0 ]; then
        echo "✅ Script ejecutado exitosamente"
    else
        echo "❌ Error ejecutando el script SQL"
        exit 1
    fi
else
    echo "❌ Archivo setup-database.sql no encontrado"
    echo "💡 Asegúrate de que el archivo esté en el directorio actual"
    exit 1
fi

# Verificar la configuración
echo "5️⃣ Verificando configuración..."
TABLES_COUNT=$(psql -U ccamem_user -d ccamem_archivo -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
USERS_COUNT=$(psql -U ccamem_user -d ccamem_archivo -t -c "SELECT COUNT(*) FROM usuarios;")

echo "📊 Estadísticas:"
echo "   - Tablas creadas: $TABLES_COUNT"
echo "   - Usuarios creados: $USERS_COUNT"

# Probar conexión con las credenciales del archivo .env
echo "6️⃣ Probando conexión final..."
if psql -U ccamem_user -d ccamem_archivo -c "SELECT 'Conexión exitosa' as resultado;" > /dev/null 2>&1; then
    echo "✅ Conexión exitosa con ccamem_user"
else
    echo "❌ Error en la conexión con ccamem_user"
    exit 1
fi

echo ""
echo "🎉 ¡Configuración completada exitosamente!"
echo "================================================"
echo ""
echo "📋 Información de conexión:"
echo "   Host: localhost"
echo "   Puerto: 5432"
echo "   Base de datos: ccamem_archivo"
echo "   Usuario: ccamem_user"
echo "   Contraseña: ccamem2024"
echo ""
echo "👤 Usuario administrador creado:"
echo "   Email: admin@ccamem.gob.mx"
echo "   Contraseña: admin123"
echo ""
echo "🚀 Ahora puedes iniciar el backend con: npm run dev"