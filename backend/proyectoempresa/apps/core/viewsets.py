from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import uuid
import logging
from .models import RolUsuario, ConfiguracionSistema
from apps.geografia.models import Departamento, Municipio, Localidad
from .serializers import (
    RolUsuarioSerializer, UsuarioSerializer, UsuarioListSerializer,
    DptoSerializer, MunicipioSerializer, LocalidadesSerializer,
    ConfiguracionSistemaSerializer
)
from .permissions import CanManageUsers, IsOwnerOrAdmin

User = get_user_model()
logger = logging.getLogger(__name__)


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
        # Endpoints públicos (sin autenticación requerida)
        if self.action in ['solicitar_recuperacion_password', 'resetear_password']:
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update']:
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
        elif self.action == 'update_password':
            # Cualquier usuario autenticado puede cambiar su propia contraseña
            return [permissions.IsAuthenticated()]
        elif self.action == 'update_me':
            # Cualquier usuario autenticado puede actualizar su propio perfil
            return [permissions.IsAuthenticated()]
        elif self.action == 'me':
            # Cualquier usuario autenticado puede ver su propio perfil
            return [permissions.IsAuthenticated()]
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
        
        # Guardar si era el primer cambio de password (para empresas)
        es_primer_cambio = user.rol and user.rol.nombre == 'Empresa' and user.debe_cambiar_password
        
        # Actualizar la contraseña
        user.set_password(new_password)
        
        # Si el usuario es empresa y debe cambiar la contraseña, marcar como ya cambiada
        if user.rol and user.rol.nombre == 'Empresa' and user.debe_cambiar_password:
            user.debe_cambiar_password = False
        
        user.save()
        
        # Enviar email de confirmación si es empresa y era el primer cambio
        if es_primer_cambio:
            try:
                # Intentar obtener la empresa asociada
                empresa = None
                try:
                    from apps.empresas.models import Empresa
                    empresa = Empresa.objects.filter(id_usuario=user).first()
                except Exception:
                    pass
                
                from apps.registro.services import enviar_email_cambio_password
                enviar_email_cambio_password(user, empresa)
            except Exception as email_error:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error enviando email de cambio de password: {str(email_error)}")
        
        # Serializar el usuario actualizado
        serializer = UsuarioSerializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch', 'put'], permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        """Permitir que cualquier usuario autenticado actualice su propio perfil (email, etc.)"""
        user = request.user
        serializer = UsuarioSerializer(user, data=request.data, partial=True, context={'request': request})
        
        if serializer.is_valid():
            # Si se está actualizando la contraseña, usar set_password
            if 'password' in serializer.validated_data:
                password = serializer.validated_data.pop('password')
                user.set_password(password)
                # Si el usuario es empresa y debe cambiar la contraseña, marcar como ya cambiada
                if user.rol and user.rol.nombre == 'Empresa' and user.debe_cambiar_password:
                    user.debe_cambiar_password = False
            
            # Actualizar otros campos
            serializer.save()
            
            # Recargar el usuario con el rol para la respuesta
            user.refresh_from_db()
            user = User.objects.select_related('rol').get(pk=user.pk)
            response_serializer = UsuarioSerializer(user, context={'request': request})
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def solicitar_recuperacion_password(self, request):
        """
        Solicitar recuperación de contraseña. Envía un email con un token.
        """
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response(
                {'error': 'El email es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Informar que el email no existe en el sistema
            logger.warning(f"Intento de recuperación de contraseña para email inexistente: {email}")
            return Response({
                'error': 'No se encontró un usuario activo con este correo electrónico en nuestro sistema.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generar token único
        token = str(uuid.uuid4())
        # Token válido por 24 horas
        expira = timezone.now() + timezone.timedelta(hours=24)
        
        # Guardar token en el usuario
        user.token_recuperacion_password = token
        user.token_recuperacion_expira = expira
        user.save()
        
        # Enviar email con el token
        try:
            from apps.registro.services import enviar_email_recuperacion_password
            enviar_email_recuperacion_password(user, token)
            logger.info(f"✅ Email de recuperación enviado a: {email}")
        except Exception as e:
            logger.error(f"❌ Error enviando email de recuperación: {str(e)}", exc_info=True)
            # Limpiar el token si falla el email
            user.token_recuperacion_password = None
            user.token_recuperacion_expira = None
            user.save()
            return Response(
                {'error': 'Error al enviar el email. Por favor, intenta nuevamente más tarde.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'Se han enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def resetear_password(self, request):
        """
        Resetear contraseña usando el token de recuperación.
        """
        token = request.data.get('token', '').strip()
        nueva_password = request.data.get('password', '').strip()
        
        if not token:
            return Response(
                {'error': 'El token es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not nueva_password:
            return Response(
                {'error': 'La nueva contraseña es requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(nueva_password) < 8:
            return Response(
                {'error': 'La contraseña debe tener al menos 8 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(
                token_recuperacion_password=token,
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el token no haya expirado
        if user.token_recuperacion_expira and user.token_recuperacion_expira < timezone.now():
            # Limpiar token expirado
            user.token_recuperacion_password = None
            user.token_recuperacion_expira = None
            user.save()
            return Response(
                {'error': 'El token ha expirado. Por favor, solicita un nuevo enlace de recuperación.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar contraseña
        user.set_password(nueva_password)
        # Limpiar token
        user.token_recuperacion_password = None
        user.token_recuperacion_expira = None
        user.save()
        
        logger.info(f"✅ Contraseña restablecida exitosamente para: {user.email}")
        
        return Response({
            'message': 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
        }, status=status.HTTP_200_OK)


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

