from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.core.exceptions import ObjectDoesNotExist
from .models import AuditoriaLog
from apps.core.models import Usuario
from apps.empresas.models import Empresaproducto, Empresaservicio, EmpresaMixta

@receiver(pre_save)
def log_pre_save(sender, instance, **kwargs):
    """
    Registrar cambios antes de guardar
    """
    if sender in [Empresaproducto, Empresaservicio, EmpresaMixta]:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_values = {
                field.name: getattr(old_instance, field.name)
                for field in old_instance._meta.fields
            }
        except ObjectDoesNotExist:
            instance._old_values = {}

@receiver(post_save)
def log_post_save(sender, instance, created, **kwargs):
    """
    Registrar cambios después de guardar
    """
    if sender in [Empresaproducto, Empresaservicio, EmpresaMixta]:
        action = 'CREATE' if created else 'UPDATE'
        
        # Obtener usuario actual (si está disponible)
        usuario = None
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            # Aquí podrías obtener el usuario actual de alguna manera
            # Por ejemplo, desde un thread local o contexto
        except:
            pass
        
        # Crear registro de auditoría
        AuditoriaLog.objects.create(
            usuario=usuario,
            accion=action,
            modelo_afectado=sender.__name__,
            objeto_id=instance.pk,
            nombre_objeto=instance.razon_social,
            descripcion=f"{'Creada' if created else 'Actualizada'} empresa {instance.razon_social}",
            valores_anteriores=getattr(instance, '_old_values', {}),
            valores_nuevos={
                field.name: str(getattr(instance, field.name))
                for field in instance._meta.fields
            },
            categoria='COMPANY_MANAGEMENT',
            nivel_criticidad='INFO'
        )

@receiver(post_delete)
def log_post_delete(sender, instance, **kwargs):
    """
    Registrar eliminaciones
    """
    if sender in [Empresaproducto, Empresaservicio, EmpresaMixta]:
        # Obtener usuario actual (si está disponible)
        usuario = None
        
        # Crear registro de auditoría
        AuditoriaLog.objects.create(
            usuario=usuario,
            accion='DELETE',
            modelo_afectado=sender.__name__,
            objeto_id=instance.pk,
            nombre_objeto=instance.razon_social,
            descripcion=f"Eliminada empresa {instance.razon_social}",
            categoria='COMPANY_MANAGEMENT',
            nivel_criticidad='WARNING'
        )

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """
    Registrar inicio de sesión
    """
    AuditoriaLog.objects.create(
        usuario=user,
        accion='LOGIN',
        modelo_afectado='Usuario',
        objeto_id=user.pk,
        nombre_objeto=user.get_full_name(),
        descripcion=f"Usuario {user.email} inició sesión",
        url=request.path,
        metodo_http=request.method,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        session_key=request.session.session_key,
        categoria='AUTHENTICATION',
        nivel_criticidad='INFO'
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """
    Registrar cierre de sesión
    """
    if user:
        AuditoriaLog.objects.create(
            usuario=user,
            accion='LOGOUT',
            modelo_afectado='Usuario',
            objeto_id=user.pk,
            nombre_objeto=user.get_full_name(),
            descripcion=f"Usuario {user.email} cerró sesión",
            url=request.path,
            metodo_http=request.method,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session_key=request.session.session_key,
            categoria='AUTHENTICATION',
            nivel_criticidad='INFO'
        )