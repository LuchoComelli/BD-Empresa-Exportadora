from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .serializers import CustomTokenObtainPairSerializer
from .viewsets import (
    RolUsuarioViewSet, UsuarioViewSet,
    DptoViewSet, MunicipioViewSet, LocalidadesViewSet,
    ConfiguracionSistemaViewSet
)

router = DefaultRouter()
router.register(r'roles', RolUsuarioViewSet, basename='rol')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'departamentos', DptoViewSet, basename='departamento')
router.register(r'municipios', MunicipioViewSet, basename='municipio')
router.register(r'localidades', LocalidadesViewSet, basename='localidad')
router.register(r'configuracion', ConfiguracionSistemaViewSet, basename='configuracion')

# Vista personalizada para login con email
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    # JWT Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Router URLs
    path('', include(router.urls)),
]

