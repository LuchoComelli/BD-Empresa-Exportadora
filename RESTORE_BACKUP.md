# Guía de Restauración de Backup

## Problema Común

Si intentas restaurar el archivo `basededatoempresa.sql` desde pgAdmin y te da error, es porque el archivo está en **formato custom de PostgreSQL** (binario), no en formato SQL plano. pgAdmin solo puede restaurar archivos SQL planos directamente desde la interfaz gráfica.

## Solución: Restaurar desde Docker

### Opción 1: Usar el Script Automático (Recomendado)

#### Windows (PowerShell):
```powershell
.\scripts\restore-backup.ps1
```

#### Linux/Mac:
```bash
chmod +x scripts/restore-backup.sh
./scripts/restore-backup.sh
```

### Opción 2: Restaurar Manualmente

Si prefieres hacerlo manualmente, sigue estos pasos:

#### 1. Verificar que los contenedores estén corriendo:
```bash
docker-compose ps
```

#### 2. Copiar el archivo de backup al contenedor:
```bash
docker cp basededatoempresa.sql $(docker-compose ps -q db):/tmp/backup.sql
```

#### 3. Restaurar el backup:

**Método A: Restaurar directamente (si la base de datos está vacía o no importa perder datos):**
```bash
docker exec -e PGPASSWORD=masterkpo123 $(docker-compose ps -q db) pg_restore -h localhost -U postgres -d bd_empresa_exportadora -c --if-exists -v /tmp/backup.sql
```

**Método B: Eliminar y recrear la base de datos primero (más seguro):**
```bash
# Obtener el ID del contenedor
DB_CONTAINER=$(docker-compose ps -q db)

# Eliminar conexiones activas
docker exec -e PGPASSWORD=masterkpo123 $DB_CONTAINER psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bd_empresa_exportadora' AND pid <> pg_backend_pid();"

# Eliminar la base de datos existente
docker exec -e PGPASSWORD=masterkpo123 $DB_CONTAINER psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS bd_empresa_exportadora;"

# Crear nueva base de datos
docker exec -e PGPASSWORD=masterkpo123 $DB_CONTAINER psql -U postgres -d postgres -c "CREATE DATABASE bd_empresa_exportadora;"

# Restaurar el backup
docker exec -e PGPASSWORD=masterkpo123 $DB_CONTAINER pg_restore -h localhost -U postgres -d bd_empresa_exportadora -v /tmp/backup.sql
```

#### 4. Limpiar el archivo temporal:
```bash
docker exec $(docker-compose ps -q db) rm /tmp/backup.sql
```

### Opción 3: Convertir a SQL Plano (para usar en pgAdmin)

Si realmente necesitas usar pgAdmin, puedes convertir el backup a formato SQL plano:

```bash
# Copiar el archivo al contenedor
docker cp basededatoempresa.sql $(docker-compose ps -q db):/tmp/backup.sql

# Convertir a SQL plano
docker exec $(docker-compose ps -q db) pg_restore -f /tmp/backup_plain.sql /tmp/backup.sql

# Copiar el archivo convertido de vuelta
docker cp $(docker-compose ps -q db):/tmp/backup_plain.sql basededatoempresa_plain.sql
```

Luego puedes usar `basededatoempresa_plain.sql` en pgAdmin.

## Verificar la Restauración

Para verificar que el backup se restauró correctamente:

```bash
# Conectarse a la base de datos
docker exec -it $(docker-compose ps -q db) psql -U postgres -d bd_empresa_exportadora

# Listar las tablas
\dt

# Contar registros en una tabla (ejemplo)
SELECT COUNT(*) FROM nombre_de_tabla;

# Salir
\q
```

## Credenciales por Defecto

Según tu archivo `docker.env`:
- **Base de datos:** `bd_empresa_exportadora`
- **Usuario:** `postgres`
- **Contraseña:** `masterkpo123`
- **Host:** `localhost` (desde fuera de Docker) o `db` (desde dentro de Docker)
- **Puerto:** `5433` (desde fuera de Docker) o `5432` (desde dentro de Docker)

## Conectar desde pgAdmin

Si quieres usar pgAdmin después de restaurar:

1. Abre pgAdmin
2. Crea una nueva conexión con estos datos:
   - **Host:** `localhost`
   - **Puerto:** `5433`
   - **Base de datos:** `bd_empresa_exportadora`
   - **Usuario:** `postgres`
   - **Contraseña:** `masterkpo123`

## Solución de Problemas

### Error: "pg_restore: error: input file appears to be a text format dump"

Si obtienes este error, significa que el archivo es SQL plano, no formato custom. En ese caso, usa `psql` en lugar de `pg_restore`:

```bash
docker exec -e PGPASSWORD=masterkpo123 $(docker-compose ps -q db) psql -U postgres -d bd_empresa_exportadora -f /tmp/backup.sql
```

### Error: "database is being accessed by other users"

Si obtienes este error, primero elimina las conexiones activas:

```bash
docker exec -e PGPASSWORD=masterkpo123 $(docker-compose ps -q db) psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bd_empresa_exportadora' AND pid <> pg_backend_pid();"
```

### Error: "permission denied"

Asegúrate de que Docker Desktop esté corriendo y que tengas permisos para ejecutar comandos de Docker.

## Notas Importantes

- ⚠️ **La restauración eliminará todos los datos existentes en la base de datos**
- ✅ Siempre haz un backup antes de restaurar si tienes datos importantes
- 📦 El formato custom de PostgreSQL es más eficiente que SQL plano para backups grandes
- 🔄 Si necesitas hacer backups regulares, considera usar el formato custom para ahorrar espacio

