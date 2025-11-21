from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from apps.core.models import Usuario, Dpto, Municipio, Localidades, TimestampedModel
import re
from datetime import datetime

def generar_nombre_catalogo(instance, filename):
    """
    Genera un nombre personalizado para el catálogo PDF
    Formato: catalogo-{nombre-empresa}-MM-YYYY.pdf
    """
    # Obtener la razón social de la empresa
    razon_social = instance.razon_social if hasattr(instance, 'razon_social') else 'empresa'
    
    # Limpiar el nombre: eliminar caracteres especiales, espacios, acentos
    nombre_limpio = razon_social.lower()
    # Reemplazar espacios y caracteres especiales con guiones
    nombre_limpio = re.sub(r'[^a-z0-9]+', '-', nombre_limpio)
    # Eliminar guiones al inicio y final
    nombre_limpio = nombre_limpio.strip('-')
    # Limitar longitud a 50 caracteres para evitar nombres muy largos
    nombre_limpio = nombre_limpio[:50]
    
    # Obtener fecha actual en formato MM-YYYY
    fecha_actual = datetime.now()
    fecha_formato = fecha_actual.strftime('%m-%Y')
    
    # Obtener extensión del archivo original
    extension = filename.split('.')[-1] if '.' in filename else 'pdf'
    
    # Generar nombre final
    nombre_final = f"catalogo-{nombre_limpio}-{fecha_formato}.{extension}"
    
    # Retornar ruta con estructura de carpetas por año/mes
    return f"catalogos/{fecha_actual.year}/{fecha_actual.month:02d}/{nombre_final}"


class TipoEmpresa(models.Model):
    """
    Modelo para tipos de empresa
    """
    nombre = models.CharField(max_length=50, unique=True, verbose_name="Nombre del Tipo")
    descripcion = models.TextField(verbose_name="Descripción")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'tipo_empresa'
        verbose_name = 'Tipo de Empresa'
        verbose_name_plural = 'Tipos de Empresa'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre

class Rubro(models.Model):
    """
    Modelo para rubros de empresas (PERTENECE A EMPRESAS)
    BASADO EN UNIDADES DE MEDIDA POR RUBRO.pdf
    """
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Rubro")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('producto', 'Producto'),
            ('servicio', 'Servicio'),
            ('mixto', 'Mixto'),
            ('otro', 'Otro'),
        ],
        default='producto',
        verbose_name="Tipo de Rubro"
    )
    
    # UNIDAD DE MEDIDA ESTÁNDAR POR RUBRO (basado en PDF)
    unidad_medida_estandar = models.CharField(
        max_length=20,
        choices=[
            ('tn', 'Toneladas (tn)'),
            ('kg', 'Kilogramos (kg)'),
            ('lts', 'Litros (lts)'),
            ('u', 'Unidades (u)'),
            ('na', 'N/A (No aplica)'),
        ],
        default='kg',
        verbose_name="Unidad de Medida Estándar",
        help_text="Unidad de medida estándar para este rubro según clasificación oficial"
    )
    
    activo = models.BooleanField(default=True, verbose_name="Activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="Orden de Visualización")
    
    class Meta:
        db_table = 'rubro'
        verbose_name = 'Rubro'
        verbose_name_plural = 'Rubros'
        ordering = ['orden', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"

class SubRubro(models.Model):
    """
    Modelo para sub-rubros relacionados con rubros
    """
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Sub-Rubro")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    rubro = models.ForeignKey(
        Rubro,
        on_delete=models.CASCADE,
        related_name='subrubros',
        verbose_name="Rubro"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")
    orden = models.PositiveIntegerField(default=0, verbose_name="Orden de Visualización")
    
    class Meta:
        db_table = 'subrubro'
        verbose_name = 'Sub-Rubro'
        verbose_name_plural = 'Sub-Rubros'
        ordering = ['rubro__orden', 'rubro__nombre', 'orden', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.rubro.nombre})"

class UnidadMedida(models.Model):
    """
    Modelo para unidades de medida (PERTENECE A EMPRESAS)
    """
    nombre = models.CharField(max_length=50, verbose_name="Nombre de la Unidad")
    simbolo = models.CharField(max_length=10, verbose_name="Símbolo")
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('peso', 'Peso'),
            ('volumen', 'Volumen'),
            ('longitud', 'Longitud'),
            ('unidad', 'Unidad'),
            ('otro', 'Otro'),
        ],
        verbose_name="Tipo de Unidad"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'unidad_medida'
        verbose_name = 'Unidad de Medida'
        verbose_name_plural = 'Unidades de Medida'
        ordering = ['tipo', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.simbolo})"

class Otrorubro(models.Model):
    """
    Modelo para rubros adicionales (PERTENECE A EMPRESAS)
    """
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Rubro")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        db_table = 'otrorubro'
        verbose_name = 'Otro Rubro'
        verbose_name_plural = 'Otros Rubros'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre

