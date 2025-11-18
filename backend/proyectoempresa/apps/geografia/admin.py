from django.contrib import admin
from .models import Provincia, Departamento, Municipio, Localidad


@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'iso_id', 'categoria', 'fecha_actualizacion']
    search_fields = ['nombre', 'nombre_completo', 'iso_id']
    list_filter = ['categoria']
    ordering = ['nombre']


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'provincia', 'categoria', 'fecha_actualizacion']
    search_fields = ['nombre', 'nombre_completo']
    list_filter = ['provincia', 'categoria']
    ordering = ['provincia', 'nombre']
    raw_id_fields = ['provincia']


@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'provincia', 'departamento', 'categoria', 'fecha_actualizacion']
    search_fields = ['nombre', 'nombre_completo']
    list_filter = ['provincia', 'categoria']
    ordering = ['provincia', 'nombre']
    raw_id_fields = ['provincia', 'departamento']


@admin.register(Localidad)
class LocalidadAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'provincia', 'departamento', 'municipio', 'tipo_asentamiento', 'fecha_actualizacion']
    search_fields = ['nombre']
    list_filter = ['provincia', 'departamento', 'municipio', 'tipo_asentamiento']
    ordering = ['provincia', 'departamento', 'nombre']
    raw_id_fields = ['provincia', 'departamento', 'municipio']

