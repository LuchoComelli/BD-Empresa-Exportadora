from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import Usuario, RolUsuario, Dpto, Municipio, Localidades

@admin.register(RolUsuario)
class RolUsuarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nivel_acceso', 'activo', 'fecha_creacion']
    list_filter = ['nivel_acceso', 'activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nivel_acceso', 'nombre']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'activo')
        }),
        ('Nivel de Acceso', {
            'fields': ('nivel_acceso',)
        }),
        ('Permisos de Empresas', {
            'fields': ('puede_crear_empresas', 'puede_editar_empresas', 'puede_eliminar_empresas')
        }),
        ('Permisos de Datos', {
            'fields': ('puede_exportar_datos', 'puede_importar_datos')
        }),
        ('Permisos de Sistema', {
            'fields': ('puede_ver_auditoria', 'puede_gestionar_usuarios', 'puede_acceder_admin')
        }),
    )

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ['email', 'nombre', 'apellido', 'rol', 'is_active', 'date_joined']
    list_filter = ['rol', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'nombre', 'apellido']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {
            'fields': ('nombre', 'apellido', 'telefono', 'avatar', 'fecha_nacimiento', 'genero')
        }),
        (_('Documento'), {
            'fields': ('tipo_documento', 'numero_documento')
        }),
        (_('Ubicación'), {
            'fields': ('departamento', 'municipio', 'localidad')
        }),
        (_('Sistema'), {
            'fields': ('rol', 'is_active', 'is_staff', 'is_superuser')
        }),
        (_('Seguridad'), {
            'fields': ('fecha_ultimo_acceso', 'intentos_login_fallidos', 'bloqueado_hasta')
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellido', 'rol', 'password1', 'password2'),
        }),
    )

@admin.register(Dpto)
class DptoAdmin(admin.ModelAdmin):
    list_display = ['nomdpto', 'coddpto', 'activo']
    list_filter = ['activo']
    search_fields = ['nomdpto', 'coddpto']
    ordering = ['nomdpto']

@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ['nommun', 'dpto', 'activo']
    list_filter = ['dpto', 'activo']
    search_fields = ['nommun']
    ordering = ['dpto', 'nommun']

@admin.register(Localidades)
class LocalidadesAdmin(admin.ModelAdmin):
    list_display = ['nomloc', 'municipio', 'activo']
    list_filter = ['municipio__dpto', 'municipio', 'activo']
    search_fields = ['nomloc']
    ordering = ['municipio', 'nomloc']