# Modelo unificado para todas las empresas
class Empresa(TimestampedModel):
    """
    Modelo unificado para todas las empresas (producto, servicio, mixta)
    Reemplaza las tablas separadas Empresaproducto, Empresaservicio, EmpresaMixta
    """
    # Campos básicos obligatorios
    razon_social = models.CharField(max_length=150, verbose_name="Razón Social")
    cuit_cuil = models.CharField(
        unique=True, 
        max_length=11, 
        verbose_name="CUIT/CUIL",
        validators=[RegexValidator(
            regex=r'^\d{11}$',
            message="CUIT debe tener exactamente 11 dígitos"
        )]
    )
    direccion = models.CharField(max_length=255, verbose_name="Dirección")
    
    # Ubicación (usando modelos compartidos)
    departamento = models.ForeignKey(
        Dpto, 
        on_delete=models.PROTECT, 
        verbose_name="Departamento"
    )
    municipio = models.ForeignKey(
        Municipio, 
        on_delete=models.PROTECT, 
        blank=True, 
        null=True,
        verbose_name="Municipio"
    )
    localidad = models.ForeignKey(
        Localidades, 
        on_delete=models.PROTECT, 
        blank=True, 
        null=True,
        verbose_name="Localidad"
    )
    geolocalizacion = models.CharField(max_length=2083, blank=True, null=True, verbose_name="Geolocalización")
    
    # Campos de contacto básicos
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono Principal",
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Formato de teléfono inválido"
        )]
    )
    correo = models.EmailField(max_length=254, blank=True, null=True, verbose_name="Correo Electrónico Principal")
    sitioweb = models.URLField(max_length=200, blank=True, null=True, verbose_name="Sitio Web")
    
    # SISTEMA DE EMAILS SIMPLIFICADO - MEJOR UX
    email_secundario = models.EmailField(
        max_length=254, 
        blank=True, 
        null=True, 
        verbose_name="Email Secundario",
        help_text="Email adicional de la empresa (opcional)"
    )
    email_terciario = models.EmailField(
        max_length=254, 
        blank=True, 
        null=True, 
        verbose_name="Email Terciario",
        help_text="Tercer email de la empresa (opcional)"
    )
    
    # SISTEMA DE CONTACTOS SIMPLIFICADO - MEJOR UX
    contacto_principal_nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre del Contacto Principal",
        help_text="Nombre del contacto principal de la empresa (OBLIGATORIO)"
    )
    contacto_principal_cargo = models.CharField(
        max_length=100,
        verbose_name="Cargo del Contacto Principal",
        help_text="Cargo del contacto principal (OBLIGATORIO)"
    )
    contacto_principal_telefono = models.CharField(
        max_length=20,
        verbose_name="Teléfono del Contacto Principal",
        help_text="Teléfono del contacto principal (OBLIGATORIO)",
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Formato de teléfono inválido"
        )]
    )
    contacto_principal_email = models.EmailField(
        max_length=254,
        verbose_name="Email del Contacto Principal",
        help_text="Email del contacto principal (OBLIGATORIO)"
    )
    
    # Contacto secundario (opcional)
    contacto_secundario_nombre = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Nombre del Contacto Secundario"
    )
    contacto_secundario_cargo = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Cargo del Contacto Secundario"
    )
    contacto_secundario_telefono = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Teléfono del Contacto Secundario",
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Formato de teléfono inválido"
        )]
    )
    contacto_secundario_email = models.EmailField(
        max_length=254, 
        blank=True, 
        null=True, 
        verbose_name="Email del Contacto Secundario"
    )
    
    # Campos de exportación (opcionales) - SISTEMA SIMPLIFICADO OPTIMIZADO
    exporta = models.CharField(
        max_length=50,
        choices=[
            ("Sí", "Sí"),
            ("No, solo ventas nacionales", "No, solo ventas nacionales"),
            ("No, solo ventas locales", "No, solo ventas locales"),
        ],
        blank=True,
        null=True,
        verbose_name="¿La Empresa Exporta?",
        help_text="Seleccione el tipo de ventas que realiza la empresa"
    )
    destinoexporta = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Destinos de Exportación",
        help_text="Si exporta, indique los destinos. Si son varios, sepárelos por comas."
    )
    tipoexporta = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Tipo de Exportación",
        choices=[
            ('Directa', 'Directa'),
            ('Terceros', 'A través de Terceros'),
            ('Mixta', 'Mixta'),
        ]
    )
    interes_exportar = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Está Interesada en Comenzar a Exportar?",
        help_text="Marque si la empresa está interesada en comenzar a exportar"
    )
    
    # Campos de importación (opcionales) - SISTEMA SIMPLIFICADO OPTIMIZADO
    importa = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿La Empresa Realiza Importaciones?",
        help_text="Marque si la empresa realiza importaciones"
    )
    tipoimporta = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Tipos de Importación",
        help_text="Si importa, indique los tipos. Si son varios, sepárelos por comas."
    )
    otrasimportaciones = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Otras Importaciones",
        help_text="Si seleccionó 'Otros' en tipos de importación, detalle cuáles"
    )
    frecuenciaimporta = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Frecuencia de Importación",
        choices=[
            ('Mensual', 'Mensual'),
            ('Anual', 'Anual'),
            ('Ocasional', 'De manera ocasional'),
            ('Nunca', 'Nunca realicé importaciones'),
        ]
    )
    
    # Campos de certificaciones (opcionales) - SISTEMA SIMPLIFICADO CON ARCHIVOS
    certificadopyme = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Posee Certificado MiPYME?",
        help_text="Marque si la empresa posee certificado MiPYME"
    )
    certificacionesbool = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Posee Certificaciones Internacionales?",
        help_text="Marque si la empresa posee certificaciones internacionales"
    )
    certificaciones = models.CharField(
        max_length=300, 
        blank=True, 
        null=True, 
        verbose_name="Detalle de Certificaciones",
        help_text="Si posee certificaciones, detalle cuáles. Si son varias, sepárelas por comas."
    )
    certificaciones_otros = models.CharField(
        max_length=300, 
        blank=True, 
        null=True, 
        verbose_name="Otras Certificaciones",
        help_text="Si seleccionó 'Otra' en certificaciones, detalle cuáles"
    )
    
    # Archivos de certificaciones - OPTIMIZADO PARA MÉTRICAS
    archivo_certificaciones = models.FileField(
        upload_to='certificaciones/%Y/%m/',
        blank=True,
        null=True,
        verbose_name="Archivo de Certificaciones",
        help_text="Subir archivo PDF o imagen de las certificaciones"
    )
    archivo_certificaciones_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre del Archivo de Certificaciones"
    )
    
    # Campos de promoción (opcionales) - SISTEMA SIMPLIFICADO
    promo2idiomas = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Posee Material de Promoción en Más de un Idioma?",
        help_text="Marque si la empresa posee material de promoción en más de un idioma"
    )
    idiomas_trabaja = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Idiomas con los que Trabaja",
        help_text="Si posee material en más de un idioma, indique cuáles. Si son varios, sepárelos por comas."
    )
    
    # Campos de capacidad productiva - OPTIMIZADOS PARA MÉTRICAS
    capacidadproductiva = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Capacidad Productiva",
        help_text="Capacidad productiva de la empresa"
    )
    tiempocapacidad = models.CharField(
        max_length=20,
        choices=[
            ('Mensual', 'Mensual'),
            ('Anual', 'Anual'),
            ('Semanal', 'Semanal'),
        ],
        blank=True,
        null=True,
        verbose_name="Período de la Capacidad Productiva"
    )
    otracapacidad = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Otra Capacidad Productiva",
        help_text="Si posee otro producto con diferente capacidad productiva, indíquelo aquí"
    )
    
    # Campos de redes sociales y web
    redes_sociales = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Redes Sociales",
        help_text="URLs o texto separado por comas"
    )
    
    # Campos de geolocalización con coordenadas
    latitud = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True,
        verbose_name="Latitud",
        help_text="Coordenada de latitud (se llena automáticamente al seleccionar en el mapa)"
    )
    longitud = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True,
        verbose_name="Longitud",
        help_text="Coordenada de longitud (se llena automáticamente al seleccionar en el mapa)"
    )
    
    # SISTEMA DE FERIAS SIMPLIFICADO - MEJOR UX
    participoferianacional = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Participó en Ferias Nacionales?",
        help_text="Marque si la empresa participó en ferias nacionales"
    )
    feriasnacionales = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Detalle de Ferias Nacionales",
        help_text="Si participó, detalle nombre, lugar y año. Si son varias, sepárelas por comas."
    )
    participoferiainternacional = models.BooleanField(
        null=True, 
        blank=True, 
        verbose_name="¿Participó en Ferias Internacionales?",
        help_text="Marque si la empresa participó en ferias internacionales"
    )
    feriasinternacionales = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Detalle de Ferias Internacionales",
        help_text="Si participó, detalle nombre, lugar y año. Si son varias, sepárelas por comas."
    )
    
    # Archivos de ferias - OPTIMIZADO PARA MÉTRICAS
    archivo_ferias = models.FileField(
        upload_to='ferias/%Y/%m/',
        blank=True,
        null=True,
        verbose_name="Archivo de Ferias",
        help_text="Subir archivo PDF o imagen de participación en ferias"
    )
    archivo_ferias_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre del Archivo de Ferias"
    )
    
    # Campos adicionales - OPTIMIZADOS PARA MÉTRICAS
    observaciones = models.CharField(max_length=1000, blank=True, null=True, verbose_name="Observaciones")
    puntaje = models.IntegerField(null=True, blank=True, verbose_name="Puntaje")
    
    # Campos de archivos adicionales
    logo = models.ImageField(
        upload_to='logos/%Y/%m/',
        blank=True,
        null=True,
        verbose_name="Logo de la Empresa"
    )
    brochure = models.FileField(
        upload_to=generar_nombre_catalogo,
        blank=True,
        null=True,
        verbose_name="Brochure o Catálogo",
        help_text="Subir archivo PDF o imagen del brochure/catálogo"
    )
    descripcion = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Descripción de la Empresa",
        help_text="Describa brevemente los productos/servicios de la empresa"
    )
    
    # Relaciones
    id_usuario = models.ForeignKey('core.Usuario', on_delete=models.CASCADE, verbose_name="Usuario")
    id_rubro = models.ForeignKey(Rubro, on_delete=models.PROTECT, verbose_name="Rubro")
    tipo_empresa = models.ForeignKey(TipoEmpresa, on_delete=models.PROTECT, verbose_name="Tipo de Empresa")
    
    # Campo para distinguir el tipo de empresa (producto, servicio, mixta)
    tipo_empresa_valor = models.CharField(
        max_length=20,
        choices=[
            ('producto', 'Solo Productos'),
            ('servicio', 'Solo Servicios'),
            ('mixta', 'Productos y Servicios'),
        ],
        verbose_name="Tipo de Empresa",
        help_text="Tipo de empresa: solo productos, solo servicios, o mixta"
    )
    
    class Meta:
        db_table = 'empresa'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['razon_social']),
            models.Index(fields=['cuit_cuil']),
            models.Index(fields=['departamento', 'municipio']),
            models.Index(fields=['fecha_creacion']),
            models.Index(fields=['exporta', 'importa']),
            # Índices optimizados para métricas y filtros
            models.Index(fields=['exporta']),
            models.Index(fields=['importa']),
            models.Index(fields=['certificadopyme']),
            models.Index(fields=['certificacionesbool']),
            models.Index(fields=['participoferianacional']),
            models.Index(fields=['participoferiainternacional']),
            models.Index(fields=['promo2idiomas']),
            models.Index(fields=['capacidadproductiva']),
            models.Index(fields=['tiempocapacidad']),
            models.Index(fields=['puntaje']),
            models.Index(fields=['latitud', 'longitud']),
            models.Index(fields=['tipo_empresa']),
            models.Index(fields=['tipo_empresa_valor']),
            models.Index(fields=['id_rubro']),
        ]
    
    def __str__(self):
        return self.razon_social

