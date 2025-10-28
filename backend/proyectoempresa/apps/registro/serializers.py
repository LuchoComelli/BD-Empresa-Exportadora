from rest_framework import serializers
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro


class DocumentoSolicitudSerializer(serializers.ModelSerializer):
    """Serializer para documentos de solicitud"""
    
    class Meta:
        model = DocumentoSolicitud
        fields = [
            'id', 'solicitud', 'tipo_documento', 'archivo',
            'nombre_archivo', 'descripcion', 'fecha_subida'
        ]
        read_only_fields = ['id', 'fecha_subida', 'nombre_archivo']


class NotificacionRegistroSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones de registro"""
    
    class Meta:
        model = NotificacionRegistro
        fields = [
            'id', 'solicitud', 'tipo', 'asunto', 'mensaje',
            'email_enviado', 'fecha_envio', 'error_envio', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class SolicitudRegistroListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de solicitudes"""
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'correo',
            'estado', 'tipo_empresa', 'fecha_solicitud',
            'email_confirmado', 'fecha_confirmacion'
        ]


class SolicitudRegistroSerializer(serializers.ModelSerializer):
    """Serializer completo para solicitudes de registro"""
    documentos = DocumentoSolicitudSerializer(many=True, read_only=True)
    notificaciones = NotificacionRegistroSerializer(many=True, read_only=True)
    
    class Meta:
        model = SolicitudRegistro
        fields = '__all__'
        read_only_fields = [
            'id', 'fecha_solicitud', 'token_confirmacion',
            'email_confirmado', 'fecha_confirmacion',
            'fecha_aprobacion', 'aprobado_por', 'empresa_creada'
        ]


class SolicitudRegistroCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes de registro público"""
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'razon_social', 'cuit_cuil', 'tipo_empresa', 'rubro_principal',
            'descripcion_actividad', 'direccion', 'departamento',
            'municipio', 'localidad', 'telefono', 'correo', 'sitioweb',
            'nombre_contacto', 'cargo_contacto', 'telefono_contacto',
            'email_contacto', 'exporta', 'destino_exportacion',
            'importa', 'tipo_importacion', 'certificado_pyme',
            'certificaciones', 'material_promocional_idiomas',
            'idiomas_trabajo'
        ]
    
    def validate_cuit_cuil(self, value):
        """Validar que el CUIT no esté ya registrado"""
        if SolicitudRegistro.objects.filter(cuit_cuil=value, estado='aprobada').exists():
            raise serializers.ValidationError(
                "Ya existe una solicitud aprobada con este CUIT/CUIL"
            )
        return value

