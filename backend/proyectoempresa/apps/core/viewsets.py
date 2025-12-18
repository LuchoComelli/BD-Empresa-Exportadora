from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import RolUsuario, ConfiguracionSistema
from apps.geografia.models import Departamento, Municipio, Localidad
from .serializers import (
    RolUsuarioSerializer, UsuarioSerializer, UsuarioListSerializer,
    DptoSerializer, MunicipioSerializer, LocalidadesSerializer,
    ConfiguracionSistemaSerializer
)
from .permissions import CanManageUsers, IsOwnerOrAdmin

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
    
    def get_queryset(self):
        """Filtrar roles para mostrar solo Administrador, Consultor y Analista"""
        queryset = super().get_queryset()
        
        # Filtrar solo roles permitidos para el dashboard
        queryset = queryset.filter(
            nombre__in=['Administrador', 'Consultor', 'Analista']
        )
        
        return queryset


class UsuarioViewSet(viewsets.ModelViewSet):
    """ViewSet para usuarios"""
    queryset = User.objects.select_related('rol').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_active', 'rol', 'genero']
    search_fields = ['email', 'nombre', 'apellido', 'numero_documento']
    ordering_fields = ['email', 'nombre', 'date_joined']
    ordering = ['-date_joined']
    
    def get_permissions(self):
        """Permisos personalizados: permitir a usuarios actualizar su propio perfil"""
        if self.action in ['update', 'partial_update']:
            # Permitir que usuarios actualicen su propio perfil o que admins gestionen usuarios
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        elif self.action in ['list', 'retrieve']:
            # Lectura permitida para todos los usuarios autenticados
            return [permissions.IsAuthenticated()]
        elif self.action == 'create':
            # Solo admins pueden crear usuarios
            return [permissions.IsAuthenticated(), CanManageUsers()]
        elif self.action == 'destroy':
            # Solo admins pueden eliminar usuarios
            return [permissions.IsAuthenticated(), CanManageUsers()]
        # Para otras acciones (como toggle_active), usar permisos de gestión
        return [permissions.IsAuthenticated(), CanManageUsers()]
    
    def get_queryset(self):
        """Filtrar usuarios para mostrar solo Administrador, Consultor y Analista"""
        queryset = super().get_queryset()
        
        # Filtrar por roles permitidos: Administrador, Consultor, Analista
        # También incluir superusuarios si tienen rol
        from django.db.models import Q
        queryset = queryset.filter(
            Q(rol__nombre__in=['Administrador', 'Consultor', 'Analista']) |
            Q(is_superuser=True, rol__isnull=False)
        )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer
    
    def perform_create(self, serializer):
        """Crear usuario y establecer campos de auditoría"""
        user = serializer.save()
        # Si hay un usuario autenticado, establecer creado_por
        if self.request.user and self.request.user.is_authenticated:
            # Nota: El modelo Usuario no tiene campos de auditoría directos,
            # pero podemos registrar esto en logs si es necesario
            pass
        return user
    
    def perform_update(self, serializer):
        """Actualizar usuario"""
        serializer.save()
        # Si hay un usuario autenticado, podríamos registrar actualizado_por
        # pero el modelo Usuario no tiene este campo
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Obtener información del usuario actual"""
        # Asegurarse de que el rol esté cargado con select_related
        # Usar el mismo queryset base que el ViewSet para consistencia
        user = User.objects.select_related('rol').get(pk=request.user.pk)
        # Usar el mismo serializer que se usa para retrieve/detail
        serializer = UsuarioSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch', 'put'], permission_classes=[permissions.IsAuthenticated])
    def update_password(self, request):
        """Permitir que cualquier usuario autenticado cambie su propia contraseña"""
        user = request.user
        new_password = request.data.get('password')
        
        if not new_password:
            return Response(
                {'error': 'La contraseña es requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'La contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar la contraseña
        user.set_password(new_password)
        
        # Si el usuario es empresa y debe cambiar la contraseña, marcar como ya cambiada
        if user.rol and user.rol.nombre == 'Empresa' and user.debe_cambiar_password:
            user.debe_cambiar_password = False
        
        user.save()
        
        # Serializar el usuario actualizado
        serializer = UsuarioSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanManageUsers])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar usuario (soft delete)"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'success',
            'is_active': user.is_active,
            'message': f'Usuario {"activado" if user.is_active else "desactivado"} exitosamente'
        })


class DptoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para departamentos (solo lectura)"""
    queryset = Departamento.objects.all()
    serializer_class = DptoSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo', 'codprov']
    search_fields = ['nomdpto', 'coddpto']
    ordering_fields = ['nomdpto']
    ordering = ['nomdpto']


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para municipios (solo lectura)"""
    queryset = Municipio.objects.select_related('departamento', 'provincia').all()
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
    queryset = Localidad.objects.select_related('departamento', 'provincia', 'municipio').all()
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


class ConfiguracionSistemaViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración del sistema (singleton)"""
    queryset = ConfiguracionSistema.objects.all()
    serializer_class = ConfiguracionSistemaSerializer
    
    def get_permissions(self):
        """Permitir lectura pública, pero solo usuarios autenticados pueden editar"""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), CanManageUsers()]
    
    def get_object(self):
        """Siempre retornar o crear la instancia única (singleton)"""
        return ConfiguracionSistema.get_config()
    
    def list(self, request, *args, **kwargs):
        """Retornar la configuración única"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Retornar la configuración única"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Actualizar la configuración única"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Establecer campos de auditoría
        if hasattr(request.user, 'id'):
            serializer.save(actualizado_por=request.user)
        else:
            serializer.save()
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Actualización parcial de la configuración"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

