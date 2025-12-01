from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    LogoutView
)
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

urlpatterns = [
    # JWT Authentication con cookies HTTP-Only
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
    path('auth/logout/', LogoutView.as_view(), name='token_logout'),
    
    # Router URLs
    path('', include(router.urls)),
]

