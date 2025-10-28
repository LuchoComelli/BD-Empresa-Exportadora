from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Rubro, UnidadMedida, Otrorubro, Empresaproducto, Empresaservicio, EmpresaMixta,
    ProductoEmpresa, ServicioEmpresa, PosicionArancelaria, MatrizClasificacionExportador,
    ProductoEmpresaMixta, ServicioEmpresaMixta, PosicionArancelariaMixta, TipoEmpresa
)

@admin.register(TipoEmpresa)
class TipoEmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']

@admin.register(Rubro)
class RubroAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'orden', 'activo']
    list_filter = ['tipo', 'activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['orden', 'nombre']

@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'simbolo', 'tipo', 'activo']
    list_filter = ['tipo', 'activo']
    search_fields = ['nombre', 'simbolo']
    ordering = ['tipo', 'nombre']

@admin.register(Otrorubro)
class OtrorubroAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']

class ProductoEmpresaInline(admin.TabularInline):
    model = ProductoEmpresa
    extra = 1
    fields = ['nombre_producto', 'descripcion', 'capacidad_productiva', 'unidad_medida', 'es_principal']

class ServicioEmpresaInline(admin.TabularInline):
    model = ServicioEmpresa
    extra = 1
    fields = ['nombre_servicio', 'descripcion', 'sector_atendido', 'alcance_servicio', 'es_principal']

class ProductoEmpresaMixtaInline(admin.TabularInline):
    model = ProductoEmpresaMixta
    extra = 1
    fields = ['nombre_producto', 'descripcion', 'capacidad_productiva', 'unidad_medida', 'es_principal']

class ServicioEmpresaMixtaInline(admin.TabularInline):
    model = ServicioEmpresaMixta
    extra = 1
    fields = ['nombre_servicio', 'descripcion', 'sector_atendido', 'alcance_servicio', 'es_principal']

@admin.register(Empresaproducto)
class EmpresaproductoAdmin(admin.ModelAdmin):
    list_display = ['razon_social', 'cuit_cuil', 'departamento', 'exporta', 'importa', 'fecha_creacion']
    list_filter = ['departamento', 'exporta', 'importa', 'certificadopyme', 'fecha_creacion']
    search_fields = ['razon_social', 'cuit_cuil', 'direccion', 'correo']
    ordering = ['-fecha_creacion']
    inlines = [ProductoEmpresaInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('razon_social', 'cuit_cuil', 'direccion', 'id_rubro', 'tipo_empresa')
        }),
        ('Ubicación', {
            'fields': ('departamento', 'municipio', 'localidad', 'geolocalizacion')
        }),
        ('Contacto', {
            'fields': ('telefono', 'correo', 'sitioweb')
        }),
        ('Exportación', {
            'fields': ('exporta', 'destinoexporta', 'tipoexporta')
        }),
        ('Importación', {
            'fields': ('importa', 'tipoimporta', 'frecuenciaimporta')
        }),
        ('Certificaciones', {
            'fields': ('certificadopyme', 'certificaciones', 'certificaciones_otros')
        }),
        ('Promoción', {
            'fields': ('promo2idiomas', 'idiomas_trabaja')
        }),
        ('Adicional', {
            'fields': ('observaciones', 'puntaje', 'id_usuario')
        }),
    )

@admin.register(Empresaservicio)
class EmpresaservicioAdmin(admin.ModelAdmin):
    list_display = ['razon_social', 'cuit_cuil', 'departamento', 'exporta', 'importa', 'fecha_creacion']
    list_filter = ['departamento', 'exporta', 'importa', 'certificadopyme', 'fecha_creacion']
    search_fields = ['razon_social', 'cuit_cuil', 'direccion', 'correo']
    ordering = ['-fecha_creacion']
    inlines = [ServicioEmpresaInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('razon_social', 'cuit_cuil', 'direccion', 'id_rubro', 'tipo_empresa')
        }),
        ('Ubicación', {
            'fields': ('departamento', 'municipio', 'localidad', 'geolocalizacion')
        }),
        ('Contacto', {
            'fields': ('telefono', 'correo', 'sitioweb')
        }),
        ('Exportación', {
            'fields': ('exporta', 'destinoexporta', 'tipoexporta')
        }),
        ('Importación', {
            'fields': ('importa', 'tipoimporta', 'frecuenciaimporta')
        }),
        ('Certificaciones', {
            'fields': ('certificadopyme', 'certificaciones', 'certificaciones_otros')
        }),
        ('Promoción', {
            'fields': ('promo2idiomas', 'idiomas_trabaja')
        }),
        ('Adicional', {
            'fields': ('observaciones', 'puntaje', 'id_usuario')
        }),
    )

