from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (
    TipoEmpresa, Rubro, UnidadMedida, Otrorubro,
    Empresaproducto, Empresaservicio, EmpresaMixta,
    ProductoEmpresa, ServicioEmpresa,
    ProductoEmpresaMixta, ServicioEmpresaMixta,
    MatrizClasificacionExportador
)
from .serializers import (
    TipoEmpresaSerializer, RubroSerializer, UnidadMedidaSerializer,
    OtrorubroSerializer, EmpresaproductoSerializer, EmpresaproductoListSerializer,
    EmpresaservicioSerializer, EmpresaservicioListSerializer,
    EmpresaMixtaSerializer, EmpresaMixtaListSerializer,
    ProductoEmpresaSerializer, ServicioEmpresaSerializer,
    ProductoEmpresaMixtaSerializer, ServicioEmpresaMixtaSerializer,
    MatrizClasificacionExportadorSerializer
)
from apps.core.permissions import CanManageEmpresas, IsOwnerOrAdmin


class TipoEmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para tipos de empresa (solo lectura)"""
    queryset = TipoEmpresa.objects.filter(activo=True)
    serializer_class = TipoEmpresaSerializer
    permission_classes = [permissions.AllowAny]


class RubroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para rubros (solo lectura)"""
    queryset = Rubro.objects.filter(activo=True)
    serializer_class = RubroSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['tipo', 'activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden', 'nombre']


class UnidadMedidaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para unidades de medida (solo lectura)"""
    queryset = UnidadMedida.objects.filter(activo=True)
    serializer_class = UnidadMedidaSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['tipo', 'activo']
    ordering = ['tipo', 'nombre']


class OtrorubroViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para otros rubros (solo lectura)"""
    queryset = Otrorubro.objects.filter(activo=True)
    serializer_class = OtrorubroSerializer
    permission_classes = [permissions.AllowAny]


class EmpresaproductoViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas de producto"""
    queryset = Empresaproducto.objects.select_related(
        'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
    ).prefetch_related('productos')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['exporta', 'importa', 'certificadopyme', 'tipo_empresa', 'id_rubro']
    search_fields = ['razon_social', 'cuit_cuil', 'correo']
    ordering_fields = ['razon_social', 'fecha_creacion']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaproductoListSerializer
        return EmpresaproductoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por usuario si no es admin
        if not self.request.user.is_staff and self.request.user.is_authenticated:
            queryset = queryset.filter(id_usuario=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def exportadoras(self, request):
        """Obtener solo empresas exportadoras"""
        empresas = self.get_queryset().filter(exporta='Sí')
        serializer = self.get_serializer(empresas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de empresas de producto"""
        queryset = self.get_queryset()
        return Response({
            'total': queryset.count(),
            'exportadoras': queryset.filter(exporta='Sí').count(),
            'importadoras': queryset.filter(importa=True).count(),
            'con_certificado_pyme': queryset.filter(certificadopyme=True).count(),
            'con_certificaciones': queryset.filter(certificacionesbool=True).count(),
        })


class EmpresaservicioViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas de servicio"""
    queryset = Empresaservicio.objects.select_related(
        'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
    ).prefetch_related('servicios')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['exporta', 'importa', 'certificadopyme', 'tipo_empresa', 'id_rubro']
    search_fields = ['razon_social', 'cuit_cuil', 'correo']
    ordering_fields = ['razon_social', 'fecha_creacion']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaservicioListSerializer
        return EmpresaservicioSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por usuario si no es admin
        if not self.request.user.is_staff and self.request.user.is_authenticated:
            queryset = queryset.filter(id_usuario=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)


class EmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para empresas mixtas"""
    queryset = EmpresaMixta.objects.select_related(
        'tipo_empresa', 'id_rubro', 'departamento', 'municipio', 'localidad', 'id_usuario'
    ).prefetch_related('productos', 'servicios')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['exporta', 'importa', 'certificadopyme', 'tipo_empresa', 'id_rubro']
    search_fields = ['razon_social', 'cuit_cuil', 'correo']
    ordering_fields = ['razon_social', 'fecha_creacion']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaMixtaListSerializer
        return EmpresaMixtaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por usuario si no es admin
        if not self.request.user.is_staff and self.request.user.is_authenticated:
            queryset = queryset.filter(id_usuario=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(actualizado_por=self.request.user)


class ProductoEmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para productos de empresa"""
    queryset = ProductoEmpresa.objects.select_related('empresa').all()
    serializer_class = ProductoEmpresaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['empresa', 'es_principal']
    search_fields = ['nombre_producto', 'descripcion']
    ordering = ['-es_principal', 'nombre_producto']


class ServicioEmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios de empresa"""
    queryset = ServicioEmpresa.objects.select_related('empresa').all()
    serializer_class = ServicioEmpresaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['empresa', 'es_principal', 'tipo_servicio', 'alcance_servicio']
    search_fields = ['nombre_servicio', 'descripcion']
    ordering = ['-es_principal', 'nombre_servicio']


class ProductoEmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para productos de empresa mixta"""
    queryset = ProductoEmpresaMixta.objects.select_related('empresa').all()
    serializer_class = ProductoEmpresaMixtaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['empresa', 'es_principal']
    search_fields = ['nombre_producto', 'descripcion']
    ordering = ['-es_principal', 'nombre_producto']


class ServicioEmpresaMixtaViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios de empresa mixta"""
    queryset = ServicioEmpresaMixta.objects.select_related('empresa').all()
    serializer_class = ServicioEmpresaMixtaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, CanManageEmpresas]
    filterset_fields = ['empresa', 'es_principal', 'tipo_servicio', 'alcance_servicio']
    search_fields = ['nombre_servicio', 'descripcion']
    ordering = ['-es_principal', 'nombre_servicio']


class MatrizClasificacionExportadorViewSet(viewsets.ModelViewSet):
    """ViewSet para matriz de clasificación de exportador"""
    queryset = MatrizClasificacionExportador.objects.select_related(
        'empresa_producto', 'empresa_servicio', 'empresa_mixta', 'evaluado_por'
    ).all()
    serializer_class = MatrizClasificacionExportadorSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageEmpresas]
    filterset_fields = ['categoria', 'empresa_producto', 'empresa_servicio', 'empresa_mixta']
    ordering = ['-fecha_evaluacion']
    
    def perform_create(self, serializer):
        serializer.save(evaluado_por=self.request.user)

