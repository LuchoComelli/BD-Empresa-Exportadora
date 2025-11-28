from rest_framework import serializers
from .models import (
    TipoEmpresa, Rubro, SubRubro, UnidadMedida, Otrorubro,
    Empresa, Empresaproducto, Empresaservicio, EmpresaMixta,  # Proxies para compatibilidad
    ProductoEmpresa, ServicioEmpresa,
    ProductoEmpresaMixta, ServicioEmpresaMixta,
    PosicionArancelaria, PosicionArancelariaMixta,
    MatrizClasificacionExportador
)
from apps.geografia.models import Departamento, Municipio, Localidad


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
    # Campos alias para facilitar el consumo desde el frontend
    sectores = serializers.SerializerMethodField()
    alcance_geografico = serializers.CharField(source='alcance_servicio', read_only=True)
    paises_destino = serializers.CharField(source='paises_trabaja', read_only=True)
    idiomas = serializers.SerializerMethodField()
    exporta_servicios_alias = serializers.BooleanField(source='exporta_servicios', read_only=True)
    interes_exportar = serializers.BooleanField(source='interes_exportar_servicios', read_only=True)

    class Meta:
        model = ServicioEmpresa
        fields = [
            'id', 'empresa', 'nombre_servicio', 'descripcion',
            'tipo_servicio', 'tipo_servicio_otro', 'sector_atendido',
            'sector_otro', 'alcance_servicio', 'paises_trabaja',
            'exporta_servicios', 'interes_exportar_servicios',
            'idiomas_trabajo', 'idioma_otro', 'forma_contratacion',
            'forma_contratacion_otro', 'certificaciones_tecnicas',
            'tiene_equipo_tecnico', 'equipo_tecnico_formacion', 'es_principal',
            # Aliases (read-only extras) para compatibilidad con frontend
            'sectores', 'alcance_geografico', 'paises_destino', 'idiomas', 'exporta_servicios_alias', 'interes_exportar'
        ]
        read_only_fields = ['id']

    def get_sectores(self, obj):
        parts = []
        try:
            if getattr(obj, 'sector_atendido', None):
                parts.append(obj.sector_atendido)
            if getattr(obj, 'sector_otro', None):
                parts.append(obj.sector_otro)
        except Exception:
            pass
        return parts

    def get_idiomas(self, obj):
        raw = getattr(obj, 'idiomas_trabajo', None)
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        # intentar separar por comas
        try:
            parts = [p.strip() for p in str(raw).split(',') if p.strip()]
            return parts
        except Exception:
            return [str(raw)]


class EmpresaproductoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de producto"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)  # ✅ Cambio aquí
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    categoria_matriz = serializers.SerializerMethodField()
    
    def get_categoria_matriz(self, obj):
        """Obtener la categoría de la matriz de clasificación"""
        try:
            matriz = MatrizClasificacionExportador.objects.filter(empresa=obj).first()
            if matriz:
                categoria_map = {
                    'exportadora': 'Exportadora',
                    'potencial_exportadora': 'Potencial Exportadora',
                    'etapa_inicial': 'Etapa Inicial'
                }
                return categoria_map.get(matriz.categoria, 'Etapa Inicial')
        except Exception:
            pass
        return None
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        return obj.localidad.nombre if obj.localidad else None
    
    class Meta:
        model = Empresaproducto
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz',
            'geolocalizacion', 'municipio_nombre', 'localidad_nombre'
        ]


class EmpresaproductoSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas de producto"""
    productos = ProductoEmpresaSerializer(source='productos_empresa', many=True, read_only=True)
    # Incluir también servicios si existen para esta empresa (no rompe los campos actuales)
    # El related_name en el modelo es `servicios_empresa`, por eso usamos `source`.
    servicios = ServicioEmpresaSerializer(source='servicios_empresa', many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)

    actividades_promocion_internacional = serializers.JSONField(required=False, allow_null=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    sub_rubro_nombre = serializers.SerializerMethodField()
    departamento_nombre = serializers.SerializerMethodField()
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    instagram = serializers.SerializerMethodField()
    facebook = serializers.SerializerMethodField()
    linkedin = serializers.SerializerMethodField()
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

    def _parse_redes(self, obj):
        """Intentar parsear el campo `redes_sociales` que puede ser JSON o texto simple."""
        import json
        raw = getattr(obj, 'redes_sociales', None)
        if not raw:
            return {}
        # Si ya es dict
        if isinstance(raw, dict):
            return raw
        # Intentar JSON
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        # Si no es JSON, intentar parsear pares separados por comas o devolver como texto
        parts = [p.strip() for p in str(raw).split(',') if p.strip()]
        redes = {}
        for part in parts:
            if ':' in part or '=' in part:
                sep = ':' if ':' in part else '='
                k, v = part.split(sep, 1)
                redes[k.strip()] = v.strip()
        return redes

    def get_instagram(self, obj):
        try:
            return self._parse_redes(obj).get('instagram') or None
        except Exception:
            return None

    def get_facebook(self, obj):
        try:
            return self._parse_redes(obj).get('facebook') or None
        except Exception:
            return None

    def get_linkedin(self, obj):
        try:
            return self._parse_redes(obj).get('linkedin') or None
        except Exception:
            return None

    def update(self, instance, validated_data):
        import json
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val

        existing = {}
        raw = getattr(instance, 'redes_sociales', None)
        if raw:
            try:
                existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
            except Exception:
                existing = {}

        existing.update(redes_updated)
        if existing:
            instance.redes_sociales = json.dumps(existing, ensure_ascii=False)

        return super().update(instance, validated_data)

    def update(self, instance, validated_data):
        import json
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val

        existing = {}
        raw = getattr(instance, 'redes_sociales', None)
        if raw:
            try:
                existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
            except Exception:
                existing = {}

        existing.update(redes_updated)
        if existing:
            instance.redes_sociales = json.dumps(existing, ensure_ascii=False)

        return super().update(instance, validated_data)

    def update(self, instance, validated_data):
        """Permitir actualizar instagram/facebook/linkedin mapeándolos a `redes_sociales`."""
        import json
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val

        # Merge con las redes existentes
        existing = {}
        raw = getattr(instance, 'redes_sociales', None)
        if raw:
            try:
                existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
            except Exception:
                existing = {}

        existing.update(redes_updated)
        if existing:
            instance.redes_sociales = json.dumps(existing, ensure_ascii=False)

        return super().update(instance, validated_data)
    
    def get_departamento_nombre(self, obj):
        """Obtener nombre del departamento"""
        return obj.departamento.nombre if obj.departamento else None

    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None

    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        import logging
        logger = logging.getLogger(__name__)
    
        logger.info(f"[Localidad Debug] Empresa ID: {obj.id}")
        logger.info(f"[Localidad Debug] Localidad field value: {obj.localidad}")
        logger.info(f"[Localidad Debug] Localidad type: {type(obj.localidad)}")
    
        if obj.localidad:
            logger.info(f"[Localidad Debug] Localidad ID: {obj.localidad.id if hasattr(obj.localidad, 'id') else 'No ID'}")
            logger.info(f"[Localidad Debug] Localidad nombre: {obj.localidad.nombre if hasattr(obj.localidad, 'nombre') else 'No nombre'}")
            return obj.localidad.nombre if obj.localidad else None
        else:
            logger.info("[Localidad Debug] Localidad is None/empty")
            return None
    
    def get_sub_rubro_nombre(self, obj):
        """Obtener nombre del subrubro desde la solicitud relacionada o descripción"""
        try:
            # Buscar en solicitudes relacionadas por CUIT (normalizar para comparación)
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                # Para empresas mixtas, retornar ambos subrubros
                if obj.tipo_empresa_valor == 'mixta':
                    sub_prod = solicitud.sub_rubro_producto or ''
                    sub_serv = solicitud.sub_rubro_servicio or ''
                    if sub_prod and sub_serv:
                        return f"{sub_prod} / {sub_serv}"
                    return sub_prod or sub_serv or None
                else:
                    # Para empresas de producto o servicio únicos
                    return solicitud.sub_rubro or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo sub_rubro_nombre: {str(e)}", exc_info=True)
        return None
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
    
        
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
        model = Empresaproducto
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class EmpresaservicioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de servicio"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
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
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        return obj.localidad.nombre if obj.localidad else None
    
    class Meta:
        model = Empresaservicio
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz',
            'geolocalizacion', 'municipio_nombre', 'localidad_nombre'
        ]


class EmpresaservicioSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas de servicio"""
    # El related_name en el modelo ServicioEmpresa es `servicios_empresa`.
    servicios = ServicioEmpresaSerializer(source='servicios_empresa', many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    actividades_promocion_internacional = serializers.JSONField(required=False, allow_null=True)
    # Agregar nombres de campos relacionados
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    sub_rubro_nombre = serializers.SerializerMethodField()
    departamento_nombre = serializers.SerializerMethodField()
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    instagram = serializers.SerializerMethodField()
    facebook = serializers.SerializerMethodField()
    linkedin = serializers.SerializerMethodField()
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

    def _parse_redes(self, obj):
        import json
        raw = getattr(obj, 'redes_sociales', None)
        if not raw:
            return {}
        if isinstance(raw, dict):
            return raw
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        parts = [p.strip() for p in str(raw).split(',') if p.strip()]
        redes = {}
        for part in parts:
            if ':' in part or '=' in part:
                sep = ':' if ':' in part else '='
                k, v = part.split(sep, 1)
                redes[k.strip()] = v.strip()
        return redes

    def get_instagram(self, obj):
        try:
            return self._parse_redes(obj).get('instagram') or None
        except Exception:
            return None

    def get_facebook(self, obj):
        try:
            return self._parse_redes(obj).get('facebook') or None
        except Exception:
            return None

    def get_linkedin(self, obj):
        try:
            return self._parse_redes(obj).get('linkedin') or None
        except Exception:
            return None
    
    def get_departamento_nombre(self, obj):
        """Obtener nombre del departamento"""
        return obj.departamento.nombre if obj.departamento else None
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        return obj.localidad.nombre if obj.localidad else None
    
    def get_sub_rubro_nombre(self, obj):
        """Obtener nombre del subrubro desde la solicitud relacionada"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                return solicitud.sub_rubro or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo sub_rubro_nombre: {str(e)}", exc_info=True)
        return None
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        
        
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
    # Aliases para compatibilidad con frontend
    sectores = serializers.SerializerMethodField()
    alcance_geografico = serializers.CharField(source='alcance_servicio', read_only=True)
    paises_destino = serializers.CharField(source='paises_trabaja', read_only=True)
    idiomas = serializers.SerializerMethodField()
    exporta_servicios_alias = serializers.BooleanField(source='exporta_servicios', read_only=True)
    interes_exportar = serializers.BooleanField(source='interes_exportar_servicios', read_only=True)

    class Meta:
        model = ServicioEmpresaMixta
        fields = [
            'id', 'empresa', 'nombre_servicio', 'descripcion',
            'tipo_servicio', 'tipo_servicio_otro', 'sector_atendido',
            'sector_otro', 'alcance_servicio', 'paises_trabaja',
            'exporta_servicios', 'interes_exportar_servicios',
            'idiomas_trabajo', 'idioma_otro', 'forma_contratacion',
            'forma_contratacion_otro', 'certificaciones_tecnicas',
            'tiene_equipo_tecnico', 'equipo_tecnico_formacion', 'es_principal',
            # aliases
            'sectores', 'alcance_geografico', 'paises_destino', 'idiomas', 'exporta_servicios_alias', 'interes_exportar'
        ]
        read_only_fields = ['id']

    def get_sectores(self, obj):
        parts = []
        try:
            if getattr(obj, 'sector_atendido', None):
                parts.append(obj.sector_atendido)
            if getattr(obj, 'sector_otro', None):
                parts.append(obj.sector_otro)
        except Exception:
            pass
        return parts

    def get_idiomas(self, obj):
        raw = getattr(obj, 'idiomas_trabajo', None)
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        try:
            parts = [p.strip() for p in str(raw).split(',') if p.strip()]
            return parts
        except Exception:
            return [str(raw)]


class EmpresaMixtaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas mixtas"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    actividades_promocion_internacional = serializers.JSONField(required=False, allow_null=True)
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
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        return obj.localidad.nombre if obj.localidad else None
    
    class Meta:
        model = EmpresaMixta
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'rubro_nombre',
            'exporta', 'importa', 'fecha_creacion', 'categoria_matriz',
            'actividades_promocion_internacional',
            'geolocalizacion', 'municipio_nombre', 'localidad_nombre'
        ]


class EmpresaMixtaSerializer(serializers.ModelSerializer):
    """Serializer completo para empresas mixtas"""
    productos = ProductoEmpresaMixtaSerializer(source='productos_mixta', many=True, read_only=True)
    # El related_name en ServicioEmpresaMixta es `servicios_mixta`.
    servicios = ServicioEmpresaMixtaSerializer(source='servicios_mixta', many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    # Agregar nombres de campos relacionados
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    sub_rubro_nombre = serializers.SerializerMethodField()
    sub_rubro_producto_nombre = serializers.SerializerMethodField()
    sub_rubro_servicio_nombre = serializers.SerializerMethodField()
    rubro_producto_nombre = serializers.SerializerMethodField()
    rubro_servicio_nombre = serializers.SerializerMethodField()
    departamento_nombre = serializers.SerializerMethodField()
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    categoria_matriz = serializers.SerializerMethodField()
    instagram = serializers.SerializerMethodField()
    facebook = serializers.SerializerMethodField()
    linkedin = serializers.SerializerMethodField()
    
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
    
    def get_departamento_nombre(self, obj):
        """Obtener nombre del departamento"""
        return obj.departamento.nombre if obj.departamento else None
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        return obj.municipio.nombre if obj.municipio else None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        return obj.localidad.nombre if obj.localidad else None
    
    def get_sub_rubro_nombre(self, obj):
        """Obtener nombre del subrubro combinado (para compatibilidad)"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                sub_prod = solicitud.sub_rubro_producto or ''
                sub_serv = solicitud.sub_rubro_servicio or ''
                if sub_prod and sub_serv:
                    return f"{sub_prod} / {sub_serv}"
                return sub_prod or sub_serv or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo sub_rubro_nombre: {str(e)}", exc_info=True)
        return None
    
    def get_sub_rubro_producto_nombre(self, obj):
        """Obtener nombre del subrubro de productos"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                return solicitud.sub_rubro_producto or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo sub_rubro_producto_nombre: {str(e)}", exc_info=True)
        return None
    
    def get_sub_rubro_servicio_nombre(self, obj):
        """Obtener nombre del subrubro de servicios"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                return solicitud.sub_rubro_servicio or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo sub_rubro_servicio_nombre: {str(e)}", exc_info=True)
        return None
    
    def get_rubro_producto_nombre(self, obj):
        """Obtener nombre del rubro de productos"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                return solicitud.rubro_producto or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo rubro_producto_nombre: {str(e)}", exc_info=True)
        return None
    
    def get_rubro_servicio_nombre(self, obj):
        """Obtener nombre del rubro de servicios"""
        try:
            from apps.registro.models import SolicitudRegistro
            # Normalizar CUIT de la empresa (sin guiones ni espacios)
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
            
            # Buscar solicitud aprobada con CUIT normalizado
            solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
            solicitud = None
            for sol in solicitudes:
                cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                if cuit_sol == cuit_empresa:
                    solicitud = sol
                    break
            
            if solicitud:
                return solicitud.rubro_servicio or None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo rubro_servicio_nombre: {str(e)}", exc_info=True)
        return None

    def _parse_redes(self, obj):
        import json
        raw = getattr(obj, 'redes_sociales', None)
        if not raw:
            return {}
        if isinstance(raw, dict):
            return raw
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        parts = [p.strip() for p in str(raw).split(',') if p.strip()]
        redes = {}
        for part in parts:
            if ':' in part or '=' in part:
                sep = ':' if ':' in part else '='
                k, v = part.split(sep, 1)
                redes[k.strip()] = v.strip()
        return redes

    def get_instagram(self, obj):
        try:
            return self._parse_redes(obj).get('instagram') or None
        except Exception:
            return None

    def get_facebook(self, obj):
        try:
            return self._parse_redes(obj).get('facebook') or None
        except Exception:
            return None

    def get_linkedin(self, obj):
        try:
            return self._parse_redes(obj).get('linkedin') or None
        except Exception:
            return None
    
    
    def create(self, validated_data):
        """Crear empresa con conversión de códigos geográficos y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        
        
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

