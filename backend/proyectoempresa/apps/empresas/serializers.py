from rest_framework import serializers
from .models import (
    TipoEmpresa, Rubro, SubRubro, UnidadMedida, Otrorubro,
    Empresa, Empresaproducto, Empresaservicio, EmpresaMixta,  # Proxies para compatibilidad
    ProductoEmpresa, ServicioEmpresa,
    ProductoEmpresaMixta, ServicioEmpresaMixta,
    PosicionArancelaria, PosicionArancelariaMixta,
    MatrizClasificacionExportador
)
from apps.core.models import Dpto, Municipio, Localidades
from apps.geografia.models import Departamento as GeoDepartamento, Municipio as GeoMunicipio, Localidad as GeoLocalidad


def obtener_departamento_core_por_codigo_geografia(codigo_geografia):
    """
    Busca un departamento en core.dpto usando el código de geografía.
    Primero busca en geografia, luego busca o crea en core usando el código.
    """
    if codigo_geografia is None:
        return None
    
    codigo_str = str(codigo_geografia)
    
    # Primero intentar como ID numérico directo en core
    try:
        codigo_int = int(codigo_str)
        dpto = Dpto.objects.filter(id=codigo_int, activo=True).first()
        if dpto:
            return dpto
    except (ValueError, TypeError):
        pass
    
    # Buscar en geografia para obtener el nombre
    try:
        geo_dpto = GeoDepartamento.objects.get(id=codigo_str)
        # Buscar en core por código (coddpto)
        dpto = Dpto.objects.filter(coddpto=codigo_str, activo=True).first()
        if dpto:
            return dpto
        # Si no existe, crear uno nuevo en core usando el código de geografía
        dpto = Dpto.objects.create(
            coddpto=codigo_str,
            nomdpto=geo_dpto.nombre,
            codprov=geo_dpto.provincia.id if geo_dpto.provincia else '',
            activo=True
        )
        return dpto
    except GeoDepartamento.DoesNotExist:
        # Si no existe en geografia, buscar por código en core
        dpto = Dpto.objects.filter(coddpto=codigo_str, activo=True).first()
        if dpto:
            return dpto
        # Intentar buscar por ID numérico si el código es numérico
        try:
            codigo_int = int(codigo_str)
            dpto = Dpto.objects.filter(id=codigo_int, activo=True).first()
            if dpto:
                return dpto
        except (ValueError, TypeError):
            pass
        raise serializers.ValidationError(f"Departamento con código '{codigo_str}' no encontrado en geografía ni en core")


def obtener_municipio_core_por_codigo_geografia(codigo_geografia, codigo_departamento=None):
    """
    Busca un municipio en core.municipio usando el código de geografía.
    """
    if codigo_geografia is None:
        return None
    
    codigo_str = str(codigo_geografia)
    
    # Intentar como ID numérico directo
    try:
        codigo_int = int(codigo_str)
        municipio = Municipio.objects.filter(id=codigo_int, activo=True).first()
        if municipio:
            return municipio
    except (ValueError, TypeError):
        pass
    
    # Buscar en geografia
    try:
        geo_mun = GeoMunicipio.objects.get(id=codigo_str)
        # Obtener el departamento de core
        dpto_core = None
        if codigo_departamento:
            dpto_core = obtener_departamento_core_por_codigo_geografia(codigo_departamento)
        elif geo_mun.departamento:
            dpto_core = obtener_departamento_core_por_codigo_geografia(geo_mun.departamento.id)
        
        # Buscar en core por código
        municipio = Municipio.objects.filter(codmun=codigo_str, activo=True).first()
        if municipio:
            return municipio
        
        # Si no existe y tenemos departamento, crear uno nuevo
        if dpto_core:
            municipio = Municipio.objects.create(
                codmun=codigo_str,
                nommun=geo_mun.nombre,
                coddpto=dpto_core.coddpto,
                codprov=geo_mun.provincia.id if geo_mun.provincia else '',
                dpto=dpto_core,
                activo=True
            )
            return municipio
    except GeoMunicipio.DoesNotExist:
        pass
    
    # Buscar por código en core como último recurso
    municipio = Municipio.objects.filter(codmun=codigo_str, activo=True).first()
    if municipio:
        return municipio
    
    # Intentar buscar por ID numérico si el código es numérico
    try:
        codigo_int = int(codigo_str)
        municipio = Municipio.objects.filter(id=codigo_int, activo=True).first()
        if municipio:
            return municipio
    except (ValueError, TypeError):
        pass
    
    return None  # Permitir None para municipios opcionales