# Clases proxy para compatibilidad durante la migración
# Estas filtran automáticamente por tipo_empresa_valor
class EmpresaproductoManager(models.Manager):
    """Manager que filtra solo empresas de producto"""
    def get_queryset(self):
        return super().get_queryset().filter(tipo_empresa_valor='producto')

class EmpresaservicioManager(models.Manager):
    """Manager que filtra solo empresas de servicio"""
    def get_queryset(self):
        return super().get_queryset().filter(tipo_empresa_valor='servicio')

class EmpresaMixtaManager(models.Manager):
    """Manager que filtra solo empresas mixtas"""
    def get_queryset(self):
        return super().get_queryset().filter(tipo_empresa_valor='mixta')

class Empresaproducto(Empresa):
    """
    Proxy para empresas de producto - usa Empresa con tipo_empresa_valor='producto'
    Mantenido para compatibilidad durante la migración
    """
    objects = EmpresaproductoManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Empresa de Producto'
        verbose_name_plural = 'Empresas de Productos'
        ordering = ['-fecha_creacion']

class Empresaservicio(Empresa):
    """
    Proxy para empresas de servicio - usa Empresa con tipo_empresa_valor='servicio'
    Mantenido para compatibilidad durante la migración
    """
    objects = EmpresaservicioManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Empresa de Servicio'
        verbose_name_plural = 'Empresas de Servicios'
        ordering = ['-fecha_creacion']

