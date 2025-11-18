from rest_framework import serializers
from .models import Provincia, Departamento, Municipio, Localidad


class ProvinciaSerializer(serializers.ModelSerializer):
    """Serializer para Provincias"""
    
    class Meta:
        model = Provincia
        fields = ['id', 'nombre', 'nombre_completo', 'iso_id', 'iso_nombre', 
                  'categoria', 'centroide_lat', 'centroide_lon']
        read_only_fields = ['id']


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamentos"""
    provincia_nombre = serializers.CharField(source='provincia.nombre', read_only=True)
    
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'nombre_completo', 'categoria', 'provincia', 
                  'provincia_nombre', 'centroide_lat', 'centroide_lon']
        read_only_fields = ['id']


class MunicipioSerializer(serializers.ModelSerializer):
    """Serializer para Municipios"""
    provincia_nombre = serializers.CharField(source='provincia.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True, allow_null=True)
    
    class Meta:
        model = Municipio
        fields = ['id', 'nombre', 'nombre_completo', 'categoria', 'provincia', 
                  'provincia_nombre', 'departamento', 'departamento_nombre',
                  'centroide_lat', 'centroide_lon']
        read_only_fields = ['id']


class LocalidadSerializer(serializers.ModelSerializer):
    """Serializer para Localidades"""
    provincia_nombre = serializers.CharField(source='provincia.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.CharField(source='municipio.nombre', read_only=True, allow_null=True)
    
    class Meta:
        model = Localidad
        fields = ['id', 'nombre', 'categoria', 'tipo_asentamiento', 'provincia', 
                  'provincia_nombre', 'departamento', 'departamento_nombre',
                  'municipio', 'municipio_nombre', 'centroide_lat', 'centroide_lon']
        read_only_fields = ['id']