def obtener_localidad_core_por_codigo_geografia(codigo_geografia, codigo_municipio=None):
    """
    Busca una localidad en core.localidades usando el código de geografía.
    """
    if codigo_geografia is None:
        return None
    
    codigo_str = str(codigo_geografia)
    
    # Intentar como ID numérico directo
    try:
        codigo_int = int(codigo_str)
        localidad = Localidades.objects.filter(id=codigo_int, activo=True).first()
        if localidad:
            return localidad
    except (ValueError, TypeError):
        pass
    
    # Buscar en geografia
    try:
        geo_loc = GeoLocalidad.objects.get(id=codigo_str)
        # Obtener el municipio de core
        mun_core = None
        if codigo_municipio:
            mun_core = obtener_municipio_core_por_codigo_geografia(codigo_municipio)
        elif geo_loc.municipio:
            mun_core = obtener_municipio_core_por_codigo_geografia(geo_loc.municipio.id, geo_loc.departamento.id if geo_loc.departamento else None)
        
        # Buscar en core por código
        localidad = Localidades.objects.filter(codloc=codigo_str, activo=True).first()
        if localidad:
            return localidad
        
        # Si no existe y tenemos municipio, crear uno nuevo
        if mun_core:
            localidad = Localidades.objects.create(
                codloc=codigo_str,
                codlocsv=codigo_str[:10] if len(codigo_str) > 10 else codigo_str,
                nomloc=geo_loc.nombre,
                codmun=mun_core.codmun,
                coddpto=mun_core.dpto.coddpto,
                codprov=geo_loc.provincia.id if geo_loc.provincia else '',
                codpais='AR',
                latitud=float(geo_loc.centroide_lat) if geo_loc.centroide_lat else None,
                longitud=float(geo_loc.centroide_lon) if geo_loc.centroide_lon else None,
                codpos='',
                municipio=mun_core,
                activo=True
            )
            return localidad
    except GeoLocalidad.DoesNotExist:
        pass
    
    # Buscar por código en core como último recurso
    localidad = Localidades.objects.filter(codloc=codigo_str, activo=True).first()
    if localidad:
        return localidad
    
    # Intentar buscar por ID numérico si el código es numérico
    try:
        codigo_int = int(codigo_str)
        localidad = Localidades.objects.filter(id=codigo_int, activo=True).first()
        if localidad:
            return localidad
    except (ValueError, TypeError):
        pass
    
    return None  # Permitir None para localidades opcionales


class TipoEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de empresa"""
    
    class Meta:
        model = TipoEmpresa
        fields = ['id', 'nombre', 'descripcion', 'activo']
        read_only_fields = ['id']


class SubRubroSerializer(serializers.ModelSerializer):
    """Serializer para sub-rubros"""
    
    class Meta:
        model = SubRubro
        fields = ['id', 'nombre', 'descripcion', 'activo', 'orden']
        read_only_fields = ['id']


class RubroSerializer(serializers.ModelSerializer):
    """Serializer para rubros"""
    subrubros = SubRubroSerializer(many=True, read_only=True)
    
    class Meta:
        model = Rubro
        fields = [
            'id', 'nombre', 'descripcion', 'tipo',
            'unidad_medida_estandar', 'activo', 'orden', 'subrubros'
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
        fields = ['id', 'producto', 'producto_id', 'codigo_arancelario', 'descripcion_arancelaria']
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
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            # Usar el campo empresa unificado
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    class Meta:
        model = Empresaproducto
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz'
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
    categoria_matriz = serializers.SerializerMethodField()
    
    # Campos para recibir códigos de geografía como strings
    departamento = serializers.CharField(write_only=True, required=False, allow_null=True)
    municipio = serializers.CharField(write_only=True, required=False, allow_null=True)
    localidad = serializers.CharField(write_only=True, required=False, allow_null=True)
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            # Usar el campo empresa unificado
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    def validate_departamento(self, value):
        """Convertir código de geografía a objeto Dpto de core"""
        if value is None:
            return None
        if isinstance(value, Dpto):
            return value
        return obtener_departamento_core_por_codigo_geografia(value)
    
    def validate_municipio(self, value):
        """Convertir código de geografía a objeto Municipio de core"""
        if value is None or value == '':
            return None
        if isinstance(value, Municipio):
            return value
        # Obtener código de departamento del contexto si está disponible
        departamento_codigo = None
        if hasattr(self, 'initial_data') and 'departamento' in self.initial_data:
            departamento_codigo = self.initial_data['departamento']
        try:
            return obtener_municipio_core_por_codigo_geografia(value, departamento_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando municipio '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar municipio '{value}': {str(e)}")
    
    def validate_localidad(self, value):
        """Convertir código de geografía a objeto Localidades de core"""
        if value is None or value == '':
            return None
        if isinstance(value, Localidades):
            return value
        # Obtener código de municipio del contexto si está disponible
        municipio_codigo = None
        if hasattr(self, 'initial_data') and 'municipio' in self.initial_data:
            municipio_codigo = self.initial_data['municipio']
        try:
            return obtener_localidad_core_por_codigo_geografia(value, municipio_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando localidad '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar localidad '{value}': {str(e)}")
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        
        # Convertir códigos de geografía a objetos de core
        if 'departamento' in validated_data and validated_data['departamento']:
            validated_data['departamento'] = self.validate_departamento(validated_data['departamento'])
        if 'municipio' in validated_data and validated_data['municipio']:
            validated_data['municipio'] = self.validate_municipio(validated_data['municipio'])
        if 'localidad' in validated_data and validated_data['localidad']:
            validated_data['localidad'] = self.validate_localidad(validated_data['localidad'])
        
        # Si no hay id_usuario o el usuario actual es admin/staff, crear usuario automáticamente
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        # Si el usuario actual es admin/staff y hay email de contacto, crear usuario automáticamente
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
                    # Obtener o crear rol de Empresa
                    rol_empresa, _ = RolUsuario.objects.get_or_create(
                        nombre='Empresa',
                        defaults={
                            'descripcion': 'Rol para empresas registradas',
                            'puede_crear_empresas': False,
                            'puede_editar_empresas': False,
                            'puede_eliminar_empresas': False,
                            'puede_ver_auditoria': False,
                            'puede_exportar_datos': False,
                            'puede_importar_datos': False,
                            'puede_gestionar_usuarios': False,
                            'puede_acceder_admin': False,
                            'nivel_acceso': 1,
                            'activo': True
                        }
                    )
                    
                    # Crear o obtener usuario
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        # Actualizar usuario existente
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)  # Actualizar contraseña
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        # Crear nuevo usuario
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,  # Contraseña inicial es el CUIT
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar empresa con conversión de códigos geográficos"""
        # Convertir códigos de geografía a objetos de core
        if 'departamento' in validated_data and validated_data['departamento']:
            validated_data['departamento'] = self.validate_departamento(validated_data['departamento'])
        if 'municipio' in validated_data and validated_data['municipio']:
            validated_data['municipio'] = self.validate_municipio(validated_data['municipio'])
        if 'localidad' in validated_data and validated_data['localidad']:
            validated_data['localidad'] = self.validate_localidad(validated_data['localidad'])
        return super().update(instance, validated_data)
    
    class Meta:
        model = Empresaproducto
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class EmpresaservicioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de servicio"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nomdpto', read_only=True)
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    class Meta:
        model = Empresaservicio
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz'
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
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    def validate_departamento(self, value):
        """Convertir código de geografía a objeto Dpto de core"""
        if value is None:
            return None
        if isinstance(value, Dpto):
            return value
        try:
            return obtener_departamento_core_por_codigo_geografia(value)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando departamento '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar departamento '{value}': {str(e)}")
    
    def validate_municipio(self, value):
        """Convertir código de geografía a objeto Municipio de core"""
        if value is None:
            return None
        if isinstance(value, Municipio):
            return value
        departamento_codigo = None
        if hasattr(self, 'initial_data') and 'departamento' in self.initial_data:
            departamento_codigo = self.initial_data['departamento']
        try:
            return obtener_municipio_core_por_codigo_geografia(value, departamento_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando municipio '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar municipio '{value}': {str(e)}")
    
    def validate_localidad(self, value):
        """Convertir código de geografía a objeto Localidades de core"""
        if value is None:
            return None
        if isinstance(value, Localidades):
            return value
        municipio_codigo = None
        if hasattr(self, 'initial_data') and 'municipio' in self.initial_data:
            municipio_codigo = self.initial_data['municipio']
        try:
            return obtener_localidad_core_por_codigo_geografia(value, municipio_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando localidad '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar localidad '{value}': {str(e)}")
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        
        # Convertir códigos de geografía a objetos de core
        if 'departamento' in validated_data and validated_data['departamento']:
            validated_data['departamento'] = self.validate_departamento(validated_data['departamento'])
        if 'municipio' in validated_data and validated_data['municipio']:
            validated_data['municipio'] = self.validate_municipio(validated_data['municipio'])
        if 'localidad' in validated_data and validated_data['localidad']:
            validated_data['localidad'] = self.validate_localidad(validated_data['localidad'])
        
        # Si no hay id_usuario o el usuario actual es admin/staff, crear usuario automáticamente
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        # Si el usuario actual es admin/staff y hay email de contacto, crear usuario automáticamente
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
                    # Obtener o crear rol de Empresa
                    rol_empresa, _ = RolUsuario.objects.get_or_create(
                        nombre='Empresa',
                        defaults={
                            'descripcion': 'Rol para empresas registradas',
                            'puede_crear_empresas': False,
                            'puede_editar_empresas': False,
                            'puede_eliminar_empresas': False,
                            'puede_ver_auditoria': False,
                            'puede_exportar_datos': False,
                            'puede_importar_datos': False,
                            'puede_gestionar_usuarios': False,
                            'puede_acceder_admin': False,
                            'nivel_acceso': 1,
                            'activo': True
                        }
                    )
                    
                    # Crear o obtener usuario
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        # Actualizar usuario existente
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)  # Actualizar contraseña
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        # Crear nuevo usuario
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,  # Contraseña inicial es el CUIT
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        return super().create(validated_data)
    
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
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    class Meta:
        model = EmpresaMixta
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz'
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
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                # Convertir la categoría del modelo a formato legible
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    def validate_departamento(self, value):
        """Convertir código de geografía a objeto Dpto de core"""
        if value is None:
            return None
        if isinstance(value, Dpto):
            return value
        try:
            return obtener_departamento_core_por_codigo_geografia(value)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando departamento '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar departamento '{value}': {str(e)}")
    
    def validate_municipio(self, value):
        """Convertir código de geografía a objeto Municipio de core"""
        if value is None:
            return None
        if isinstance(value, Municipio):
            return value
        departamento_codigo = None
        if hasattr(self, 'initial_data') and 'departamento' in self.initial_data:
            departamento_codigo = self.initial_data['departamento']
        try:
            return obtener_municipio_core_por_codigo_geografia(value, departamento_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando municipio '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar municipio '{value}': {str(e)}")
    
    def validate_localidad(self, value):
        """Convertir código de geografía a objeto Localidades de core"""
        if value is None:
            return None
        if isinstance(value, Localidades):
            return value
        municipio_codigo = None
        if hasattr(self, 'initial_data') and 'municipio' in self.initial_data:
            municipio_codigo = self.initial_data['municipio']
        try:
            return obtener_localidad_core_por_codigo_geografia(value, municipio_codigo)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error validando localidad '{value}': {str(e)}")
            raise serializers.ValidationError(f"Error al procesar localidad '{value}': {str(e)}")
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        
        # Convertir códigos de geografía a objetos de core
        if 'departamento' in validated_data and validated_data['departamento']:
            validated_data['departamento'] = self.validate_departamento(validated_data['departamento'])
        if 'municipio' in validated_data and validated_data['municipio']:
            validated_data['municipio'] = self.validate_municipio(validated_data['municipio'])
        if 'localidad' in validated_data and validated_data['localidad']:
            validated_data['localidad'] = self.validate_localidad(validated_data['localidad'])
        
        # Si no hay id_usuario o el usuario actual es admin/staff, crear usuario automáticamente
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        # Si el usuario actual es admin/staff y hay email de contacto, crear usuario automáticamente
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
                    # Obtener o crear rol de Empresa
                    rol_empresa, _ = RolUsuario.objects.get_or_create(
                        nombre='Empresa',
                        defaults={
                            'descripcion': 'Rol para empresas registradas',
                            'puede_crear_empresas': False,
                            'puede_editar_empresas': False,
                            'puede_eliminar_empresas': False,
                            'puede_ver_auditoria': False,
                            'puede_exportar_datos': False,
                            'puede_importar_datos': False,
                            'puede_gestionar_usuarios': False,
                            'puede_acceder_admin': False,
                            'nivel_acceso': 1,
                            'activo': True
                        }
                    )
                    
                    # Crear o obtener usuario
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        # Actualizar usuario existente
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)  # Actualizar contraseña
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        # Crear nuevo usuario
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,  # Contraseña inicial es el CUIT
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        return super().create(validated_data)
    
    class Meta:
        model = EmpresaMixta
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class MatrizClasificacionExportadorSerializer(serializers.ModelSerializer):
    """Serializer para matriz de clasificación de exportador"""
    empresa_nombre = serializers.CharField(source='empresa.razon_social', read_only=True)
    empresa_tipo = serializers.CharField(source='empresa.tipo_empresa_valor', read_only=True)
    
    class Meta:
        model = MatrizClasificacionExportador
        fields = [
            'id', 'empresa', 'empresa_nombre', 'empresa_tipo',
            'experiencia_exportadora', 'volumen_produccion', 'presencia_digital',
            'posicion_arancelaria', 'participacion_internacionalizacion',
            'estructura_interna', 'interes_exportador',
            'certificaciones_nacionales', 'certificaciones_internacionales',
            'puntaje_total', 'categoria', 'fecha_evaluacion',
            'evaluado_por', 'observaciones'
        ]
        read_only_fields = ['id', 'puntaje_total', 'categoria', 'fecha_evaluacion', 'empresa_nombre', 'empresa_tipo']
    
    def validate(self, data):
        """Validar que la empresa esté asignada"""
        if not data.get('empresa'):
            if not self.instance or not self.instance.empresa:
                raise serializers.ValidationError('Debe asignar una empresa')
        return data