class EmpresaMixta(Empresa):
    """
    Proxy para empresas mixtas - usa Empresa con tipo_empresa_valor='mixta'
    Mantenido para compatibilidad durante la migración
    """
    objects = EmpresaMixtaManager()
    
    class Meta:
        proxy = True
        verbose_name = 'Empresa Mixta'
        verbose_name_plural = 'Empresas Mixtas'
        ordering = ['-fecha_creacion']

# Alias para compatibilidad
EmpresaBase = Empresa

# MATRIZ DE CLASIFICACIÓN DE PERFIL EXPORTADOR
class MatrizClasificacionExportador(models.Model):
    """
    Modelo para la matriz de clasificación de perfil exportador
    BASADO EN MATRIZ DE CLASIFICACIÓN DE PERFIL EXPORTADOR.pdf
    """
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name='clasificaciones_exportador',
        verbose_name="Empresa",
        help_text="Empresa a la que se aplica esta clasificación",
        null=True,  # Temporalmente nullable para migración
        blank=True
    )
    
    # CRITERIOS DE EVALUACIÓN (9 criterios, 0-3 puntos cada uno)
    experiencia_exportadora = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Experiencia Exportadora"
    )
    volumen_produccion = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Volumen de Producción"
    )
    presencia_digital = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Presencia Digital"
    )
    posicion_arancelaria = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Posición Arancelaria"
    )
    participacion_internacionalizacion = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Participación en Internacionalización"
    )
    estructura_interna = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Estructura Interna"
    )
    interes_exportador = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Interés Exportador"
    )
    certificaciones_nacionales = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Certificaciones Nacionales"
    )
    certificaciones_internacionales = models.IntegerField(
        choices=[(0, '0 puntos'), (1, '1 punto'), (2, '2 puntos'), (3, '3 puntos')],
        default=0,
        verbose_name="Certificaciones Internacionales"
    )
    
    # PUNTAJE TOTAL Y CATEGORÍA
    puntaje_total = models.IntegerField(
        default=0,
        verbose_name="Puntaje Total",
        help_text="Suma de todos los criterios (máximo 18 puntos)"
    )
    categoria = models.CharField(
        max_length=30,
        choices=[
            ('exportadora', 'Exportadora (12-18 puntos)'),
            ('potencial_exportadora', 'Potencial Exportadora (6-11 puntos)'),
            ('etapa_inicial', 'Etapa Inicial (0-5 puntos)'),
        ],
        default='etapa_inicial',
        verbose_name="Categoría de Clasificación"
    )
    
    # FECHA DE EVALUACIÓN
    fecha_evaluacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Evaluación"
    )
    evaluado_por = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Evaluado por"
    )
    
    # OBSERVACIONES
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observaciones",
        help_text="Comentarios adicionales sobre la evaluación"
    )
    
    class Meta:
        db_table = 'matriz_clasificacion_exportador'
        verbose_name = 'Matriz de Clasificación Exportador'
        verbose_name_plural = 'Matrices de Clasificación Exportador'
        ordering = ['-fecha_evaluacion']
        constraints = [
            models.UniqueConstraint(fields=['empresa'], name='unique_matriz_empresa')
        ]
    
    def get_empresa(self):
        """Obtener la empresa asociada"""
        return self.empresa
    
    def clean(self):
        """Validar que la empresa esté asignada"""
        if not self.empresa:
            raise ValidationError('Debe asignar una empresa')
    
    def save(self, *args, **kwargs):
        # Validar antes de guardar
        self.clean()
        
        # Calcular puntaje total automáticamente
        self.puntaje_total = (
            self.experiencia_exportadora +
            self.volumen_produccion +
            self.presencia_digital +
            self.posicion_arancelaria +
            self.participacion_internacionalizacion +
            self.estructura_interna +
            self.interes_exportador +
            self.certificaciones_nacionales +
            self.certificaciones_internacionales
        )
        
        # Determinar categoría basada en el puntaje
        if self.puntaje_total >= 12:
            self.categoria = 'exportadora'
        elif self.puntaje_total >= 6:
            self.categoria = 'potencial_exportadora'
        else:
            self.categoria = 'etapa_inicial'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        empresa = self.get_empresa()
        empresa_nombre = empresa.razon_social if empresa else "Sin empresa"
        return f"{empresa_nombre} - {self.get_categoria_display()} ({self.puntaje_total}/18 pts)"

