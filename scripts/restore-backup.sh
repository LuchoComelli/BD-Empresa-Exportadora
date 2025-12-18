#!/bin/bash
# Script para restaurar backup de PostgreSQL desde Docker
# Uso: ./scripts/restore-backup.sh

echo "========================================="
echo "Restauración de Backup de PostgreSQL"
echo "========================================="
echo ""

# Verificar que el archivo de backup existe
BACKUP_FILE="basededatoempresa.sql"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: No se encontró el archivo $BACKUP_FILE"
    echo "Asegúrate de que el archivo esté en la raíz del proyecto."
    exit 1
fi

echo "✓ Archivo de backup encontrado: $BACKUP_FILE"

# Verificar que los contenedores estén corriendo
echo ""
echo "Verificando contenedores de Docker..."
DB_CONTAINER=$(docker-compose ps -q db)
if [ -z "$DB_CONTAINER" ]; then
    echo "ERROR: El contenedor de la base de datos no está corriendo."
    echo "Ejecuta: docker-compose up -d db"
    exit 1
fi

echo "✓ Contenedor de base de datos está corriendo"

# Obtener credenciales del archivo de configuración
ENV_FILE="backend/proyectoempresa/config/docker.env"
if [ -f "$ENV_FILE" ]; then
    DB_NAME=$(grep "DB_NAME=" "$ENV_FILE" | cut -d'=' -f2)
    DB_USER=$(grep "DB_USER=" "$ENV_FILE" | cut -d'=' -f2)
    DB_PASSWORD=$(grep "DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
else
    # Valores por defecto
    DB_NAME="bd_empresa_exportadora"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
fi

echo ""
echo "Configuración de la base de datos:"
echo "  Base de datos: $DB_NAME"
echo "  Usuario: $DB_USER"
echo ""

# Advertencia
echo "⚠️  ADVERTENCIA: Esta operación eliminará todos los datos existentes en la base de datos."
echo ""
read -p "¿Deseas continuar? (s/N): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo "Copiando archivo de backup al contenedor..."
docker cp "$BACKUP_FILE" "${DB_CONTAINER}:/tmp/backup.sql"

if [ $? -ne 0 ]; then
    echo "ERROR: No se pudo copiar el archivo al contenedor."
    exit 1
fi

echo "✓ Archivo copiado al contenedor"

echo ""
echo "Restaurando backup..."
echo "Esto puede tardar varios minutos dependiendo del tamaño del backup..."
echo ""

# Restaurar el backup usando pg_restore
RESTORE_CMD="PGPASSWORD=$DB_PASSWORD pg_restore -h localhost -U $DB_USER -d $DB_NAME -c --if-exists -v /tmp/backup.sql"
docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" sh -c "$RESTORE_CMD"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: La restauración falló."
    echo "Intentando método alternativo..."
    
    # Método alternativo: eliminar y recrear la base de datos primero
    echo "Eliminando conexiones activas..."
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
    
    echo "Eliminando base de datos existente..."
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    echo "Creando nueva base de datos..."
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    echo "Restaurando backup en la nueva base de datos..."
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" sh -c "$RESTORE_CMD"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: La restauración falló con ambos métodos."
        echo "Verifica los logs del contenedor para más detalles."
        exit 1
    fi
fi

echo ""
echo "✓ Backup restaurado exitosamente!"
echo ""
echo "Limpiando archivo temporal..."
docker exec "$DB_CONTAINER" rm /tmp/backup.sql

echo ""
echo "========================================="
echo "Restauración completada"
echo "========================================="
echo ""
echo "Puedes verificar la restauración conectándote a la base de datos."
echo ""

