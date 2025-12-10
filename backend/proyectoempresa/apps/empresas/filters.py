import django_filters
from django import forms
from .models import Empresa, Rubro  # ✅ Usar modelo unificado

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
        field_name='departamento__nomdpto',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por departamento...'})
    )
    
    municipio = django_filters.CharFilter(
        field_name='municipio__nommun',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por municipio...'})
    )
    
    localidad = django_filters.CharFilter(
        field_name='localidad__nomloc',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por localidad...'})
    )
    
    # Filtros booleanos
    certificadopyme = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    exporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por exportación...'})
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
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ferias nacionales...'})
    )
    
    feriasinternacionales = django_filters.CharFilter(
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
        model = Empresa  # ✅ Usar modelo unificado
        fields = [
            'razon_social', 'producto', 'descripcion', 'telefono', 'correo', 
            'direccion', 'cuit_cuil', 'departamento', 'municipio', 'localidad',
            'certificadopyme', 'exporta', 'promo2idiomas', 'importa',
            'destinoexporta', 'feriasnacionales', 'feriasinternacionales',
            'certificaciones', 'capacidadproductiva', 'id_rubro'
        ]

class EmpresaServicioFilter(django_filters.FilterSet):
    # Similar a EmpresaProductoFilter pero para servicios
    razon_social = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por razón social...'})
    )
    
    # Filtro por servicios específicos
    servicio = django_filters.CharFilter(
        field_name='servicios__nombre_servicio',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por servicio...'})
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
    
    departamento = django_filters.CharFilter(
        field_name='departamento__nomdpto',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por departamento...'})
    )
    
    municipio = django_filters.CharFilter(
        field_name='municipio__nommun',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por municipio...'})
    )
    
    localidad = django_filters.CharFilter(
        field_name='localidad__nomloc',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por localidad...'})
    )
    
    certificadopyme = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    exporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por exportación...'})
    )
    
    promo2idiomas = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    importa = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    destinoexporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Destino de exportación...'})
    )
    
    certificaciones = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Certificaciones...'})
    )
    
    id_rubro = django_filters.ModelChoiceFilter(
        queryset=Rubro.objects.all(),
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Rubro"
    )
    
    class Meta:
        model = Empresa  # ✅ Usar modelo unificado
        fields = [
            'razon_social', 'servicio', 'telefono', 'correo', 
            'direccion', 'cuit_cuil', 'departamento', 'municipio', 'localidad',
            'certificadopyme', 'exporta', 'promo2idiomas', 'importa',
            'destinoexporta', 'certificaciones', 'id_rubro'
        ]

class EmpresaMixtaFilter(django_filters.FilterSet):
    # Similar a EmpresaProductoFilter pero para empresas mixtas
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
    
    # Filtro por servicios específicos
    servicio = django_filters.CharFilter(
        field_name='servicios__nombre_servicio',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por servicio...'})
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
    
    departamento = django_filters.CharFilter(
        field_name='departamento__nomdpto',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por departamento...'})
    )
    
    municipio = django_filters.CharFilter(
        field_name='municipio__nommun',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por municipio...'})
    )
    
    localidad = django_filters.CharFilter(
        field_name='localidad__nomloc',
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por localidad...'})
    )
    
    certificadopyme = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    exporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por exportación...'})
    )
    
    promo2idiomas = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    importa = django_filters.BooleanFilter(
        widget=forms.Select(attrs={'class': 'form-control'}, choices=[('', 'Todos'), (True, 'Sí'), (False, 'No')])
    )
    
    destinoexporta = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Destino de exportación...'})
    )
    
    certificaciones = django_filters.CharFilter(
        lookup_expr='icontains',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Certificaciones...'})
    )
    
    id_rubro = django_filters.ModelChoiceFilter(
        queryset=Rubro.objects.all(),
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Rubro"
    )
    
    class Meta:
        model = Empresa  # ✅ Usar modelo unificado
        fields = [
            'razon_social', 'producto', 'servicio', 'telefono', 'correo', 
            'direccion', 'cuit_cuil', 'departamento', 'municipio', 'localidad',
            'certificadopyme', 'exporta', 'promo2idiomas', 'importa',
            'destinoexporta', 'certificaciones', 'id_rubro'
        ]