# Sistema de Notificaciones por Email

Este documento describe el sistema completo de notificaciones por email implementado en BD Empresa Exportadora.

## 📋 Tabla de Contenidos

1. [Configuración](#configuración)
2. [Tipos de Notificaciones](#tipos-de-notificaciones)
3. [Configuración de Gmail SMTP](#configuración-de-gmail-smtp)
4. [Uso del Sistema](#uso-del-sistema)
5. [Personalización de Templates](#personalización-de-templates)
6. [Troubleshooting](#troubleshooting)

---

## Configuración

### Variables de Entorno

**⚠️ IMPORTANTE**: El sistema utiliza el archivo `backend/proyectoempresa/config/docker.env` para la configuración de email cuando se ejecuta con Docker Compose.

Este archivo es el que Docker Compose carga automáticamente (ver `docker-compose.yml` línea 50-51).

**Si no existe el archivo `docker.env`**, copia el archivo de ejemplo:
```bash
cp backend/proyectoempresa/config/docker.env.example backend/proyectoempresa/config/docker.env
```

Luego edita el archivo `backend/proyectoempresa/config/docker.env` y agrega/actualiza las siguientes variables:

```bash
# Email Configuration (Gmail SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
DEFAULT_FROM_EMAIL=noreply@empresa-exportadora.com
SITE_URL=http://localhost:3000
```

**Nota**: Si ejecutas Django sin Docker, el sistema intentará cargar un archivo `.env` desde la raíz del proyecto usando `python-dotenv`, pero en Docker siempre se usa `docker.env`.

### Configuración en Settings

La configuración de email se encuentra en `backend/proyectoempresa/config/settings/base.py`:

- **Desarrollo**: Por defecto usa `console.EmailBackend` para ver emails en la consola
- **Producción**: Usa SMTP con las credenciales configuradas

---

## Tipos de Notificaciones

El sistema envía automáticamente los siguientes tipos de emails:

### 1. Confirmación de Registro

**Cuándo se envía**: Cuando una empresa completa el formulario de registro

**Destinatarios**: Email principal y email de contacto de la solicitud

**Contenido**:
- Confirmación de recepción de la solicitud
- Instrucciones para confirmar el email
- Enlace para ver el estado de la solicitud

**Template**: `registro/emails/confirmacion_registro.html`

### 2. Aprobación de Solicitud

**Cuándo se envía**: Cuando un administrador aprueba una solicitud de registro

**Destinatarios**: Email principal y email de contacto de la solicitud

**Contenido**:
- Notificación de aprobación
- Credenciales de acceso (email y CUIT como contraseña inicial)
- Instrucciones para el primer login
- Enlace directo al login

**Template**: `registro/emails/aprobacion.html`

### 3. Rechazo de Solicitud

**Cuándo se envía**: Cuando un administrador rechaza una solicitud de registro

**Destinatarios**: Email principal y email de contacto de la solicitud

**Contenido**:
- Notificación de rechazo
- Motivo y observaciones del administrador
- Instrucciones para contactar o corregir

**Template**: `registro/emails/rechazo.html`

### 4. Recordatorio de Solicitud Pendiente

**Cuándo se envía**: Automáticamente cuando una solicitud está pendiente por más de 7 días (configurable)

**Destinatarios**: Email principal y email de contacto de la solicitud

**Contenido**:
- Recordatorio de que la solicitud está pendiente
- Días transcurridos desde el registro
- Enlace para ver el estado

**Template**: `registro/emails/recordatorio_pendiente.html`

**Nota**: Se evita el spam enviando máximo 1 recordatorio por semana por solicitud.

### 5. Confirmación de Cambio de Contraseña

**Cuándo se envía**: Cuando una empresa cambia su contraseña por primera vez (después del login inicial)

**Destinatarios**: Email del usuario de la empresa

**Contenido**:
- Confirmación de cambio exitoso
- Recomendaciones de seguridad
- Enlace al login

**Template**: `registro/emails/cambio_password.html`

### 6. Notificación de Cambios en Empresa

**Cuándo se envía**: Cuando se actualizan datos importantes de la empresa

**Campos monitoreados**:
- Razón social
- CUIT/CUIL
- Email principal
- Email de contacto principal
- Dirección
- Teléfono
- Emails secundarios

**Destinatarios**: Todos los emails de contacto de la empresa (principal, secundario, terciario)

**Contenido**:
- Lista de campos modificados
- Valores anteriores y nuevos
- Usuario que realizó los cambios
- Enlace al perfil de la empresa

**Template**: `registro/emails/cambios_empresa.html`

---

## Configuración de Gmail SMTP

### Paso 1: Habilitar Autenticación de 2 Factores

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad**
3. Habilita **Verificación en 2 pasos** si no está activada

### Paso 2: Generar Contraseña de Aplicación

1. En la misma sección de Seguridad, busca **Contraseñas de aplicaciones**
2. Selecciona **Aplicación**: "Correo"
3. Selecciona **Dispositivo**: "Otro (nombre personalizado)"
4. Ingresa un nombre (ej: "BD Empresa Exportadora")
5. Haz clic en **Generar**
6. **Copia la contraseña generada** (16 caracteres sin espacios)

### Paso 3: Configurar Variables de Entorno

Actualiza el archivo `backend/proyectoempresa/config/docker.env`:

```bash
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # La contraseña de 16 caracteres generada (sin espacios)
```

**Ubicación del archivo**: `backend/proyectoempresa/config/docker.env`

**Después de actualizar**, reinicia los contenedores de Docker:
```bash
docker-compose restart backend
```

**⚠️ IMPORTANTE**: 
- No uses tu contraseña normal de Gmail
- Usa siempre una "Contraseña de aplicación"
- Mantén esta contraseña segura y no la compartas

### Paso 4: Verificar Configuración

En desarrollo, puedes verificar que los emails se están enviando correctamente revisando la consola (si usas `console.EmailBackend`) o los logs del servidor.

---

## Uso del Sistema

### Envío Automático

Las notificaciones se envían automáticamente cuando ocurren los eventos correspondientes:

- **Registro**: Al crear una solicitud de registro
- **Aprobación/Rechazo**: Al aprobar o rechazar desde el admin o API
- **Cambio de Password**: Al cambiar la contraseña por primera vez
- **Cambios en Empresa**: Al actualizar datos importantes

### Envío Manual de Recordatorios

Para enviar recordatorios manualmente a empresas pendientes:

```bash
# Enviar recordatorios a solicitudes pendientes por más de 7 días
python manage.py enviar_recordatorios_pendientes

# Personalizar días de pendiente
python manage.py enviar_recordatorios_pendientes --dias 10

# Personalizar días entre recordatorios (evitar spam)
python manage.py enviar_recordatorios_pendientes --dias-entre-recordatorios 14

# Modo dry-run (ver qué se enviaría sin enviar realmente)
python manage.py enviar_recordatorios_pendientes --dry-run
```

### Programar Recordatorios Automáticos

Para enviar recordatorios automáticamente, puedes configurar un cron job o tarea programada:

**Linux/Mac (cron)**:
```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar cada lunes a las 9 AM
0 9 * * 1 cd /ruta/al/proyecto && python manage.py enviar_recordatorios_pendientes
```

**Docker (usando docker-compose)**:
Puedes agregar un servicio separado que ejecute el comando periódicamente usando `cron` o una herramienta como `celery-beat`.

---

## Personalización de Templates

### Ubicación de Templates

Los templates de email se encuentran en:
```
backend/proyectoempresa/apps/registro/templates/registro/emails/
```

### Estructura de Templates

Todos los templates extienden de `base_email.html` que proporciona:
- Diseño responsive
- Header con logo y branding
- Footer con información de contacto
- Estilos CSS inline

### Personalizar un Template

1. Edita el template correspondiente en `templates/registro/emails/`
2. Los templates usan Django template language
3. Variables disponibles están documentadas en cada función del servicio (`services.py`)

### Ejemplo de Personalización

```html
{% extends "registro/emails/base_email.html" %}

{% block content %}
<h2 style="color: #3259B5;">Mi Título Personalizado</h2>
<p>Hola {{ nombre }},</p>
<!-- Tu contenido aquí -->
{% endblock %}
```

### Variables Disponibles por Template

**confirmacion_registro.html**:
- `solicitud`: Objeto SolicitudRegistro
- `razon_social`: Razón social de la empresa
- `correo`: Email de contacto
- `fecha_registro`: Fecha de creación
- `site_url`: URL del sitio
- `confirm_url`: URL de confirmación

**aprobacion.html**:
- `solicitud`: Objeto SolicitudRegistro
- `razon_social`: Razón social
- `cuit_cuil`: CUIT/CUIL
- `email_login`: Email para login
- `fecha_aprobacion`: Fecha de aprobación
- `observaciones`: Observaciones del admin
- `login_url`: URL de login

**rechazo.html**:
- `solicitud`: Objeto SolicitudRegistro
- `razon_social`: Razón social
- `fecha_rechazo`: Fecha de rechazo
- `observaciones`: Motivo del rechazo
- `contacto_url`: URL de contacto

**recordatorio_pendiente.html**:
- `solicitud`: Objeto SolicitudRegistro
- `razon_social`: Razón social
- `dias_pendiente`: Días desde el registro
- `fecha_registro`: Fecha de registro
- `estado_url`: URL para ver estado

**cambio_password.html**:
- `usuario`: Objeto Usuario
- `nombre`: Nombre del usuario
- `empresa`: Objeto Empresa (opcional)
- `razon_social`: Razón social (si hay empresa)
- `fecha_cambio`: Fecha del cambio
- `login_url`: URL de login

**cambios_empresa.html**:
- `empresa`: Objeto Empresa
- `razon_social`: Razón social
- `cambios`: Dict con cambios {campo: {anterior: val, nuevo: val}}
- `fecha_actualizacion`: Fecha de actualización
- `usuario_modificador`: Usuario que hizo los cambios
- `perfil_url`: URL del perfil

---

## Troubleshooting

### Los emails no se envían

1. **Verificar configuración de email**:
   ```bash
   # Probar el envío de emails con el comando de prueba
   docker-compose exec backend python manage.py test_email --email tu-email@gmail.com
   
   # Ver logs en tiempo real
   docker-compose logs -f backend
   
   # Ver últimas 100 líneas de logs
   docker-compose logs backend --tail=100
   ```

2. **Verificar que las variables de entorno se carguen correctamente**:
   ```bash
   # Verificar variables dentro del contenedor
   docker-compose exec backend python -c "import os; print('EMAIL_HOST_USER:', os.getenv('EMAIL_HOST_USER'))"
   
   # Si muestra "tu-email@gmail.com" en lugar de tu email real, recrea los contenedores:
   docker-compose down
   docker-compose up -d
   ```

3. **Verificar credenciales de Gmail**:
   - Asegúrate de usar una "Contraseña de aplicación", no tu contraseña normal
   - Verifica que la verificación en 2 pasos esté habilitada
   - La contraseña de aplicación debe tener 16 caracteres sin espacios

4. **Verificar logs**:
   ```bash
   # Ver logs en tiempo real
   docker-compose logs -f backend | findstr "email\|Email\|EMAIL"
   
   # Ver todos los logs del backend
   docker-compose logs backend --tail=200
   ```
   
   Los errores se registran en los logs de Django. Busca mensajes con:
   - `✅ Email enviado exitosamente` - Email enviado correctamente
   - `❌ Error al enviar email` - Error al enviar
   - `SMTPAuthenticationError` - Error de autenticación con Gmail

5. **Verificar firewall/red**:
   - Asegúrate de que el puerto 587 (SMTP) no esté bloqueado

### Emails van a spam

1. **Configurar SPF/DKIM** (para producción):
   - Configura registros DNS apropiados
   - Usa un servicio de email profesional (SendGrid, Mailgun) para mejor deliverability

2. **Verificar contenido**:
   - Evita palabras spam
   - Incluye información de contacto válida

### Error: "SMTPAuthenticationError"

- Verifica que `EMAIL_HOST_USER` y `EMAIL_HOST_PASSWORD` estén correctos
- Asegúrate de usar una "Contraseña de aplicación" de Gmail
- Verifica que la verificación en 2 pasos esté habilitada

### Error: "Connection refused"

- Verifica que `EMAIL_HOST` y `EMAIL_PORT` sean correctos
- Verifica que no haya firewall bloqueando la conexión
- Para Gmail, usa `smtp.gmail.com` y puerto `587`

### Los recordatorios no se envían automáticamente

- Verifica que el cron job o tarea programada esté configurada correctamente
- Ejecuta el comando manualmente para verificar que funciona
- Revisa los logs para errores

---

## Archivos del Sistema

### Servicio de Email
- `backend/proyectoempresa/apps/registro/services.py` - Funciones de envío de email

### Templates
- `backend/proyectoempresa/apps/registro/templates/registro/emails/base_email.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/confirmacion_registro.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/aprobacion.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/rechazo.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/recordatorio_pendiente.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/cambio_password.html`
- `backend/proyectoempresa/apps/registro/templates/registro/emails/cambios_empresa.html`

### Comandos de Management
- `backend/proyectoempresa/apps/registro/management/commands/enviar_recordatorios_pendientes.py`

### Configuración
- `backend/proyectoempresa/config/settings/base.py` - Configuración de email (lee variables de entorno)
- `backend/proyectoempresa/config/docker.env` - **Archivo principal de variables de entorno** (usado por Docker Compose)
- `docker-compose.yml` - Carga `docker.env` en el servicio backend (línea 50-51)

---

## Soporte

Para problemas o preguntas sobre el sistema de emails:
1. Revisa esta documentación
2. Verifica los logs del sistema
3. Consulta con el equipo de desarrollo

---

**Última actualización**: 2024-12-01

