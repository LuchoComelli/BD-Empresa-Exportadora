from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro
from .forms import SolicitudRegistroForm, DocumentoSolicitudForm, RegistroUsuarioForm
import uuid

def registro_empresa(request):
    """
    Vista para registro público de empresas
    """
    if request.method == 'POST':
        form = SolicitudRegistroForm(request.POST)
        if form.is_valid():
            solicitud = form.save(commit=False)
            solicitud.token_confirmacion = str(uuid.uuid4())
            solicitud.save()
            
            # Enviar email de confirmación
            enviar_email_confirmacion(solicitud)
            
            messages.success(
                request, 
                'Solicitud enviada correctamente. Revise su email para confirmar el registro.'
            )
            return redirect('registro:confirmacion_enviada', solicitud.id)
    else:
        form = SolicitudRegistroForm()
    
    context = {
        'form': form,
    }
    return render(request, 'registro/registro_empresa.html', context)

def confirmacion_enviada(request, solicitud_id):
    """
    Vista de confirmación enviada
    """
    solicitud = get_object_or_404(SolicitudRegistro, id=solicitud_id)
    context = {
        'solicitud': solicitud,
    }
    return render(request, 'registro/confirmacion_enviada.html', context)

def confirmar_email(request, token):
    """
    Vista para confirmar email
    """
    try:
        solicitud = SolicitudRegistro.objects.get(token_confirmacion=token)
        if not solicitud.email_confirmado:
            solicitud.email_confirmado = True
            solicitud.fecha_confirmacion = timezone.now()
            solicitud.save()
            
            # Crear notificación
            NotificacionRegistro.objects.create(
                solicitud=solicitud,
                tipo='confirmacion',
                asunto='Email confirmado',
                mensaje='Su email ha sido confirmado correctamente. Su solicitud será revisada por nuestros administradores.'
            )
            
            messages.success(request, 'Email confirmado correctamente.')
        else:
            messages.info(request, 'Este email ya fue confirmado anteriormente.')
    except SolicitudRegistro.DoesNotExist:
        messages.error(request, 'Token de confirmación inválido.')
    
    return redirect('registro:estado_solicitud', solicitud.id)

def estado_solicitud(request, solicitud_id):
    """
    Vista para ver estado de la solicitud
    """
    solicitud = get_object_or_404(SolicitudRegistro, id=solicitud_id)
    context = {
        'solicitud': solicitud,
    }
    return render(request, 'registro/estado_solicitud.html', context)

@login_required
def listar_solicitudes(request):
    """
    Vista para listar solicitudes (solo administradores)
    """
    if not request.user.rol or not request.user.rol.puede_gestionar_usuarios:
        messages.error(request, 'No tiene permisos para acceder a esta sección.')
        return redirect('core:dashboard')
    
    solicitudes = SolicitudRegistro.objects.all()
    estado = request.GET.get('estado')
    if estado:
        solicitudes = solicitudes.filter(estado=estado)
    
    context = {
        'solicitudes': solicitudes,
    }
    return render(request, 'registro/listar_solicitudes.html', context)

@login_required
def detalle_solicitud(request, solicitud_id):
    """
    Vista para ver detalle de solicitud
    """
    if not request.user.rol or not request.user.rol.puede_gestionar_usuarios:
        messages.error(request, 'No tiene permisos para acceder a esta sección.')
        return redirect('core:dashboard')
    
    solicitud = get_object_or_404(SolicitudRegistro, id=solicitud_id)
    documentos = solicitud.documentos.all()
    
    if request.method == 'POST':
        accion = request.POST.get('accion')
        observaciones = request.POST.get('observaciones', '')
        
        if accion == 'aprobar':
            solicitud.estado = 'aprobada'
            solicitud.fecha_aprobacion = timezone.now()
            solicitud.aprobado_por = request.user
            solicitud.observaciones_admin = observaciones
            solicitud.save()
            
            # Crear empresa
            empresa = crear_empresa_desde_solicitud(solicitud)
            solicitud.empresa_creada = empresa
            solicitud.save()
            
            # Enviar email de aprobación
            enviar_email_aprobacion(solicitud)
            
            messages.success(request, 'Solicitud aprobada correctamente.')
        elif accion == 'rechazar':
            solicitud.estado = 'rechazada'
            solicitud.observaciones_admin = observaciones
            solicitud.save()
            
            # Enviar email de rechazo
            enviar_email_rechazo(solicitud)
            
            messages.success(request, 'Solicitud rechazada.')
        
        return redirect('registro:detalle_solicitud', solicitud.id)
    
    context = {
        'solicitud': solicitud,
        'documentos': documentos,
    }
    return render(request, 'registro/detalle_solicitud.html', context)

