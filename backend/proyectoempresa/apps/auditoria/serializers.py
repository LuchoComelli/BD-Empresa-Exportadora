from rest_framework import serializers
from .models import AuditoriaLog


class AuditoriaLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de auditoría"""
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditoriaLog
        fields = [
            'id', 'usuario', 'usuario_email', 'usuario_nombre',
            'accion', 'modelo', 'objeto_id', 'objeto_repr',
            'cambios', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = fields
    
    def get_usuario_nombre(self, obj):
        """Obtener nombre completo del usuario"""
        if obj.usuario:
            return f"{obj.usuario.nombre} {obj.usuario.apellido}"
        return None

