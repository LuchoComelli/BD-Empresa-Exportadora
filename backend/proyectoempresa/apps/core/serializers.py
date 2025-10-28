from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RolUsuario, Dpto, Municipio, Localidades

User = get_user_model()


class RolUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para roles de usuario"""
    
    class Meta:
        model = RolUsuario
        fields = [
            'id', 'nombre', 'descripcion',
            'puede_crear_empresas', 'puede_editar_empresas',
            'puede_eliminar_empresas', 'puede_ver_auditoria',
            'puede_exportar_datos', 'puede_importar_datos',
            'puede_gestionar_usuarios', 'puede_acceder_admin',
            'nivel_acceso', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para usuarios"""
    rol_detalle = RolUsuarioSerializer(source='rol', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'nombre', 'apellido', 'rol', 'rol_detalle',
            'is_active', 'is_staff', 'is_superuser', 'date_joined',
            'last_login', 'telefono', 'avatar', 'fecha_nacimiento',
            'genero', 'tipo_documento', 'numero_documento',
            'departamento', 'municipio', 'localidad', 'password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de usuarios"""
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nombre', 'apellido', 'rol_nombre', 'is_active']


class DptoSerializer(serializers.ModelSerializer):
    """Serializer para departamentos"""
    
    class Meta:
        model = Dpto
        fields = ['id', 'coddpto', 'nomdpto', 'codprov', 'activo']
        read_only_fields = ['id']


class MunicipioSerializer(serializers.ModelSerializer):
    """Serializer para municipios"""
    dpto_nombre = serializers.CharField(source='dpto.nomdpto', read_only=True)
    
    class Meta:
        model = Municipio
        fields = ['id', 'codmun', 'nommun', 'coddpto', 'codprov', 'dpto', 'dpto_nombre', 'activo']
        read_only_fields = ['id']


class LocalidadesSerializer(serializers.ModelSerializer):
    """Serializer para localidades"""
    municipio_nombre = serializers.CharField(source='municipio.nommun', read_only=True)
    dpto_nombre = serializers.CharField(source='municipio.dpto.nomdpto', read_only=True)
    
    class Meta:
        model = Localidades
        fields = [
            'id', 'codloc', 'codlocsv', 'nomloc', 'codmun', 'coddpto',
            'codprov', 'codpais', 'latitud', 'longitud', 'codpos',
            'municipio', 'municipio_nombre', 'dpto_nombre', 'activo'
        ]
        read_only_fields = ['id']

