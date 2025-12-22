from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import RolUsuario, ConfiguracionSistema
from apps.geografia.models import Departamento, Municipio, Localidad


User = get_user_model()


class RolUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para roles de usuario"""
    
    class Meta:
        model = RolUsuario
        fields = [
            'id', 'nombre', 'descripcion',
            'puede_crear_empresas', 'puede_editar_empresas',
            'puede_eliminar_empresas', 'puede_ver_auditoria',
            'puede_exportar_datos', 'puede_importar_datos',
            'puede_gestionar_usuarios', 'puede_acceder_admin',
            'puede_ver_usuarios', 'puede_ver_configuracion',
            'puede_aprobar_empresas', 'puede_ver_empresas_pendientes',
            'puede_ver_reportes', 'puede_ver_mapa', 'puede_ver_matriz',
            'nivel_acceso', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para usar email en lugar de username"""
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cambiar el campo username por email
        # El frontend envía 'username' pero debe contener el email
        self.fields['username'] = serializers.EmailField(required=True)
        self.fields['username'].label = 'Email'
        self.fields['username'].help_text = 'Ingrese su email'
        # Asegurar que el username_field esté configurado correctamente
        self.username_field = 'email'
        # No requerir el campo 'email' directamente ya que usamos 'username'
        if 'email' in self.fields:
            self.fields['email'] = serializers.EmailField(required=False)
    
    def validate(self, attrs):
        import logging
        from django.contrib.auth import authenticate
        
        logger = logging.getLogger(__name__)
        
        # El frontend envía 'email' pero el serializer puede recibir 'username' o 'email'
        # Como username_field = 'email', necesitamos mapear ambos casos
        email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        # Si el frontend envió 'username', mapearlo a 'email' para el serializer padre
        if 'username' in attrs and 'email' not in attrs:
            attrs['email'] = attrs.pop('username')
        
        email = attrs.get('email')
        
        logger.info(f"Intento de login con email: {email}")
        
        if not email:
            logger.error("No se proporcionó email en el login")
            raise serializers.ValidationError({
                'username': ['El email es obligatorio.']
            })
        
        if not password:
            logger.error("No se proporcionó contraseña en el login")
            raise serializers.ValidationError({
                'password': ['La contraseña es obligatoria.']
            })
        
        # Buscar usuario por email
        try:
            user = User.objects.get(email=email)
            logger.info(f"Usuario encontrado: {user.email}, activo: {user.is_active}")
            
            # Verificar que el usuario esté activo
            if not user.is_active:
                logger.warning(f"Intento de login con usuario inactivo: {email}")
                raise serializers.ValidationError({
                    'email': ['Este usuario está inactivo.']
                })
            
            # Verificar estado de la solicitud de registro si el usuario tiene una
            # Envolver en try-except para evitar errores si hay problemas con la tabla
            try:
                from apps.registro.models import SolicitudRegistro
                solicitud = SolicitudRegistro.objects.filter(usuario_creado=user).first()
                if solicitud:
                    if solicitud.estado == 'pendiente':
                        logger.warning(f"Intento de login con solicitud pendiente: {email}")
                        raise serializers.ValidationError({
                            'email': ['Tu solicitud de registro está pendiente de aprobación. Recibirás un email cuando sea aprobada.']
                        })
                    elif solicitud.estado == 'rechazada':
                        logger.warning(f"Intento de login con solicitud rechazada: {email}")
                        raise serializers.ValidationError({
                            'email': ['Tu solicitud de registro fue rechazada. Por favor, contacta con el administrador.']
                        })
            except serializers.ValidationError:
                # Re-lanzar errores de validación (pendiente/rechazada)
                raise
            except Exception as e:
                # Si hay un error al consultar SolicitudRegistro (ej: migraciones pendientes),
                # registrar el error pero continuar con el login
                logger.warning(f"Error al verificar solicitud de registro para {email}: {str(e)}")
                # Continuar con el proceso de autenticación
            
            # Autenticar usando authenticate() que usa USERNAME_FIELD = 'email'
            # authenticate() busca por el campo USERNAME_FIELD automáticamente
            authenticated_user = authenticate(
                request=self.context.get('request'),
                username=user.email,  # Usar email como username
                password=password
            )
            
            if not authenticated_user:
                logger.error(f"Contraseña incorrecta para usuario: {email}")
                # Verificar manualmente la contraseña para dar un mensaje más específico
                if not user.check_password(password):
                    raise serializers.ValidationError({
                        'password': ['Contraseña incorrecta.']
                    })
                else:
                    raise serializers.ValidationError({
                        'password': ['Error al autenticar. Por favor, intenta nuevamente.']
                    })
            
            if authenticated_user != user:
                logger.error(f"Usuario autenticado no coincide con el usuario buscado")
                raise serializers.ValidationError({
                    'password': ['Error al autenticar. Por favor, intenta nuevamente.']
                })
            
            # Asignar el usuario autenticado y el email para el serializer padre
            attrs['user'] = authenticated_user
            # El serializer padre espera que attrs tenga 'email' cuando username_field = 'email'
            attrs['email'] = authenticated_user.email
            
            logger.info(f"Login exitoso para usuario: {email}")
            
        except User.DoesNotExist:
            logger.error(f"Usuario no encontrado: {email}")
            raise serializers.ValidationError({
                'email': ['No se encontró un usuario con este email.']
            })
        except serializers.ValidationError:
            # Re-lanzar errores de validación sin modificar
            raise
        except Exception as e:
            logger.error(f"Error al buscar o autenticar usuario: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'email': ['Error al procesar la autenticación.']
            })
        
        # Generar tokens JWT directamente usando el usuario autenticado
        # El serializer padre TokenObtainPairSerializer tiene un método get_token()
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            
            # Generar el refresh token directamente
            refresh = RefreshToken.for_user(authenticated_user)
            
            # Crear los datos de respuesta con los tokens
            validated_data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            logger.info(f"Tokens generados exitosamente para usuario: {email}")
            return validated_data
            
        except Exception as e:
            logger.error(f"Error al generar tokens: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'password': ['Error al generar tokens de autenticación.']
            })


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para usuarios"""
    rol_detalle = RolUsuarioSerializer(source='rol', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    empresa = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'nombre', 'apellido', 'rol', 'rol_detalle',
            'is_active', 'is_staff', 'is_superuser', 'date_joined',
            'last_login', 'telefono', 'avatar', 'fecha_nacimiento',
            'genero', 'tipo_documento', 'numero_documento',
            'departamento', 'municipio', 'localidad', 'password',
            'debe_cambiar_password', 'empresa'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_empresa(self, obj):
        """Obtener la empresa asociada al usuario si existe"""
        try:
            from apps.empresas.models import Empresa
            empresa = Empresa.objects.filter(id_usuario=obj).select_related(
                "tipo_empresa", "id_rubro", "departamento", "municipio", "localidad"
            ).prefetch_related(
                "productos_empresa__posicion_arancelaria",
                "productos_mixta__posiciones_arancelarias",
                "servicios_empresa",
                "servicios_mixta"
            ).first()
            if empresa:
                # Usar el serializer de empresa para formatear los datos
                from apps.empresas.serializers import EmpresaSerializer
                serializer = EmpresaSerializer(empresa, context=self.context)
                return serializer.data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error obteniendo empresa para usuario {obj.id}: {str(e)}")
        return None
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            # Si es una empresa y cambió la contraseña, marcar que ya no debe cambiarla
            if instance.rol and instance.rol.nombre == 'Empresa' and instance.debe_cambiar_password:
                instance.debe_cambiar_password = False
        instance.save()
        return instance


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de usuarios"""
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    rol = serializers.IntegerField(source='rol.id', read_only=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nombre', 'apellido', 'rol', 'rol_nombre', 'is_active', 'last_login', 'date_joined']


class DptoSerializer(serializers.ModelSerializer):
    """Serializer para departamentos (usando modelo nuevo)"""
    
    class Meta:
        model = Departamento  # ✅ Ahora usa Departamento de geografia
        fields = ['id', 'nombre', 'nombre_completo', 'categoria', 'provincia']
        read_only_fields = ['id']


class MunicipioSerializer(serializers.ModelSerializer):
    """Serializer para municipios (usando modelo nuevo)"""
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    provincia_nombre = serializers.CharField(source='provincia.nombre', read_only=True)
    
    class Meta:
        model = Municipio  # ✅ Ahora usa Municipio de geografia
        fields = [
            'id', 'nombre', 'nombre_completo', 'categoria',
            'provincia', 'provincia_nombre', 
            'departamento', 'departamento_nombre'
        ]
        read_only_fields = ['id']


class LocalidadesSerializer(serializers.ModelSerializer):
    """Serializer para localidades (usando modelo nuevo)"""
    municipio_nombre = serializers.CharField(source='municipio.nombre', read_only=True, allow_null=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    provincia_nombre = serializers.CharField(source='provincia.nombre', read_only=True)
    
    class Meta:
        model = Localidad  # ✅ Ahora usa Localidad de geografia
        fields = [
            'id', 'nombre', 'categoria', 'tipo_asentamiento',
            'provincia', 'provincia_nombre',
            'departamento', 'departamento_nombre',
            'municipio', 'municipio_nombre'
        ]
        read_only_fields = ['id']


class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    """Serializer para configuración del sistema"""
    
    def validate(self, data):
        """Validar que los rangos de densidad sean consecutivos"""
        densidad_baja_max = data.get('densidad_baja_max', self.instance.densidad_baja_max if self.instance else 5)
        densidad_media_max = data.get('densidad_media_max', self.instance.densidad_media_max if self.instance else 20)
        densidad_alta_max = data.get('densidad_alta_max', self.instance.densidad_alta_max if self.instance else 40)
        
        # Validar que densidad_baja_max sea mayor que 0
        if densidad_baja_max < 1:
            raise serializers.ValidationError({
                'densidad_baja_max': 'La densidad baja debe ser al menos 1 empresa.'
            })
        
        # Validar que densidad_media_max sea mayor que densidad_baja_max
        if densidad_media_max <= densidad_baja_max:
            raise serializers.ValidationError({
                'densidad_media_max': f'La densidad media debe ser mayor que la densidad baja ({densidad_baja_max}).'
            })
        
        # Validar que densidad_alta_max sea mayor que densidad_media_max
        if densidad_alta_max <= densidad_media_max:
            raise serializers.ValidationError({
                'densidad_alta_max': f'La densidad alta debe ser mayor que la densidad media ({densidad_media_max}).'
            })
        
        densidad_muy_alta_min = data.get('densidad_muy_alta_min', self.instance.densidad_muy_alta_min if self.instance else 41)
        
        # Validar que densidad_muy_alta_min sea mayor que densidad_alta_max
        if densidad_muy_alta_min <= densidad_alta_max:
            raise serializers.ValidationError({
                'densidad_muy_alta_min': f'La densidad muy alta debe ser mayor que la densidad alta ({densidad_alta_max}).'
            })
        
        return data
    
    class Meta:
        model = ConfiguracionSistema
        fields = [
            'id', 'nombre_sistema', 'institucion', 
            'email_contacto', 'telefono', 'direccion',
            'paises_destino', 'valor_exportado',
            'beneficio1_titulo', 'beneficio1_descripcion',
            'beneficio2_titulo', 'beneficio2_descripcion',
            'beneficio3_titulo', 'beneficio3_descripcion',
            'densidad_baja_max', 'densidad_media_max', 'densidad_alta_max', 'densidad_muy_alta_min',
            'fecha_creacion', 'fecha_actualizacion',
            'creado_por', 'actualizado_por'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'creado_por', 'actualizado_por']