class ProductoEmpresa(models.Model):
    """
    Modelo para productos específicos de cada empresa
    """
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE, 
        related_name='productos_empresa',
        verbose_name="Empresa",
        limit_choices_to={'tipo_empresa_valor__in': ['producto', 'mixta']},
        help_text="Empresa que ofrece este producto (debe ser tipo producto o mixta)"
    )
    nombre_producto = models.CharField(
        max_length=200, 
        verbose_name="Nombre del Producto"
    )
    descripcion = models.TextField(
        verbose_name="Descripción del Producto"
    )
    
    # CAPACIDAD PRODUCTIVA POR PRODUCTO (no por empresa)
    capacidad_productiva = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Capacidad Productiva",
        help_text="Capacidad productiva de ESTE producto específico"
    )
    unidad_medida = models.CharField(
        max_length=20,
        choices=[
            ('kg', 'Kilogramos'),
            ('tn', 'Toneladas'),
            ('lt', 'Litros'),
            ('m3', 'Metros cúbicos'),
            ('un', 'Unidades'),
            ('otro', 'Otro'),
        ],
        default='kg',
        verbose_name="Unidad de Medida",
        help_text="Unidad de medida para ESTE producto específico"
    )
    periodo_capacidad = models.CharField(
        max_length=20,
        choices=[
            ('mensual', 'Mensual'),
            ('anual', 'Anual'),
            ('semanal', 'Semanal'),
        ],
        default='mensual',
        verbose_name="Período de Capacidad",
        help_text="Período de capacidad para ESTE producto específico"
    )
    
    # OPCIONAL: Marcar un producto como principal (no obligatorio)
    es_principal = models.BooleanField(
        default=False, 
        verbose_name="Producto Principal",
        help_text="Marcar si este es el producto principal de la empresa"
    )
    
    # Campos adicionales por producto
    precio_estimado = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Precio Estimado",
        help_text="Precio estimado por unidad"
    )
    moneda_precio = models.CharField(
        max_length=3,
        choices=[
            ('ARS', 'Pesos Argentinos'),
            ('USD', 'Dólares'),
            ('EUR', 'Euros'),
        ],
        default='ARS',
        verbose_name="Moneda del Precio"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'producto_empresa'
        verbose_name = 'Producto de Empresa'
        verbose_name_plural = 'Productos de Empresa'
        ordering = ['-es_principal', 'nombre_producto']
    
    def __str__(self):
        return f"{self.nombre_producto} - {self.empresa.razon_social}"

class ServicioEmpresa(models.Model):
    """
    Modelo para servicios específicos de cada empresa
    BASADO EN FORMULARIO SERVICIOS - CAMPOS COMPLETOS
    """
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE, 
        related_name='servicios_empresa',
        verbose_name="Empresa",
        limit_choices_to={'tipo_empresa_valor__in': ['servicio', 'mixta']},
        help_text="Empresa que ofrece este servicio (debe ser tipo servicio o mixta)"
    )
    nombre_servicio = models.CharField(
        max_length=200, 
        verbose_name="Nombre del Servicio"
    )
    descripcion = models.TextField(
        verbose_name="Descripción del Servicio"
    )
    
    # TIPO DE SERVICIO (basado en formulario)
    tipo_servicio = models.CharField(
        max_length=50,
        choices=[
            ('consultoria', 'Consultoría y servicios empresariales'),
            ('tecnologias', 'Tecnologías de la información (IT)'),
            ('diseno_marketing', 'Diseño y marketing'),
            ('capacitacion', 'Capacitación y educación online'),
            ('culturales_eventos', 'Servicios culturales y eventos'),
            ('investigacion_desarrollo', 'Investigación y desarrollo (I+D)'),
            ('turismo_receptivo', 'Turismo receptivo'),
            ('otro', 'Otro (especificar)'),
        ],
        verbose_name="Tipo de Servicio"
    )
    tipo_servicio_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Tipo de Servicio"
    )
    
    # SECTORES A LOS QUE PRESTA SERVICIOS
    sector_atendido = models.CharField(
        max_length=50,
        choices=[
            ('mineria', 'Minería'),
            ('agroindustria', 'Agroindustria'),
            ('turismo', 'Turismo'),
            ('comercio', 'Comercio'),
            ('salud', 'Salud'),
            ('pymes', 'Pymes'),
            ('otro', 'Otro'),
        ],
        verbose_name="Sector Atendido"
    )
    sector_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Sector"
    )
    
    # ALCANCE GEOGRÁFICO
    alcance_servicio = models.CharField(
        max_length=20,
        choices=[
            ('local', 'Local'),
            ('nacional', 'Nacional'),
            ('internacional', 'Internacional'),
        ],
        verbose_name="Alcance del Servicio"
    )
    paises_trabaja = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Países con los que Trabaja",
        help_text="Si aplica, listar países separados por comas"
    )
    
    # EXPORTACIÓN DE SERVICIOS
    exporta_servicios = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Exporta Servicios?",
        help_text="Marque si la empresa exporta servicios"
    )
    interes_exportar_servicios = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Interés en Exportar Servicios?",
        help_text="Marque si tiene interés en exportar servicios"
    )
    
    # IDIOMAS DE TRABAJO
    idiomas_trabajo = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Idiomas con los que Trabaja",
        help_text="Español, Inglés, Portugués, Otro (especificar)"
    )
    idioma_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Idioma"
    )
    
    # FORMA DE CONTRATACIÓN
    forma_contratacion = models.CharField(
        max_length=20,
        choices=[
            ('hora', 'Por Hora'),
            ('proyecto', 'Por Proyecto'),
            ('mensual', 'Mensual'),
            ('otro', 'Otro'),
        ],
        verbose_name="Forma de Contratación"
    )
    forma_contratacion_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otra Forma de Contratación"
    )
    
    # CERTIFICACIONES TÉCNICAS
    certificaciones_tecnicas = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Certificaciones Técnicas",
        help_text="ISO 9001, ISO 14001, SCRUM, AWS, etc. Separar por comas"
    )
    tiene_equipo_tecnico = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Tiene Equipo Técnico Especializado?",
        help_text="Marque si tiene equipo técnico especializado"
    )
    equipo_tecnico_formacion = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Equipo en Formación?",
        help_text="Marque si el equipo está en formación"
    )
    
    es_principal = models.BooleanField(
        default=False, 
        verbose_name="Servicio Principal",
        help_text="Marcar si este es el servicio principal de la empresa"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'servicio_empresa'
        verbose_name = 'Servicio de Empresa'
        verbose_name_plural = 'Servicios de Empresa'
        ordering = ['-es_principal', 'nombre_servicio']
    
    def __str__(self):
        return f"{self.nombre_servicio} - {self.empresa.razon_social}"

class PosicionArancelaria(models.Model):
    """
    Modelo para posiciones arancelarias de productos (UNIVERSALES - Sistema Armonizado SA)
    """
    producto = models.ForeignKey(
        ProductoEmpresa, 
        on_delete=models.CASCADE, 
        related_name='posicion_arancelaria',  # ← UNA posición por producto
        verbose_name="Producto"
    )
    codigo_arancelario = models.CharField(
        max_length=20,
        verbose_name="Código Arancelario",
        help_text="Formato: 1234.56.78 - UNIVERSAL (Sistema Armonizado SA)"
    )
    descripcion_arancelaria = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name="Descripción Arancelaria"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'posicion_arancelaria'
        verbose_name = 'Posición Arancelaria'
        verbose_name_plural = 'Posiciones Arancelarias'
        ordering = ['codigo_arancelario']
        # Constraint para asegurar UNA posición por producto
        constraints = [
            models.UniqueConstraint(
                fields=['producto'],
                name='unique_position_per_product'
            )
        ]
    
    def __str__(self):
        return f"{self.codigo_arancelario} - {self.producto.nombre_producto}"
    
    def clean(self):
        super().clean()
        # Validar formato del código arancelario
        import re
        if not re.match(r'^\d{4}\.\d{2}\.\d{2}$', self.codigo_arancelario):
            raise ValidationError('El código arancelario debe tener el formato 1234.56.78')

class ProductoEmpresaMixta(models.Model):
    """
    Modelo para productos de empresas mixtas
    """
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE, 
        related_name='productos_mixta',
        verbose_name="Empresa",
        limit_choices_to={'tipo_empresa_valor': 'mixta'},
        help_text="Empresa mixta que ofrece este producto"
    )
    nombre_producto = models.CharField(
        max_length=200, 
        verbose_name="Nombre del Producto"
    )
    descripcion = models.TextField(
        verbose_name="Descripción del Producto"
    )
    
    # CAPACIDAD PRODUCTIVA POR PRODUCTO
    capacidad_productiva = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Capacidad Productiva"
    )
    unidad_medida = models.CharField(
        max_length=20,
        choices=[
            ('kg', 'Kilogramos'),
            ('tn', 'Toneladas'),
            ('lt', 'Litros'),
            ('m3', 'Metros cúbicos'),
            ('un', 'Unidades'),
            ('otro', 'Otro'),
        ],
        default='kg',
        verbose_name="Unidad de Medida"
    )
    periodo_capacidad = models.CharField(
        max_length=20,
        choices=[
            ('mensual', 'Mensual'),
            ('anual', 'Anual'),
            ('semanal', 'Semanal'),
        ],
        default='mensual',
        verbose_name="Período de Capacidad"
    )
    
    es_principal = models.BooleanField(
        default=False, 
        verbose_name="Producto Principal"
    )
    
    precio_estimado = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Precio Estimado"
    )
    moneda_precio = models.CharField(
        max_length=3,
        choices=[
            ('ARS', 'Pesos Argentinos'),
            ('USD', 'Dólares'),
            ('EUR', 'Euros'),
        ],
        default='ARS',
        verbose_name="Moneda del Precio"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'producto_empresa_mixta'
        verbose_name = 'Producto de Empresa Mixta'
        verbose_name_plural = 'Productos de Empresas Mixtas'
        ordering = ['-es_principal', 'nombre_producto']
    
    def __str__(self):
        return f"{self.nombre_producto} - {self.empresa.razon_social}"

class ServicioEmpresaMixta(models.Model):
    """
    Modelo para servicios de empresas mixtas
    BASADO EN FORMULARIO SERVICIOS - CAMPOS COMPLETOS
    """
    empresa = models.ForeignKey(
        Empresa, 
        on_delete=models.CASCADE, 
        related_name='servicios_mixta',
        verbose_name="Empresa",
        limit_choices_to={'tipo_empresa_valor': 'mixta'},
        help_text="Empresa mixta que ofrece este servicio"
    )
    nombre_servicio = models.CharField(
        max_length=200, 
        verbose_name="Nombre del Servicio"
    )
    descripcion = models.TextField(
        verbose_name="Descripción del Servicio"
    )
    
    # TIPO DE SERVICIO (basado en formulario)
    tipo_servicio = models.CharField(
        max_length=50,
        choices=[
            ('consultoria', 'Consultoría y servicios empresariales'),
            ('tecnologias', 'Tecnologías de la información (IT)'),
            ('diseno_marketing', 'Diseño y marketing'),
            ('capacitacion', 'Capacitación y educación online'),
            ('culturales_eventos', 'Servicios culturales y eventos'),
            ('investigacion_desarrollo', 'Investigación y desarrollo (I+D)'),
            ('turismo_receptivo', 'Turismo receptivo'),
            ('otro', 'Otro (especificar)'),
        ],
        verbose_name="Tipo de Servicio"
    )
    tipo_servicio_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Tipo de Servicio"
    )
    
    # SECTORES A LOS QUE PRESTA SERVICIOS
    sector_atendido = models.CharField(
        max_length=50,
        choices=[
            ('mineria', 'Minería'),
            ('agroindustria', 'Agroindustria'),
            ('turismo', 'Turismo'),
            ('comercio', 'Comercio'),
            ('salud', 'Salud'),
            ('pymes', 'Pymes'),
            ('otro', 'Otro'),
        ],
        verbose_name="Sector Atendido"
    )
    sector_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Sector"
    )
    
    # ALCANCE GEOGRÁFICO
    alcance_servicio = models.CharField(
        max_length=20,
        choices=[
            ('local', 'Local'),
            ('nacional', 'Nacional'),
            ('internacional', 'Internacional'),
        ],
        verbose_name="Alcance del Servicio"
    )
    paises_trabaja = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Países con los que Trabaja",
        help_text="Si aplica, listar países separados por comas"
    )
    
    # EXPORTACIÓN DE SERVICIOS
    exporta_servicios = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Exporta Servicios?",
        help_text="Marque si la empresa exporta servicios"
    )
    interes_exportar_servicios = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Interés en Exportar Servicios?",
        help_text="Marque si tiene interés en exportar servicios"
    )
    
    # IDIOMAS DE TRABAJO
    idiomas_trabajo = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Idiomas con los que Trabaja",
        help_text="Español, Inglés, Portugués, Otro (especificar)"
    )
    idioma_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otro Idioma"
    )
    
    # FORMA DE CONTRATACIÓN
    forma_contratacion = models.CharField(
        max_length=20,
        choices=[
            ('hora', 'Por Hora'),
            ('proyecto', 'Por Proyecto'),
            ('mensual', 'Mensual'),
            ('otro', 'Otro'),
        ],
        verbose_name="Forma de Contratación"
    )
    forma_contratacion_otro = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Especificar Otra Forma de Contratación"
    )
    
    # CERTIFICACIONES TÉCNICAS
    certificaciones_tecnicas = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Certificaciones Técnicas",
        help_text="ISO 9001, ISO 14001, SCRUM, AWS, etc. Separar por comas"
    )
    tiene_equipo_tecnico = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Tiene Equipo Técnico Especializado?",
        help_text="Marque si tiene equipo técnico especializado"
    )
    equipo_tecnico_formacion = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Equipo en Formación?",
        help_text="Marque si el equipo está en formación"
    )
    
    es_principal = models.BooleanField(
        default=False, 
        verbose_name="Servicio Principal"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'servicio_empresa_mixta'
        verbose_name = 'Servicio de Empresa Mixta'
        verbose_name_plural = 'Servicios de Empresas Mixtas'
        ordering = ['-es_principal', 'nombre_servicio']
    
    def __str__(self):
        return f"{self.nombre_servicio} - {self.empresa.razon_social}"

class PosicionArancelariaMixta(models.Model):
    """
    Modelo para posiciones arancelarias de productos de empresas mixtas
    """
    producto = models.ForeignKey(
        ProductoEmpresaMixta, 
        on_delete=models.CASCADE, 
        related_name='posiciones_arancelarias',
        verbose_name="Producto"
    )
    codigo_arancelario = models.CharField(
        max_length=20,
        verbose_name="Código Arancelario"
    )
    descripcion_arancelaria = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name="Descripción Arancelaria"
    )
    es_principal = models.BooleanField(
        default=False, 
        verbose_name="Posición Principal"
    )
    
    # Campos de auditoría (heredados de TimestampedModel)
    
    class Meta:
        db_table = 'posicion_arancelaria_mixta'
        verbose_name = 'Posición Arancelaria Mixta'
        verbose_name_plural = 'Posiciones Arancelarias Mixtas'
        ordering = ['-es_principal', 'codigo_arancelario']
    
    def __str__(self):
        return f"{self.codigo_arancelario} - {self.producto.nombre_producto}"