@admin.register(EmpresaMixta)
class EmpresaMixtaAdmin(admin.ModelAdmin):
    list_display = ['razon_social', 'cuit_cuil', 'departamento', 'exporta', 'importa', 'fecha_creacion']
    list_filter = ['departamento', 'exporta', 'importa', 'certificadopyme', 'fecha_creacion']
    search_fields = ['razon_social', 'cuit_cuil', 'direccion', 'correo']
    ordering = ['-fecha_creacion']
    inlines = [ProductoEmpresaMixtaInline, ServicioEmpresaMixtaInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('razon_social', 'cuit_cuil', 'direccion', 'id_rubro', 'tipo_empresa')
        }),
        ('Ubicación', {
            'fields': ('departamento', 'municipio', 'localidad', 'geolocalizacion')
        }),
        ('Contacto', {
            'fields': ('telefono', 'correo', 'sitioweb')
        }),
        ('Exportación', {
            'fields': ('exporta', 'destinoexporta', 'tipoexporta')
        }),
        ('Importación', {
            'fields': ('importa', 'tipoimporta', 'frecuenciaimporta')
        }),
        ('Certificaciones', {
            'fields': ('certificadopyme', 'certificaciones', 'certificaciones_otros')
        }),
        ('Promoción', {
            'fields': ('promo2idiomas', 'idiomas_trabaja')
        }),
        ('Adicional', {
            'fields': ('observaciones', 'puntaje', 'id_usuario')
        }),
    )

@admin.register(ProductoEmpresa)
class ProductoEmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre_producto', 'empresa', 'capacidad_productiva', 'unidad_medida', 'es_principal']
    list_filter = ['unidad_medida', 'periodo_capacidad', 'es_principal', 'empresa__departamento']
    search_fields = ['nombre_producto', 'descripcion', 'empresa__razon_social']
    ordering = ['-es_principal', 'nombre_producto']

@admin.register(ServicioEmpresa)
class ServicioEmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre_servicio', 'empresa', 'sector_atendido', 'alcance_servicio', 'es_principal']
    list_filter = ['sector_atendido', 'alcance_servicio', 'forma_contratacion', 'es_principal']
    search_fields = ['nombre_servicio', 'descripcion', 'empresa__razon_social']
    ordering = ['-es_principal', 'nombre_servicio']

@admin.register(PosicionArancelaria)
class PosicionArancelariaAdmin(admin.ModelAdmin):
    list_display = ['codigo_arancelario', 'producto', 'descripcion_arancelaria']
    list_filter = ['producto__empresa__departamento']
    search_fields = ['codigo_arancelario', 'descripcion_arancelaria', 'producto__nombre_producto']
    ordering = ['codigo_arancelario']

@admin.register(MatrizClasificacionExportador)
class MatrizClasificacionExportadorAdmin(admin.ModelAdmin):
    list_display = ['get_empresa_nombre', 'puntaje_total', 'categoria', 'fecha_evaluacion']
    list_filter = ['categoria', 'fecha_evaluacion']
    search_fields = ['empresa_producto__razon_social', 'empresa_servicio__razon_social', 'empresa_mixta__razon_social']
    ordering = ['-fecha_evaluacion']
    
    def get_empresa_nombre(self, obj):
        empresa = obj.get_empresa()
        return empresa.razon_social if empresa else "Sin empresa"
    get_empresa_nombre.short_description = 'Empresa'