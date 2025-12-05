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
    SIMPLIFICADA - Usa directamente los modelos nuevos de geografia
    """
    from apps.empresas.models import Empresa, Rubro, TipoEmpresa
    from apps.geografia.models import Departamento, Municipio, Localidad
    import logging
    
    logger = logging.getLogger(__name__)
    
    # ✅ BUSCAR departamento directamente (modelos nuevos)
    departamento = None
    try:
        departamento_valor = solicitud.departamento.strip()
        
        # Si es un ID numérico, buscar por ID
        if departamento_valor.isdigit():
            departamento = Departamento.objects.filter(id=departamento_valor).first()
        
        # Si no, buscar por nombre
        if not departamento:
            departamento = Departamento.objects.filter(nombre__iexact=departamento_valor).first()
        
        if not departamento:
            raise ValueError(f"El departamento '{departamento_valor}' no existe en el sistema.")
        
        logger.info(f"Departamento encontrado: {departamento.nombre} (ID: {departamento.id})")
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Error al buscar departamento: {str(e)}", exc_info=True)
        raise ValueError(f"Error al buscar el departamento: {str(e)}")
    
    # ✅ BUSCAR municipio directamente
    municipio = None
    if solicitud.municipio:
        try:
            municipio_valor = solicitud.municipio.strip()
            
            if municipio_valor.isdigit():
                municipio = Municipio.objects.filter(id=municipio_valor).first()
            
            if not municipio:
                municipio = Municipio.objects.filter(
                    nombre__iexact=municipio_valor,
                    departamento=departamento
                ).first()
            
            if municipio:
                logger.info(f"Municipio encontrado: {municipio.nombre}")
        except Exception as e:
            logger.warning(f"Error al buscar municipio: {str(e)}")
            municipio = None
    
    # ✅ BUSCAR localidad directamente
    localidad = None
    if solicitud.localidad:
        try:
            localidad_valor = solicitud.localidad.strip()
            logger.info(f"🔍 Buscando localidad: '{localidad_valor}' (tipo: {type(localidad_valor)})")
        
            # Buscar directamente por ID (puede contener letras y números)
            localidad = Localidad.objects.filter(id=localidad_valor).first()
            logger.info(f"Búsqueda por ID: {localidad}")
        
            # Si no se encontró por ID, intentar por nombre
            if not localidad:
                localidad = Localidad.objects.filter(
                    nombre__iexact=localidad_valor,
                    departamento=departamento
                ).first()
                logger.info(f"Búsqueda por nombre: {localidad}")
        
            if localidad:
                logger.info(f"✅ Localidad encontrada: {localidad.nombre} (ID: {localidad.id})")
            else:
                logger.warning(f"❌ No se encontró localidad con valor: '{localidad_valor}'")
        except Exception as e:
            logger.warning(f"Error al buscar localidad: {str(e)}")
            # No sobreescribir localidad aquí; si hubo error se queda como None
    else:
        logger.info("ℹ️ La solicitud no tiene localidad asignada")
    
    # Obtener o crear rubro
    # Para empresas mixtas, usar el rubro de productos como principal
    # Para empresas de producto o servicio únicos, usar rubro_principal
    rubro = None
    if solicitud.tipo_empresa == 'mixta' and solicitud.rubro_producto:
        # Buscar rubro de productos para empresas mixtas
        try:
            rubro = Rubro.objects.get(nombre=solicitud.rubro_producto)
        except Rubro.DoesNotExist:
            # Si no existe, crear uno nuevo
            try:
                rubro = Rubro.objects.create(
                    nombre=solicitud.rubro_producto,
                    descripcion=solicitud.descripcion_actividad or '',
                    tipo='mixto'
                )
            except Exception as e:
                logger.error(f"Error al crear rubro: {str(e)}", exc_info=True)
                # Si falla la creación, intentar obtener cualquier rubro existente como fallback
                rubro = Rubro.objects.filter(activo=True).first()
                if not rubro:
                    raise ValueError(f"No se pudo crear ni encontrar un rubro válido: {str(e)}")
    else:
        # Para empresas de producto o servicio únicos, usar rubro_principal
        try:
            rubro = Rubro.objects.get(nombre=solicitud.rubro_principal)
        except Rubro.DoesNotExist:
            # Si no existe, crear uno nuevo
            try:
                rubro = Rubro.objects.create(
                    nombre=solicitud.rubro_principal,
                    descripcion=solicitud.descripcion_actividad or ''
                )
            except Exception as e:
                logger.error(f"Error al crear rubro: {str(e)}", exc_info=True)
                # Si falla la creación, intentar obtener cualquier rubro existente como fallback
                rubro = Rubro.objects.filter(activo=True).first()
                if not rubro:
                    raise ValueError(f"No se pudo crear ni encontrar un rubro válido: {str(e)}")
    
    if not rubro:
        raise ValueError("No se pudo obtener o crear un rubro para la empresa")
    
    from apps.empresas.models import SubRubro

    id_subrubro = None
    id_subrubro_producto = None
    id_subrubro_servicio = None

    if solicitud.tipo_empresa == 'mixta':
        # Para empresas mixtas, buscar subrubros de productos y servicios
        if solicitud.sub_rubro_producto:
            try:
                # Buscar subrubro de productos por nombre dentro del rubro
                id_subrubro_producto = SubRubro.objects.filter(
                    rubro=rubro,
                    nombre__iexact=solicitud.sub_rubro_producto,
                    activo=True
                ).first()
                if not id_subrubro_producto:
                    logger.warning(f"Subrubro de productos '{solicitud.sub_rubro_producto}' no encontrado en rubro '{rubro.nombre}'")
            except Exception as e:
                logger.error(f"Error al buscar subrubro de productos: {str(e)}")
    
        if solicitud.sub_rubro_servicio:
            try:
                # Para servicios, necesitamos el rubro de servicios
                # Si la solicitud tiene rubro_servicio, buscar ese rubro primero
                rubro_servicio = None
                if solicitud.rubro_servicio:
                    try:
                        rubro_servicio = Rubro.objects.get(nombre=solicitud.rubro_servicio)
                    except Rubro.DoesNotExist:
                        logger.warning(f"Rubro de servicios '{solicitud.rubro_servicio}' no encontrado")
            
                if rubro_servicio:
                    id_subrubro_servicio = SubRubro.objects.filter(
                        rubro=rubro_servicio,
                        nombre__iexact=solicitud.sub_rubro_servicio,
                        activo=True
                    ).first()
                    if not id_subrubro_servicio:
                        logger.warning(f"Subrubro de servicios '{solicitud.sub_rubro_servicio}' no encontrado en rubro '{rubro_servicio.nombre}'")
            except Exception as e:
                logger.error(f"Error al buscar subrubro de servicios: {str(e)}")
    else:
    # Para empresas de producto o servicio único
        if solicitud.sub_rubro:
            try:
                id_subrubro = SubRubro.objects.filter(
                    rubro=rubro,
                    nombre__iexact=solicitud.sub_rubro,
                    activo=True
                ).first()
                if not id_subrubro:
                    logger.warning(f"Subrubro '{solicitud.sub_rubro}' no encontrado en rubro '{rubro.nombre}'")
            except Exception as e:
                logger.error(f"Error al buscar subrubro: {str(e)}")
    
    # Obtener o crear tipo de empresa
    tipo_empresa_nombre = solicitud.tipo_empresa.title() if solicitud.tipo_empresa else 'Producto'
    tipo_empresa, _ = TipoEmpresa.objects.get_or_create(
        nombre=tipo_empresa_nombre
    )
    
    # Crear usuario para la empresa
    from django.contrib.auth import get_user_model
    from apps.core.models import RolUsuario
    User = get_user_model()
    
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
    
    # Verificar si ya existe un usuario con este email
    usuario_empresa = None
    try:
        usuario_empresa = User.objects.get(email=solicitud.correo)
        usuario_empresa.nombre = solicitud.nombre_contacto
        usuario_empresa.apellido = solicitud.cargo_contacto
        usuario_empresa.rol = rol_empresa
        usuario_empresa.telefono = solicitud.telefono_contacto
        usuario_empresa.departamento = solicitud.departamento
        usuario_empresa.municipio = solicitud.municipio
        usuario_empresa.localidad = solicitud.localidad
        usuario_empresa.is_active = True
        usuario_empresa.save()
        logger.info(f"Usuario existente actualizado: {usuario_empresa.email}")
    except User.DoesNotExist:
        usuario_empresa = User.objects.create_user(
            email=solicitud.correo,
            password=solicitud.cuit_cuil,
            nombre=solicitud.nombre_contacto,
            apellido=solicitud.cargo_contacto,
            rol=rol_empresa,
            telefono=solicitud.telefono_contacto,
            departamento=solicitud.departamento,
            municipio=solicitud.municipio,
            localidad=solicitud.localidad,
            is_active=True
        )
        logger.info(f"Nuevo usuario creado: {usuario_empresa.email}")
    
    # Preparar datos comunes para la empresa
    exporta_value = 'Sí' if solicitud.exporta == 'si' else ('No, solo ventas nacionales' if solicitud.exporta == 'no' else 'No, solo ventas locales')
    if len(exporta_value) > 50:
        exporta_value = exporta_value[:50]
    
    # Normalizar CUIT para que coincida con el formato de la solicitud (sin guiones ni espacios)
    cuit_normalizado = str(solicitud.cuit_cuil).replace('-', '').replace(' ', '').strip()
    
    empresa_kwargs = {
        'razon_social': solicitud.razon_social,
        'nombre_fantasia': solicitud.nombre_fantasia,
        'tipo_sociedad': solicitud.tipo_sociedad,
        'cuit_cuil': cuit_normalizado,
        'direccion': solicitud.direccion,
        'codigo_postal': solicitud.codigo_postal,
        # Direccion comercial desde la solicitud
        'direccion_comercial': getattr(solicitud, 'direccion_comercial', None) or None,
        'codigo_postal_comercial': getattr(solicitud, 'codigo_postal_comercial', None) or None,
        'departamento': departamento,  
        'municipio': municipio,  
        'localidad': localidad,  
        'telefono': solicitud.telefono,
        'correo': solicitud.correo,
        'sitioweb': solicitud.sitioweb,
        'exporta': exporta_value,
        'destinoexporta': solicitud.destino_exportacion[:200] if solicitud.destino_exportacion else None,
        'importa': True if solicitud.importa == 'si' else False,
        'certificadopyme': True if solicitud.certificado_pyme == 'si' else False,
        'certificaciones': solicitud.certificaciones[:500] if solicitud.certificaciones else None,
        'promo2idiomas': True if solicitud.material_promocional_idiomas == 'si' else False,
        'idiomas_trabaja': (solicitud.idiomas_trabajo[:100] if solicitud.idiomas_trabajo else None),
        'contacto_principal_nombre': (solicitud.nombre_contacto[:100] if solicitud.nombre_contacto else ''),
        'contacto_principal_cargo': (solicitud.cargo_contacto[:100] if solicitud.cargo_contacto else ''),
        'contacto_principal_telefono': (solicitud.telefono_contacto[:20] if solicitud.telefono_contacto else ''),
        'contacto_principal_email': (solicitud.email_contacto or solicitud.correo),
        'id_usuario': usuario_empresa,
        'id_rubro': rubro,
        'id_subrubro': id_subrubro,
        'id_subrubro_producto': id_subrubro_producto,
        'id_subrubro_servicio': id_subrubro_servicio,
        'tipo_empresa': tipo_empresa,
        # Registrar y mapear actividades de promoción desde la solicitud
        'actividades_promocion_internacional': solicitud.actividades_promocion if solicitud.actividades_promocion else None,
        # Mapear geolocalizacion (puede venir como string "lat,lng" o como objeto)
        'geolocalizacion': None,
    }
    # Loguear detalle de actividades para debugging
    try:
        logger.info(f"[Registro->Empresa] Solicitud ID={solicitud.id} actividades_promocion (raw): {repr(solicitud.actividades_promocion)}")
        logger.info(f"[Registro->Empresa] Tipo de datos: {type(solicitud.actividades_promocion)}")
        if solicitud.actividades_promocion:
            logger.info(f"[Registro->Empresa] Cantidad de actividades: {len(solicitud.actividades_promocion)}")
    except Exception:
        logger.exception("Error al loguear actividades_promocion de la solicitud")

    # Log y normalización de geolocalizacion
    try:
        geo_raw = solicitud.geolocalizacion
        logger.info(f"[Registro->Empresa] Solicitud ID={solicitud.id} geolocalizacion (raw): {repr(geo_raw)} (tipo: {type(geo_raw)})")
        geo_value = None
        if geo_raw:
            # Si es tipo dict con lat/lng
            if isinstance(geo_raw, dict):
                lat = geo_raw.get('lat') or geo_raw.get('latitude')
                lng = geo_raw.get('lng') or geo_raw.get('lon') or geo_raw.get('longitude')
                try:
                    geo_value = f"{float(lat)},{float(lng)}"
                except Exception:
                    geo_value = None
            elif isinstance(geo_raw, str):
                # Normalizar espacios y comas
                geo_value = geo_raw.strip()
            else:
                # Otros tipos: intentar convertir a string
                try:
                    geo_value = str(geo_raw)
                except Exception:
                    geo_value = None

        if geo_value:
            empresa_kwargs['geolocalizacion'] = geo_value
            logger.info(f"[Registro->Empresa] Geolocalizacion normalizada para empresa: {geo_value}")
        else:
            logger.info(f"[Registro->Empresa] No se encontró geolocalizacion válida en la solicitud ID={solicitud.id}")
    except Exception:
        logger.exception("Error al procesar geolocalizacion de la solicitud")

    # Mapear redes sociales desde la solicitud hacia el campo redes_sociales de la empresa
    try:
        social = {}
        if getattr(solicitud, 'instagram', None):
            social['instagram'] = solicitud.instagram
        if getattr(solicitud, 'facebook', None):
            social['facebook'] = solicitud.facebook
        if getattr(solicitud, 'linkedin', None):
            social['linkedin'] = solicitud.linkedin
        if social:
            import json
            empresa_kwargs['redes_sociales'] = json.dumps(social, ensure_ascii=False)
            logger.info(f"[Registro->Empresa] Redes sociales mapeadas: {social}")
    except Exception:
        logger.exception("Error al mapear redes sociales desde la solicitud")
    
    if solicitud.catalogo_pdf:
        empresa_kwargs['brochure'] = solicitud.catalogo_pdf
    
    tipo_empresa_value = solicitud.tipo_empresa or 'producto'
    empresa_kwargs['tipo_empresa_valor'] = tipo_empresa_value
    
    solicitud.refresh_from_db()
    if solicitud.aprobado_por:
        empresa_kwargs['creado_por'] = solicitud.aprobado_por
        empresa_kwargs['actualizado_por'] = solicitud.aprobado_por
    else:
        empresa_kwargs['creado_por'] = usuario_empresa
        empresa_kwargs['actualizado_por'] = usuario_empresa
    
    empresa = None
    
    if tipo_empresa_value == 'producto':
        # Filtrar claves que no existan en la tabla para evitar errores si las migraciones no se aplicaron
        from django.core.exceptions import FieldDoesNotExist
        def column_exists(model, field_name):
            """Return True if model has the given field name (including FK _id)."""
            try:
                model._meta.get_field(field_name)
                return True
            except Exception:
                # try FK column form
                try:
                    model._meta.get_field(f"{field_name}_id")
                    return True
                except Exception:
                    return False

        filtered_kwargs = {}
        for k, v in empresa_kwargs.items():
            if isinstance(k, str) and column_exists(Empresa, k):
                filtered_kwargs[k] = v
        empresa = Empresa.objects.create(**filtered_kwargs)
        from apps.empresas.models import ProductoEmpresa, PosicionArancelaria
        if solicitud.productos:
            for producto_data in solicitud.productos:
                producto = ProductoEmpresa.objects.create(
            empresa=empresa,
            nombre_producto=producto_data.get('nombre', ''),
            descripcion=producto_data.get('descripcion', ''),
            capacidad_productiva=float(producto_data.get('capacidad_productiva', 0)) if producto_data.get('capacidad_productiva') else None,
            unidad_medida=producto_data.get('unidad_medida', 'kg'),
            periodo_capacidad=producto_data.get('periodo_capacidad', 'mensual'),
        )
        if producto_data.get('posicion_arancelaria'):
            PosicionArancelaria.objects.create(
                producto=producto,
                codigo_arancelario=producto_data.get('posicion_arancelaria', ''),
                descripcion_arancelaria=producto_data.get('descripcion_arancelaria', ''),
            )
                
    elif tipo_empresa_value == 'servicio':
        # Filtrar claves por columnas existentes antes de crear

        from django.core.exceptions import FieldDoesNotExist
        def column_exists(model, field_name):
            try:
                model._meta.get_field(field_name)
                return True
            except Exception:
                try:
                    model._meta.get_field(f"{field_name}_id")
                    return True
                except Exception:
                    return False

        filtered_kwargs = {}
        for k, v in empresa_kwargs.items():
            if isinstance(k, str) and column_exists(Empresa, k):
                filtered_kwargs[k] = v
        empresa = Empresa.objects.create(**filtered_kwargs)
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
        # Filtrar claves por columnas existentes antes de crear

        from django.core.exceptions import FieldDoesNotExist
        def column_exists(model, field_name):
            try:
                model._meta.get_field(field_name)
                return True
            except Exception:
                try:
                    model._meta.get_field(f"{field_name}_id")
                    return True
                except Exception:
                    return False

        filtered_kwargs = {}
        for k, v in empresa_kwargs.items():
            if isinstance(k, str) and column_exists(Empresa, k):
                filtered_kwargs[k] = v
        empresa = Empresa.objects.create(**filtered_kwargs)
        from apps.empresas.models import ProductoEmpresaMixta, ServicioEmpresaMixta, PosicionArancelariaMixta
        if solicitud.productos:
            for producto_data in solicitud.productos:
                producto = ProductoEmpresaMixta.objects.create(
            empresa=empresa,
            nombre_producto=producto_data.get('nombre', ''),
            descripcion=producto_data.get('descripcion', ''),
            capacidad_productiva=float(producto_data.get('capacidad_productiva', 0)) if producto_data.get('capacidad_productiva') else None,
            unidad_medida=producto_data.get('unidad_medida', 'kg'),
            periodo_capacidad=producto_data.get('periodo_capacidad', 'mensual'),
        )
        if producto_data.get('posicion_arancelaria'):
            PosicionArancelariaMixta.objects.create(
                producto=producto,
                codigo_arancelario=producto_data.get('posicion_arancelaria', ''),
                descripcion_arancelaria=producto_data.get('descripcion_arancelaria', ''),
            )
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
    
    # Crear matriz de clasificación
    from apps.empresas.models import MatrizClasificacionExportador
    from apps.empresas.utils import calcular_puntajes_matriz
    
    try:
        resultado = calcular_puntajes_matriz(empresa)
        puntajes = resultado.get('puntajes', {})
        
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
        
        matriz_kwargs['empresa'] = empresa
        
        matriz, created = MatrizClasificacionExportador.objects.update_or_create(
            empresa=empresa,
            defaults=matriz_kwargs
        )
        
        logger.info(f"Matriz de clasificación {'creada' if created else 'actualizada'} para empresa ID={empresa.id}")
    except Exception as e:
        logger.error(f"Error al crear matriz de clasificación: {str(e)}", exc_info=True)
    
    logger.info(f"✅ Empresa creada: ID={empresa.id}, Razón Social={empresa.razon_social}, Departamento={departamento.nombre}")
    return empresa