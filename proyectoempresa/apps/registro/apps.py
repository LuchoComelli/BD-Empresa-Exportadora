from django.apps import AppConfig


class RegistroConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.registro'
    verbose_name = 'Registro Público de Empresas'
    
    def ready(self):
        import apps.registro.signals
