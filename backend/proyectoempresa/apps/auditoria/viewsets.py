from rest_framework import viewsets, permissions
from .models import AuditoriaLog
from .serializers import AuditoriaLogSerializer
from apps.core.permissions import CanViewAuditoria


class AuditoriaLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logs de auditoría (solo lectura)"""
    queryset = AuditoriaLog.objects.select_related('usuario').all()
    serializer_class = AuditoriaLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewAuditoria]
    filterset_fields = ['accion', 'modelo', 'usuario']
    search_fields = ['objeto_repr', 'cambios']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

