from rest_framework import serializers
from .models import (
    TipoEmpresa, Rubro, UnidadMedida, Otrorubro,
    Empresaproducto, Empresaservicio, EmpresaMixta,
    ProductoEmpresa, ServicioEmpresa,
    ProductoEmpresaMixta, ServicioEmpresaMixta,
    PosicionArancelaria, PosicionArancelariaMixta,
    MatrizClasificacionExportador
)


class TipoEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de empresa"""
    
    class Meta:
        model = TipoEmpresa
        fields = ['id', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class RubroSerializer(serializers.ModelSerializer):
    """Serializer para rubros"""
    
    class Meta:
        model = Rubro
        fields = [
            'id', 'nombre', 'descripcion', 'tipo',
            'unidad_medida_estandar', 'activo', 'orden'
        ]
        read_only_fields = ['id']


class UnidadMedidaSerializer(serializers.ModelSerializer):
    """Serializer para unidades de medida"""
    
    class Meta:
        model = UnidadMedida
        fields = ['id', 'nombre', 'simbolo', 'tipo', 'activo']
        read_only_fields = ['id']


class OtrorubroSerializer(serializers.ModelSerializer):
    """Serializer para otros rubros"""
    
    class Meta:
        model = Otrorubro
        fields = ['id', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class PosicionArancelariaSerializer(serializers.ModelSerializer):
    """Serializer para posiciones arancelarias"""
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
    
    class Meta:
        model = PosicionArancelaria
        fields = ['id', 'producto_id', 'codigo_arancelario', 'descripcion_arancelaria']
        read_only_fields = ['id', 'producto_id']


class ProductoEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para productos de empresa"""
    posicion_arancelaria = serializers.SerializerMethodField()
    
    def get_posicion_arancelaria(self, obj):
        """Obtener la posición arancelaria del producto si existe"""
        try:
            # Intentar obtener la posición arancelaria relacionada
            posicion = obj.posicion_arancelaria.first() if hasattr(obj, 'posicion_arancelaria') else None
            if posicion:
                return PosicionArancelariaSerializer(posicion).data
            return None
        except Exception:
            return None
    
    class Meta:
        model = ProductoEmpresa
        fields = [
            'id', 'empresa', 'nombre_producto', 'descripcion',
            'capacidad_productiva', 'unidad_medida', 'periodo_capacidad',
            'es_principal', 'precio_estimado', 'moneda_precio',
            'posicion_arancelaria'
        ]
        read_only_fields = ['id']


class ServicioEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para servicios de empresa"""
    
    class Meta:
        model = ServicioEmpresa
        fields = [
            'id', 'empresa', 'nombre_servicio', 'descripcion',
            'tipo_servicio', 'tipo_servicio_otro', 'sector_atendido',
            'sector_otro', 'alcance_servicio', 'paises_trabaja',
            'exporta_servicios', 'interes_exportar_servicios',
            'idiomas_trabajo', 'idioma_otro', 'forma_contratacion',
            'forma_contratacion_otro', 'certificaciones_tecnicas',
            'tiene_equipo_tecnico', 'equipo_tecnico_formacion', 'es_principal'
        ]
        read_only_fields = ['id']


class EmpresaproductoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de producto"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    
    class Meta:
        model = Empresaproducto
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion'
        ]


class EmpresaproductoSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas de producto"""
    productos = ProductoEmpresaSerializer(many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    # Agregar nombres de campos relacionados
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    municipio_nombre = serializers.CharField(source='municipio.nommun', read_only=True, allow_null=True)
    localidad_nombre = serializers.CharField(source='localidad.nomloc', read_only=True, allow_null=True)
    
    class Meta:
        model = Empresaproducto
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class EmpresaservicioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de servicio"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    
    class Meta:
        model = Empresaservicio
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion'
        ]


class EmpresaservicioSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas de servicio"""
    servicios = ServicioEmpresaSerializer(many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    # Agregar nombres de campos relacionados
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    municipio_nombre = serializers.CharField(source='municipio.nommun', read_only=True, allow_null=True)
    localidad_nombre = serializers.CharField(source='localidad.nomloc', read_only=True, allow_null=True)
    
    class Meta:
        model = Empresaservicio
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class ProductoEmpresaMixtaSerializer(serializers.ModelSerializer):
    """Serializer para productos de empresa mixta"""
    
    class Meta:
        model = ProductoEmpresaMixta
        fields = [
            'id', 'empresa', 'nombre_producto', 'descripcion',
            'capacidad_productiva', 'unidad_medida', 'periodo_capacidad',
            'es_principal', 'precio_estimado', 'moneda_precio'
        ]
        read_only_fields = ['id']


class ServicioEmpresaMixtaSerializer(serializers.ModelSerializer):
    """Serializer para servicios de empresa mixta"""
    
    class Meta:
        model = ServicioEmpresaMixta
        fields = [
            'id', 'empresa', 'nombre_servicio', 'descripcion',
            'tipo_servicio', 'tipo_servicio_otro', 'sector_atendido',
            'sector_otro', 'alcance_servicio', 'paises_trabaja',
            'exporta_servicios', 'interes_exportar_servicios',
            'idiomas_trabajo', 'idioma_otro', 'forma_contratacion',
            'forma_contratacion_otro', 'certificaciones_tecnicas',
            'tiene_equipo_tecnico', 'equipo_tecnico_formacion', 'es_principal'
        ]
        read_only_fields = ['id']


class EmpresaMixtaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas mixtas"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    
    class Meta:
        model = EmpresaMixta
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion'
        ]


class EmpresaMixtaSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas mixtas"""
    productos = ProductoEmpresaMixtaSerializer(many=True, read_only=True)
    servicios = ServicioEmpresaMixtaSerializer(many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    # Agregar nombres de campos relacionados
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    municipio_nombre = serializers.CharField(source='municipio.nommun', read_only=True, allow_null=True)
    localidad_nombre = serializers.CharField(source='localidad.nomloc', read_only=True, allow_null=True)
    
    class Meta:
        model = EmpresaMixta
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class MatrizClasificacionExportadorSerializer(serializers.ModelSerializer):
    """Serializer para matriz de clasificación de exportador"""
    
    class Meta:
        model = MatrizClasificacionExportador
        fields = [
            'id', 'empresa_producto', 'empresa_servicio', 'empresa_mixta',
            'experiencia_exportadora', 'volumen_produccion', 'presencia_digital',
            'posicion_arancelaria', 'participacion_internacionalizacion',
            'estructura_interna', 'interes_exportador',
            'certificaciones_nacionales', 'certificaciones_internacionales',
            'puntaje_total', 'categoria', 'fecha_evaluacion',
            'evaluado_por', 'observaciones'
        ]
        read_only_fields = ['id', 'puntaje_total', 'categoria', 'fecha_evaluacion']

