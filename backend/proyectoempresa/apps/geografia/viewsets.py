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
    pagination_class = None  # Deshabilitar paginación para obtener todos los datos


class DepartamentoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Departamentos (solo lectura)"""
    queryset = Departamento.objects.select_related('provincia').all()
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'categoria']
    search_fields = ['nombre', 'nombre_completo']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None  # Deshabilitar paginación para obtener todos los datos
    
    @action(detail=False, methods=['get'])
    def por_provincia(self, request):
        """Obtener departamentos por provincia"""
        provincia_id = request.query_params.get('provincia_id')
        if not provincia_id:
            return Response({'error': 'provincia_id es requerido'}, status=400)
        
        departamentos = self.queryset.filter(provincia_id=provincia_id)
        serializer = self.get_serializer(departamentos, many=True)
        return Response(serializer.data)


class MunicipioViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Municipios (solo lectura)"""
    queryset = Municipio.objects.select_related('provincia', 'departamento').all()
    serializer_class = MunicipioSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'departamento', 'categoria']
    search_fields = ['nombre', 'nombre_completo']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None  # Deshabilitar paginación para obtener todos los datos
    
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
        provincia_id = request.query_params.get('provincia_id')
        if not provincia_id:
            return Response({'error': 'provincia_id es requerido'}, status=400)
        
        municipios = self.queryset.filter(provincia_id=provincia_id)
        serializer = self.get_serializer(municipios, many=True)
        return Response(serializer.data)


class LocalidadViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para Localidades (solo lectura)"""
    queryset = Localidad.objects.select_related('provincia', 'departamento', 'municipio').all()
    serializer_class = LocalidadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provincia', 'departamento', 'municipio', 'tipo_asentamiento']
    search_fields = ['nombre']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    pagination_class = None  # Deshabilitar paginación para obtener todos los datos
    
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

