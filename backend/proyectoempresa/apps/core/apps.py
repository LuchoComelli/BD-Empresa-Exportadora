from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core - Usuarios y Ubicaciones'
    
    def ready(self):
        import apps.core.signals
