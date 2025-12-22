from rest_framework import serializers
from .models import SolicitudRegistro, DocumentoSolicitud, NotificacionRegistro
from django.contrib.auth import get_user_model
from apps.core.models import RolUsuario
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class DocumentoSolicitudSerializer(serializers.ModelSerializer):
    """Serializer para documentos de solicitud"""
    
    class Meta:
        model = DocumentoSolicitud
        fields = ['id', 'solicitud', 'tipo_documento', 'nombre_archivo', 'archivo', 'descripcion', 'fecha_subida']
        read_only_fields = ['id', 'fecha_subida']


class NotificacionRegistroSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones de registro"""
    
    class Meta:
        model = NotificacionRegistro
        fields = ['id', 'solicitud', 'tipo', 'asunto', 'mensaje', 'email_enviado', 'fecha_envio', 'error_envio']
        read_only_fields = ['id', 'fecha_envio']


class SolicitudRegistroListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de solicitudes"""
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'id', 'razon_social', 'cuit_cuil', 'estado', 'tipo_empresa',
            'rubro_principal', 'correo',
            'fecha_creacion', 'email_confirmado', 'fecha_confirmacion'
        ]


class SolicitudRegistroSerializer(serializers.ModelSerializer):
    """Serializer completo para solicitudes de registro"""
    documentos = DocumentoSolicitudSerializer(many=True, read_only=True)
    notificaciones = NotificacionRegistroSerializer(many=True, read_only=True)
    departamento_nombre = serializers.SerializerMethodField()
    municipio_nombre = serializers.SerializerMethodField()
    localidad_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = SolicitudRegistro
        fields = '__all__'
        read_only_fields = [
            'id', 'fecha_creacion', 'fecha_actualizacion', 'token_confirmacion',
            'email_confirmado', 'fecha_confirmacion',
            'fecha_aprobacion', 'aprobado_por', 'empresa_creada'
        ]
    def get_departamento_nombre(self, obj):
        """Obtener nombre del departamento"""
        if obj.departamento:
            try:
                from apps.geografia.models import Departamento
                depto = Departamento.objects.get(id=obj.departamento)
                return depto.nombre
            except Departamento.DoesNotExist:
                return obj.departamento
        return None
    
    def get_municipio_nombre(self, obj):
        """Obtener nombre del municipio"""
        if obj.municipio:
            try:
                from apps.geografia.models import Municipio
                municipio = Municipio.objects.get(id=obj.municipio)
                return municipio.nombre
            except Municipio.DoesNotExist:
                return obj.municipio
        return None
    
    def get_localidad_nombre(self, obj):
        """Obtener nombre de la localidad"""
        if obj.localidad:
            try:
                from apps.geografia.models import Localidad
                localidad = Localidad.objects.get(id=obj.localidad)
                return localidad.nombre
            except Localidad.DoesNotExist:
                return obj.localidad
        return None
        


class SolicitudRegistroCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes de registro público"""
    
    # Campos adicionales del formulario
    contacto_principal = serializers.DictField(write_only=True, required=True, allow_null=False)
    contactos_secundarios = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        allow_null=True
    )
    productos = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        allow_null=True
    )
    servicios = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        allow_null=True
    )
    actividades_promocion = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        allow_null=True
    )
    actividades_promocion_internacional = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        allow_null=True
    )
    
    def to_internal_value(self, data):
        """Parsear strings JSON antes de la validación"""
        import json
        import logging
        logger = logging.getLogger(__name__)
        
        # Si viene como FormData, algunos campos pueden venir como strings JSON
        parsed_data = {}
        for key, value in data.items():
            # Log para debug
            if key in ['direccion', 'departamento']:
                logger.info(f"Campo {key} recibido: {repr(value)} (tipo: {type(value).__name__})")
            
            if value is None:
                parsed_data[key] = value
            elif isinstance(value, str):
                # Si es una cadena vacía, mantenerla (no es None)
                if value == '':
                    parsed_data[key] = value
                elif key in ['contacto_principal', 'contactos_secundarios', 'productos', 'servicios', 'actividades_promocion', 'actividades_promocion_internacional']:
                    # Intentar parsear como JSON solo para estos campos
                    try:
                        parsed_data[key] = json.loads(value)
                    except (json.JSONDecodeError, ValueError, TypeError):
                        # Si no es JSON válido, mantener el valor original
                        parsed_data[key] = value
                else:
                    # Para otros campos string, mantener el valor
                    parsed_data[key] = value
            else:
                parsed_data[key] = value
        
        # Log para debug
        if 'direccion' in parsed_data:
            logger.info(f"Dirección después de parsear: {repr(parsed_data.get('direccion'))}")
        if 'departamento' in parsed_data:
            logger.info(f"Departamento después de parsear: {repr(parsed_data.get('departamento'))}")
        
        return super().to_internal_value(parsed_data)
    
    # Campos explícitos para contacto principal
    nombre_contacto = serializers.CharField(required=False, allow_blank=False, allow_null=True)
    apellido_contacto = serializers.CharField(required=False, allow_blank=False, allow_null=True)
    cargo_contacto = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    telefono_contacto = serializers.CharField(required=False, allow_blank=False, allow_null=True)
    email_contacto = serializers.EmailField(required=False, write_only=True, allow_blank=True)
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'razon_social', 'nombre_fantasia', 'tipo_sociedad', 'cuit_cuil',
            'direccion', 'codigo_postal', 'direccion_comercial', 'codigo_postal_comercial', 'departamento', 'municipio', 'localidad',
            'geolocalizacion', 'telefono', 'correo', 'sitioweb',
            'tipo_empresa', 'rubro_principal', 'sub_rubro', 
            'rubro_producto', 'sub_rubro_producto', 'rubro_servicio', 'sub_rubro_servicio',
            'descripcion_actividad',
            'productos', 'servicios', 'actividades_promocion',
            'actividades_promocion_internacional',
            'contacto_principal', 'contactos_secundarios',
            'nombre_contacto', 'apellido_contacto', 'cargo_contacto', 'telefono_contacto', 'email_contacto',
            'exporta', 'destino_exportacion', 'interes_exportar', 'importa', 'tipo_importacion',
            'certificado_pyme', 'certificaciones', 'brochure_url', 'catalogo_pdf', 'material_promocional_idiomas',
            'idiomas_trabajo', 'observaciones',
            'instagram', 'facebook', 'linkedin'
        ]
        extra_kwargs = {
            'direccion': {'allow_blank': False, 'required': True},
            'departamento': {'allow_blank': False, 'required': True},
        }
    
    def validate_cuit_cuil(self, value):
        """Validar y limpiar CUIT/CUIL"""
        if not value:
            raise serializers.ValidationError("El CUIT/CUIL es requerido")
        
        # Limpiar CUIT/CUIL (remover guiones y espacios)
        cuit_limpio = value.replace('-', '').replace(' ', '').strip()
        
        # Verificar que tenga 11 dígitos
        if not cuit_limpio.isdigit() or len(cuit_limpio) != 11:
            raise serializers.ValidationError("El CUIT/CUIL debe tener exactamente 11 dígitos")
        
        # Verificar que no exista otra solicitud aprobada con el mismo CUIT
        from .models import SolicitudRegistro
        solicitud_existente = SolicitudRegistro.objects.filter(
            cuit_cuil=cuit_limpio,
            estado='aprobada'
        ).exclude(id=self.instance.id if self.instance else None).first()
        
        if solicitud_existente:
            raise serializers.ValidationError("Ya existe una solicitud aprobada con este CUIT/CUIL")
        
        return cuit_limpio
    
    def create(self, validated_data):
        """Crear solicitud y usuario asociado"""
        import logging
        import json
        from django.utils import timezone
        logger = logging.getLogger(__name__)
        
        try:
            # Función auxiliar para parsear JSON si viene como string
            def parse_json_value(value, default):
                if value is None:
                    return default
                if isinstance(value, str):
                    try:
                        return json.loads(value)
                    except (json.JSONDecodeError, ValueError, TypeError):
                        return default
                return value
            
            # Extraer datos anidados (pueden venir como strings JSON desde FormData)
            contacto_principal_raw = validated_data.pop('contacto_principal', {})
            contactos_secundarios_raw = validated_data.pop('contactos_secundarios', [])
            productos_raw = validated_data.pop('productos', [])
            servicios_raw = validated_data.pop('servicios', {})
            # Aceptar alias enviado por frontend: 'actividades_promocion_internacional'
            actividades_promocion_raw = validated_data.pop('actividades_promocion', None)
            if not actividades_promocion_raw and 'actividades_promocion_internacional' in validated_data:
                actividades_promocion_raw = validated_data.pop('actividades_promocion_internacional', None)
            if actividades_promocion_raw is None:
                actividades_promocion_raw = []
            
            # Parsear cada campo
            contacto_principal = parse_json_value(contacto_principal_raw, {})
            
            # Para arrays, parsear cada elemento si es string
            contactos_secundarios = []
            if contactos_secundarios_raw:
                if isinstance(contactos_secundarios_raw, str):
                    try:
                        contactos_secundarios = json.loads(contactos_secundarios_raw)
                    except:
                        contactos_secundarios = []
                elif isinstance(contactos_secundarios_raw, list):
                    contactos_secundarios = [parse_json_value(item, item) if isinstance(item, str) else item for item in contactos_secundarios_raw]
                else:
                    contactos_secundarios = []
            
            productos = []
            if productos_raw:
                if isinstance(productos_raw, str):
                    try:
                        productos = json.loads(productos_raw)
                    except:
                        productos = []
                elif isinstance(productos_raw, list):
                    productos = [parse_json_value(item, item) if isinstance(item, str) else item for item in productos_raw]
                else:
                    productos = []
            
            # Para servicios, puede venir como lista o como objeto único
            servicios = []
            if servicios_raw:
                if isinstance(servicios_raw, str):
                    try:
                        parsed = json.loads(servicios_raw)
                        servicios = parsed if isinstance(parsed, list) else [parsed]
                    except:
                        servicios = []
                elif isinstance(servicios_raw, list):
                    servicios = [parse_json_value(item, item) if isinstance(item, str) else item for item in servicios_raw]
                elif isinstance(servicios_raw, dict):
                    # Si viene como objeto único, convertirlo a lista
                    servicios = [servicios_raw]
                else:
                    servicios = []
            
            actividades_promocion = []
            if actividades_promocion_raw:
                if isinstance(actividades_promocion_raw, str):
                    try:
                        actividades_promocion = json.loads(actividades_promocion_raw)
                    except:
                        actividades_promocion = []
                elif isinstance(actividades_promocion_raw, list):
                    actividades_promocion = [parse_json_value(item, item) if isinstance(item, str) else item for item in actividades_promocion_raw]
                else:
                    actividades_promocion = []
            # Log para depuración: cuántas actividades se recibieron
            try:
                logger.info(f"Actividades promocion procesadas: {len(actividades_promocion)}")
            except Exception:
                logger.info("Actividades promocion procesadas: (no disponible)")
            
            # Mapear contacto principal a campos del modelo
            nombre_contacto = contacto_principal.get('nombre', '') or validated_data.pop('nombre_contacto', '')
            apellido_contacto = contacto_principal.get('apellido', '') or validated_data.pop('apellido_contacto', '')
            cargo_contacto = contacto_principal.get('cargo', '') or validated_data.pop('cargo_contacto', '')
            telefono_contacto = contacto_principal.get('telefono', '') or validated_data.pop('telefono_contacto', '')
            email_contacto = contacto_principal.get('email', '') or validated_data.pop('email_contacto', '')
            
            # Validar que los campos del contacto principal estén presentes
            if not nombre_contacto:
                raise serializers.ValidationError({'contacto_principal': {'nombre': ['Este campo es requerido.']}})
            if not apellido_contacto:
                raise serializers.ValidationError({'contacto_principal': {'apellido': ['Este campo es requerido.']}})
            if not cargo_contacto:
                raise serializers.ValidationError({'contacto_principal': {'cargo': ['Este campo es requerido.']}})
            if not telefono_contacto:
                raise serializers.ValidationError({'contacto_principal': {'telefono': ['Este campo es requerido.']}})
            if not email_contacto:
                raise serializers.ValidationError({'contacto_principal': {'email': ['Este campo es requerido.']}})
            
            # Establecer correo desde contacto principal
            validated_data['correo'] = email_contacto
            
            # Manejar rubros según el tipo de empresa
            tipo_empresa = validated_data.get('tipo_empresa', 'producto')
            
            if tipo_empresa == 'mixta':
                # Para empresas mixtas, usar los campos específicos
                rubro_prod = validated_data.get('rubro_producto', '')
                sub_rubro_prod = validated_data.get('sub_rubro_producto', '')
                rubro_serv = validated_data.get('rubro_servicio', '')
                sub_rubro_serv = validated_data.get('sub_rubro_servicio', '')
                
                # Construir descripción de actividad
                prod_desc = f"{rubro_prod}{' - ' + sub_rubro_prod if sub_rubro_prod else ''}".strip()
                serv_desc = f"{rubro_serv}{' - ' + sub_rubro_serv if sub_rubro_serv else ''}".strip()
                
                if prod_desc and serv_desc:
                    validated_data['descripcion_actividad'] = f"{prod_desc} / {serv_desc}"
                elif prod_desc:
                    validated_data['descripcion_actividad'] = prod_desc
                elif serv_desc:
                    validated_data['descripcion_actividad'] = serv_desc
                
                # También mantener rubro_principal y sub_rubro para compatibilidad
                if not validated_data.get('rubro_principal'):
                    validated_data['rubro_principal'] = f"{rubro_prod}{' / ' + rubro_serv if rubro_serv else ''}".strip()
                if not validated_data.get('sub_rubro'):
                    validated_data['sub_rubro'] = f"{sub_rubro_prod}{' / ' + sub_rubro_serv if sub_rubro_serv else ''}".strip() or None
            else:
                # Para empresas de producto o servicio únicos, usar rubro_principal y sub_rubro
                if not validated_data.get('descripcion_actividad'):
                    rubro = validated_data.get('rubro_principal', '')
                    sub_rubro = validated_data.get('sub_rubro', '')
                    validated_data['descripcion_actividad'] = f"{rubro}{' - ' + sub_rubro if sub_rubro else ''}".strip()
            
            # Guardar datos complejos en JSONFields
            validated_data['productos'] = productos
            validated_data['servicios_ofrecidos'] = servicios
            validated_data['actividades_promocion'] = actividades_promocion
            # Limitar contactos secundarios a máximo 2 (para tener hasta 3 contactos totales: 1 principal + 2 secundarios)
            validated_data['contactos_secundarios'] = contactos_secundarios[:2]

            # Procesar campo interes_exportar
            exporta_value = validated_data.get('exporta')
            if exporta_value and str(exporta_value).lower() in ['no', 'no, solo ventas nacionales', 'no, solo ventas locales']:
                # Solo procesar si NO exporta
                # El campo ya viene en validated_data del to_internal_value
                # pero aseguramos el valor correcto
                if 'interes_exportar' in self.initial_data:
                    interes_value = self.initial_data.get('interes_exportar')
                    if interes_value in ['si', 'Sí', True, 'true']:
                        validated_data['interes_exportar'] = True
                    elif interes_value in ['no', 'No', False, 'false']:
                        validated_data['interes_exportar'] = False
                    else:
                        validated_data['interes_exportar'] = None
            else:
                # Si exporta, no tiene sentido el campo interes_exportar
                validated_data['interes_exportar'] = None
            
            # Manejar catálogo PDF si viene
            if 'catalogo_pdf' in validated_data and validated_data['catalogo_pdf']:
                archivo = validated_data['catalogo_pdf']
                validated_data['catalogo_pdf_nombre'] = archivo.name if hasattr(archivo, 'name') else str(archivo)
            
            # Establecer campos del contacto
            validated_data['nombre_contacto'] = nombre_contacto
            validated_data['apellido_contacto'] = apellido_contacto
            validated_data['cargo_contacto'] = cargo_contacto
            validated_data['telefono_contacto'] = telefono_contacto
            validated_data['email_contacto'] = email_contacto
            
            # Crear usuario con transacción atómica
            from django.db import transaction
            from apps.geografia.models import Departamento, Municipio, Localidad
            from apps.empresas.models import Rubro, TipoEmpresa, Empresaproducto, Empresaservicio, EmpresaMixta
            
            with transaction.atomic():
                # Crear usuario
                usuario = User.objects.create_user(
                    email=email_contacto,
                    password=validated_data['cuit_cuil'],  # Contraseña inicial es el CUIT
                )
                
                # Asignar rol de Empresa
                try:
                    rol_empresa = RolUsuario.objects.get(nombre='Empresa')
                    usuario.rol = rol_empresa
                    # Marcar que debe cambiar la contraseña (es empresa con CUIT como password)
                    usuario.debe_cambiar_password = True
                    usuario.save()
                except RolUsuario.DoesNotExist:
                    logger.warning("Rol 'Empresa' no encontrado, usuario creado sin rol")
                
                # Crear solicitud con estado 'pendiente' hasta que admin apruebe
                # Remover 'estado' de validated_data si existe para evitar duplicado
                validated_data.pop('estado', None)
                solicitud = SolicitudRegistro.objects.create(**validated_data, estado='pendiente')
                solicitud.usuario_creado = usuario
                solicitud.save()
                
                # NO crear empresa aquí - solo se creará cuando admin apruebe
                # La empresa se creará en el método aprobar() del viewset
                # Los productos y servicios se guardan en el JSONField de la solicitud
                
                logger.info(f"Solicitud creada exitosamente: ID={solicitud.id}, Usuario={usuario.email}, Estado=pendiente")
                
                return solicitud
                
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error inesperado al crear solicitud de registro: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'non_field_errors': [f'Error al procesar el registro: {str(e)}']
            })


class SolicitudRegistroUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar solicitudes de registro por el usuario"""
    
    # Campos adicionales del formulario
    contacto_principal = serializers.DictField(write_only=True, required=False)
    contactos_secundarios = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    productos = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    servicios = serializers.DictField(required=False, allow_null=True)
    actividades_promocion = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = SolicitudRegistro
        fields = [
            'nombre_fantasia', 'tipo_sociedad', 'direccion', 'codigo_postal',
            'direccion_comercial', 'codigo_postal_comercial', 'departamento', 'municipio', 'localidad', 'geolocalizacion',
            'telefono', 'sitioweb', 'rubro_principal', 'sub_rubro', 'descripcion_actividad',
            'productos', 'servicios', 'contacto_principal', 'contactos_secundarios',
            'actividades_promocion', 'instagram', 'facebook', 'linkedin',
            'exporta', 'destino_exportacion', 'importa', 'tipo_importacion',
            'certificado_pyme', 'certificaciones', 'material_promocional_idiomas',
            'idiomas_trabajo', 'observaciones', 'nombre_contacto', 'cargo_contacto', 'telefono_contacto',
        ]
        read_only_fields = [
            'id', 'razon_social', 'cuit_cuil', 'correo', 'email_contacto',
            'fecha_creacion', 'fecha_actualizacion', 'token_confirmacion',
            'email_confirmado', 'fecha_confirmacion', 'estado', 'usuario_creado'
        ]
    
    def validate_telefono_contacto(self, value):
        """Validar telefono_contacto solo si se proporciona y no está vacío"""
        if value is not None:
            value_str = str(value).strip()
            # Si viene vacío, lanzar error (el teléfono es obligatorio)
            if value_str == '':
                raise serializers.ValidationError('Este campo no puede estar en blanco.')
            return value_str
        # Si es None, permitir que pase (el campo no se actualizará, mantendrá el existente)
        return value
    
    def validate_nombre_contacto(self, value):
        """Validar nombre_contacto solo si se proporciona y no está vacío"""
        if value is not None:
            value_str = str(value).strip()
            # Si viene vacío, lanzar error (el nombre es obligatorio)
            if value_str == '':
                raise serializers.ValidationError('Este campo no puede estar en blanco.')
            return value_str
        # Si es None, permitir que pase (el campo no se actualizará, mantendrá el existente)
        return value
    
    def update(self, instance, validated_data):
        """Actualizar solicitud con datos del formulario"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Extraer datos anidados
            contacto_principal = validated_data.pop('contacto_principal', None)
            contactos_secundarios = validated_data.pop('contactos_secundarios', None)
            productos = validated_data.pop('productos', None)
            servicios = validated_data.pop('servicios', None)
            actividades_promocion = validated_data.pop('actividades_promocion', None)
            
            # Actualizar contacto principal si se proporciona
            if contacto_principal:
                nombre = contacto_principal.get('nombre')
                cargo = contacto_principal.get('cargo')
                telefono = contacto_principal.get('telefono')
                
                # Validar y actualizar teléfono - SIEMPRE debe venir un teléfono válido
                telefono_actualizado = None
                
                if telefono is not None and str(telefono).strip() != '':
                    telefono_limpio = str(telefono).strip()
                    telefono_actualizado = telefono_limpio
                elif 'telefono_contacto' in validated_data:
                    # Si viene telefono_contacto directamente en validated_data
                    telefono_directo = validated_data.pop('telefono_contacto')
                    if telefono_directo is not None:
                        telefono_str = str(telefono_directo).strip()
                        if telefono_str != '':
                            telefono_actualizado = telefono_str
                        # Si viene vacío, mantener el existente (no hacer nada)
                    # Si viene None, mantener el existente (no hacer nada)
                
                # Si tenemos un teléfono actualizado, usarlo; si no, mantener el existente
                if telefono_actualizado:
                    instance.telefono_contacto = telefono_actualizado
                # Si no se proporciona teléfono válido, mantener el existente (no hacer nada)
                
                # Validar y actualizar nombre
                if nombre is not None and str(nombre).strip() != '':
                    nombre_limpio = str(nombre).strip()
                    instance.nombre_contacto = nombre_limpio
                elif 'nombre_contacto' in validated_data:
                    nombre_directo = validated_data.pop('nombre_contacto')
                    if nombre_directo and str(nombre_directo).strip() != '':
                        nombre_limpio = str(nombre_directo).strip()
                        instance.nombre_contacto = nombre_limpio
                    # Si viene vacío, mantener el existente (ya lo removimos de validated_data)
                
                # Validar y actualizar apellido
                apellido = contacto.get('apellido') if contacto else None
                if apellido is not None:
                    instance.apellido_contacto = str(apellido).strip()
                elif 'apellido_contacto' in validated_data:
                    apellido_directo = validated_data.pop('apellido_contacto')
                    if apellido_directo:
                        instance.apellido_contacto = str(apellido_directo).strip()
                
                # Cargo es opcional
                if cargo is not None:
                    instance.cargo_contacto = str(cargo).strip()
                elif 'cargo_contacto' in validated_data:
                    cargo_directo = validated_data.pop('cargo_contacto')
                    if cargo_directo:
                        instance.cargo_contacto = str(cargo_directo).strip()
                    # Si viene vacío, mantener el existente
                
                # email_contacto es read-only, no se puede cambiar
            else:
                # Si no viene contacto_principal pero vienen los campos directamente
                if 'telefono_contacto' in validated_data:
                    telefono_directo = validated_data.pop('telefono_contacto')
                    if telefono_directo and str(telefono_directo).strip() != '':
                        telefono_limpio = str(telefono_directo).strip()
                        instance.telefono_contacto = telefono_limpio
                    # Si viene vacío, mantener el existente (ya lo removimos de validated_data)
                
                if 'nombre_contacto' in validated_data:
                    nombre_directo = validated_data.pop('nombre_contacto')
                    if nombre_directo and str(nombre_directo).strip() != '':
                        nombre_limpio = str(nombre_directo).strip()
                        instance.nombre_contacto = nombre_limpio
                    # Si viene vacío, mantener el existente (ya lo removimos de validated_data)
                
                if 'cargo_contacto' in validated_data:
                    cargo_directo = validated_data.pop('cargo_contacto')
                    if cargo_directo and str(cargo_directo).strip() != '':
                        instance.cargo_contacto = str(cargo_directo).strip()
                    # Si viene vacío, mantener el existente (ya lo removimos de validated_data)
            
            # Actualizar contactos secundarios
            if contactos_secundarios is not None:
                instance.contactos_secundarios = contactos_secundarios
            
            # Actualizar productos
            if productos is not None:
                instance.productos = productos
            
            # Actualizar servicios
            if servicios is not None:
                instance.servicios_ofrecidos = servicios if isinstance(servicios, dict) else {}
            
            # Actualizar actividades de promoción
            if actividades_promocion is not None:
                instance.actividades_promocion = actividades_promocion
            
            # Actualizar campos simples (excluyendo los que ya procesamos)
            campos_excluidos = ['telefono_contacto', 'nombre_contacto', 'cargo_contacto']
            for attr, value in validated_data.items():
                if attr not in campos_excluidos:
                    # Validar teléfono de la empresa (no puede estar vacío)
                    if attr == 'telefono':
                        if value is not None:
                            value_str = str(value).strip()
                            if not value_str:
                                # Si viene vacío, mantener el existente (no actualizar)
                                continue
                            value = value_str
                        else:
                            # Si es None, mantener el existente (no actualizar)
                            continue
                    
                    # Validar y formatear URL para sitioweb
                    if attr == 'sitioweb' and value:
                        value = str(value).strip()
                        if value and value != 'null' and value.lower() != 'null':
                            # Si no empieza con http:// o https://, agregarlo
                            if not (value.startswith('http://') or value.startswith('https://')):
                                value = f'https://{value}'
                            setattr(instance, attr, value)
                        else:
                            setattr(instance, attr, None)
                    else:
                        setattr(instance, attr, value)
            
            instance.save()
            logger.info(f"Solicitud actualizada: ID={instance.id}, Usuario={instance.usuario_creado.email if instance.usuario_creado else 'No creado'}")
            
            return instance
        except Exception as e:
            logger.error(f"Error al actualizar solicitud: {str(e)}", exc_info=True)
            raise
