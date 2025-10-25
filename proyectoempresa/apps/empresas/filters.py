import django_filters
from django import forms
from .models import Empresaproducto, Empresaservicio, Rubro
from apps.core.models import Dpto, Municipio, Localidades

class EmpresaProductoFilter(django_filters.FilterSet):
    # Filtros textuales
    razon_social = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por razón social...'})
    )
    
    # Filtro por productos específicos
    producto = django_filters.CharFilter(
        field_name='productos__nombre_producto',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por producto...'})
    )
    
    # Filtro por descripción de empresa
    descripcion = django_filters.CharFilter(
        field_name='observaciones',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por descripción...'})
    )
    
    telefono = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por teléfono...'})
    )
    
    correo = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por email...'})
    )
    
    direccion = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por dirección...'})
    )
    
    cuit_cuil = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por CUIT...'})
    )
    
    # Filtros de ubicación
    departamento = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por departamento...'})
    )
    
    municipio = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por municipio...'})
    )
    
    localidad = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por localidad...'})
    )
    
    # Filtros booleanos
    certificadopyme = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    exporta = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    promo2idiomas = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    importa = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    # Filtros de texto libre
    destinoexporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Destino de exportación...'})
    )
    
    # Filtros por ferias
    feriasnacionales = django_filters.CharFilter(
        field_name='ferias__nombre_feria',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ferias nacionales...'})
    )
    
    feriasinternacionales = django_filters.CharFilter(
        field_name='ferias__nombre_feria',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ferias internacionales...'})
    )
    
    certificaciones = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Certificaciones...'})
    )
    
    # Filtro por capacidad productiva
    capacidadproductiva = django_filters.CharFilter(
        field_name='productos__capacidad_productiva',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Capacidad productiva...'})
    )
    
    # Filtro por rubro
    id_rubro = django_filters.ModelChoiceFilter(
        queryset=Rubro.objects.all(),
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Rubro"
    )
    
    class Meta:
        model = Empresaproducto
        fields = [
            'razon_social', 'producto', 'descripcion', 'telefono', 'correo', 
            'direccion', 'cuit_cuil', 'departamento', 'municipio', 'localidad',
            'certificadopyme', 'exporta', 'promo2idiomas', 'importa',
            'destinoexporta', 'feriasnacionales', 'feriasinternacionales',
            'certificaciones', 'capacidadproductiva', 'id_rubro'
        ]

class EmpresaFilter(django_filters.FilterSet):
    # Filtros geográficos
    departamento = django_filters.ModelChoiceFilter(
        queryset=Dpto.objects.all(),
        field_name='departamento',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    municipio = django_filters.ModelChoiceFilter(
        queryset=Municipio.objects.all(),
        field_name='municipio',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    localidad = django_filters.ModelChoiceFilter(
        queryset=Localidades.objects.all(),
        field_name='localidad',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    # Filtros de capacidad productiva
    capacidad_minima = django_filters.NumberFilter(
        field_name='capacidadproductiva',
        lookup_expr='gte',
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )
    capacidad_maxima = django_filters.NumberFilter(
        field_name='capacidadproductiva',
        lookup_expr='lte',
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )
    
    # Filtros de exportación
    exporta = django_filters.ChoiceFilter(
        choices=[('Sí', 'Sí'), ('No, solo ventas nacionales', 'No, solo ventas nacionales'), ('No, solo ventas locales', 'No, solo ventas locales')],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    # Filtros de certificaciones
    tiene_certificaciones = django_filters.BooleanFilter(
        field_name='certificacionesbool',
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    # Filtros de ferias
    participo_ferias_nacionales = django_filters.BooleanFilter(
        field_name='participoferianacional',
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    # Filtros de puntaje
    puntaje_minimo = django_filters.NumberFilter(
        field_name='puntaje',
        lookup_expr='gte',
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )
    
    class Meta:
        model = Empresaproducto
        fields = ['departamento', 'municipio', 'localidad', 'exporta', 'tiene_certificaciones', 
                 'participo_ferias_nacionales', 'capacidad_minima', 'capacidad_maxima', 'puntaje_minimo']
