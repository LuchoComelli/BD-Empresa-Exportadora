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
    # Importar modelos de empresas al inicio
    from apps.empresas.models import (
        Empresa, Rubro, TipoEmpresa
    )
    
    # Obtener o crear departamento
    from apps.core.models import Dpto, Municipio, Localidades
    dpto, _ = Dpto.objects.get_or_create(
        nomdpto=solicitud.departamento,
        defaults={'coddpto': solicitud.departamento[:3].upper()}
    )
    
    # Obtener o crear municipio
    municipio = None
    if solicitud.municipio:
        # Generar un código único para el municipio basado en el nombre y departamento
        import uuid
        dpto_cod = dpto.coddpto[:3] if hasattr(dpto, 'coddpto') and dpto.coddpto else ''
        mun_nombre = solicitud.municipio[:5].upper().replace(' ', '')
        codmun_base = mun_nombre + dpto_cod if dpto_cod else mun_nombre
        codmun = codmun_base[:10] if codmun_base else str(uuid.uuid4())[:10]  # Si está vacío, usar UUID
        
        # Asegurar que el código no esté vacío
        if not codmun or codmun.strip() == '':
            codmun = str(uuid.uuid4())[:10]
        
        # Buscar si ya existe un municipio con este nombre y departamento
        try:
            municipio = Municipio.objects.get(
                nommun=solicitud.municipio,
                dpto=dpto
            )
        except Municipio.DoesNotExist:
            # Si no existe, crear uno nuevo con un código único
            # Intentar crear con el código base, si falla por duplicado, agregar un sufijo único
            codmun_final = codmun
            counter = 1
            while Municipio.objects.filter(codmun=codmun_final).exists() or codmun_final == '':
                if codmun_final == '' or counter > 999:
                    # Si está vacío o hay demasiados intentos, usar un UUID truncado
                    codmun_final = str(uuid.uuid4())[:10]
                    break
                codmun_final = codmun[:7] + str(counter).zfill(3)
                counter += 1
            
            municipio = Municipio.objects.create(
                nommun=solicitud.municipio,
                dpto=dpto,
                codmun=codmun_final,
                coddpto=dpto.coddpto if hasattr(dpto, 'coddpto') and dpto.coddpto else '',
                codprov=''
            )
    
    # Obtener o crear localidad
    localidad = None
    if solicitud.localidad and municipio:
        # Generar un código único para la localidad basado en el nombre y municipio
        import uuid
        codloc_base = solicitud.localidad[:10].upper().replace(' ', '') + municipio.codmun[:5]
        codloc = codloc_base[:20]  # Asegurar que no exceda 20 caracteres
        
        # Buscar si ya existe una localidad con este nombre y municipio
        try:
            localidad = Localidades.objects.get(
                nomloc=solicitud.localidad,
                municipio=municipio
            )
        except Localidades.DoesNotExist:
            # Si no existe, crear una nueva con un código único
            # Intentar crear con el código base, si falla por duplicado, agregar un sufijo único
            codloc_final = codloc
            counter = 1
            while Localidades.objects.filter(codloc=codloc_final).exists():
                codloc_final = codloc[:15] + str(counter).zfill(5)
                counter += 1
            
            localidad = Localidades.objects.create(
                nomloc=solicitud.localidad,
                municipio=municipio,
                codloc=codloc_final,
                codlocsv='',
                codmun=municipio.codmun if hasattr(municipio, 'codmun') else '',
                coddpto=dpto.coddpto if hasattr(dpto, 'coddpto') else '',
                codprov='',
                codpais='ARG',
                latitud=-34.6037,
                longitud=-58.3816
            )
    
    # Obtener o crear rubro (ya importado arriba)
    rubro, _ = Rubro.objects.get_or_create(
        nombre=solicitud.rubro_principal,
        defaults={'descripcion': solicitud.descripcion_actividad}
    )
    
    # Obtener o crear tipo de empresa
    tipo_empresa_nombre = solicitud.tipo_empresa.title() if solicitud.tipo_empresa else 'Producto'
    tipo_empresa, _ = TipoEmpresa.objects.get_or_create(
        nombre=tipo_empresa_nombre
    )
    
    # Crear usuario para la empresa
    from django.contrib.auth import get_user_model
    from apps.core.models import RolUsuario
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
    
    # Verificar si ya existe un usuario con este email (creado durante el registro)
    usuario_empresa = None
    try:
        usuario_empresa = User.objects.get(email=solicitud.correo)
        # Actualizar el usuario existente
        usuario_empresa.nombre = solicitud.nombre_contacto
        usuario_empresa.apellido = solicitud.cargo_contacto
        usuario_empresa.rol = rol_empresa
        usuario_empresa.telefono = solicitud.telefono_contacto
        usuario_empresa.departamento = solicitud.departamento
        usuario_empresa.municipio = solicitud.municipio
        usuario_empresa.localidad = solicitud.localidad
        usuario_empresa.is_active = True  # Activar usuario al aprobar
        usuario_empresa.save()
    except User.DoesNotExist:
        # Si no existe, crear nuevo usuario
        usuario_empresa = User.objects.create_user(
            email=solicitud.correo,
            password=solicitud.cuit_cuil,  # Contraseña inicial es el CUIT
            nombre=solicitud.nombre_contacto,
            apellido=solicitud.cargo_contacto,
            rol=rol_empresa,
            telefono=solicitud.telefono_contacto,
            departamento=solicitud.departamento,
            municipio=solicitud.municipio,
            localidad=solicitud.localidad,
            is_active=True  # Activar usuario al aprobar
        )
    
    # Preparar datos comunes para la empresa
    empresa_kwargs = {
        'razon_social': solicitud.razon_social,
        'cuit_cuil': solicitud.cuit_cuil,
        'direccion': solicitud.direccion,
        'departamento': dpto,
        'municipio': municipio,
        'localidad': localidad,
        'telefono': solicitud.telefono,
        'correo': solicitud.correo,
        'sitioweb': solicitud.sitioweb,
        'exporta': 'Sí' if solicitud.exporta == 'si' else 'No, solo ventas nacionales',
        'destinoexporta': solicitud.destino_exportacion,
        'importa': True if solicitud.importa == 'si' else False,
        'certificadopyme': True if solicitud.certificado_pyme == 'si' else False,
        'certificaciones': solicitud.certificaciones,
        'promo2idiomas': True if solicitud.material_promocional_idiomas == 'si' else False,
        'idiomas_trabaja': solicitud.idiomas_trabajo,
        'id_usuario': usuario_empresa,
        'id_rubro': rubro,
        'tipo_empresa': tipo_empresa,
    }
    
    # Agregar catálogo PDF si existe
    if solicitud.catalogo_pdf:
        empresa_kwargs['brochure'] = solicitud.catalogo_pdf
    
    # Crear empresa según tipo usando el modelo unificado
    tipo_empresa_value = solicitud.tipo_empresa or 'producto'
    empresa_kwargs['tipo_empresa_valor'] = tipo_empresa_value
    
    # Establecer campos de auditoría (creado_por y actualizado_por)
    # Si hay un usuario que aprobó la solicitud, usarlo; sino, usar el usuario de la empresa
    # Recargar la solicitud para obtener el aprobado_por actualizado
    solicitud.refresh_from_db()
    if solicitud.aprobado_por:
        empresa_kwargs['creado_por'] = solicitud.aprobado_por
        empresa_kwargs['actualizado_por'] = solicitud.aprobado_por
    else:
        empresa_kwargs['creado_por'] = usuario_empresa
        empresa_kwargs['actualizado_por'] = usuario_empresa
    
    empresa = None
    
    if tipo_empresa_value == 'producto':
        empresa = Empresa.objects.create(**empresa_kwargs)
        # Crear productos en la tabla ProductoEmpresa
        from apps.empresas.models import ProductoEmpresa, PosicionArancelaria
        if solicitud.productos:
            for producto_data in solicitud.productos:
                producto = ProductoEmpresa.objects.create(
                    empresa=empresa,
                    nombre_producto=producto_data.get('nombre', ''),
                    descripcion=producto_data.get('descripcion', ''),
                    capacidad_productiva=float(producto_data.get('capacidad_productiva', 0)) if producto_data.get('capacidad_productiva') else None,
                )
                # Crear posición arancelaria si existe
                if producto_data.get('posicion_arancelaria'):
                    PosicionArancelaria.objects.create(
                        producto=producto,
                        codigo_arancelario=producto_data.get('posicion_arancelaria', ''),
                    )
                
    elif tipo_empresa_value == 'servicio':
        empresa = Empresa.objects.create(**empresa_kwargs)
        # Crear servicios en la tabla ServicioEmpresa
        from apps.empresas.models import ServicioEmpresa
        if solicitud.servicios_ofrecidos:
            servicios_data = solicitud.servicios_ofrecidos
            if isinstance(servicios_data, dict):
                ServicioEmpresa.objects.create(
                    empresa=empresa,
                    nombre_servicio=servicios_data.get('nombre', 'Servicios'),
                    descripcion=servicios_data.get('descripcion', '') or solicitud.descripcion_actividad or '',
                    tipo_servicio=servicios_data.get('tipo_servicio', 'otro'),
                    sector_atendido=servicios_data.get('sector_atendido', 'otro'),
                )
            elif isinstance(servicios_data, list):
                for servicio_data in servicios_data:
                    ServicioEmpresa.objects.create(
                        empresa=empresa,
                        nombre_servicio=servicio_data.get('nombre', ''),
                        descripcion=servicio_data.get('descripcion', ''),
                        tipo_servicio=servicio_data.get('tipo_servicio', 'otro'),
                        sector_atendido=servicio_data.get('sector_atendido', 'otro'),
                    )
                    
    else:  # mixta
        empresa = Empresa.objects.create(**empresa_kwargs)
        # Crear productos en ProductoEmpresaMixta
        from apps.empresas.models import ProductoEmpresaMixta, ServicioEmpresaMixta, PosicionArancelariaMixta
        if solicitud.productos:
            for producto_data in solicitud.productos:
                producto = ProductoEmpresaMixta.objects.create(
                    empresa=empresa,
                    nombre_producto=producto_data.get('nombre', ''),
                    descripcion=producto_data.get('descripcion', ''),
                    capacidad_productiva=float(producto_data.get('capacidad_productiva', 0)) if producto_data.get('capacidad_productiva') else None,
                )
                # Crear posición arancelaria si existe
                if producto_data.get('posicion_arancelaria'):
                    PosicionArancelariaMixta.objects.create(
                        producto=producto,
                        codigo_arancelario=producto_data.get('posicion_arancelaria', ''),
                    )
        # Crear servicios en ServicioEmpresaMixta
        if solicitud.servicios_ofrecidos:
            servicios_data = solicitud.servicios_ofrecidos
            if isinstance(servicios_data, dict):
                ServicioEmpresaMixta.objects.create(
                    empresa=empresa,
                    nombre_servicio=servicios_data.get('nombre', 'Servicios'),
                    descripcion=servicios_data.get('descripcion', '') or solicitud.descripcion_actividad or '',
                    tipo_servicio=servicios_data.get('tipo_servicio', 'otro'),
                    sector_atendido=servicios_data.get('sector_atendido', 'otro'),
                )
            elif isinstance(servicios_data, list):
                for servicio_data in servicios_data:
                    ServicioEmpresaMixta.objects.create(
                        empresa=empresa,
                        nombre_servicio=servicio_data.get('nombre', ''),
                        descripcion=servicio_data.get('descripcion', ''),
                        tipo_servicio=servicio_data.get('tipo_servicio', 'otro'),
                        sector_atendido=servicio_data.get('sector_atendido', 'otro'),
                    )
    
    # Crear matriz de clasificación automáticamente para la empresa
    from apps.empresas.models import MatrizClasificacionExportador
    from apps.empresas.utils import calcular_puntajes_matriz
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Calcular puntajes automáticamente
        resultado = calcular_puntajes_matriz(empresa)
        puntajes = resultado.get('puntajes', {})
        
        # Crear matriz de clasificación
        matriz_kwargs = {
            'experiencia_exportadora': puntajes.get('experiencia_exportadora', 0),
            'volumen_produccion': puntajes.get('volumen_produccion', 0),
            'presencia_digital': puntajes.get('presencia_digital', 0),
            'posicion_arancelaria': puntajes.get('posicion_arancelaria', 0),
            'participacion_internacionalizacion': puntajes.get('participacion_internacionalizacion', 0),
            'estructura_interna': puntajes.get('estructura_interna', 0),
            'interes_exportador': puntajes.get('interes_exportador', 0),
            'certificaciones_nacionales': puntajes.get('certificaciones_nacionales', 0),
            'certificaciones_internacionales': puntajes.get('certificaciones_internacionales', 0),
        }
        
        # Asignar la empresa usando el campo unificado
        matriz_kwargs['empresa'] = empresa
        
        # Crear o actualizar matriz (en caso de que ya exista)
        matriz, created = MatrizClasificacionExportador.objects.update_or_create(
            empresa=empresa,
            defaults=matriz_kwargs
        )
        
        logger.info(f"Matriz de clasificación {'creada' if created else 'actualizada'} para empresa ID={empresa.id}, Tipo={tipo_empresa_value}")
    except Exception as e:
        logger.error(f"Error al crear matriz de clasificación para empresa ID={empresa.id}: {str(e)}", exc_info=True)
        # No fallar la creación de la empresa si falla la matriz
    
    return empresa