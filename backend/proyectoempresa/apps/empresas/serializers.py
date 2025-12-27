from rest_framework import serializers
from .models import (
    TipoEmpresa, Rubro, SubRubro, UnidadMedida, Otrorubro,
    Empresa,  # ✅ Modelo principal unificado
    Empresaproducto, Empresaservicio, EmpresaMixta,  # ⚠️ OBSOLETO: Mantener solo para compatibilidad
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
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)
    rubro_id = serializers.IntegerField(source='rubro.id', read_only=True)
    
    class Meta:
        model = SubRubro
        fields = ['id', 'nombre', 'descripcion', 'activo', 'orden', 'rubro_nombre', 'rubro_id']
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


class PosicionArancelariaMixtaSerializer(serializers.ModelSerializer):
    """Serializer para posiciones arancelarias de productos mixtos"""
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
    
    class Meta:
        model = PosicionArancelariaMixta
        fields = ['id', 'producto', 'producto_id', 'codigo_arancelario', 'descripcion_arancelaria', 'es_principal']
        read_only_fields = ['id', 'producto_id']


class ProductoEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para productos de empresa"""
    # Sobrescribir el campo empresa para usar all_objects (incluye empresas eliminadas)
    empresa = serializers.PrimaryKeyRelatedField(
        queryset=Empresa.all_objects.all(),
        required=False
    )
    posicion_arancelaria = serializers.SerializerMethodField(read_only=True)
    codigo_arancelario_input = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        source='posicion_arancelaria_codigo'
    )
    
    def get_posicion_arancelaria(self, obj):
        """Obtener la posición arancelaria del producto si existe"""
        try:
            if hasattr(obj, 'posicion_arancelaria') and obj.posicion_arancelaria:
                return PosicionArancelariaSerializer(obj.posicion_arancelaria).data
            return None
        except PosicionArancelaria.DoesNotExist:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo posicion_arancelaria: {str(e)}", exc_info=True)
            return None
    
    def create(self, validated_data):
        """Crear producto y su posición arancelaria si se proporciona"""
        codigo_arancelario = validated_data.pop('posicion_arancelaria_codigo', None)
        
        # Crear el producto
        producto = ProductoEmpresa.objects.create(**validated_data)
        
        # Crear la posición arancelaria si se proporcionó un código
        if codigo_arancelario and codigo_arancelario.strip():
            try:
                PosicionArancelaria.objects.create(
                    producto=producto,
                    codigo_arancelario=codigo_arancelario.strip(),
                    descripcion_arancelaria=''
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creando posición arancelaria: {str(e)}", exc_info=True)
        
        return producto
    
    def update(self, instance, validated_data):
        """Actualizar producto y su posición arancelaria"""
    
        # ✅ CRÍTICO: Extraer posicion_data ANTES de usarlo
        posicion_data = validated_data.pop('posicion_arancelaria_codigo', None)
    
        # Actualizar campos del producto
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar o crear posición arancelaria
        if posicion_data is not None:
            codigo = None
            if isinstance(posicion_data, dict):
                codigo = posicion_data.get('codigo_arancelario')
            elif isinstance(posicion_data, str):
                codigo = posicion_data
    
            if codigo and codigo.strip():
                try:
                    posicion = instance.posicion_arancelaria
                    posicion.codigo_arancelario = codigo.strip()
                    posicion.save()
                except PosicionArancelaria.DoesNotExist:
                    PosicionArancelaria.objects.create(
                        producto=instance,
                        codigo_arancelario=codigo.strip(),
                        descripcion_arancelaria=''
                    )
            else:
                # Si el código está vacío, eliminar la posición arancelaria
                try:
                    instance.posicion_arancelaria.delete()
                except PosicionArancelaria.DoesNotExist:
                    pass

        return instance
    
    class Meta:
        model = ProductoEmpresa
        fields = [
            'id', 'empresa', 'nombre_producto', 'descripcion',
            'capacidad_productiva', 'unidad_medida', 'periodo_capacidad',
            'es_principal', 'precio_estimado', 'moneda_precio',
            'posicion_arancelaria', 'codigo_arancelario_input'  # ← Agregar el campo de escritura
        ]
        read_only_fields = ['id']


class ServicioEmpresaSerializer(serializers.ModelSerializer):
    """Serializer para servicios de empresa"""
    # Sobrescribir el campo empresa para usar all_objects (incluye empresas eliminadas)
    empresa = serializers.PrimaryKeyRelatedField(
        queryset=Empresa.all_objects.all(),
        required=False
    )
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
    tipo_empresa = serializers.SerializerMethodField()
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)  # ✅ Cambio aquí
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    categoria_matriz = serializers.SerializerMethodField()

    def get_tipo_empresa(self, obj):
        """Retornar el valor del tipo de empresa"""
        if hasattr(obj, 'tipo_empresa_valor'):
            return obj.tipo_empresa_valor
        return 'producto'
    
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
            'tipo_empresa_nombre','tipo_empresa', 'rubro_nombre', 'id_subrubro',
            'exporta', 'interes_exportar', 'importa', 'fecha_creacion', 'categoria_matriz',
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
    
        if obj.localidad:
            return obj.localidad.nombre if obj.localidad else None
        else:
            return None
    
    def get_sub_rubro_nombre(self, obj):
        """Obtener nombre del subrubro desde el campo directo o desde la solicitud relacionada"""
        # Primero intentar usar el campo directo (nuevo)
        if obj.id_subrubro:
            return obj.id_subrubro.nombre
    
        # Si no existe, usar el método antiguo como fallback (compatibilidad)
        try:
            from apps.registro.models import SolicitudRegistro
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
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
    
    def to_internal_value(self, data):
        """Manejar el campo brochure cuando viene como string (URL) en lugar de archivo"""
        # Si 'brochure' está presente y es un string (no un archivo), eliminarlo de los datos
        # porque no debe enviarse la URL del archivo existente, solo archivos nuevos o strings vacíos para eliminar
        if 'brochure' in data and isinstance(data.get('brochure'), str):
            brochure_value = data.get('brochure')
            # Si es una URL (empieza con http:// o https://), eliminarlo porque es el archivo existente
            # Solo mantenerlo si es un string vacío (para eliminar el archivo)
            if brochure_value and (brochure_value.startswith('http://') or brochure_value.startswith('https://')):
                # Es una URL del archivo existente, no debe enviarse
                data = data.copy()
                data.pop('brochure', None)
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """Actualizar empresa incluyendo productos, servicios, subrubro y redes sociales"""
        import json
        import logging
        logger = logging.getLogger(__name__)
    
        # 1. EXTRAER PRODUCTOS Y SERVICIOS **ANTES** de procesarlos
        # IMPORTANTE: No están en validated_data, vienen en self.initial_data
        productos_data = self.initial_data.get('productos', None)
        servicios_data = self.initial_data.get('servicios', None)
    
        # 2. MANEJAR REDES SOCIALES
        # Cargar redes sociales existentes
        existing = {}
        raw = getattr(instance, 'redes_sociales', None)
        logger.info(f"🔍 [EmpresaproductoSerializer.update] Redes sociales existentes (raw): {raw}")
        if raw:
            try:
                existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
                logger.info(f"🔍 [EmpresaproductoSerializer.update] Redes sociales parseadas: {existing}")
            except Exception as e:
                logger.error(f"❌ [EmpresaproductoSerializer.update] Error parseando redes sociales: {e}")
                existing = {}
        
        # Debug: Ver qué hay en validated_data e initial_data
        logger.info(f"🔍 [EmpresaproductoSerializer.update] validated_data keys: {list(validated_data.keys())}")
        if hasattr(self, 'initial_data') and self.initial_data is not None:
            logger.info(f"🔍 [EmpresaproductoSerializer.update] initial_data type: {type(self.initial_data)}")
            if hasattr(self.initial_data, 'keys'):
                logger.info(f"🔍 [EmpresaproductoSerializer.update] initial_data keys: {list(self.initial_data.keys())}")
            # Buscar específicamente las redes sociales en initial_data
            for key in ('instagram', 'facebook', 'linkedin'):
                if hasattr(self.initial_data, 'get'):
                    val_check = self.initial_data.get(key)
                    logger.info(f"🔍 [EmpresaproductoSerializer.update] initial_data.get('{key}'): {repr(val_check)} (type: {type(val_check)})")
        
        redes_modified = False
        for key in ('instagram', 'facebook', 'linkedin'):
            logger.info(f"🔍 [EmpresaproductoSerializer.update] Procesando {key}...")
            
            # Buscar primero en validated_data
            val = validated_data.pop(key, None)
            logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} desde validated_data: {repr(val)}")
            
            # Si no está, buscar en initial_data (para FormData/QueryDict)
            if val is None and hasattr(self, 'initial_data') and self.initial_data is not None:
                try:
                    logger.info(f"🔍 [EmpresaproductoSerializer.update] Buscando {key} en initial_data...")
                    if hasattr(self.initial_data, 'get'):
                        if key in self.initial_data:
                            val = self.initial_data.get(key)
                            logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} encontrado en initial_data: {repr(val)}")
                    elif isinstance(self.initial_data, dict):
                        if key in self.initial_data:
                            val = self.initial_data.get(key)
                    
                    # Si es un QueryDict o lista, puede tener múltiples valores, tomar el primero
                    if isinstance(val, list) and len(val) > 0:
                        logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} es lista, tomando primer valor: {repr(val[0])}")
                        val = val[0]
                except Exception as e:
                    logger.error(f"❌ [EmpresaproductoSerializer.update] Error accediendo initial_data para {key}: {e}")
                    val = None
            
            logger.info(f"🔍 [EmpresaproductoSerializer.update] Valor final para {key}: {repr(val)} (type: {type(val)})")
            
            # Procesar el valor
            if val is not None:
                # Normalizar: convertir string vacío a None para procesamiento consistente
                if val == '':
                    logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} es string vacío, convirtiendo a None")
                    val = None
                    
                if val is None:
                    # Si existía, eliminarla
                    if key in existing:
                        logger.info(f"🔍 [EmpresaproductoSerializer.update] Eliminando {key} (existía: {existing[key]})")
                        del existing[key]
                        redes_modified = True
                    else:
                        logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} es None pero no existía, no hay cambios")
                elif val:
                    # Si tiene valor, actualizarla
                    val_str = str(val).strip()
                    if val_str and existing.get(key) != val_str:
                        logger.info(f"🔍 [EmpresaproductoSerializer.update] Actualizando {key}: '{existing.get(key)}' -> '{val_str}'")
                        existing[key] = val_str
                        redes_modified = True
                    else:
                        logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} no cambió (era: '{existing.get(key)}', nuevo: '{val_str}')")
            else:
                logger.info(f"🔍 [EmpresaproductoSerializer.update] {key} es None, no se procesa")
        
        # Si se modificaron las redes sociales, actualizar el campo
        if redes_modified:
            logger.info(f"✅ [EmpresaproductoSerializer.update] Redes sociales modificadas. Nuevo estado: {existing}")
            if existing:
                instance.redes_sociales = json.dumps(existing, ensure_ascii=False)
                logger.info(f"✅ [EmpresaproductoSerializer.update] Redes sociales guardadas como JSON: {instance.redes_sociales}")
            else:
                instance.redes_sociales = None
                logger.info(f"✅ [EmpresaproductoSerializer.update] Todas las redes sociales eliminadas, campo asignado a None")
        else:
            logger.info(f"ℹ️ [EmpresaproductoSerializer.update] No hubo cambios en las redes sociales")
    
        # 3. MANEJAR SUBRUBRO
        id_subrubro = validated_data.pop('id_subrubro', None)
        rubro = validated_data.get('id_rubro', instance.id_rubro)
    
        if 'id_rubro' in validated_data and validated_data['id_rubro'] != instance.id_rubro:
            if instance.id_subrubro and instance.id_subrubro.rubro != validated_data['id_rubro']:
                instance.id_subrubro = None
    
        if id_subrubro is not None:
            if id_subrubro.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
                })
            instance.id_subrubro = id_subrubro
        
        # 3.5. MANEJAR BROCHURE (archivo)
        # Si se envía un string vacío, eliminar el archivo existente
        if 'brochure' in validated_data:
            brochure_value = validated_data.pop('brochure')
            # Si es un string vacío o None, eliminar el archivo
            if brochure_value == '' or brochure_value is None:
                if instance.brochure:
                    instance.brochure.delete(save=False)
                instance.brochure = None
            else:
                # Si es un archivo válido, asignarlo directamente
                instance.brochure = brochure_value
        
        # 3.6. MANEJAR CAMPOS BOOLEANOS QUE VIENEN COMO 'si'/'no'
        # Convertir certificado_pyme (del frontend) a certificadopyme (del modelo)
        if 'certificado_pyme' in validated_data:
            cert_value = validated_data.pop('certificado_pyme')
            # Convertir 'si'/'no' a booleano
            if isinstance(cert_value, str):
                instance.certificadopyme = cert_value.lower() == 'si'
            else:
                instance.certificadopyme = bool(cert_value)
        
        # Convertir material_promocional_idiomas (del frontend) a promo2idiomas (del modelo)
        if 'material_promocional_idiomas' in validated_data:
            promo_value = validated_data.pop('material_promocional_idiomas')
            # Convertir 'si'/'no' a booleano
            if isinstance(promo_value, str):
                instance.promo2idiomas = promo_value.lower() == 'si'
            else:
                instance.promo2idiomas = bool(promo_value)
    
        # 4. ACTUALIZAR OTROS CAMPOS DE LA EMPRESA
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
    
        instance.save()
        
        # Refrescar la instancia desde la BD para asegurar que los cambios se reflejen en la serialización
        instance.refresh_from_db()
        if redes_modified:
            logger.info(f"✅ [EmpresaproductoSerializer.update] Instancia refrescada. redes_sociales en BD: {instance.redes_sociales}")
    
        # 5. ACTUALIZAR PRODUCTOS Y SERVICIOS
        self._actualizar_productos(instance, productos_data)
        self._actualizar_servicios(instance, servicios_data)
    
        return instance
    
    def _actualizar_productos(self, empresa, productos_data):
        """Actualizar productos de la empresa"""
        if productos_data is None:
            return
    
        # Obtener IDs de productos que vienen en la petición
        productos_ids_actuales = []
    
        for producto_data in productos_data:
            producto_id = producto_data.get('id')
        
            # Si el ID es temporal (empieza con 'temp-'), crear nuevo producto
            if producto_id and str(producto_id).startswith('temp-'):
                producto_data_copy = producto_data.copy()
                producto_data_copy.pop('id', None)
            
                # Extraer posición arancelaria si existe
                # Extraer código arancelario
                codigo_arancelario = None
                posicion_data = producto_data_copy.pop('posicion_arancelaria', None)
                if posicion_data:
                    if isinstance(posicion_data, dict):
                        codigo_arancelario = posicion_data.get('codigo_arancelario')
                    elif isinstance(posicion_data, str):
                        codigo_arancelario = posicion_data

                # Crear producto (sin el campo posicion_arancelaria)
                    nuevo_producto = ProductoEmpresa.objects.create(
                    empresa=empresa,
                    **producto_data_copy
                )
                productos_ids_actuales.append(nuevo_producto.id)
                # Crear posición arancelaria si existe código
                if codigo_arancelario and codigo_arancelario.strip():
                    PosicionArancelaria.objects.create(
                        producto=nuevo_producto,
                        codigo_arancelario=codigo_arancelario.strip(),
                        descripcion_arancelaria=''
                    )
        
            # Si el producto ya existe, actualizarlo
            elif producto_id:
                try:
                    producto = ProductoEmpresa.objects.get(id=producto_id, empresa=empresa)
                
                    # Extraer posición arancelaria
                    posicion_data = producto_data.pop('posicion_arancelaria', None)
                
                    # Actualizar campos del producto
                    for key, value in producto_data.items():
                        if key != 'id':
                            setattr(producto, key, value)
                    producto.save()
                
                    productos_ids_actuales.append(producto.id)
                
                    # Actualizar posición arancelaria
                    if posicion_data is not None:
                        codigo = None
                        if isinstance(posicion_data, dict):
                            codigo = posicion_data.get('codigo_arancelario')
                        elif isinstance(posicion_data, str):
                            codigo = posicion_data
                    
                        if codigo and codigo.strip():
                            try:
                                posicion = producto.posicion_arancelaria
                                posicion.codigo_arancelario = codigo.strip()
                                posicion.save()
                            except PosicionArancelaria.DoesNotExist:
                                PosicionArancelaria.objects.create(
                                    producto=producto,
                                    codigo_arancelario=codigo.strip(),
                                    descripcion_arancelaria=''
                                )
                        else:
                            try:
                                producto.posicion_arancelaria.delete()
                            except PosicionArancelaria.DoesNotExist:
                                pass
                except ProductoEmpresa.DoesNotExist:
                    continue
    
        # Eliminar productos que no están en la lista actual
        ProductoEmpresa.objects.filter(empresa=empresa).exclude(
            id__in=productos_ids_actuales
        ).delete()

    def _actualizar_servicios(self, empresa, servicios_data):
        """Actualizar servicios de la empresa"""
        if servicios_data is None:
            return
    
        # Obtener IDs de servicios que vienen en la petición
        servicios_ids_actuales = []
    
        for servicio_data in servicios_data:
            servicio_id = servicio_data.get('id')
        
            # Si el ID es temporal, crear nuevo servicio
            if servicio_id and str(servicio_id).startswith('temp-'):
                servicio_data_copy = servicio_data.copy()
                servicio_data_copy.pop('id', None)
            
                nuevo_servicio = ServicioEmpresa.objects.create(
                    empresa=empresa,
                    **servicio_data_copy
                )
                servicios_ids_actuales.append(nuevo_servicio.id)
        
            # Si el servicio ya existe, actualizarlo
            elif servicio_id:
                try:
                    servicio = ServicioEmpresa.objects.get(id=servicio_id, empresa=empresa)
                
                    # Actualizar campos del servicio
                    for key, value in servicio_data.items():
                        if key != 'id':
                            setattr(servicio, key, value)
                    servicio.save()
                
                    servicios_ids_actuales.append(servicio.id)
                except ServicioEmpresa.DoesNotExist:
                    continue
    
        # Eliminar servicios que no están en la lista actual
        ServicioEmpresa.objects.filter(empresa=empresa).exclude(
            id__in=servicios_ids_actuales
        ).delete()
    
    def create(self, validated_data):
        """
        Crear empresa con validación de subrubro y creación automática de usuario
        """
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        import json
        
        # 1. EXTRAER Y VALIDAR SUBRUBRO
        id_subrubro = validated_data.pop('id_subrubro', None)
        rubro = validated_data.get('id_rubro')
        
        if id_subrubro:
            # Validar que el subrubro pertenezca al rubro seleccionado
            if id_subrubro.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
                })
        
        # 2. MANEJAR REDES SOCIALES
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val
        
        if redes_updated:
            validated_data['redes_sociales'] = json.dumps(redes_updated, ensure_ascii=False)
        
        # 2.5. MANEJAR CAMPOS BOOLEANOS QUE VIENEN COMO 'si'/'no'
        # Convertir certificado_pyme (del frontend) a certificadopyme (del modelo)
        if 'certificado_pyme' in validated_data:
            cert_value = validated_data.pop('certificado_pyme')
            # Convertir 'si'/'no' a booleano
            if isinstance(cert_value, str):
                validated_data['certificadopyme'] = cert_value.lower() == 'si'
            else:
                validated_data['certificadopyme'] = bool(cert_value)
        
        # Convertir material_promocional_idiomas (del frontend) a promo2idiomas (del modelo)
        if 'material_promocional_idiomas' in validated_data:
            promo_value = validated_data.pop('material_promocional_idiomas')
            # Convertir 'si'/'no' a booleano
            if isinstance(promo_value, str):
                validated_data['promo2idiomas'] = promo_value.lower() == 'si'
            else:
                validated_data['promo2idiomas'] = bool(promo_value)
        
        # 3. CREAR USUARIO AUTOMÁTICAMENTE SI ES NECESARIO
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
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
                    
                    # Crear o actualizar usuario
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        # 4. CREAR LA EMPRESA
        empresa = Empresaproducto.objects.create(**validated_data)
        
        # 5. ASIGNAR SUBRUBRO SI EXISTE
        if id_subrubro:
            empresa.id_subrubro = id_subrubro
            empresa.save()
        
        return empresa
    
    
    class Meta:
        model = Empresaproducto
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class EmpresaservicioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de empresas de servicio"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    tipo_empresa = serializers.SerializerMethodField()
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    categoria_matriz = serializers.SerializerMethodField()

    def get_tipo_empresa(self, obj):
        """Retornar el valor del tipo de empresa"""
        if hasattr(obj, 'tipo_empresa_valor'):
            return obj.tipo_empresa_valor
        return 'servicio'
    
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
            'tipo_empresa_nombre', 'tipo_empresa', 'rubro_nombre', 'id_subrubro',  
            'exporta', 'interes_exportar', 'importa', 'fecha_creacion', 'categoria_matriz',
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
        """Obtener nombre del subrubro desde el campo directo o desde la solicitud relacionada"""
        # Primero intentar usar el campo directo (nuevo)
        if obj.id_subrubro:
            return obj.id_subrubro.nombre
    
        # Si no existe, usar el método antiguo como fallback (compatibilidad)
        try:
            from apps.registro.models import SolicitudRegistro
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
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
    
    def to_internal_value(self, data):
        """Manejar el campo brochure cuando viene como string (URL) en lugar de archivo"""
        # Si 'brochure' está presente y es un string (no un archivo), eliminarlo de los datos
        # porque no debe enviarse la URL del archivo existente, solo archivos nuevos o strings vacíos para eliminar
        if 'brochure' in data and isinstance(data.get('brochure'), str):
            brochure_value = data.get('brochure')
            # Si es una URL (empieza con http:// o https://), eliminarlo porque es el archivo existente
            # Solo mantenerlo si es un string vacío (para eliminar el archivo)
            if brochure_value and (brochure_value.startswith('http://') or brochure_value.startswith('https://')):
                # Es una URL del archivo existente, no debe enviarse
                data = data.copy()
                data.pop('brochure', None)
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """Actualizar empresa incluyendo productos, servicios, subrubro y redes sociales"""
        import json
    
        # 1. EXTRAER PRODUCTOS Y SERVICIOS
        productos_data = validated_data.pop('productos', None)
        servicios_data = validated_data.pop('servicios', None)
    
        # 2. MANEJAR REDES SOCIALES
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val
    
        if redes_updated:
            existing = {}
            raw = getattr(instance, 'redes_sociales', None)
            if raw:
                try:
                    existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
                except Exception:
                    existing = {}
            existing.update(redes_updated)
            instance.redes_sociales = json.dumps(existing, ensure_ascii=False)
    
        # 3. MANEJAR SUBRUBRO
        id_subrubro = validated_data.pop('id_subrubro', None)
        rubro = validated_data.get('id_rubro', instance.id_rubro)
    
        if 'id_rubro' in validated_data and validated_data['id_rubro'] != instance.id_rubro:
            if instance.id_subrubro and instance.id_subrubro.rubro != validated_data['id_rubro']:
                instance.id_subrubro = None
    
        if id_subrubro is not None:
            if id_subrubro.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
                })
            instance.id_subrubro = id_subrubro
        
        # 3.5. MANEJAR BROCHURE (archivo)
        # Si se envía un string vacío, eliminar el archivo existente
        if 'brochure' in validated_data:
            brochure_value = validated_data.pop('brochure')
            # Si es un string vacío o None, eliminar el archivo
            if brochure_value == '' or brochure_value is None:
                if instance.brochure:
                    instance.brochure.delete(save=False)
                instance.brochure = None
            else:
                # Si es un archivo válido, asignarlo directamente
                instance.brochure = brochure_value
    
        # 4. ACTUALIZAR OTROS CAMPOS DE LA EMPRESA
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
    
        instance.save()
    
        # 5. ACTUALIZAR PRODUCTOS Y SERVICIOS
        self._actualizar_productos(instance, productos_data)
        self._actualizar_servicios(instance, servicios_data)
    
        return instance
    
    def _actualizar_productos(self, empresa, productos_data):
        """Actualizar productos de la empresa"""
        if productos_data is None:
            return
    
        # Obtener IDs de productos que vienen en la petición
        productos_ids_actuales = []
    
        for producto_data in productos_data:
            producto_id = producto_data.get('id')
        
            # Si el ID es temporal (empieza con 'temp-'), crear nuevo producto
            if producto_id and str(producto_id).startswith('temp-'):
                producto_data_copy = producto_data.copy()
                producto_data_copy.pop('id', None)
            
                # Extraer posición arancelaria si existe
                # Extraer código arancelario
                codigo_arancelario = None
                posicion_data = producto_data_copy.pop('posicion_arancelaria', None)
                if posicion_data:
                    if isinstance(posicion_data, dict):
                        codigo_arancelario = posicion_data.get('codigo_arancelario')
                    elif isinstance(posicion_data, str):
                        codigo_arancelario = posicion_data

                # Crear producto (sin el campo posicion_arancelaria)
                nuevo_producto = ProductoEmpresa.objects.create(
                    empresa=empresa,
                    **producto_data_copy
                )
                productos_ids_actuales.append(nuevo_producto.id)

                # Crear posición arancelaria si existe código
                if codigo_arancelario and codigo_arancelario.strip():
                    PosicionArancelaria.objects.create(
                        producto=nuevo_producto,
                        codigo_arancelario=codigo_arancelario.strip(),
                        descripcion_arancelaria=''
                )
        
            # Si el producto ya existe, actualizarlo
            elif producto_id:
                try:
                    producto = ProductoEmpresa.objects.get(id=producto_id, empresa=empresa)
                
                    # Extraer posición arancelaria
                    posicion_data = producto_data.pop('posicion_arancelaria', None)
                
                    # Actualizar campos del producto
                    for key, value in producto_data.items():
                        if key != 'id':
                            setattr(producto, key, value)
                    producto.save()
                
                    productos_ids_actuales.append(producto.id)
                
                    # Actualizar posición arancelaria
                    if posicion_data is not None:
                        codigo = None
                        if isinstance(posicion_data, dict):
                            codigo = posicion_data.get('codigo_arancelario')
                        elif isinstance(posicion_data, str):
                            codigo = posicion_data
                    
                        if codigo and codigo.strip():
                            try:
                                posicion = producto.posicion_arancelaria
                                posicion.codigo_arancelario = codigo.strip()
                                posicion.save()
                            except PosicionArancelaria.DoesNotExist:
                                PosicionArancelaria.objects.create(
                                    producto=producto,
                                    codigo_arancelario=codigo.strip(),
                                    descripcion_arancelaria=''
                                )
                        else:
                            try:
                                producto.posicion_arancelaria.delete()
                            except PosicionArancelaria.DoesNotExist:
                                pass
                except ProductoEmpresa.DoesNotExist:
                    continue
    
        # Eliminar productos que no están en la lista actual
        ProductoEmpresa.objects.filter(empresa=empresa).exclude(
            id__in=productos_ids_actuales
        ).delete()

    def _actualizar_servicios(self, empresa, servicios_data):
        """Actualizar servicios de la empresa"""
        if servicios_data is None:
            return
    
        # Obtener IDs de servicios que vienen en la petición
        servicios_ids_actuales = []
    
        for servicio_data in servicios_data:
            servicio_id = servicio_data.get('id')
        
            # Si el ID es temporal, crear nuevo servicio
            if servicio_id and str(servicio_id).startswith('temp-'):
                servicio_data_copy = servicio_data.copy()
                servicio_data_copy.pop('id', None)
            
                nuevo_servicio = ServicioEmpresa.objects.create(
                    empresa=empresa,
                    **servicio_data_copy
                )
                servicios_ids_actuales.append(nuevo_servicio.id)
        
            # Si el servicio ya existe, actualizarlo
            elif servicio_id:
                try:
                    servicio = ServicioEmpresa.objects.get(id=servicio_id, empresa=empresa)
                
                    # Actualizar campos del servicio
                    for key, value in servicio_data.items():
                        if key != 'id':
                            setattr(servicio, key, value)
                    servicio.save()
                
                    servicios_ids_actuales.append(servicio.id)
                except ServicioEmpresa.DoesNotExist:
                    continue
    
        # Eliminar servicios que no están en la lista actual
        ServicioEmpresa.objects.filter(empresa=empresa).exclude(
            id__in=servicios_ids_actuales
        ).delete()
    
    def create(self, validated_data):
        """
        Crear empresa con validación de subrubro y creación automática de usuario
        """
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        import json
        
        # 1. EXTRAER Y VALIDAR SUBRUBRO
        id_subrubro = validated_data.pop('id_subrubro', None)
        rubro = validated_data.get('id_rubro')
        
        if id_subrubro:
            if id_subrubro.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
                })
        
        # 2. MANEJAR REDES SOCIALES
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val
        
        if redes_updated:
            validated_data['redes_sociales'] = json.dumps(redes_updated, ensure_ascii=False)
        
        # 3. CREAR USUARIO AUTOMÁTICAMENTE
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
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
                    
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        # 4. CREAR LA EMPRESA
        empresa = Empresaservicio.objects.create(**validated_data)
        
        # 5. ASIGNAR SUBRUBRO
        if id_subrubro:
            empresa.id_subrubro = id_subrubro
            empresa.save()
        
        return empresa
    
    class Meta:
        model = Empresaservicio
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class ProductoEmpresaMixtaSerializer(serializers.ModelSerializer):
    """Serializer para productos de empresa mixta"""
    # Sobrescribir el campo empresa para usar all_objects (incluye empresas eliminadas)
    empresa = serializers.PrimaryKeyRelatedField(
        queryset=Empresa.all_objects.all(),
        required=False
    )
    
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
    # Sobrescribir el campo empresa para usar all_objects (incluye empresas eliminadas)
    empresa = serializers.PrimaryKeyRelatedField(
        queryset=Empresa.all_objects.all(),
        required=False
    )
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
    tipo_empresa = serializers.SerializerMethodField()
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    actividades_promocion_internacional = serializers.JSONField(required=False, allow_null=True)
    categoria_matriz = serializers.SerializerMethodField()

    def get_tipo_empresa(self, obj):
        """Retornar el valor del tipo de empresa"""
        if hasattr(obj, 'tipo_empresa_valor'):
            return obj.tipo_empresa_valor
        return 'mixta'  # Default para EmpresaMixta
    
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
            'tipo_empresa_nombre', 'tipo_empresa', 'rubro_nombre', 
            'id_subrubro_producto', 'id_subrubro_servicio',  
            'exporta', 'interes_exportar', 'importa', 'fecha_creacion', 'categoria_matriz',
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

    def to_representation(self, instance):
        """Override para debug y asegurar que se cargan productos/servicios"""
        import logging
        logger = logging.getLogger(__name__)
        
        # 🔍 DEBUG: Ver qué está pasando
        logger.info(f"=" * 80)
        logger.info(f"🔍 [EmpresaMixtaSerializer.to_representation]")
        logger.info(f"   Empresa ID: {instance.id}")
        logger.info(f"   Razón Social: {instance.razon_social}")
        logger.info(f"   Tipo Empresa: {instance.tipo_empresa_valor}")
        
        # ✅ FORZAR la carga de productos y servicios
        productos_mixta = instance.productos_mixta.all()
        servicios_mixta = instance.servicios_mixta.all()
        
        logger.info(f"   📦 Productos en BD: {productos_mixta.count()}")
        for producto in productos_mixta:
            logger.info(f"      - {producto.nombre_producto}")
            posiciones = producto.posiciones_arancelarias.all()
            logger.info(f"        Posiciones arancelarias: {posiciones.count()}")
            for pos in posiciones:
                logger.info(f"          * {pos.codigo_arancelario}")
        
        logger.info(f"   🔧 Servicios en BD: {servicios_mixta.count()}")
        for servicio in servicios_mixta:
            logger.info(f"      - {servicio.nombre_servicio}")
        
        # Llamar al método padre para serializar
        data = super().to_representation(instance)
        
        # 🔍 DEBUG: Ver qué se está devolviendo
        logger.info(f"   📤 Productos en respuesta: {len(data.get('productos', []))}")
        logger.info(f"   📤 Servicios en respuesta: {len(data.get('servicios', []))}")
        
        # ⚠️ Si no hay productos/servicios en la respuesta, agregarlos manualmente
        if not data.get('productos') and productos_mixta.exists():
            logger.warning("⚠️  Productos NO se serializaron automáticamente, serializando manualmente...")
            data['productos'] = ProductoEmpresaMixtaSerializer(productos_mixta, many=True).data
        
        if not data.get('servicios') and servicios_mixta.exists():
            logger.warning("⚠️  Servicios NO se serializaron automáticamente, serializando manualmente...")
            data['servicios'] = ServicioEmpresaMixtaSerializer(servicios_mixta, many=True).data
        
        logger.info(f"   ✅ Productos finales en respuesta: {len(data.get('productos', []))}")
        logger.info(f"   ✅ Servicios finales en respuesta: {len(data.get('servicios', []))}")
        logger.info(f"=" * 80)
        
        return data
    
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
        """Obtener nombre del subrubro desde el campo directo o desde la solicitud relacionada"""
        # Primero intentar usar el campo directo (nuevo)
        if obj.id_subrubro:
            return obj.id_subrubro.nombre
    
        # Si no existe, usar el método antiguo como fallback (compatibilidad)
        try:
            from apps.registro.models import SolicitudRegistro
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
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
    
    def get_sub_rubro_producto_nombre(self, obj):
        """Obtener nombre del subrubro de productos"""
        # ✅ PRIMERO: Usar campo directo
        if obj.id_subrubro_producto:
            return obj.id_subrubro_producto.nombre
    
        # Fallback a solicitud
        try:
            from apps.registro.models import SolicitudRegistro
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
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
        # ✅ PRIMERO: Usar campo directo
        if obj.id_subrubro_servicio:
            return obj.id_subrubro_servicio.nombre
    
            # Fallback a solicitud
        try:
            from apps.registro.models import SolicitudRegistro
            cuit_empresa = str(obj.cuit_cuil).replace('-', '').replace(' ', '').strip()
        
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
        """Obtener nombre del rubro de productos desde el subrubro"""
        # ✅ PRIMERO: Usar el rubro del subrubro de productos
        if obj.id_subrubro_producto and obj.id_subrubro_producto.rubro:
            return obj.id_subrubro_producto.rubro.nombre
        
        # Fallback a solicitud
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
        """Obtener nombre del rubro de servicios desde el subrubro"""
        # ✅ PRIMERO: Usar el rubro del subrubro de servicios
        if obj.id_subrubro_servicio and obj.id_subrubro_servicio.rubro:
            return obj.id_subrubro_servicio.rubro.nombre
        
        # Fallback a solicitud
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
    
    
    def to_internal_value(self, data):
        """Manejar el campo brochure cuando viene como string (URL) en lugar de archivo"""
        # Si 'brochure' está presente y es un string (no un archivo), eliminarlo de los datos
        # porque no debe enviarse la URL del archivo existente, solo archivos nuevos o strings vacíos para eliminar
        if 'brochure' in data and isinstance(data.get('brochure'), str):
            brochure_value = data.get('brochure')
            # Si es una URL (empieza con http:// o https://), eliminarlo porque es el archivo existente
            # Solo mantenerlo si es un string vacío (para eliminar el archivo)
            if brochure_value and (brochure_value.startswith('http://') or brochure_value.startswith('https://')):
                # Es una URL del archivo existente, no debe enviarse
                data = data.copy()
                data.pop('brochure', None)
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """
        Actualizar empresa mixta incluyendo subrubros y redes sociales
        """
        import json
        
        # 1. MANEJAR REDES SOCIALES
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val
        
        if redes_updated:
            existing = {}
            raw = getattr(instance, 'redes_sociales', None)
            if raw:
                try:
                    existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
                except Exception:
                    existing = {}
            
            existing.update(redes_updated)
            instance.redes_sociales = json.dumps(existing, ensure_ascii=False)
        
        # 2. MANEJAR SUBRUBROS (producto y servicio)
        # Para empresas mixtas, cada subrubro tiene su propio rubro, no validamos contra id_rubro general
        id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
        id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
        
        # Validar y asignar subrubro de productos
        if id_subrubro_producto is not None:
            from .models import SubRubro
            # El serializer de DRF puede convertir el ID en un objeto SubRubro automáticamente
            # Verificar si ya es un objeto o si es un ID
            if isinstance(id_subrubro_producto, SubRubro):
                subrubro_prod = id_subrubro_producto
            else:
                # Es un ID, obtener el objeto
                try:
                    subrubro_prod = SubRubro.objects.get(id=id_subrubro_producto)
                except SubRubro.DoesNotExist:
                    raise serializers.ValidationError({
                        'id_subrubro_producto': 'El subrubro de productos seleccionado no existe'
                    })
            
            # Validar que el subrubro esté activo
            if not subrubro_prod.activo:
                raise serializers.ValidationError({
                    'id_subrubro_producto': 'El subrubro de productos seleccionado no está activo'
                })
            instance.id_subrubro_producto = subrubro_prod
        elif id_subrubro_producto is None and 'id_subrubro_producto' in validated_data:
            # Si se envía explícitamente None, limpiar el subrubro
            instance.id_subrubro_producto = None
        
        # Validar y asignar subrubro de servicios
        if id_subrubro_servicio is not None:
            from .models import SubRubro
            # El serializer de DRF puede convertir el ID en un objeto SubRubro automáticamente
            # Verificar si ya es un objeto o si es un ID
            if isinstance(id_subrubro_servicio, SubRubro):
                subrubro_serv = id_subrubro_servicio
            else:
                # Es un ID, obtener el objeto
                try:
                    subrubro_serv = SubRubro.objects.get(id=id_subrubro_servicio)
                except SubRubro.DoesNotExist:
                    raise serializers.ValidationError({
                        'id_subrubro_servicio': 'El subrubro de servicios seleccionado no existe'
                    })
            
            # Validar que el subrubro esté activo
            if not subrubro_serv.activo:
                raise serializers.ValidationError({
                    'id_subrubro_servicio': 'El subrubro de servicios seleccionado no está activo'
                })
            instance.id_subrubro_servicio = subrubro_serv
        elif id_subrubro_servicio is None and 'id_subrubro_servicio' in validated_data:
            # Si se envía explícitamente None, limpiar el subrubro
            instance.id_subrubro_servicio = None
        
        # 2.5. MANEJAR BROCHURE (archivo)
        # Si se envía un string vacío, eliminar el archivo existente
        if 'brochure' in validated_data:
            brochure_value = validated_data.pop('brochure')
            # Si es un string vacío o None, eliminar el archivo
            if brochure_value == '' or brochure_value is None:
                if instance.brochure:
                    instance.brochure.delete(save=False)
                instance.brochure = None
            else:
                # Si es un archivo válido, asignarlo directamente
                instance.brochure = brochure_value
        
        # 3. ACTUALIZAR OTROS CAMPOS
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
    
    def _actualizar_productos(self, empresa, productos_data):
        """Actualizar productos de empresa mixta"""
        if productos_data is None:
            return
    
        productos_ids_actuales = []
    
        for producto_data in productos_data:
            producto_id = producto_data.get('id')
        
            if producto_id and str(producto_id).startswith('temp-'):
                producto_data_copy = producto_data.copy()
                producto_data_copy.pop('id', None)
                producto_data_copy.pop('posicion_arancelaria', None)
            
                nuevo_producto = ProductoEmpresaMixta.objects.create(
                    empresa=empresa,
                    **producto_data_copy
                )
                productos_ids_actuales.append(nuevo_producto.id)
        
            elif producto_id:
                try:
                    producto = ProductoEmpresaMixta.objects.get(id=producto_id, empresa=empresa)
                    producto_data.pop('posicion_arancelaria', None)
                
                    for key, value in producto_data.items():
                        if key != 'id':
                            setattr(producto, key, value)
                    producto.save()
                
                    productos_ids_actuales.append(producto.id)
                except ProductoEmpresaMixta.DoesNotExist:
                    continue
    
        ProductoEmpresaMixta.objects.filter(empresa=empresa).exclude(
            id__in=productos_ids_actuales
        ).delete()

    def _actualizar_servicios(self, empresa, servicios_data):
        """Actualizar servicios de empresa mixta"""
        if servicios_data is None:
            return
    
        servicios_ids_actuales = []
    
        for servicio_data in servicios_data:
            servicio_id = servicio_data.get('id')
        
            if servicio_id and str(servicio_id).startswith('temp-'):
                servicio_data_copy = servicio_data.copy()
                servicio_data_copy.pop('id', None)
            
                nuevo_servicio = ServicioEmpresaMixta.objects.create(
                    empresa=empresa,
                    **servicio_data_copy
                )
                servicios_ids_actuales.append(nuevo_servicio.id)
        
            elif servicio_id:
                try:
                    servicio = ServicioEmpresaMixta.objects.get(id=servicio_id, empresa=empresa)
                
                    for key, value in servicio_data.items():
                        if key != 'id':
                            setattr(servicio, key, value)
                    servicio.save()
                
                    servicios_ids_actuales.append(servicio.id)
                except ServicioEmpresaMixta.DoesNotExist:
                    continue
    
        ServicioEmpresaMixta.objects.filter(empresa=empresa).exclude(
            id__in=servicios_ids_actuales
        ).delete()
    
    def create(self, validated_data):
        """
        Crear empresa mixta con validación de subrubros y creación automática de usuario
        """
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        import json
        
        # 1. EXTRAER Y VALIDAR SUBRUBROS
        id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
        id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
        rubro = validated_data.get('id_rubro')
        
        # Validar subrubro de productos
        if id_subrubro_producto:
            if id_subrubro_producto.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro_producto': 'El subrubro de productos debe pertenecer al rubro seleccionado'
                })
        
        # Validar subrubro de servicios
        if id_subrubro_servicio:
            if id_subrubro_servicio.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro_servicio': 'El subrubro de servicios debe pertenecer al rubro seleccionado'
                })
        
        # 2. MANEJAR REDES SOCIALES
        redes_updated = {}
        for key in ('instagram', 'facebook', 'linkedin'):
            if key in validated_data:
                val = validated_data.pop(key)
                if val:
                    redes_updated[key] = val
        
        if redes_updated:
            validated_data['redes_sociales'] = json.dumps(redes_updated, ensure_ascii=False)
        
        # 3. CREAR USUARIO AUTOMÁTICAMENTE
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
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
                    
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)
                        usuario_empresa.is_active = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        # 4. CREAR LA EMPRESA
        empresa = EmpresaMixta.objects.create(**validated_data)
        
        # 5. ASIGNAR SUBRUBROS
        if id_subrubro_producto:
            empresa.id_subrubro_producto = id_subrubro_producto
        if id_subrubro_servicio:
            empresa.id_subrubro_servicio = id_subrubro_servicio
        
        if id_subrubro_producto or id_subrubro_servicio:
            empresa.save()
        
        return empresa
    
    class Meta:
        model = EmpresaMixta
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


# ============================================================================
# SERIALIZERS UNIFICADOS PARA EMPRESA (REEMPLAZAN LOS PROXY MODELS)
# ============================================================================

class EmpresaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado unificado para listas de empresas (todos los tipos)"""
    tipo_empresa_nombre = serializers.CharField(source='tipo_empresa.nombre', read_only=True)
    tipo_empresa = serializers.SerializerMethodField()
    tipo_empresa_valor = serializers.CharField(read_only=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    categoria_matriz = serializers.SerializerMethodField()
    sub_rubro_nombre = serializers.SerializerMethodField()

    def get_tipo_empresa(self, obj):
        """Retornar el valor del tipo de empresa"""
        return getattr(obj, 'tipo_empresa_valor', None) or 'producto'
    
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
    
    def get_sub_rubro_nombre(self, obj):
        """Obtener nombre del subrubro según el tipo de empresa"""
        if obj.tipo_empresa_valor == 'mixta':
            # Para empresas mixtas, mostrar ambos subrubros si existen
            sub_prod = obj.id_subrubro_producto.nombre if obj.id_subrubro_producto else None
            sub_serv = obj.id_subrubro_servicio.nombre if obj.id_subrubro_servicio else None
            if sub_prod and sub_serv:
                return f"{sub_prod} / {sub_serv}"
            return sub_prod or sub_serv or None
        else:
            # Para empresas de producto o servicio único
            return obj.id_subrubro.nombre if obj.id_subrubro else None
    
    class Meta:
        model = Empresa
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'direccion',
            'departamento_nombre', 'telefono', 'correo',
            'tipo_empresa_nombre', 'tipo_empresa', 'tipo_empresa_valor', 
            'tipo_sociedad', 'codigo_postal', 'rubro_nombre', 'id_subrubro', 'id_subrubro_producto', 'id_subrubro_servicio',
            'sub_rubro_nombre', 'exporta', 'interes_exportar', 'importa', 'fecha_creacion', 
            'categoria_matriz', 'geolocalizacion', 'municipio_nombre', 'localidad_nombre',
            'sitioweb', 'email_secundario', 'email_terciario',
            'contacto_principal_nombre', 'contacto_principal_telefono', 'contacto_principal_email',
            'contacto_secundario_nombre', 'contacto_secundario_telefono', 'contacto_secundario_email',
            'certificadopyme', 'certificaciones', 'promo2idiomas',
            'actividades_promocion_internacional', 'observaciones',
            'eliminado', 'ultima_notificacion_credenciales',
            'anos_etapa_inicial', 'anos_potencial_exportadora', 'anos_exportadora'
        ]


