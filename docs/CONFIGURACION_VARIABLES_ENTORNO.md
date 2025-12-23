# Configuración de Variables de Entorno

## 📋 Archivo de Configuración Principal

**El único archivo de configuración que se usa en producción con Docker es:**
```
backend/proyectoempresa/config/docker.env
```

Este archivo es cargado automáticamente por Docker Compose (ver `docker-compose.yml` línea 50-51).

## 🚀 Configuración Inicial

### Paso 1: Copiar el archivo de ejemplo

Si es la primera vez que configuras el proyecto, copia el archivo de ejemplo:

```bash
# Desde la raíz del proyecto
cp backend/proyectoempresa/config/docker.env.example backend/proyectoempresa/config/docker.env
```

### Paso 2: Editar las variables

Edita `backend/proyectoempresa/config/docker.env` y configura:

1. **Base de datos**: Cambia `DB_PASSWORD` por una contraseña segura
2. **Email**: Configura las credenciales de Gmail (ver [SISTEMA_EMAILS.md](./SISTEMA_EMAILS.md))
3. **Secret Key**: Cambia `SECRET_KEY` por una clave segura para producción

### Paso 3: Reiniciar contenedores

Después de modificar `docker.env`, reinicia los contenedores:

```bash
docker-compose restart backend
```

## ⚠️ Importante

- **NO subas `docker.env` al repositorio** (está en `.gitignore`)
- **SÍ sube `docker.env.example`** (contiene valores de ejemplo sin credenciales)
- El archivo `docker.env` debe crearse localmente en cada entorno (desarrollo, producción)

## 📝 Variables Disponibles

### Base de Datos
- `DB_NAME`: Nombre de la base de datos
- `DB_USER`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `DB_HOST`: Host de la base de datos (usar `db` en Docker)
- `DB_PORT`: Puerto de PostgreSQL (5432)

### Email (Gmail SMTP)
- `EMAIL_BACKEND`: Backend de email (smtp o console)
- `EMAIL_HOST`: Servidor SMTP (smtp.gmail.com)
- `EMAIL_PORT`: Puerto SMTP (587)
- `EMAIL_USE_TLS`: Usar TLS (True/False)
- `EMAIL_HOST_USER`: Email de Gmail
- `EMAIL_HOST_PASSWORD`: Contraseña de aplicación de Gmail
- `DEFAULT_FROM_EMAIL`: Email remitente por defecto
- `SITE_URL`: URL del sitio para enlaces en emails

### Otros
- `DEBUG`: Modo debug (1 para desarrollo, 0 para producción)
- `SECRET_KEY`: Clave secreta de Django
- `REDIS_URL`: URL de conexión a Redis
- `LOG_LEVEL`: Nivel de logging (DEBUG, INFO, WARNING, ERROR)

## 🔍 Notas Técnicas

- El archivo `base.py` incluye `load_dotenv()` como fallback para desarrollo local sin Docker, pero **en producción con Docker solo se usa `docker.env`**
- Si ejecutas Django sin Docker, `load_dotenv()` intentará cargar un `.env` desde la raíz del proyecto (si existe)
- En Docker, las variables se cargan desde `docker.env` y tienen prioridad sobre cualquier `.env` local

## 📚 Referencias

- [SISTEMA_EMAILS.md](./SISTEMA_EMAILS.md) - Configuración detallada del sistema de emails
- [DOCKER_GUIA.md](./DOCKER_GUIA.md) - Guía completa de Docker