def subir_documento(request, solicitud_id):
    """
    Vista para subir documentos
    """
    solicitud = get_object_or_404(SolicitudRegistro, id=solicitud_id)
    
    if request.method == 'POST':
        form = DocumentoSolicitudForm(request.POST, request.FILES)
        if form.is_valid():
            documento = form.save(commit=False)
            documento.solicitud = solicitud
            documento.save()
            messages.success(request, 'Documento subido correctamente.')
            return redirect('registro:estado_solicitud', solicitud.id)
    else:
        form = DocumentoSolicitudForm()
    
    context = {
        'form': form,
        'solicitud': solicitud,
    }
    return render(request, 'registro/subir_documento.html', context)

def registro_usuario(request):
    """
    Vista para registro de usuarios del sistema (privado)
    """
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Usuario registrado correctamente.')
            return redirect('core:dashboard')
    else:
        form = RegistroUsuarioForm()
    
    context = {
        'form': form,
    }
    return render(request, 'registro/registro_usuario.html', context)

# Funciones auxiliares

def enviar_email_confirmacion(solicitud):
    """
    Enviar email de confirmación
    """
    subject = 'Confirmación de Registro - BD Empresa Exportadora'
    message = render_to_string('registro/emails/confirmacion.html', {
        'solicitud': solicitud,
        'confirm_url': f"{settings.SITE_URL}/registro/confirmar/{solicitud.token_confirmacion}/"
    })
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [solicitud.correo],
            html_message=message,
            fail_silently=False,
        )
        
        # Crear notificación
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='confirmacion',
            asunto=subject,
            mensaje=message,
            email_enviado=True,
            fecha_envio=timezone.now()
        )
    except Exception as e:
        # Crear notificación de error
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='confirmacion',
            asunto=subject,
            mensaje=message,
            email_enviado=False,
            error_envio=str(e)
        )

def enviar_email_aprobacion(solicitud):
    """
    Enviar email de aprobación
    """
    subject = 'Solicitud Aprobada - BD Empresa Exportadora'
    message = render_to_string('registro/emails/aprobacion.html', {
        'solicitud': solicitud,
    })
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [solicitud.correo],
            html_message=message,
            fail_silently=False,
        )
        
        # Crear notificación
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='aprobacion',
            asunto=subject,
            mensaje=message,
            email_enviado=True,
            fecha_envio=timezone.now()
        )
    except Exception as e:
        # Crear notificación de error
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='aprobacion',
            asunto=subject,
            mensaje=message,
            email_enviado=False,
            error_envio=str(e)
        )

def enviar_email_rechazo(solicitud):
    """
    Enviar email de rechazo
    """
    subject = 'Solicitud Rechazada - BD Empresa Exportadora'
    message = render_to_string('registro/emails/rechazo.html', {
        'solicitud': solicitud,
    })
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [solicitud.correo],
            html_message=message,
            fail_silently=False,
        )
        
        # Crear notificación
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='rechazo',
            asunto=subject,
            mensaje=message,
            email_enviado=True,
            fecha_envio=timezone.now()
        )
    except Exception as e:
        # Crear notificación de error
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='rechazo',
            asunto=subject,
            mensaje=message,
            email_enviado=False,
            error_envio=str(e)
        )

