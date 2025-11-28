from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Provincia, Departamento, Municipio, Localidad
from .serializers import (
    ProvinciaSerializer, DepartamentoSerializer, 
    MunicipioSerializer, LocalidadSerializer
)

# Constante para Catamarca
CATAMARCA_ID = '10'


class ProvinciaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Provincias (solo lectura)"""
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categoria']
    search_fields = ['nombre', 'nombre_completo', 'iso_id']
    ordering_fields = ['nombre', 'iso_id']
    ordering = ['nombre']
    pagination_class = None


class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Departamentos de Catamarca (solo lectura)"""
    # Por defecto solo mostrar departamentos de Catamarca
    queryset = Departamento.objects.select_related('provincia').filter(provincia_id=CATAMARCA_ID)
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'categoria']
    search_fields = ['nombre', 'nombre_completo']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None
    
    @action(detail=False, methods=['get'])
    def por_provincia(self, request):
        """Obtener departamentos por provincia"""
        provincia_id = request.query_params.get('provincia_id', CATAMARCA_ID)
        departamentos = Departamento.objects.filter(provincia_id=provincia_id)
        serializer = self.get_serializer(departamentos, many=True)
        return Response(serializer.data)


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Municipios de Catamarca (solo lectura)"""
    # Por defecto solo mostrar municipios de Catamarca
    queryset = Municipio.objects.select_related('provincia', 'departamento').filter(provincia_id=CATAMARCA_ID)
    serializer_class = MunicipioSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'departamento', 'categoria']
    search_fields = ['nombre', 'nombre_completo']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None
    
    @action(detail=False, methods=['get'])
    def por_departamento(self, request):
        """Obtener municipios por departamento"""
        departamento_id = request.query_params.get('departamento_id')
        if not departamento_id:
            return Response({'error': 'departamento_id es requerido'}, status=400)
        
        municipios = self.queryset.filter(departamento_id=departamento_id)
        serializer = self.get_serializer(municipios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_provincia(self, request):
        """Obtener municipios por provincia"""
        provincia_id = request.query_params.get('provincia_id', CATAMARCA_ID)
        municipios = Municipio.objects.filter(provincia_id=provincia_id)
        serializer = self.get_serializer(municipios, many=True)
        return Response(serializer.data)


class LocalidadViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Localidades de Catamarca (solo lectura)"""
    # Por defecto solo mostrar localidades de Catamarca
    queryset = Localidad.objects.select_related('provincia', 'departamento', 'municipio').filter(provincia_id=CATAMARCA_ID)
    serializer_class = LocalidadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'departamento', 'municipio', 'tipo_asentamiento']
    search_fields = ['nombre']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None
    
    @action(detail=False, methods=['get'])
    def por_municipio(self, request):
        """Obtener localidades por municipio"""
        municipio_id = request.query_params.get('municipio_id')
        if not municipio_id:
            return Response({'error': 'municipio_id es requerido'}, status=400)
        
        localidades = self.queryset.filter(municipio_id=municipio_id)
        serializer = self.get_serializer(localidades, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_departamento(self, request):
        """Obtener localidades por departamento"""
        departamento_id = request.query_params.get('departamento_id')
        if not departamento_id:
            return Response({'error': 'departamento_id es requerido'}, status=400)
        
        localidades = self.queryset.filter(departamento_id=departamento_id)
        serializer = self.get_serializer(localidades, many=True)
        return Response(serializer.data)