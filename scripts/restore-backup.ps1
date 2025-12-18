# Script para restaurar backup de PostgreSQL desde Docker
# Uso: .\scripts\restore-backup.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Restauración de Backup de PostgreSQL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el archivo de backup existe
$backupFile = "basededatoempresa.sql"
if (-not (Test-Path $backupFile)) {
    Write-Host "ERROR: No se encontró el archivo $backupFile" -ForegroundColor Red
    Write-Host "Asegúrate de que el archivo esté en la raíz del proyecto." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Archivo de backup encontrado: $backupFile" -ForegroundColor Green

# Verificar que los contenedores estén corriendo
Write-Host ""
Write-Host "Verificando contenedores de Docker..." -ForegroundColor Yellow
$dbContainer = docker-compose ps -q db
if (-not $dbContainer) {
    Write-Host "ERROR: El contenedor de la base de datos no está corriendo." -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose up -d db" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Contenedor de base de datos está corriendo" -ForegroundColor Green

# Obtener credenciales del archivo de configuración
$envFile = "backend\proyectoempresa\config\docker.env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $dbName = ($content | Select-String "DB_NAME=").ToString().Split("=")[1]
    $dbUser = ($content | Select-String "DB_USER=").ToString().Split("=")[1]
    $dbPassword = ($content | Select-String "DB_PASSWORD=").ToString().Split("=")[1]
} else {
    # Valores por defecto
    $dbName = "bd_empresa_exportadora"
    $dbUser = "postgres"
    $dbPassword = "postgres"
}

Write-Host ""
Write-Host "Configuración de la base de datos:" -ForegroundColor Yellow
Write-Host "  Base de datos: $dbName" -ForegroundColor White
Write-Host "  Usuario: $dbUser" -ForegroundColor White
Write-Host ""

# Advertencia
Write-Host "⚠️  ADVERTENCIA: Esta operación eliminará todos los datos existentes en la base de datos." -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "¿Deseas continuar? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operación cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Copiando archivo de backup al contenedor..." -ForegroundColor Yellow
docker cp $backupFile "${dbContainer}:/tmp/backup.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo copiar el archivo al contenedor." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Archivo copiado al contenedor" -ForegroundColor Green

Write-Host ""
Write-Host "Restaurando backup..." -ForegroundColor Yellow
Write-Host "Esto puede tardar varios minutos dependiendo del tamaño del backup..." -ForegroundColor Yellow
Write-Host ""

# Restaurar el backup usando pg_restore
$restoreCommand = "PGPASSWORD=$dbPassword pg_restore -h localhost -U $dbUser -d $dbName -c --if-exists -v /tmp/backup.sql"
docker exec -e PGPASSWORD=$dbPassword $dbContainer sh -c $restoreCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: La restauración falló." -ForegroundColor Red
    Write-Host "Intentando método alternativo..." -ForegroundColor Yellow
    
    # Método alternativo: eliminar y recrear la base de datos primero
    Write-Host "Eliminando conexiones activas..." -ForegroundColor Yellow
    $terminateQuery = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbName' AND pid != pg_backend_pid();"
    docker exec -e PGPASSWORD=$dbPassword $dbContainer psql -U $dbUser -d postgres -c $terminateQuery
    
    Write-Host "Eliminando base de datos existente..." -ForegroundColor Yellow
    $dropQuery = "DROP DATABASE IF EXISTS $dbName;"
    docker exec -e PGPASSWORD=$dbPassword $dbContainer psql -U $dbUser -d postgres -c $dropQuery
    
    Write-Host "Creando nueva base de datos..." -ForegroundColor Yellow
    $createQuery = "CREATE DATABASE $dbName;"
    docker exec -e PGPASSWORD=$dbPassword $dbContainer psql -U $dbUser -d postgres -c $createQuery
    
    Write-Host "Restaurando backup en la nueva base de datos..." -ForegroundColor Yellow
    docker exec -e PGPASSWORD=$dbPassword $dbContainer sh -c $restoreCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: La restauración falló con ambos métodos." -ForegroundColor Red
        Write-Host "Verifica los logs del contenedor para más detalles." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "✓ Backup restaurado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Limpiando archivo temporal..." -ForegroundColor Yellow
docker exec $dbContainer rm /tmp/backup.sql

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Restauración completada" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puedes verificar la restauración conectándote a la base de datos." -ForegroundColor Green
Write-Host ""