def crear_empresa_desde_solicitud(solicitud):
    """
    Crear empresa desde solicitud aprobada
    """
    # Obtener o crear departamento
    from apps.core.models import Dpto, Municipio, Localidades
    dpto, _ = Dpto.objects.get_or_create(
        nomdpto=solicitud.departamento,
        defaults={'coddpto': solicitud.departamento[:3].upper()}
    )
    
    # Obtener o crear municipio
    municipio = None
    if solicitud.municipio:
        municipio, _ = Municipio.objects.get_or_create(
            nommun=solicitud.municipio,
            dpto=dpto
        )
    
    # Obtener o crear localidad
    localidad = None
    if solicitud.localidad and municipio:
        localidad, _ = Localidades.objects.get_or_create(
            nomloc=solicitud.localidad,
            municipio=municipio,
            defaults={'latitud': -34.6037, 'longitud': -58.3816}
        )
    
    # Obtener o crear rubro
    from apps.empresas.models import Rubro, TipoEmpresa
    rubro, _ = Rubro.objects.get_or_create(
        nombre=solicitud.rubro_principal,
        defaults={'descripcion': solicitud.descripcion_actividad}
    )
    
    # Obtener tipo de empresa
    tipo_empresa = TipoEmpresa.objects.get(nombre=solicitud.tipo_empresa.title())
    
    # Crear usuario para la empresa
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Crear usuario con rol de empresa
    rol_empresa, _ = RolUsuario.objects.get_or_create(
        nombre='Empresa',
        defaults={
            'descripcion': 'Rol para empresas registradas',
            'nivel_acceso': 1,
            'puede_crear_empresas': False,
            'puede_editar_empresas': True,
            'puede_eliminar_empresas': False,
            'puede_ver_auditoria': False,
            'puede_exportar_datos': True,
            'puede_importar_datos': False,
            'puede_gestionar_usuarios': False,
            'puede_acceder_admin': False,
        }
    )
    
    usuario_empresa = User.objects.create_user(
        email=solicitud.correo,
        nombre=solicitud.nombre_contacto,
        apellido=solicitud.cargo_contacto,
        rol=rol_empresa,
        telefono=solicitud.telefono_contacto,
        departamento=solicitud.departamento,
        municipio=solicitud.municipio,
        localidad=solicitud.localidad
    )
    
    # Crear empresa según tipo
    if solicitud.tipo_empresa == 'producto':
        empresa = Empresaproducto.objects.create(
            razon_social=solicitud.razon_social,
            cuit_cuil=solicitud.cuit_cuil,
            direccion=solicitud.direccion,
            departamento=dpto,
            municipio=municipio,
            localidad=localidad,
            telefono=solicitud.telefono,
            correo=solicitud.correo,
            sitioweb=solicitud.sitioweb,
            exporta=solicitud.exporta,
            destinoexporta=solicitud.destino_exportacion,
            importa=solicitud.importa,
            tipoimporta=solicitud.tipo_importacion,
            certificadopyme=solicitud.certificado_pyme,
            certificaciones=solicitud.certificaciones,
            promo2idiomas=solicitud.material_promocional_idiomas,
            idiomas_trabaja=solicitud.idiomas_trabajo,
            id_usuario=usuario_empresa,
            id_rubro=rubro,
            tipo_empresa=tipo_empresa
        )
    elif solicitud.tipo_empresa == 'servicio':
        empresa = Empresaservicio.objects.create(
            razon_social=solicitud.razon_social,
            cuit_cuil=solicitud.cuit_cuil,
            direccion=solicitud.direccion,
            departamento=dpto,
            municipio=municipio,
            localidad=localidad,
            telefono=solicitud.telefono,
            correo=solicitud.correo,
            sitioweb=solicitud.sitioweb,
            exporta=solicitud.exporta,
            destinoexporta=solicitud.destino_exportacion,
            importa=solicitud.importa,
            tipoimporta=solicitud.tipo_importacion,
            certificadopyme=solicitud.certificado_pyme,
            certificaciones=solicitud.certificaciones,
            promo2idiomas=solicitud.material_promocional_idiomas,
            idiomas_trabaja=solicitud.idiomas_trabajo,
            id_usuario=usuario_empresa,
            id_rubro=rubro,
            tipo_empresa=tipo_empresa
        )
    else:  # mixta
        empresa = EmpresaMixta.objects.create(
            razon_social=solicitud.razon_social,
            cuit_cuil=solicitud.cuit_cuil,
            direccion=solicitud.direccion,
            departamento=dpto,
            municipio=municipio,
            localidad=localidad,
            telefono=solicitud.telefono,
            correo=solicitud.correo,
            sitioweb=solicitud.sitioweb,
            exporta=solicitud.exporta,
            destinoexporta=solicitud.destino_exportacion,
            importa=solicitud.importa,
            tipoimporta=solicitud.tipo_importacion,
            certificadopyme=solicitud.certificado_pyme,
            certificaciones=solicitud.certificaciones,
            promo2idiomas=solicitud.material_promocional_idiomas,
            idiomas_trabaja=solicitud.idiomas_trabajo,
            id_usuario=usuario_empresa,
            id_rubro=rubro,
            tipo_empresa=tipo_empresa
        )
    
    return empresa