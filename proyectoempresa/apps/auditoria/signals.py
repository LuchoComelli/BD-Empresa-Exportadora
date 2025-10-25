# apps/auditoria/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Acá van tus signals cuando los necesites
# Por ahora dejalo vacío o con un comentario

# Ejemplo de signal (comentado por ahora):
# @receiver(post_save, sender=TuModelo)
# def log_cambio(sender, instance, created, **kwargs):
#     # Lógica de auditoría
#     pass