class EmpresaSerializer(serializers.ModelSerializer):
    """Serializer completo unificado para empresas (todos los tipos)"""
    # Relaciones
    productos = ProductoEmpresaSerializer(source='productos_empresa', many=True, read_only=True)
    servicios = ServicioEmpresaSerializer(source='servicios_empresa', many=True, read_only=True)
    productos_mixta = ProductoEmpresaMixtaSerializer(many=True, read_only=True)
    servicios_mixta = ServicioEmpresaMixtaSerializer(many=True, read_only=True)
    tipo_empresa_detalle = TipoEmpresaSerializer(source='tipo_empresa', read_only=True)
    rubro_detalle = RubroSerializer(source='id_rubro', read_only=True)
    
    # Campos calculados
    actividades_promocion_internacional = serializers.JSONField(required=False, allow_null=True)
    rubro_nombre = serializers.CharField(source='id_rubro.nombre', read_only=True)
    sub_rubro_nombre = serializers.SerializerMethodField()
    sub_rubro_producto_nombre = serializers.SerializerMethodField()
    sub_rubro_servicio_nombre = serializers.SerializerMethodField()
    rubro_producto_nombre = serializers.SerializerMethodField()
    rubro_servicio_nombre = serializers.SerializerMethodField()
    departamento_nombre = serializers.SerializerMethodField()
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    instagram = serializers.SerializerMethodField()
    instagram_write = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    facebook = serializers.SerializerMethodField()
    facebook_write = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    linkedin = serializers.SerializerMethodField()
    linkedin_write = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    categoria_matriz = serializers.SerializerMethodField()
    tipo_empresa_valor = serializers.CharField(read_only=True)
    usuario_email = serializers.SerializerMethodField()
    
    def get_usuario_email(self, obj):
        """Obtener el email del usuario asociado a la empresa"""
        if obj.id_usuario:
            return obj.id_usuario.email
        return None
    
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
    
    def _parse_redes(self, obj):
        """Intentar parsear el campo `redes_sociales` que puede ser JSON o texto simple."""
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
        """Obtener nombre del subrubro según el tipo de empresa"""
        if obj.tipo_empresa_valor == 'mixta':
            sub_prod = obj.id_subrubro_producto.nombre if obj.id_subrubro_producto else None
            sub_serv = obj.id_subrubro_servicio.nombre if obj.id_subrubro_servicio else None
            if sub_prod and sub_serv:
                return f"{sub_prod} / {sub_serv}"
            return sub_prod or sub_serv or None
        else:
            return obj.id_subrubro.nombre if obj.id_subrubro else None
    
    def get_sub_rubro_producto_nombre(self, obj):
        """Obtener nombre del subrubro de productos"""
        if obj.id_subrubro_producto:
            return obj.id_subrubro_producto.nombre
        return None
    
    def get_sub_rubro_servicio_nombre(self, obj):
        """Obtener nombre del subrubro de servicios"""
        if obj.id_subrubro_servicio:
            return obj.id_subrubro_servicio.nombre
        return None
    
    def get_rubro_producto_nombre(self, obj):
        """Obtener nombre del rubro de productos desde el subrubro"""
        # Usar el rubro del subrubro de productos
        if obj.id_subrubro_producto and obj.id_subrubro_producto.rubro:
            return obj.id_subrubro_producto.rubro.nombre
        return None
    
    def get_rubro_servicio_nombre(self, obj):
        """Obtener nombre del rubro de servicios desde el subrubro"""
        # Usar el rubro del subrubro de servicios
        if obj.id_subrubro_servicio and obj.id_subrubro_servicio.rubro:
            return obj.id_subrubro_servicio.rubro.nombre
        return None
    
    def to_internal_value(self, data):
        """Manejar el campo brochure cuando viene como string (URL) en lugar de archivo"""
        # Si 'brochure' está presente y es un string (no un archivo), eliminarlo de los datos
        # porque no debe enviarse la URL del archivo existente, solo archivos nuevos o strings vacíos para eliminar
        data_dict = dict(data.items()) if hasattr(data, 'items') else data
        if 'brochure' in data_dict and isinstance(data_dict.get('brochure'), str):
            brochure_value = data_dict.get('brochure')
            # Si es una URL (empieza con http:// o https://), eliminarlo porque es el archivo existente
            # Solo mantenerlo si es un string vacío (para eliminar el archivo)
            if brochure_value and (brochure_value.startswith('http://') or brochure_value.startswith('https://')):
                # Es una URL del archivo existente, no debe enviarse
                data_dict = dict(data_dict) if not isinstance(data_dict, dict) else data_dict.copy()
                data_dict.pop('brochure', None)
                data = data_dict
        
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """Actualizar empresa con validación de subrubro y redes sociales"""
        import json
        import logging
        from django.db import models as django_models
        
        logger = logging.getLogger(__name__)
        
        # 1. MANEJAR REDES SOCIALES
        # Cargar redes sociales existentes
        existing = {}
        raw = getattr(instance, 'redes_sociales', None)
        logger.info(f"🔍 [EmpresaSerializer.update] Redes sociales existentes (raw): {raw}")
        if raw:
            try:
                existing = json.loads(raw) if isinstance(raw, str) else (raw if isinstance(raw, dict) else {})
                logger.info(f"🔍 [EmpresaSerializer.update] Redes sociales parseadas: {existing}")
            except Exception as e:
                logger.error(f"❌ [EmpresaSerializer.update] Error parseando redes sociales: {e}")
                existing = {}
        
        # Debug: Ver qué hay en validated_data e initial_data
        logger.info(f"🔍 [EmpresaSerializer.update] validated_data keys: {list(validated_data.keys())}")
        if hasattr(self, 'initial_data') and self.initial_data is not None:
            logger.info(f"🔍 [EmpresaSerializer.update] initial_data type: {type(self.initial_data)}")
            if hasattr(self.initial_data, 'keys'):
                logger.info(f"🔍 [EmpresaSerializer.update] initial_data keys: {list(self.initial_data.keys())}")
            # Buscar específicamente las redes sociales en initial_data
            for key in ('instagram', 'facebook', 'linkedin'):
                if hasattr(self.initial_data, 'get'):
                    val_check = self.initial_data.get(key)
                    logger.info(f"🔍 [EmpresaSerializer.update] initial_data.get('{key}'): {repr(val_check)} (type: {type(val_check)})")
                if hasattr(self.initial_data, '__contains__'):
                    logger.info(f"🔍 [EmpresaSerializer.update] '{key}' in initial_data: {key in self.initial_data}")
        
        # Procesar cada red social
        redes_modified = False
        # Mapeo de campos write_only a nombres de campo
        redes_map = {
            'instagram_write': 'instagram',
            'facebook_write': 'facebook',
            'linkedin_write': 'linkedin',
        }
        
        for write_key, json_key in redes_map.items():
            logger.info(f"🔍 [EmpresaSerializer.update] Procesando {json_key}...")
            
            # Buscar primero con el nombre original (más común cuando viene FormData desde frontend)
            val = validated_data.pop(json_key, None)
            logger.info(f"🔍 [EmpresaSerializer.update] {json_key} desde validated_data: {repr(val)}")
            
            # Si no está, intentar desde validated_data (campos write_only)
            if val is None:
                val = validated_data.pop(write_key, None)
                logger.info(f"🔍 [EmpresaSerializer.update] {write_key} desde validated_data: {repr(val)}")
            
            # Si aún no está, intentar desde initial_data (para FormData/QueryDict)
            if val is None and hasattr(self, 'initial_data') and self.initial_data is not None:
                try:
                    logger.info(f"🔍 [EmpresaSerializer.update] Buscando {json_key} en initial_data...")
                    # Intentar obtener desde initial_data (puede ser QueryDict, dict, etc.)
                    # Primero intentar con el nombre original (más común cuando viene FormData desde frontend)
                    if hasattr(self.initial_data, 'get'):
                        # Para QueryDict y dict - usar 'in' para verificar existencia, no 'or' (porque string vacío es falsy)
                        if json_key in self.initial_data:
                            val = self.initial_data.get(json_key)
                            logger.info(f"🔍 [EmpresaSerializer.update] {json_key} encontrado en initial_data: {repr(val)}")
                        elif write_key in self.initial_data:
                            val = self.initial_data.get(write_key)
                            logger.info(f"🔍 [EmpresaSerializer.update] {write_key} encontrado en initial_data: {repr(val)}")
                        else:
                            logger.info(f"🔍 [EmpresaSerializer.update] {json_key} y {write_key} NO encontrados en initial_data")
                    elif hasattr(self.initial_data, '__contains__'):
                        # Para objetos que soportan 'in'
                        if json_key in self.initial_data:
                            val = self.initial_data[json_key]
                            logger.info(f"🔍 [EmpresaSerializer.update] {json_key} encontrado (__getitem__): {repr(val)}")
                        elif write_key in self.initial_data:
                            val = self.initial_data[write_key]
                            logger.info(f"🔍 [EmpresaSerializer.update] {write_key} encontrado (__getitem__): {repr(val)}")
                    
                    # Si es un QueryDict o lista, puede tener múltiples valores, tomar el primero
                    if isinstance(val, list) and len(val) > 0:
                        logger.info(f"🔍 [EmpresaSerializer.update] {json_key} es lista, tomando primer valor: {repr(val[0])}")
                        val = val[0]
                except Exception as e:
                    # Si hay algún error al acceder a initial_data, ignorar y continuar
                    logger.error(f"❌ [EmpresaSerializer.update] Error accediendo initial_data para {json_key}: {e}")
                    val = None
            
            logger.info(f"🔍 [EmpresaSerializer.update] Valor final para {json_key}: {repr(val)} (type: {type(val)})")
            
            # Procesar el valor
            if val is not None:
                # Normalizar: convertir string vacío a None para procesamiento consistente
                if val == '':
                    logger.info(f"🔍 [EmpresaSerializer.update] {json_key} es string vacío, convirtiendo a None")
                    val = None
                    
                if val is None:
                    # Si existía, eliminarla
                    if json_key in existing:
                        logger.info(f"🔍 [EmpresaSerializer.update] Eliminando {json_key} (existía: {existing[json_key]})")
                        del existing[json_key]
                        redes_modified = True
                    else:
                        logger.info(f"🔍 [EmpresaSerializer.update] {json_key} es None pero no existía, no hay cambios")
                elif val:
                    # Si tiene valor, actualizarla
                    val_str = str(val).strip()
                    if val_str and existing.get(json_key) != val_str:
                        logger.info(f"🔍 [EmpresaSerializer.update] Actualizando {json_key}: '{existing.get(json_key)}' -> '{val_str}'")
                        existing[json_key] = val_str
                        redes_modified = True
                    else:
                        logger.info(f"🔍 [EmpresaSerializer.update] {json_key} no cambió (era: '{existing.get(json_key)}', nuevo: '{val_str}')")
            else:
                logger.info(f"🔍 [EmpresaSerializer.update] {json_key} es None, no se procesa")
        
        # Si se modificaron las redes sociales, actualizar el campo
        if redes_modified:
            logger.info(f"✅ [EmpresaSerializer.update] Redes sociales modificadas. Nuevo estado: {existing}")
            if existing:
                instance.redes_sociales = json.dumps(existing, ensure_ascii=False)
                logger.info(f"✅ [EmpresaSerializer.update] Redes sociales guardadas como JSON: {instance.redes_sociales}")
            else:
                # Si no quedan redes sociales, asignar None
                instance.redes_sociales = None
                logger.info(f"✅ [EmpresaSerializer.update] Todas las redes sociales eliminadas, campo asignado a None")
        else:
            logger.info(f"ℹ️ [EmpresaSerializer.update] No hubo cambios en las redes sociales")
        
        # 2. MANEJAR SUBRUBROS
        id_subrubro = validated_data.pop('id_subrubro', None)
        id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
        id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
        
        rubro = validated_data.get('id_rubro', instance.id_rubro)
        
        # Para empresas no mixtas: validar subrubro contra rubro general
        if id_subrubro is not None:
            from .models import SubRubro
            # El serializer de DRF puede convertir el ID en un objeto SubRubro automáticamente
            if isinstance(id_subrubro, SubRubro):
                subrubro_obj = id_subrubro
            else:
                try:
                    subrubro_obj = SubRubro.objects.get(id=id_subrubro)
                except SubRubro.DoesNotExist:
                    raise serializers.ValidationError({
                        'id_subrubro': 'El subrubro seleccionado no existe'
                    })
            
            if not subrubro_obj.activo:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro seleccionado no está activo'
                })
            if subrubro_obj.rubro != rubro:
                raise serializers.ValidationError({
                    'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
                })
            instance.id_subrubro = subrubro_obj
        elif id_subrubro is None and 'id_subrubro' in validated_data:
            instance.id_subrubro = None
        
        # Para empresas mixtas: cada subrubro tiene su propio rubro, no validamos contra id_rubro general
        if id_subrubro_producto is not None:
            from .models import SubRubro
            # El serializer de DRF puede convertir el ID en un objeto SubRubro automáticamente
            if isinstance(id_subrubro_producto, SubRubro):
                subrubro_prod = id_subrubro_producto
            else:
                try:
                    subrubro_prod = SubRubro.objects.get(id=id_subrubro_producto)
                except SubRubro.DoesNotExist:
                    raise serializers.ValidationError({
                        'id_subrubro_producto': 'El subrubro de productos seleccionado no existe'
                    })
            
            if not subrubro_prod.activo:
                raise serializers.ValidationError({
                    'id_subrubro_producto': 'El subrubro de productos seleccionado no está activo'
                })
            instance.id_subrubro_producto = subrubro_prod
        elif id_subrubro_producto is None and 'id_subrubro_producto' in validated_data:
            instance.id_subrubro_producto = None
        
        if id_subrubro_servicio is not None:
            from .models import SubRubro
            # El serializer de DRF puede convertir el ID en un objeto SubRubro automáticamente
            if isinstance(id_subrubro_servicio, SubRubro):
                subrubro_serv = id_subrubro_servicio
            else:
                try:
                    subrubro_serv = SubRubro.objects.get(id=id_subrubro_servicio)
                except SubRubro.DoesNotExist:
                    raise serializers.ValidationError({
                        'id_subrubro_servicio': 'El subrubro de servicios seleccionado no existe'
                    })
            
            if not subrubro_serv.activo:
                raise serializers.ValidationError({
                    'id_subrubro_servicio': 'El subrubro de servicios seleccionado no está activo'
                })
            instance.id_subrubro_servicio = subrubro_serv
        elif id_subrubro_servicio is None and 'id_subrubro_servicio' in validated_data:
            instance.id_subrubro_servicio = None
        
        # Limpiar subrubros si se cambia el rubro (solo para empresas no mixtas)
        if 'id_rubro' in validated_data and validated_data['id_rubro'] != instance.id_rubro:
            if instance.id_subrubro and instance.id_subrubro.rubro != validated_data['id_rubro']:
                instance.id_subrubro = None
        
        # 2.5. MANEJAR BROCHURE (archivo)
        # Si se envía un string vacío, eliminar el archivo existente
        if 'brochure' in validated_data:
            brochure_value = validated_data.pop('brochure')
            # Si es un string vacío o None, eliminar el archivo
            if brochure_value == '' or brochure_value is None:
                if instance.brochure:
                    instance.brochure.delete(save=False)
                instance.brochure = None
            else:
                # Si es un archivo válido, asignarlo directamente
                instance.brochure = brochure_value
        
        # 3. ACTUALIZAR OTROS CAMPOS
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
        
    
    def create(self, validated_data):
        """Crear empresa con validación de subrubro y creación automática de usuario"""
        from apps.core.models import Usuario, RolUsuario
        from django.db import transaction
        import json
        
        # 1. EXTRAER Y VALIDAR SUBRUBROS
        id_subrubro = validated_data.pop('id_subrubro', None)
        id_subrubro_producto = validated_data.pop('id_subrubro_producto', None)
        id_subrubro_servicio = validated_data.pop('id_subrubro_servicio', None)
        rubro = validated_data.get('id_rubro')
        
        if id_subrubro and id_subrubro.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro': 'El subrubro debe pertenecer al rubro seleccionado'
            })
        
        if id_subrubro_producto and id_subrubro_producto.rubro != rubro:
            raise serializers.ValidationError({
                'id_subrubro_producto': 'El subrubro de productos debe pertenecer al rubro seleccionado'
            })
        
        # 2. MANEJAR REDES SOCIALES
        import logging
        logger = logging.getLogger(__name__)
        
        redes_updated = {}
        # Mapeo de campos write_only a nombres de campo
        redes_map = {
            'instagram_write': 'instagram',
            'facebook_write': 'facebook',
            'linkedin_write': 'linkedin',
        }
        
        # Debug: Ver qué hay en validated_data e initial_data
        logger.info(f"🔍 [EmpresaSerializer.create] validated_data keys: {list(validated_data.keys())}")
        if hasattr(self, 'initial_data') and self.initial_data is not None:
            logger.info(f"🔍 [EmpresaSerializer.create] initial_data type: {type(self.initial_data)}")
            if hasattr(self.initial_data, 'keys'):
                logger.info(f"🔍 [EmpresaSerializer.create] initial_data keys: {list(self.initial_data.keys())}")
            # Buscar específicamente las redes sociales en initial_data
            for key in ('instagram', 'facebook', 'linkedin'):
                if hasattr(self.initial_data, 'get'):
                    val_check = self.initial_data.get(key)
                    logger.info(f"🔍 [EmpresaSerializer.create] initial_data.get('{key}'): {repr(val_check)} (type: {type(val_check)})")
                if hasattr(self.initial_data, '__contains__'):
                    logger.info(f"🔍 [EmpresaSerializer.create] '{key}' in initial_data: {key in self.initial_data}")
        
        for write_key, json_key in redes_map.items():
            logger.info(f"🔍 [EmpresaSerializer.create] Procesando {json_key}...")
            
            # Intentar obtener desde validated_data (campos write_only)
            val = validated_data.pop(write_key, None)
            logger.info(f"🔍 [EmpresaSerializer.create] {write_key} desde validated_data: {repr(val)}")
            
            # Si no está, intentar desde el nombre original (para compatibilidad)
            if val is None:
                val = validated_data.pop(json_key, None)
                logger.info(f"🔍 [EmpresaSerializer.create] {json_key} desde validated_data: {repr(val)}")
            
            # Si aún no está, intentar desde initial_data
            if val is None and hasattr(self, 'initial_data') and self.initial_data is not None:
                try:
                    logger.info(f"🔍 [EmpresaSerializer.create] Buscando {json_key} en initial_data...")
                    if hasattr(self.initial_data, 'get'):
                        # Para QueryDict y dict - verificar existencia primero
                        if json_key in self.initial_data:
                            val = self.initial_data.get(json_key)
                            logger.info(f"🔍 [EmpresaSerializer.create] {json_key} encontrado en initial_data: {repr(val)}")
                        elif write_key in self.initial_data:
                            val = self.initial_data.get(write_key)
                            logger.info(f"🔍 [EmpresaSerializer.create] {write_key} encontrado en initial_data: {repr(val)}")
                    elif isinstance(self.initial_data, dict):
                        if json_key in self.initial_data:
                            val = self.initial_data.get(json_key)
                        elif write_key in self.initial_data:
                            val = self.initial_data.get(write_key)
                    # Si es un QueryDict, puede tener múltiples valores, tomar el primero
                    if isinstance(val, list) and len(val) > 0:
                        logger.info(f"🔍 [EmpresaSerializer.create] {json_key} es lista, tomando primer valor: {repr(val[0])}")
                        val = val[0]
                except Exception as e:
                    logger.error(f"❌ [EmpresaSerializer.create] Error accediendo initial_data para {json_key}: {e}")
            
            logger.info(f"🔍 [EmpresaSerializer.create] Valor final para {json_key}: {repr(val)} (type: {type(val)})")
            
            # Procesar el valor (solo agregar si tiene valor)
            if val and val != '':
                redes_updated[json_key] = val
                logger.info(f"✅ [EmpresaSerializer.create] {json_key} agregado a redes_updated: {val}")
            else:
                logger.info(f"ℹ️ [EmpresaSerializer.create] {json_key} no tiene valor o está vacío, no se agrega")
        
        if redes_updated:
            validated_data['redes_sociales'] = json.dumps(redes_updated, ensure_ascii=False)
            logger.info(f"✅ [EmpresaSerializer.create] Redes sociales guardadas: {validated_data['redes_sociales']}")
        else:
            logger.info(f"ℹ️ [EmpresaSerializer.create] No hay redes sociales para guardar")
        
        # 3. CREAR USUARIO AUTOMÁTICAMENTE SI ES NECESARIO
        id_usuario = validated_data.get('id_usuario')
        contacto_email = validated_data.get('contacto_principal_email')
        cuit_cuil = validated_data.get('cuit_cuil')
        
        request = self.context.get('request')
        if request and request.user and (request.user.is_staff or request.user.is_superuser):
            if contacto_email and cuit_cuil and (not id_usuario or id_usuario == request.user):
                with transaction.atomic():
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
                    
                    try:
                        usuario_empresa = Usuario.objects.get(email=contacto_email)
                        usuario_empresa.rol = rol_empresa
                        usuario_empresa.set_password(cuit_cuil)
                        usuario_empresa.is_active = True
                        # Marcar que debe cambiar la contraseña (es empresa con CUIT como password)
                        usuario_empresa.debe_cambiar_password = True
                        usuario_empresa.save()
                    except Usuario.DoesNotExist:
                        usuario_empresa = Usuario.objects.create_user(
                            email=contacto_email,
                            password=cuit_cuil,
                            nombre=validated_data.get('contacto_principal_nombre', ''),
                            apellido=validated_data.get('contacto_principal_cargo', ''),
                            rol=rol_empresa,
                            telefono=validated_data.get('contacto_principal_telefono', ''),
                            is_active=True,
                            debe_cambiar_password=True  # Marcar que debe cambiar la contraseña
                        )
                    
                    validated_data['id_usuario'] = usuario_empresa
        
        # 4. EXTRAER Y ESTABLECER tipo_empresa_valor (aunque sea read_only, lo establecemos manualmente)
        # Los campos read_only no están en validated_data, así que los obtenemos de initial_data
        tipo_empresa_valor = self.initial_data.get('tipo_empresa_valor') or validated_data.pop('tipo_empresa_valor', None)
        
        # Si no se proporciona tipo_empresa_valor, intentar inferirlo del tipo_empresa
        if not tipo_empresa_valor and validated_data.get('tipo_empresa'):
            tipo_empresa_obj = validated_data.get('tipo_empresa')
            if hasattr(tipo_empresa_obj, 'nombre'):
                nombre_tipo = tipo_empresa_obj.nombre.lower()
                if 'producto' in nombre_tipo and 'servicio' in nombre_tipo:
                    tipo_empresa_valor = 'mixta'
                elif 'servicio' in nombre_tipo:
                    tipo_empresa_valor = 'servicio'
                else:
                    tipo_empresa_valor = 'producto'
        
        # 5. CREAR LA EMPRESA (usando el modelo base Empresa)
        empresa = Empresa.objects.create(**validated_data)
        
        # 6. ESTABLECER tipo_empresa_valor si se proporcionó
        if tipo_empresa_valor:
            empresa.tipo_empresa_valor = tipo_empresa_valor
        
        # 7. ASIGNAR SUBRUBROS SI EXISTEN
        if id_subrubro:
            empresa.id_subrubro = id_subrubro
        if id_subrubro_producto:
            empresa.id_subrubro_producto = id_subrubro_producto
        if id_subrubro_servicio:
            empresa.id_subrubro_servicio = id_subrubro_servicio
        
        # Guardar si hay cambios
        if tipo_empresa_valor or id_subrubro or id_subrubro_producto or id_subrubro_servicio:
            empresa.save()
        
        return empresa
    
    class Meta:
        model = Empresa
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'eliminado', 'fecha_eliminacion', 'eliminado_por']


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

