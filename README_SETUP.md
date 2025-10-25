# 🚀 Guía de Configuración para el Equipo

## 📋 **Configuración Inicial**

### 1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/BD-Empresa-Exportadora.git
cd BD-Empresa-Exportadora
```

### 2. **Configurar variables de entorno**

**Copia el archivo de ejemplo:**
```bash
cp proyectoempresa/config/env.example .env
```

**Edita el archivo `.env` con tus datos:**
```bash
# Django
DEBUG=1
SECRET_KEY=tu_secret_key_personal_aqui
DJANGO_SETTINGS_MODULE=proyectoempresa.config.settings.development

# Base de datos PostgreSQL
DB_NAME=bd_empresa_exportadora
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres_personal
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Email (opcional para desarrollo)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Logging
LOG_LEVEL=DEBUG

# Archivos estáticos
STATIC_URL=/static/
MEDIA_URL=/media/
```

### 3. **Levantar el proyecto con Docker**

**Para Windows:**
```bash
scripts\dev.bat build
scripts\dev.bat up
```

**Para Linux/macOS:**
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh build
./scripts/dev.sh up
```

### 4. **Aplicar migraciones**
```bash
# Windows
scripts\dev.bat migrate

# Linux/macOS
./scripts/dev.sh migrate
```

### 5. **Crear superusuario**
```bash
# Windows
scripts\dev.bat createsuperuser

# Linux/macOS
./scripts/dev.sh createsuperuser
```

## 🔧 **Configuración de pgAdmin**

**Datos de conexión:**
- **Host:** `localhost`
- **Puerto:** `5433` ⚠️ **¡IMPORTANTE!**
- **Base de datos:** `bd_empresa_exportadora`
- **Usuario:** `postgres`
- **Contraseña:** `tu_contraseña_postgres_personal`

## 📝 **Comandos Útiles**

### **Levantar servicios:**
```bash
# Windows
scripts\dev.bat up

# Linux/macOS
./scripts/dev.sh up
```

### **Detener servicios:**
```bash
# Windows
scripts\dev.bat down

# Linux/macOS
./scripts/dev.sh down
```

### **Ver logs:**
```bash
docker-compose logs -f web
```

### **Acceder al shell de Django:**
```bash
docker-compose exec web python manage.py shell
```

## ⚠️ **Importante**

- **NUNCA** subas el archivo `.env` al repositorio
- **NUNCA** subas archivos con contraseñas
- Cada desarrollador debe crear su propio archivo `.env`
- Usa contraseñas diferentes para cada entorno

## 🆘 **Solución de Problemas**

### **Error de puerto ocupado:**
Si el puerto 5433 está ocupado, cambia el puerto en `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Cambia 5433 por 5434
```

### **Error de permisos en Linux/macOS:**
```bash
chmod +x scripts/dev.sh
```

### **Reiniciar completamente:**
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d
```
