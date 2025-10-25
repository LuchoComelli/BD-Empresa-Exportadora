from django.apps import AppConfig


class EmpresasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.empresas'
    verbose_name = 'Empresas - Gestión Completa'
    
    def ready(self):
        import apps.empresas.signals
