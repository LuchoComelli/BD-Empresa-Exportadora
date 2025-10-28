from django.contrib import admin
from django.utils.html import format_html
from .models import AuditoriaLog, AuditoriaCambios, AuditoriaArchivos

@admin.register(AuditoriaLog)
class AuditoriaLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'usuario', 'accion', 'modelo_afectado', 'nivel_criticidad', 'exito']
    list_filter = ['accion', 'nivel_criticidad', 'categoria', 'exito', 'timestamp']
    search_fields = ['usuario__email', 'modelo_afectado', 'descripcion']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp', 'usuario', 'session_key', 'user_agent', 'accion', 'modelo_afectado', 'objeto_id', 'nombre_objeto', 'descripcion', 'detalles_adicionales', 'valores_anteriores', 'valores_nuevos', 'url', 'metodo_http', 'nivel_criticidad', 'categoria', 'exito', 'mensaje_error']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('timestamp', 'usuario', 'accion', 'exito')
        }),
        ('Objeto Afectado', {
            'fields': ('modelo_afectado', 'objeto_id', 'nombre_objeto')
        }),
        ('Detalles', {
            'fields': ('descripcion', 'detalles_adicionales')
        }),
        ('Cambios', {
            'fields': ('valores_anteriores', 'valores_nuevos')
        }),
        ('Contexto', {
            'fields': ('url', 'metodo_http', 'session_key', 'user_agent')
        }),
        ('Clasificación', {
            'fields': ('nivel_criticidad', 'categoria')
        }),
        ('Error', {
            'fields': ('mensaje_error',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(AuditoriaCambios)
class AuditoriaCambiosAdmin(admin.ModelAdmin):
    list_display = ['auditoria_log', 'campo_modificado', 'valor_anterior', 'valor_nuevo']
    list_filter = ['auditoria_log__accion', 'auditoria_log__modelo_afectado']
    search_fields = ['campo_modificado', 'valor_anterior', 'valor_nuevo']
    ordering = ['auditoria_log__timestamp', 'campo_modificado']
    readonly_fields = ['auditoria_log', 'campo_modificado', 'valor_anterior', 'valor_nuevo']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(AuditoriaArchivos)
class AuditoriaArchivosAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'auditoria_log', 'tipo_archivo', 'tamaño_archivo']
    list_filter = ['tipo_archivo', 'auditoria_log__accion']
    search_fields = ['nombre_archivo', 'ruta_archivo']
    ordering = ['-auditoria_log__timestamp']
    readonly_fields = ['auditoria_log', 'nombre_archivo', 'ruta_archivo', 'tamaño_archivo', 'tipo_archivo', 'hash_archivo']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False