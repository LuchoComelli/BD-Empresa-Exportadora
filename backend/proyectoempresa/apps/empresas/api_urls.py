from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    TipoEmpresaViewSet, RubroViewSet, SubRubroViewSet, UnidadMedidaViewSet, OtrorubroViewSet,
    EmpresaproductoViewSet, EmpresaservicioViewSet, EmpresaMixtaViewSet,
    ProductoEmpresaViewSet, ServicioEmpresaViewSet,
    ProductoEmpresaMixtaViewSet, ServicioEmpresaMixtaViewSet,
    PosicionArancelariaViewSet, MatrizClasificacionExportadorViewSet
)

router = DefaultRouter()
router.register(r'tipos-empresa', TipoEmpresaViewSet, basename='tipo-empresa')
router.register(r'rubros', RubroViewSet, basename='rubro')
router.register(r'subrubros', SubRubroViewSet, basename='subrubro')
router.register(r'unidades-medida', UnidadMedidaViewSet, basename='unidad-medida')
router.register(r'otros-rubros', OtrorubroViewSet, basename='otro-rubro')
router.register(r'empresas-producto', EmpresaproductoViewSet, basename='empresa-producto')
router.register(r'empresas-servicio', EmpresaservicioViewSet, basename='empresa-servicio')
router.register(r'empresas-mixta', EmpresaMixtaViewSet, basename='empresa-mixta')
router.register(r'productos', ProductoEmpresaViewSet, basename='producto')
router.register(r'servicios', ServicioEmpresaViewSet, basename='servicio')
router.register(r'productos-mixta', ProductoEmpresaMixtaViewSet, basename='producto-mixta')
router.register(r'servicios-mixta', ServicioEmpresaMixtaViewSet, basename='servicio-mixta')
router.register(r'posiciones-arancelarias', PosicionArancelariaViewSet, basename='posicion-arancelaria')
router.register(r'matriz-clasificacion', MatrizClasificacionExportadorViewSet, basename='matriz-clasificacion')

urlpatterns = [
    path('', include(router.urls)),
]

