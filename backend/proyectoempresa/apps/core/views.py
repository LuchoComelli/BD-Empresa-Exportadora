"""
Vistas personalizadas para autenticación con cookies HTTP-Only
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .serializers import CustomTokenObtainPairSerializer
import logging

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(APIView):
    """
    Vista personalizada para login que establece cookies HTTP-Only
    """
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener los tokens del serializer
        email = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        
        # Autenticar usuario
        user = authenticate(username=email, password=password)
        if not user:
            return Response(
                {'detail': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Preparar datos del usuario con todos los permisos del rol
        user_data = {
            'id': user.id,
            'email': user.email,
            'nombre': user.nombre,
            'apellido': user.apellido,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
        }
        
        # Incluir información completa del rol con todos los permisos
        if user.rol:
            user_data['rol'] = {
                'id': user.rol.id,
                'nombre': user.rol.nombre,
                'nivel_acceso': user.rol.nivel_acceso,
                # Todos los permisos
                'puede_crear_empresas': user.rol.puede_crear_empresas,
                'puede_editar_empresas': user.rol.puede_editar_empresas,
                'puede_eliminar_empresas': user.rol.puede_eliminar_empresas,
                'puede_ver_auditoria': user.rol.puede_ver_auditoria,
                'puede_exportar_datos': user.rol.puede_exportar_datos,
                'puede_importar_datos': user.rol.puede_importar_datos,
                'puede_gestionar_usuarios': user.rol.puede_gestionar_usuarios,
                'puede_acceder_admin': user.rol.puede_acceder_admin,
                'puede_ver_usuarios': user.rol.puede_ver_usuarios,
                'puede_ver_configuracion': user.rol.puede_ver_configuracion,
                'puede_aprobar_empresas': user.rol.puede_aprobar_empresas,
                'puede_ver_empresas_pendientes': user.rol.puede_ver_empresas_pendientes,
                'puede_ver_reportes': user.rol.puede_ver_reportes,
                'puede_ver_mapa': user.rol.puede_ver_mapa,
                'puede_ver_matriz': user.rol.puede_ver_matriz,
            }
        else:
            user_data['rol'] = None
        
        # Crear respuesta
        response = Response({
            'status': 'success',
            'message': 'Login exitoso',
            'user': user_data
        }, status=status.HTTP_200_OK)
        
        # Configurar cookies HTTP-Only y Secure
        # Refresh token en cookie HTTP-Only (1 día)
        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=60 * 60 * 24,  # 1 día (86400 segundos)
            httponly=True,
            secure=not settings.DEBUG,  # Secure solo en producción
            samesite='Lax',
            path='/api/core/auth/'
        )
        
        # Access token también en cookie (para compatibilidad) - 10 minutos
        response.set_cookie(
            'access_token',
            access_token,
            max_age=60 * 10,  # 10 minutos (600 segundos)
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        
        # También retornar el access token en el body para que el frontend lo guarde en memoria
        response.data['access_token'] = access_token
        
        logger.info(f"Login exitoso para usuario: {email}")
        return response


class CustomTokenRefreshView(APIView):
    """
    Vista personalizada para refresh token usando cookies
    """
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        # Obtener refresh token de la cookie o del body
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token no proporcionado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            response = Response({
                'status': 'success',
                'access_token': access_token
            }, status=status.HTTP_200_OK)
            
            # Actualizar access token en cookie (10 minutos)
            response.set_cookie(
                'access_token',
                access_token,
                max_age=60 * 10,  # 10 minutos (600 segundos)
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            
            return response
        except Exception as e:
            logger.error(f"Error al refrescar token: {str(e)}")
            return Response(
                {'detail': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CustomTokenVerifyView(APIView):
    """
    Vista personalizada para verificar token
    """
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        # Obtener access token de la cookie o del body
        access_token = request.COOKIES.get('access_token') or request.data.get('token')
        
        if not access_token:
            return Response(
                {'detail': 'Token no proporcionado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from rest_framework_simplejwt.tokens import UntypedToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            
            UntypedToken(access_token)
            return Response({'valid': True}, status=status.HTTP_200_OK)
        except (InvalidToken, TokenError) as e:
            return Response(
                {'valid': False, 'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """
    Vista para logout que elimina las cookies
    """
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        response = Response({
            'status': 'success',
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
        
        # Eliminar cookies
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/api/core/auth/')
        
        logger.info(f"Logout exitoso para usuario: {request.user.email if request.user.is_authenticated else 'Anónimo'}")
        return response
