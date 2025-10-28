from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import RolUsuario, Dpto, Municipio, Localidades
from .serializers import (
    RolUsuarioSerializer, UsuarioSerializer, UsuarioListSerializer,
    DptoSerializer, MunicipioSerializer, LocalidadesSerializer
)
from .permissions import CanManageUsers

User = get_user_model()


class RolUsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para roles de usuario"""
    queryset = RolUsuario.objects.all()
    serializer_class = RolUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    filterset_fields = ['activo', 'nivel_acceso']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'nivel_acceso']
    ordering = ['nivel_acceso', 'nombre']


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para usuarios"""
    queryset = User.objects.select_related('rol').all()
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    filterset_fields = ['is_active', 'rol', 'genero']
    search_fields = ['email', 'nombre', 'apellido', 'numero_documento']
    ordering_fields = ['email', 'nombre', 'date_joined']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Obtener información del usuario actual"""
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar usuario"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'success',
            'is_active': user.is_active
        })


class DptoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para departamentos (solo lectura)"""
    queryset = Dpto.objects.filter(activo=True)
    serializer_class = DptoSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo', 'codprov']
    search_fields = ['nomdpto', 'coddpto']
    ordering_fields = ['nomdpto']
    ordering = ['nomdpto']


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para municipios (solo lectura)"""
    queryset = Municipio.objects.select_related('dpto').filter(activo=True)
    serializer_class = MunicipioSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo', 'dpto', 'codprov']
    search_fields = ['nommun', 'codmun']
    ordering_fields = ['nommun']
    ordering = ['nommun']
    
    @action(detail=False, methods=['get'])
    def por_departamento(self, request):
        """Obtener municipios por departamento"""
        dpto_id = request.query_params.get('dpto_id')
        if not dpto_id:
            return Response({'error': 'dpto_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        municipios = self.queryset.filter(dpto_id=dpto_id)
        serializer = self.get_serializer(municipios, many=True)
        return Response(serializer.data)


class LocalidadesViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para localidades (solo lectura)"""
    queryset = Localidades.objects.select_related('municipio', 'municipio__dpto').filter(activo=True)
    serializer_class = LocalidadesSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo', 'municipio', 'codprov']
    search_fields = ['nomloc', 'codloc']
    ordering_fields = ['nomloc']
    ordering = ['nomloc']
    
    @action(detail=False, methods=['get'])
    def por_municipio(self, request):
        """Obtener localidades por municipio"""
        municipio_id = request.query_params.get('municipio_id')
        if not municipio_id:
            return Response({'error': 'municipio_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        localidades = self.queryset.filter(municipio_id=municipio_id)
        serializer = self.get_serializer(localidades, many=True)
        return Response(serializer.data)

