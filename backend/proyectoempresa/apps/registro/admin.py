from django.contrib import admin
from django.utils.html import format_html
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro

@admin.register(SolicitudRegistro)
class SolicitudRegistroAdmin(admin.ModelAdmin):
    list_display = [
        'razon_social', 'cuit_cuil', 'tipo_empresa', 'estado', 
        'email_confirmado', 'fecha_creacion', 'aprobado_por'
    ]
    list_filter = ['estado', 'tipo_empresa', 'email_confirmado', 'fecha_creacion']
    search_fields = ['razon_social', 'cuit_cuil', 'correo', 'nombre_contacto']
    ordering = ['-fecha_creacion']
    readonly_fields = ['fecha_creacion', 'fecha_aprobacion', 'fecha_confirmacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('razon_social', 'cuit_cuil', 'direccion', 'tipo_empresa')
        }),
        ('Ubicación', {
            'fields': ('departamento', 'municipio', 'localidad')
        }),
        ('Contacto', {
            'fields': ('telefono', 'correo', 'sitioweb')
        }),
        ('Actividad', {
            'fields': ('rubro_principal', 'descripcion_actividad')
        }),
        ('Comercio Exterior', {
            'fields': ('exporta', 'destino_exportacion', 'importa', 'tipo_importacion')
        }),
        ('Certificaciones', {
            'fields': ('certificado_pyme', 'certificaciones', 'material_promocional_idiomas', 'idiomas_trabajo')
        }),
        ('Contacto Responsable', {
            'fields': ('nombre_contacto', 'cargo_contacto', 'telefono_contacto', 'email_contacto')
        }),
        ('Estado', {
            'fields': ('estado', 'email_confirmado', 'fecha_confirmacion', 'aprobado_por', 'fecha_aprobacion', 'observaciones_admin')
        }),
        ('Empresa Creada', {
            'fields': ('empresa_creada',)
        }),
    )
    
    actions = ['aprobar_solicitudes', 'rechazar_solicitudes']
    
    def aprobar_solicitudes(self, request, queryset):
        from .views import crear_empresa_desde_solicitud
        from .services import enviar_email_aprobacion
        from django.utils import timezone
        
        for solicitud in queryset:
            if solicitud.estado == 'pendiente':
                solicitud.estado = 'aprobada'
                solicitud.fecha_aprobacion = timezone.now()
                solicitud.aprobado_por = request.user
                solicitud.save()
                
                # Crear empresa
                empresa = crear_empresa_desde_solicitud(solicitud)
                solicitud.empresa_creada = empresa
                solicitud.save()
                
                # Enviar email
                try:
                    enviar_email_aprobacion(solicitud)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Error enviando email de aprobación: {str(e)}")
        
        self.message_user(request, f'{queryset.count()} solicitudes aprobadas.')
    aprobar_solicitudes.short_description = 'Aprobar solicitudes seleccionadas'
    
    def rechazar_solicitudes(self, request, queryset):
        from .services import enviar_email_rechazo
        from django.utils import timezone
        from django.db import transaction
        from apps.empresas.models import Empresa
        import logging
        
        logger = logging.getLogger(__name__)
        
        for solicitud in queryset:
            if solicitud.estado == 'pendiente':
                usuario_a_eliminar = solicitud.usuario_creado
                
                try:
                    with transaction.atomic():
                        # Guardar el rechazo
                        solicitud.estado = 'rechazada'
                        solicitud.aprobado_por = request.user
                        solicitud.save()
                        
                        # Eliminar el usuario asociado si existe
                        if usuario_a_eliminar:
                            # Verificar que el usuario no esté asociado a una empresa aprobada
                            empresa_asociada = Empresa.objects.filter(id_usuario=usuario_a_eliminar).first()
                            
                            if empresa_asociada:
                                logger.warning(
                                    f"Usuario {usuario_a_eliminar.email} tiene empresa asociada (ID: {empresa_asociada.id}), "
                                    f"no se eliminará el usuario al rechazar solicitud {solicitud.id}"
                                )
                            else:
                                # Verificar que no tenga otras solicitudes aprobadas
                                otras_solicitudes = SolicitudRegistro.objects.filter(
                                    usuario_creado=usuario_a_eliminar,
                                    estado='aprobada'
                                ).exclude(id=solicitud.id).exists()
                                
                                if otras_solicitudes:
                                    logger.warning(
                                        f"Usuario {usuario_a_eliminar.email} tiene otras solicitudes aprobadas, "
                                        f"no se eliminará el usuario al rechazar solicitud {solicitud.id}"
                                    )
                                else:
                                    # Eliminar el usuario
                                    email_usuario = usuario_a_eliminar.email
                                    usuario_a_eliminar.delete()
                                    logger.info(f"✅ Usuario {email_usuario} eliminado al rechazar solicitud {solicitud.id}")
                        
                        # Desvincular el usuario de la solicitud
                        solicitud.usuario_creado = None
                        solicitud.save()
                
                except Exception as e:
                    logger.error(f"❌ Error al rechazar solicitud {solicitud.id}: {str(e)}", exc_info=True)
                    continue
                
                # Enviar email
                try:
                    enviar_email_rechazo(solicitud)
                except Exception as e:
                    logger.warning(f"Error enviando email de rechazo: {str(e)}")
        
        self.message_user(request, f'{queryset.count()} solicitudes rechazadas.')
    rechazar_solicitudes.short_description = 'Rechazar solicitudes seleccionadas'

@admin.register(DocumentoSolicitud)
class DocumentoSolicitudAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'tipo_documento', 'nombre_archivo', 'fecha_subida']
    list_filter = ['tipo_documento', 'fecha_subida']
    search_fields = ['solicitud__razon_social', 'nombre_archivo']
    ordering = ['-fecha_subida']

@admin.register(NotificacionRegistro)
class NotificacionRegistroAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'tipo', 'asunto', 'email_enviado', 'fecha_envio']
    list_filter = ['tipo', 'email_enviado', 'fecha_envio']
    search_fields = ['solicitud__razon_social', 'asunto']
    ordering = ['-fecha_envio']
    readonly_fields = ['fecha_envio', 'error_envio']