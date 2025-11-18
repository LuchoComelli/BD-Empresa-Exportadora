from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.core.validators import RegexValidator

class TimestampedModel(models.Model):
    """
    Modelo base para todos los modelos que necesiten auditoría temporal
    """
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")
    creado_por = models.ForeignKey(
        'core.Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)s_creados',
        verbose_name="Creado por"
    )
    actualizado_por = models.ForeignKey(
        'core.Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)s_actualizados',
        verbose_name="Actualizado por"
    )
    
    class Meta:
        abstract = True

class SoftDeleteModel(models.Model):
    """
    Modelo base para soft delete
    """
    eliminado = models.BooleanField(default=False, verbose_name="Eliminado")
    fecha_eliminacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Eliminación")
    eliminado_por = models.ForeignKey(
        'core.Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Eliminado por"
    )
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        self.eliminado = True
        self.fecha_eliminacion = timezone.now()
        self.save(using=using)
    
    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)

class RolUsuario(models.Model):
    """
    Modelo para roles de usuarios del sistema
    """
    nombre = models.CharField(max_length=50, unique=True, verbose_name="Nombre del Rol")
    descripcion = models.TextField(verbose_name="Descripción")
    
    # Permisos específicos
    puede_crear_empresas = models.BooleanField(default=False, verbose_name="Puede Crear Empresas")
    puede_editar_empresas = models.BooleanField(default=False, verbose_name="Puede Editar Empresas")
    puede_eliminar_empresas = models.BooleanField(default=False, verbose_name="Puede Eliminar Empresas")
    puede_ver_auditoria = models.BooleanField(default=False, verbose_name="Puede Ver Auditoría")
    puede_exportar_datos = models.BooleanField(default=True, verbose_name="Puede Exportar Datos")
    puede_importar_datos = models.BooleanField(default=False, verbose_name="Puede Importar Datos")
    puede_gestionar_usuarios = models.BooleanField(default=False, verbose_name="Puede Gestionar Usuarios")
    puede_acceder_admin = models.BooleanField(default=False, verbose_name="Puede Acceder al Admin")
    
    # Nivel de acceso
    nivel_acceso = models.IntegerField(
        choices=[
            (1, 'Consulta'),
            (2, 'Analista'),
            (3, 'Administrador'),
        ],
        default=1,
        verbose_name="Nivel de Acceso"
    )
    
    activo = models.BooleanField(default=True, verbose_name="Activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    
    class Meta:
        db_table = 'rol_usuario'
        verbose_name = 'Rol de Usuario'
        verbose_name_plural = 'Roles de Usuario'
        ordering = ['nivel_acceso', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} (Nivel {self.nivel_acceso})"

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        # Crear rol de administrador si no existe
        from apps.core.models import RolUsuario
        rol_admin, _ = RolUsuario.objects.get_or_create(
            nombre='Administrador',
            defaults={
                'descripcion': 'Acceso completo al sistema',
                'puede_crear_empresas': True,
                'puede_editar_empresas': True,
                'puede_eliminar_empresas': True,
                'puede_ver_auditoria': True,
                'puede_exportar_datos': True,
                'puede_importar_datos': True,
                'puede_gestionar_usuarios': True,
                'puede_acceder_admin': True,
                'nivel_acceso': 3,
                'activo': True
            }
        )
        extra_fields.setdefault('rol', rol_admin)
        
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado con sistema de roles
    """
    # Campos básicos
    email = models.EmailField(unique=True, verbose_name="Email")
    nombre = models.CharField(max_length=50, verbose_name="Nombre")
    apellido = models.CharField(max_length=50, verbose_name="Apellido")
    
    # Sistema de roles
    rol = models.ForeignKey(
        RolUsuario, 
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Rol del Usuario",
        help_text="Rol que determina los permisos del usuario"
    )
    
    # Campos de estado
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    is_staff = models.BooleanField(default=False, verbose_name="Es Staff")
    is_superuser = models.BooleanField(default=False, verbose_name="Es Superusuario")
    
    # Campos de fecha
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Registro")
    last_login = models.DateTimeField(blank=True, null=True, verbose_name="Último Acceso")
    
    # Campos adicionales
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono",
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Formato de teléfono inválido"
        )]
    )
    avatar = models.ImageField(
        upload_to='avatars/', 
        blank=True, 
        null=True, 
        verbose_name="Avatar"
    )
    
    # Campos adicionales importantes
    fecha_nacimiento = models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento")
    genero = models.CharField(
        max_length=1,
        choices=[('M', 'Masculino'), ('F', 'Femenino'), ('O', 'Otro')],
        blank=True,
        null=True,
        verbose_name="Género"
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=[('DNI', 'DNI'), ('PAS', 'Pasaporte'), ('LE', 'Libreta de Enrolamiento')],
        default='DNI',
        verbose_name="Tipo de Documento"
    )
    numero_documento = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Número de Documento"
    )
    fecha_ultimo_acceso = models.DateTimeField(blank=True, null=True, verbose_name="Último Acceso")
    intentos_login_fallidos = models.PositiveIntegerField(default=0, verbose_name="Intentos de Login Fallidos")
    bloqueado_hasta = models.DateTimeField(blank=True, null=True, verbose_name="Bloqueado Hasta")
    
    # Ubicación del usuario (compartida con empresas)
    departamento = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Departamento"
    )
    municipio = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Municipio"
    )
    localidad = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Localidad"
    )
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido']
    
    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
    
    def __str__(self):
        rol_nombre = self.rol.nombre if self.rol else 'Sin rol'
        return f"{self.nombre} {self.apellido} ({self.email}) - {rol_nombre}"
    
    def get_full_name(self):
        return f"{self.nombre} {self.apellido}"
    
    def get_short_name(self):
        return self.nombre
    
    def has_perm(self, perm, obj=None):
        """
        Verificar si el usuario tiene un permiso específico
        """
        if self.is_superuser:
            return True
        
        if not self.rol:
            return False
        
        # Verificar permisos basados en el rol
        if perm == 'empresas.add_empresaproducto':
            return self.rol.puede_crear_empresas
        elif perm == 'empresas.change_empresaproducto':
            return self.rol.puede_editar_empresas
        elif perm == 'empresas.delete_empresaproducto':
            return self.rol.puede_eliminar_empresas
        elif perm == 'auditoria.view_auditorialog':
            return self.rol.puede_ver_auditoria
        elif perm == 'empresas.export_data':
            return self.rol.puede_exportar_datos
        elif perm == 'empresas.import_data':
            return self.rol.puede_importar_datos
        elif perm == 'core.add_usuario':
            return self.rol.puede_gestionar_usuarios
        
        return super().has_perm(perm, obj)

class Dpto(models.Model):
    """
    Modelo para departamentos (usando datos de dpto.csv)
    """
    coddpto = models.CharField(max_length=10, unique=True, verbose_name="Código Departamento")
    nomdpto = models.CharField(max_length=100, verbose_name="Nombre del Departamento")
    codprov = models.CharField(max_length=10, verbose_name="Código Provincia")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'dpto'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['nomdpto']
    
    def __str__(self):
        return self.nomdpto

class Municipio(models.Model):
    """
    Modelo para municipios (usando datos de municipio.csv)
    """
    codmun = models.CharField(max_length=10, unique=True, verbose_name="Código Municipio")
    nommun = models.CharField(max_length=100, verbose_name="Nombre del Municipio")
    coddpto = models.CharField(max_length=10, verbose_name="Código Departamento")
    codprov = models.CharField(max_length=10, verbose_name="Código Provincia")
    dpto = models.ForeignKey(Dpto, on_delete=models.CASCADE, related_name='municipios')
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'municipio'
        verbose_name = 'Municipio'
        verbose_name_plural = 'Municipios'
        ordering = ['nommun']
    
    def __str__(self):
        return f"{self.nommun} - {self.dpto.nomdpto}"

class Localidades(models.Model):
    """
    Modelo para localidades (usando datos de localidades.csv)
    """
    codloc = models.CharField(max_length=20, unique=True, verbose_name="Código Localidad")
    codlocsv = models.CharField(max_length=10, verbose_name="Código Localidad SV")
    nomloc = models.CharField(max_length=100, verbose_name="Nombre de la Localidad")
    codmun = models.CharField(max_length=10, verbose_name="Código Municipio")
    coddpto = models.CharField(max_length=10, verbose_name="Código Departamento")
    codprov = models.CharField(max_length=10, verbose_name="Código Provincia")
    codpais = models.CharField(max_length=10, verbose_name="Código País")
    latitud = models.DecimalField(max_digits=10, decimal_places=8, verbose_name="Latitud")
    longitud = models.DecimalField(max_digits=11, decimal_places=8, verbose_name="Longitud")
    codpos = models.CharField(max_length=10, verbose_name="Código Postal")
    municipio = models.ForeignKey(Municipio, on_delete=models.CASCADE, related_name='localidades')
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'localidades'
        verbose_name = 'Localidad'
        verbose_name_plural = 'Localidades'
        ordering = ['nomloc']
    
    def __str__(self):
        return f"{self.nomloc} - {self.municipio.nommun}"


class ConfiguracionSistema(TimestampedModel):
    """
    Modelo singleton para almacenar la configuración general del sistema
    Solo debe existir una instancia de este modelo
    """
    nombre_sistema = models.CharField(
        max_length=200,
        default="Sistema de Gestión de Empresas Exportadoras",
        verbose_name="Nombre del Sistema"
    )
    institucion = models.CharField(
        max_length=200,
        default="Dirección de Intercambio Comercial Internacional y Regional - Catamarca",
        verbose_name="Institución"
    )
    email_contacto = models.EmailField(
        default="contacto@catamarca.gob.ar",
        verbose_name="Email de Contacto"
    )
    telefono = models.CharField(
        max_length=50,
        default="+54 383 4123456",
        verbose_name="Teléfono"
    )
    direccion = models.CharField(
        max_length=255,
        default="San Martín 320, San Fernando del Valle de Catamarca",
        verbose_name="Dirección"
    )
    paises_destino = models.IntegerField(
        default=12,
        verbose_name="Países de Destino"
    )
    valor_exportado = models.CharField(
        max_length=50,
        default="$2.5M",
        verbose_name="Valor Exportado"
    )
    # Beneficios
    beneficio1_titulo = models.CharField(
        max_length=200,
        default="Evaluación de Perfil Exportador",
        verbose_name="Beneficio 1 - Título"
    )
    beneficio1_descripcion = models.TextField(
        default="Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación",
        verbose_name="Beneficio 1 - Descripción"
    )
    beneficio2_titulo = models.CharField(
        max_length=200,
        default="Acceso a Mercados Internacionales",
        verbose_name="Beneficio 2 - Título"
    )
    beneficio2_descripcion = models.TextField(
        default="Conecta con oportunidades de exportación y participa en ferias internacionales",
        verbose_name="Beneficio 2 - Descripción"
    )
    beneficio3_titulo = models.CharField(
        max_length=200,
        default="Capacitación y Asesoramiento",
        verbose_name="Beneficio 3 - Título"
    )
    beneficio3_descripcion = models.TextField(
        default="Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora",
        verbose_name="Beneficio 3 - Descripción"
    )
    
    class Meta:
        db_table = 'configuracion_sistema'
        verbose_name = 'Configuración del Sistema'
        verbose_name_plural = 'Configuraciones del Sistema'
    
    def __str__(self):
        return f"Configuración: {self.nombre_sistema}"
    
    @classmethod
    def get_config(cls):
        """Obtener o crear la configuración del sistema (singleton)"""
        config, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'nombre_sistema': 'Sistema de Gestión de Empresas Exportadoras',
                'institucion': 'Dirección de Intercambio Comercial Internacional y Regional - Catamarca',
                'email_contacto': 'contacto@catamarca.gob.ar',
                'telefono': '+54 383 4123456',
                'direccion': 'San Martín 320, San Fernando del Valle de Catamarca',
                'paises_destino': 12,
                'valor_exportado': '$2.5M',
                'beneficio1_titulo': 'Evaluación de Perfil Exportador',
                'beneficio1_descripcion': 'Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación',
                'beneficio2_titulo': 'Acceso a Mercados Internacionales',
                'beneficio2_descripcion': 'Conecta con oportunidades de exportación y participa en ferias internacionales',
                'beneficio3_titulo': 'Capacitación y Asesoramiento',
                'beneficio3_descripcion': 'Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora',
            }
        )
        return config
    
    def save(self, *args, **kwargs):
        """Asegurar que solo exista una instancia"""
        self.pk = 1
        super().save(*args, **kwargs)