from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import TimestampedModel
from apps.empresas.models import Empresa
import re
from datetime import datetime

User = get_user_model()


def generar_nombre_catalogo_solicitud(instance, filename):
    """
    Genera un nombre personalizado para el catálogo PDF en solicitudes
    Formato: catalogo-{nombre-empresa}-MM-YYYY.pdf
    """
    # Obtener la razón social de la solicitud
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

class SolicitudRegistro(TimestampedModel):
    """
    Modelo para solicitudes de registro de empresas
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
        ('en_revision', 'En Revisión'),
    ]
    
    TIPO_EMPRESA_CHOICES = [
        ('producto', 'Solo Productos'),
        ('servicio', 'Solo Servicios'),
        ('mixta', 'Productos y Servicios'),
    ]
    
    # Información básica de la empresa
    razon_social = models.CharField(max_length=150, verbose_name="Razón Social")
    nombre_fantasia = models.CharField(max_length=150, blank=True, null=True, verbose_name="Nombre de Fantasía")
    tipo_sociedad = models.CharField(max_length=50, blank=True, null=True, verbose_name="Tipo de Sociedad")
    cuit_cuil = models.CharField(
        max_length=15, 
        verbose_name="CUIT/CUIL",
        help_text="Ingrese el CUIT/CUIL"
    )
    direccion = models.CharField(max_length=255, verbose_name="Dirección")
    codigo_postal = models.CharField(max_length=10, blank=True, null=True, verbose_name="Código Postal")
    direccion_comercial = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección Comercial")
    codigo_postal_comercial = models.CharField(max_length=10, blank=True, null=True, verbose_name="Código Postal Comercial")
    
    # Ubicación
    departamento = models.CharField(max_length=100, verbose_name="Departamento")
    municipio = models.CharField(max_length=100, blank=True, null=True, verbose_name="Municipio")
    localidad = models.CharField(max_length=100, blank=True, null=True, verbose_name="Localidad")
    geolocalizacion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Geolocalización")
    
    # Contacto
    telefono = models.CharField(
        max_length=20, 
        verbose_name="Teléfono",
        help_text="Formato: +54 9 11 1234-5678"
    )
    correo = models.EmailField(verbose_name="Correo Electrónico")
    sitioweb = models.URLField(blank=True, null=True, verbose_name="Sitio Web")
    
    # Información de la empresa
    tipo_empresa = models.CharField(
        max_length=20,
        choices=TIPO_EMPRESA_CHOICES,
        verbose_name="Tipo de Empresa"
    )
    rubro_principal = models.CharField(max_length=100, verbose_name="Rubro Principal")
    sub_rubro = models.CharField(max_length=100, blank=True, null=True, verbose_name="Sub-Rubro")
    
    # Campos específicos para empresas mixtas (productos y servicios separados)
    rubro_producto = models.CharField(max_length=100, blank=True, null=True, verbose_name="Rubro de Productos")
    sub_rubro_producto = models.CharField(max_length=100, blank=True, null=True, verbose_name="Sub-Rubro de Productos")
    rubro_servicio = models.CharField(max_length=100, blank=True, null=True, verbose_name="Rubro de Servicios")
    sub_rubro_servicio = models.CharField(max_length=100, blank=True, null=True, verbose_name="Sub-Rubro de Servicios")
    
    descripcion_actividad = models.TextField(blank=True, null=True, verbose_name="Descripción de la Actividad")
    
    # Datos complejos en JSON
    productos = models.JSONField(default=list, blank=True, verbose_name="Productos")
    servicios_ofrecidos = models.JSONField(default=dict, blank=True, null=True, verbose_name="Servicios Ofrecidos")
    actividades_promocion = models.JSONField(default=list, blank=True, verbose_name="Actividades de Promoción")
    contactos_secundarios = models.JSONField(default=list, blank=True, verbose_name="Contactos Secundarios")
    
    # Redes sociales
    instagram = models.CharField(max_length=100, blank=True, null=True, verbose_name="Instagram")
    facebook = models.CharField(max_length=100, blank=True, null=True, verbose_name="Facebook")
    linkedin = models.CharField(max_length=100, blank=True, null=True, verbose_name="LinkedIn")
    
    # Exportación/Importación
    exporta = models.CharField(
        max_length=20,
        choices=[
            ('si', 'Sí'),
            ('no', 'No'),
            ('en-proceso', 'En proceso'),
        ],
        blank=True,
        null=True,
        verbose_name="¿Exporta productos/servicios?"
    )
    destino_exportacion = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Principales destinos de exportación"
    )
    importa = models.CharField(
        max_length=10,
        choices=[
            ('si', 'Sí'),
            ('no', 'No'),
        ],
        blank=True,
        null=True,
        verbose_name="¿Importa productos/servicios?"
    )
    tipo_importacion = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Tipo de importación"
    )

    interes_exportar = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="¿Está Interesada en Comenzar a Exportar?",
        help_text="Solo aplica si NO exporta actualmente"
    )
    
    # Certificaciones
    certificado_pyme = models.CharField(
        max_length=20,
        choices=[
            ('si', 'Sí, vigente'),
            ('vencido', 'Sí, vencido'),
            ('en-tramite', 'En trámite'),
            ('no', 'No'),
        ],
        blank=True,
        null=True,
        verbose_name="¿Tiene certificado MiPYME?"
    )
    certificaciones = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Certificaciones (ISO, etc.)"
    )
    brochure_url = models.CharField(max_length=255, blank=True, null=True, verbose_name="URL del Brochure")
    catalogo_pdf = models.FileField(
        upload_to=generar_nombre_catalogo_solicitud,
        blank=True,
        null=True,
        verbose_name="Catálogo en PDF",
        help_text="Subir catálogo o brochure en formato PDF"
    )
    catalogo_pdf_nombre = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre del Archivo PDF"
    )
    
    # Promoción
    material_promocional_idiomas = models.CharField(
        max_length=20,
        choices=[
            ('si', 'Sí'),
            ('no', 'No'),
            ('en-desarrollo', 'En desarrollo'),
        ],
        blank=True,
        null=True,
        verbose_name="¿Tiene material promocional en otros idiomas?"
    )
    idiomas_trabajo = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name="Idiomas en los que trabaja"
    )
    
    # Observaciones
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones Generales")
    
    # Usuario creado (para login)
    usuario_creado = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitud_registro',
        verbose_name="Usuario Creado"
    )
    
    # Información del contacto
    nombre_contacto = models.CharField(max_length=100, verbose_name="Nombre del Contacto")
    cargo_contacto = models.CharField(max_length=100, verbose_name="Cargo del Contacto")
    telefono_contacto = models.CharField(
        max_length=20, 
        verbose_name="Teléfono del Contacto"
    )
    email_contacto = models.EmailField(verbose_name="Email del Contacto")
    
    # Estado de la solicitud
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name="Estado de la Solicitud"
    )
    fecha_aprobacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Aprobación")
    aprobado_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='solicitudes_aprobadas',
        verbose_name="Aprobado por"
    )
    observaciones_admin = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Observaciones del Administrador"
    )
    
    # Token para confirmación por email
    token_confirmacion = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="Token de Confirmación"
    )
    email_confirmado = models.BooleanField(default=False, verbose_name="Email Confirmado")
    fecha_confirmacion = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Confirmación")
    
    # Empresa creada (si fue aprobada)
    empresa_creada = models.ForeignKey(
        'empresas.Empresa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Empresa Creada"
    )
    
    class Meta:
        db_table = 'solicitud_registro'
        verbose_name = 'Solicitud de Registro'
        verbose_name_plural = 'Solicitudes de Registro'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['tipo_empresa']),
            models.Index(fields=['fecha_creacion']),
            models.Index(fields=['token_confirmacion']),
        ]
    
    def __str__(self):
        return f"{self.razon_social} - {self.get_estado_display()}"
    
    def save(self, *args, **kwargs):
        if not self.token_confirmacion:
            import uuid
            self.token_confirmacion = str(uuid.uuid4())
        super().save(*args, **kwargs)

class DocumentoSolicitud(models.Model):
    """
    Modelo para documentos adjuntos en las solicitudes
    """
    TIPO_DOCUMENTO_CHOICES = [
        ('cuit', 'Constancia de CUIT'),
        ('acta', 'Acta Constitutiva'),
        ('estatutos', 'Estatutos'),
        ('certificado', 'Certificado'),
        ('otro', 'Otro'),
    ]
    
    solicitud = models.ForeignKey(
        SolicitudRegistro, 
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name="Solicitud"
    )
    tipo_documento = models.CharField(
        max_length=20,
        choices=TIPO_DOCUMENTO_CHOICES,
        verbose_name="Tipo de Documento"
    )
    nombre_archivo = models.CharField(max_length=255, verbose_name="Nombre del Archivo")
    archivo = models.FileField(
        upload_to='solicitudes/documentos/',
        verbose_name="Archivo"
    )
    descripcion = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Descripción"
    )
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Subida")
    
    class Meta:
        db_table = 'documento_solicitud'
        verbose_name = 'Documento de Solicitud'
        verbose_name_plural = 'Documentos de Solicitud'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"{self.nombre_archivo} - {self.solicitud.razon_social}"

class NotificacionRegistro(models.Model):
    """
    Modelo para notificaciones del sistema de registro
    """
    TIPO_CHOICES = [
        ('confirmacion', 'Confirmación de Email'),
        ('aprobacion', 'Aprobación de Solicitud'),
        ('rechazo', 'Rechazo de Solicitud'),
        ('recordatorio', 'Recordatorio'),
    ]
    
    solicitud = models.ForeignKey(
        SolicitudRegistro, 
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name="Solicitud"
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name="Tipo de Notificación"
    )
    asunto = models.CharField(max_length=200, verbose_name="Asunto")
    mensaje = models.TextField(verbose_name="Mensaje")
    email_enviado = models.BooleanField(default=False, verbose_name="Email Enviado")
    fecha_envio = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Envío")
    error_envio = models.TextField(blank=True, null=True, verbose_name="Error de Envío")
    
    class Meta:
        db_table = 'notificacion_registro'
        verbose_name = 'Notificación de Registro'
        verbose_name_plural = 'Notificaciones de Registro'
        ordering = ['-fecha_envio']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.solicitud.razon_social}"