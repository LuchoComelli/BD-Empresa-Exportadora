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
        from .views import crear_empresa_desde_solicitud, enviar_email_aprobacion
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
                enviar_email_aprobacion(solicitud)
        
        self.message_user(request, f'{queryset.count()} solicitudes aprobadas.')
    aprobar_solicitudes.short_description = 'Aprobar solicitudes seleccionadas'
    
    def rechazar_solicitudes(self, request, queryset):
        from .views import enviar_email_rechazo
        from django.utils import timezone
        
        for solicitud in queryset:
            if solicitud.estado == 'pendiente':
                solicitud.estado = 'rechazada'
                solicitud.aprobado_por = request.user
                solicitud.save()
                
                # Enviar email
                enviar_email_rechazo(solicitud)
        
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