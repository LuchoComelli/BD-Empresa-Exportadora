from .base import *
import os
import dj_database_url

# Debug mode
DEBUG = True

# Installed apps for development
INSTALLED_APPS += [
    'django_extensions',
    'debug_toolbar',
]

# Middleware for development
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Email backend for development
# Si las credenciales de email están configuradas, usar SMTP real
# Si no, usar console backend para ver emails en consola
if os.getenv('EMAIL_HOST_USER') and os.getenv('EMAIL_HOST_PASSWORD'):
    # Usar SMTP real si hay credenciales configuradas
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
else:
    # Usar console backend si no hay credenciales (solo para desarrollo local)
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Logging for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['root']['level'] = 'DEBUG'

# Base de datos PostgreSQL usando variables de entorno
DATABASES = {
    'default': dj_database_url.config(
        default=f"postgresql://{os.environ.get('DB_USER','postgres')}:{os.environ.get('DB_PASSWORD','masterkpo123')}@{os.environ.get('DB_HOST','db')}:{os.environ.get('DB_PORT','5432')}/{os.environ.get('DB_NAME','bd_empresa_exportadora')}"
    )
}
