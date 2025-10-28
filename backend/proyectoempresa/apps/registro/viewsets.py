from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro
from .serializers import (
    SolicitudRegistroSerializer, SolicitudRegistroListSerializer,
    SolicitudRegistroCreateSerializer, DocumentoSolicitudSerializer,
    NotificacionRegistroSerializer
)
from apps.core.permissions import IsPublicRegistration, CanManageUsers
import uuid


class SolicitudRegistroViewSet(viewsets.ModelViewSet):
    """ViewSet para solicitudes de registro"""
    queryset = SolicitudRegistro.objects.prefetch_related('documentos', 'notificaciones').all()
    filterset_fields = ['estado', 'tipo_empresa', 'email_confirmado']
    search_fields = ['razon_social', 'cuit_cuil', 'correo']
    ordering_fields = ['fecha_solicitud', 'razon_social']
    ordering = ['-fecha_solicitud']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudRegistroCreateSerializer
        elif self.action == 'list':
            return SolicitudRegistroListSerializer
        return SolicitudRegistroSerializer
    
    def get_permissions(self):
        """
        POST (crear) es público, todo lo demás requiere autenticación
        """
        if self.action == 'create':
            return [IsPublicRegistration()]
        return [permissions.IsAuthenticated(), CanManageUsers()]
    
    def perform_create(self, serializer):
        """Crear solicitud con token de confirmación"""
        solicitud = serializer.save(
            token_confirmacion=str(uuid.uuid4()),
            estado='pendiente'
        )
        # TODO: Enviar email de confirmación
        # enviar_email_confirmacion(solicitud)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def aprobar(self, request, pk=None):
        """Aprobar solicitud y crear empresa"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden aprobar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        observaciones = request.data.get('observaciones', '')
        
        try:
            # Importar función de creación de empresa
            from .views import crear_empresa_desde_solicitud, enviar_email_aprobacion
            
            solicitud.estado = 'aprobada'
            solicitud.fecha_aprobacion = timezone.now()
            solicitud.aprobado_por = request.user
            solicitud.observaciones_admin = observaciones
            solicitud.save()
            
            # Crear empresa
            empresa = crear_empresa_desde_solicitud(solicitud)
            solicitud.empresa_creada = empresa
            solicitud.save()
            
            # Enviar email
            enviar_email_aprobacion(solicitud)
            
            return Response({
                'status': 'success',
                'message': 'Solicitud aprobada correctamente',
                'empresa_id': empresa.id
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def rechazar(self, request, pk=None):
        """Rechazar solicitud"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden rechazar solicitudes pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        observaciones = request.data.get('observaciones', '')
        
        try:
            from .views import enviar_email_rechazo
            
            solicitud.estado = 'rechazada'
            solicitud.observaciones_admin = observaciones
            solicitud.save()
            
            # Enviar email
            enviar_email_rechazo(solicitud)
            
            return Response({
                'status': 'success',
                'message': 'Solicitud rechazada correctamente'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def confirmar_email(self, request, pk=None):
        """Confirmar email con token"""
        solicitud = self.get_object()
        token = request.data.get('token')
        
        if not token or solicitud.token_confirmacion != token:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if solicitud.email_confirmado:
            return Response(
                {'message': 'Email ya confirmado anteriormente'},
                status=status.HTTP_200_OK
            )
        
        solicitud.email_confirmado = True
        solicitud.fecha_confirmacion = timezone.now()
        solicitud.save()
        
        # Crear notificación
        NotificacionRegistro.objects.create(
            solicitud=solicitud,
            tipo='confirmacion',
            asunto='Email confirmado',
            mensaje='Su email ha sido confirmado correctamente.'
        )
        
        return Response({
            'status': 'success',
            'message': 'Email confirmado correctamente'
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de solicitudes"""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'pendientes': queryset.filter(estado='pendiente').count(),
            'aprobadas': queryset.filter(estado='aprobada').count(),
            'rechazadas': queryset.filter(estado='rechazada').count(),
            'emails_confirmados': queryset.filter(email_confirmado=True).count(),
        })


class DocumentoSolicitudViewSet(viewsets.ModelViewSet):
    """ViewSet para documentos de solicitud"""
    queryset = DocumentoSolicitud.objects.select_related('solicitud').all()
    serializer_class = DocumentoSolicitudSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['solicitud', 'tipo_documento']
    ordering = ['-fecha_subida']


class NotificacionRegistroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para notificaciones de registro (solo lectura)"""
    queryset = NotificacionRegistro.objects.select_related('solicitud').all()
    serializer_class = NotificacionRegistroSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    filterset_fields = ['solicitud', 'tipo', 'email_enviado']
    ordering = ['-fecha_creacion']

