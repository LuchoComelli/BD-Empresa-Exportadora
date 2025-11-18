from django.apps import AppConfig


class GeografiaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.geografia'
    verbose_name = 'Geografía Argentina'
    
    def ready(self):
        import apps.geografia.signals

