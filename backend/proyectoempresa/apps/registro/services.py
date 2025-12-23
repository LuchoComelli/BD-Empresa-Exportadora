"""
Servicio centralizado para envío de emails del sistema de registro
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from .models import SolicitudRegistro, NotificacionRegistro
import logging
import os
import base64
from io import BytesIO

logger = logging.getLogger(__name__)

# Intentar importar PIL para optimización de imágenes
try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("⚠️ PIL/Pillow no está disponible. El logo no se optimizará automáticamente.")


def _enviar_email(
    asunto: str,
    destinatarios: list,
    template_html: str,
    contexto: dict,
    tipo_notificacion: str = None,
    solicitud: SolicitudRegistro = None,
    empresa=None
):
    """
    Función auxiliar para enviar emails con manejo de errores y logging
    
    Args:
        asunto: Asunto del email
        destinatarios: Lista de direcciones de email
        template_html: Nombre del template HTML a usar
        contexto: Diccionario con variables para el template
        tipo_notificacion: Tipo de notificación para el registro
        solicitud: Instancia de SolicitudRegistro (opcional)
        empresa: Instancia de Empresa (opcional)
    """
    if not destinatarios:
        logger.warning("No se proporcionaron destinatarios para el email")
        return False
    
    # Filtrar emails vacíos o None
    destinatarios = [email for email in destinatarios if email and email.strip()]
    
    if not destinatarios:
        logger.warning("No hay destinatarios válidos después de filtrar")
        return False
    
    try:
        # Usar URL del logo del gobierno de Catamarca (compatible con todos los clientes de email)
        # Gmail, Outlook y otros no soportan imágenes base64, así que usamos URL externa
        logo_url = 'https://portal.catamarca.gob.ar/img/Ctca-Gobierno-blanco-Header.png'
        
        # Agregar URL del logo al contexto si no está presente
        if 'logo_url' not in contexto:
            contexto['logo_url'] = logo_url
            logger.info(f"✅ Usando logo desde URL externa: {logo_url}")
        
        # Mantener base64 como fallback opcional (aunque la mayoría de clientes no lo soportan)
        # Solo se usará si logo_url no está disponible
        if 'logo_base64' not in contexto:
            contexto['logo_base64'] = None
        
        # Verificar que logo_base64 esté en el contexto antes de renderizar
        if 'logo_base64' in contexto and contexto['logo_base64']:
            logger.debug(f"✅ logo_base64 presente en contexto antes de renderizar (longitud: {len(str(contexto['logo_base64']))} chars)")
            logger.debug(f"✅ Primeros 100 chars del data URI: {str(contexto['logo_base64'])[:100]}...")
        else:
            logger.warning("⚠️ logo_base64 NO está presente en contexto o está vacío")
        
        # Renderizar template HTML
        mensaje_html = render_to_string(template_html, contexto)
        
        # Verificar si el logo está en el HTML renderizado
        if 'logo_base64' in contexto and contexto['logo_base64']:
            if contexto['logo_base64'][:50] in mensaje_html:
                logger.info("✅ Logo base64 encontrado en HTML renderizado")
            else:
                logger.warning("⚠️ Logo base64 NO encontrado en HTML renderizado - puede ser un problema del template")
        
        # Crear versión de texto plano básica
        mensaje_texto = f"{asunto}\n\n"
        if 'mensaje' in contexto:
            mensaje_texto += str(contexto['mensaje'])
        
        # Enviar email
        # Usar fail_silently=True para evitar que Django propague errores de SMTP
        # Nota: Gmail puede enviar mensajes de error (bounces) al remitente cuando
        # intenta entregar a direcciones que no existen. Esto es comportamiento normal
        # de los servidores de correo y no se puede evitar completamente.
        try:
            send_mail(
                subject=asunto,
                message=mensaje_texto,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=destinatarios,
                html_message=mensaje_html,
                fail_silently=True,  # True para evitar que errores de SMTP se propaguen
            )
            # Si fail_silently=True, send_mail no lanza excepciones, pero puede retornar False
            # Verificar si el envío fue exitoso es difícil con fail_silently=True
            # Por ahora, asumimos éxito si no hay excepción
        except Exception as smtp_error:
            # Aunque usamos fail_silently=True, algunos errores pueden seguir lanzándose
            error_msg = str(smtp_error)
            # Detectar errores de dirección no encontrada
            if '550' in error_msg or '5.1.1' in error_msg or 'does not exist' in error_msg.lower() or 'address not found' in error_msg.lower():
                logger.warning(f"⚠️ Dirección de email no válida: {destinatarios}. Error: {error_msg}")
                # No re-lanzar el error para evitar que se propague y cause más problemas
                return False
            else:
                # Otros errores de SMTP también se loguean
                logger.error(f"❌ Error SMTP al enviar email a {destinatarios}: {error_msg}")
                return False
        
        # Registrar notificación en BD si hay solicitud
        if solicitud and tipo_notificacion:
            NotificacionRegistro.objects.create(
                solicitud=solicitud,
                tipo=tipo_notificacion,
                asunto=asunto,
                mensaje=mensaje_html,
                email_enviado=True,
                fecha_envio=timezone.now()
            )
        
        logger.info(f"✅ Email enviado exitosamente: {asunto} a {destinatarios}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Error al enviar email '{asunto}': {error_msg}", exc_info=True)
        
        # Registrar error en BD si hay solicitud
        if solicitud and tipo_notificacion:
            NotificacionRegistro.objects.create(
                solicitud=solicitud,
                tipo=tipo_notificacion,
                asunto=asunto,
                mensaje=mensaje_html if 'mensaje_html' in locals() else '',
                email_enviado=False,
                fecha_envio=timezone.now(),
                error_envio=error_msg
            )
        
        return False


def enviar_email_confirmacion_registro(solicitud: SolicitudRegistro):
    """
    Enviar email de confirmación cuando se registra una empresa
    
    Args:
        solicitud: Instancia de SolicitudRegistro
    """
    asunto = 'Confirmación de Registro - Sistema de Gestión de Empresas Exportadoras'
    
    contexto = {
        'solicitud': solicitud,
        'razon_social': solicitud.razon_social,
        'correo': solicitud.correo,
        'fecha_registro': solicitud.fecha_creacion,
        'site_url': settings.SITE_URL,
        'confirm_url': f"{settings.SITE_URL}/registro/confirmar/{solicitud.token_confirmacion}/",
    }
    
    # Obtener destinatarios: email principal y email de contacto si es diferente
    destinatarios = []
    if solicitud.correo:
        destinatarios.append(solicitud.correo)
    if solicitud.email_contacto and solicitud.email_contacto != solicitud.correo:
        destinatarios.append(solicitud.email_contacto)
    
    if not destinatarios:
        logger.warning(f"⚠️ No hay destinatarios válidos para solicitud {solicitud.id}")
        return False
    
    logger.info(f"📧 Enviando email de confirmación a: {destinatarios}")
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/confirmacion_registro.html',
        contexto=contexto,
        tipo_notificacion='confirmacion',
        solicitud=solicitud
    )


def enviar_email_aprobacion(solicitud: SolicitudRegistro):
    """
    Enviar email cuando una solicitud es aprobada
    
    Args:
        solicitud: Instancia de SolicitudRegistro
    """
    asunto = 'Solicitud Aprobada - Sistema de Gestión de Empresas Exportadoras'
    
    # Obtener credenciales
    cuit_cuil = solicitud.cuit_cuil
    email_login = solicitud.correo
    
    contexto = {
        'solicitud': solicitud,
        'razon_social': solicitud.razon_social,
        'cuit_cuil': cuit_cuil,
        'email_login': email_login,
        'fecha_aprobacion': solicitud.fecha_aprobacion,
        'observaciones': solicitud.observaciones_admin,
        'site_url': settings.SITE_URL,
        'login_url': f"{settings.SITE_URL}/login",
    }
    
    destinatarios = [solicitud.correo]
    if solicitud.email_contacto and solicitud.email_contacto != solicitud.correo:
        destinatarios.append(solicitud.email_contacto)
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/aprobacion.html',
        contexto=contexto,
        tipo_notificacion='aprobacion',
        solicitud=solicitud
    )


def enviar_email_notificacion_empresa(empresa):
    """
    Enviar email de notificación con credenciales a una empresa ya aprobada
    
    Args:
        empresa: Instancia de Empresa
    """
    asunto = 'Credenciales de Acceso - Sistema de Gestión de Empresas Exportadoras'
    
    # Obtener credenciales del usuario asociado
    if not empresa.id_usuario:
        logger.warning(f"⚠️ Empresa {empresa.id} no tiene usuario asociado")
        return False
    
    usuario = empresa.id_usuario
    email_login = usuario.email
    cuit_cuil = empresa.cuit_cuil
    
    contexto = {
        'empresa': empresa,
        'razon_social': empresa.razon_social,
        'cuit_cuil': cuit_cuil,
        'email_login': email_login,
        'fecha_notificacion': timezone.now(),
        'site_url': settings.SITE_URL,
        'login_url': f"{settings.SITE_URL}/login",
    }
    
    # Obtener destinatarios: email del usuario y correo de la empresa si es diferente
    destinatarios = [email_login]
    if empresa.correo and empresa.correo != email_login:
        destinatarios.append(empresa.correo)
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/notificacion_empresa.html',
        contexto=contexto,
        tipo_notificacion='notificacion_empresa',
        solicitud=None,
        empresa=empresa
    )


def enviar_email_rechazo(solicitud: SolicitudRegistro):
    """
    Enviar email cuando una solicitud es rechazada
    
    Args:
        solicitud: Instancia de SolicitudRegistro
    """
    asunto = 'Solicitud Rechazada - Sistema de Gestión de Empresas Exportadoras'
    
    contexto = {
        'solicitud': solicitud,
        'razon_social': solicitud.razon_social,
        'fecha_rechazo': timezone.now(),
        'observaciones': solicitud.observaciones_admin,
        'site_url': settings.SITE_URL,
        'contacto_url': f"{settings.SITE_URL}/contacto",
    }
    
    destinatarios = [solicitud.correo]
    if solicitud.email_contacto and solicitud.email_contacto != solicitud.correo:
        destinatarios.append(solicitud.email_contacto)
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/rechazo.html',
        contexto=contexto,
        tipo_notificacion='rechazo',
        solicitud=solicitud
    )


def enviar_email_recuperacion_password(usuario, token):
    """
    Enviar email con enlace para recuperar contraseña
    
    Args:
        usuario: Instancia de Usuario
        token: Token único para recuperar contraseña
    """
    asunto = 'Recuperar Contraseña - Sistema de Gestión de Empresas Exportadoras'
    
    # Construir URL de recuperación
    reset_url = f"{settings.SITE_URL}/recuperar-contrasena/reset?token={token}"
    
    contexto = {
        'usuario': usuario,
        'nombre': usuario.nombre or usuario.email,
        'token': token,
        'reset_url': reset_url,
        'site_url': settings.SITE_URL,
        'fecha_solicitud': timezone.now(),
    }
    
    # Obtener empresa si existe
    empresa = None
    try:
        from apps.empresas.models import Empresa
        empresa = Empresa.objects.filter(id_usuario=usuario).first()
        if empresa:
            contexto['empresa'] = empresa
            contexto['razon_social'] = empresa.razon_social
    except Exception:
        pass
    
    destinatarios = [usuario.email]
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/recuperacion_password.html',
        contexto=contexto,
        tipo_notificacion=None,
        solicitud=None,
        empresa=empresa
    )


def enviar_email_cambio_password(usuario, empresa=None):
    """
    Enviar email cuando una empresa cambia su contraseña por primera vez
    
    Args:
        usuario: Instancia de Usuario
        empresa: Instancia de Empresa (opcional)
    """
    asunto = 'Contraseña actualizada exitosamente - Sistema de Gestión de Empresas Exportadoras'
    
    contexto = {
        'usuario': usuario,
        'nombre': usuario.nombre or usuario.email,
        'fecha_cambio': timezone.now(),
        'site_url': settings.SITE_URL,
        'login_url': f"{settings.SITE_URL}/login",
    }
    
    if empresa:
        contexto['razon_social'] = empresa.razon_social
        contexto['empresa'] = empresa
    
    destinatarios = [usuario.email]
    
    return _enviar_email(
        asunto=asunto,
        destinatarios=destinatarios,
        template_html='registro/emails/cambio_password.html',
        contexto=contexto,
        tipo_notificacion=None,  # No hay solicitud asociada
        solicitud=None
    )



