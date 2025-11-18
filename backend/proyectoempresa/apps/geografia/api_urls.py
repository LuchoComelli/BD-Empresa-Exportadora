from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    ProvinciaViewSet, DepartamentoViewSet,
    MunicipioViewSet, LocalidadViewSet
)

router = DefaultRouter()
router.register(r'provincias', ProvinciaViewSet, basename='provincia')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'municipios', MunicipioViewSet, basename='municipio')
router.register(r'localidades', LocalidadViewSet, basename='localidad')

urlpatterns = [
    path('', include(router.urls)),
]

