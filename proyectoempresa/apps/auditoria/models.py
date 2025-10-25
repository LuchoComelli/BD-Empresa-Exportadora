from django.db import models
from apps.core.models import Usuario

class AuditoriaLog(models.Model):
    """
    Modelo principal para registrar todas las acciones del sistema
    """
    
    # Información básica del evento
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y Hora")
    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Usuario",
        help_text="Usuario que realizó la acción (puede ser NULL para acciones del sistema)"
    )
    
    # Información de la sesión
    session_key = models.CharField(
        max_length=40, 
        blank=True, 
        null=True,
        verbose_name="Clave de Sesión"
    )
    user_agent = models.TextField(
        blank=True, 
        null=True,
        verbose_name="User Agent",
        help_text="Información del navegador/dispositivo"
    )
    
    # Información de la acción
    accion = models.CharField(
        max_length=50,
        choices=[
            ('CREATE', 'Crear'),
            ('READ', 'Leer'),
            ('UPDATE', 'Actualizar'),
            ('DELETE', 'Eliminar'),
            ('LOGIN', 'Iniciar Sesión'),
            ('LOGOUT', 'Cerrar Sesión'),
            ('EXPORT', 'Exportar'),
            ('IMPORT', 'Importar'),
            ('LOGIN_FAILED', 'Intento de Login Fallido'),
            ('PASSWORD_CHANGE', 'Cambio de Contraseña'),
            ('PASSWORD_RESET', 'Restablecer Contraseña'),
            ('PERMISSION_DENIED', 'Acceso Denegado'),
            ('FILE_UPLOAD', 'Subir Archivo'),
            ('FILE_DOWNLOAD', 'Descargar Archivo'),
            ('EMAIL_SENT', 'Email Enviado'),
            ('EMAIL_FAILED', 'Email Fallido'),
            ('SYSTEM_ERROR', 'Error del Sistema'),
        ],
        verbose_name="Acción Realizada"
    )
    
    # Información del objeto afectado
    modelo_afectado = models.CharField(
        max_length=100,
        verbose_name="Modelo Afectado",
        help_text="Nombre del modelo Django afectado"
    )
    objeto_id = models.PositiveIntegerField(
        null=True, 
        blank=True,
        verbose_name="ID del Objeto",
        help_text="ID del objeto específico afectado"
    )
    nombre_objeto = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nombre del Objeto",
        help_text="Nombre descriptivo del objeto (ej: razón social de empresa)"
    )
    
    # Detalles de la acción
    descripcion = models.TextField(
        verbose_name="Descripción",
        help_text="Descripción detallada de la acción realizada"
    )
    detalles_adicionales = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Detalles Adicionales",
        help_text="Información adicional en formato JSON"
    )
    
    # Valores antes y después del cambio
    valores_anteriores = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Valores Anteriores",
        help_text="Valores del objeto antes del cambio"
    )
    valores_nuevos = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Valores Nuevos",
        help_text="Valores del objeto después del cambio"
    )
    
    # Información de contexto
    url = models.URLField(
        blank=True, 
        null=True,
        verbose_name="URL",
        help_text="URL donde se realizó la acción"
    )
    metodo_http = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name="Método HTTP",
        help_text="GET, POST, PUT, DELETE, etc."
    )
    
    # Clasificación de la acción
    nivel_criticidad = models.CharField(
        max_length=20,
        choices=[
            ('INFO', 'Informativo'),
            ('WARNING', 'Advertencia'),
            ('ERROR', 'Error'),
            ('CRITICAL', 'Crítico'),
        ],
        default='INFO',
        verbose_name="Nivel de Criticidad"
    )
    categoria = models.CharField(
        max_length=50,
        choices=[
            ('AUTHENTICATION', 'Autenticación'),
            ('USER_MANAGEMENT', 'Gestión de Usuarios'),
            ('COMPANY_MANAGEMENT', 'Gestión de Empresas'),
            ('DATA_EXPORT', 'Exportación de Datos'),
            ('DATA_IMPORT', 'Importación de Datos'),
            ('FILE_MANAGEMENT', 'Gestión de Archivos'),
            ('SYSTEM_ADMIN', 'Administración del Sistema'),
            ('SECURITY', 'Seguridad'),
            ('ERROR', 'Errores'),
        ],
        verbose_name="Categoría"
    )
    
    # Información de resultado
    exito = models.BooleanField(
        default=True,
        verbose_name="Éxito",
        help_text="Indica si la acción fue exitosa"
    )
    mensaje_error = models.TextField(
        blank=True,
        null=True,
        verbose_name="Mensaje de Error",
        help_text="Mensaje de error si la acción falló"
    )
    
    class Meta:
        db_table = 'auditoria_log'
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['usuario']),
            models.Index(fields=['accion']),
            models.Index(fields=['modelo_afectado']),
            models.Index(fields=['categoria']),
            models.Index(fields=['nivel_criticidad']),
        ]
    
    def __str__(self):
        return f"{self.timestamp} - {self.usuario} - {self.accion} - {self.modelo_afectado}"

class AuditoriaCambios(models.Model):
    """
    Modelo específico para auditoría de cambios en objetos
    """
    auditoria_log = models.ForeignKey(
        AuditoriaLog, 
        on_delete=models.CASCADE,
        related_name='cambios_detallados',
        verbose_name="Registro de Auditoría"
    )
    
    campo_modificado = models.CharField(
        max_length=100,
        verbose_name="Campo Modificado"
    )
    valor_anterior = models.TextField(
        blank=True,
        null=True,
        verbose_name="Valor Anterior"
    )
    valor_nuevo = models.TextField(
        blank=True,
        null=True,
        verbose_name="Valor Nuevo"
    )
    
    class Meta:
        db_table = 'auditoria_cambios'
        verbose_name = 'Cambio Detallado'
        verbose_name_plural = 'Cambios Detallados'
        ordering = ['campo_modificado']
    
    def __str__(self):
        return f"{self.campo_modificado}: {self.valor_anterior} → {self.valor_nuevo}"

class AuditoriaArchivos(models.Model):
    """
    Modelo para auditoría específica de archivos
    """
    auditoria_log = models.ForeignKey(
        AuditoriaLog, 
        on_delete=models.CASCADE,
        related_name='archivos_afectados',
        verbose_name="Registro de Auditoría"
    )
    
    nombre_archivo = models.CharField(
        max_length=255,
        verbose_name="Nombre del Archivo"
    )
    ruta_archivo = models.CharField(
        max_length=500,
        verbose_name="Ruta del Archivo"
    )
    tamaño_archivo = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Tamaño del Archivo (bytes)"
    )
    tipo_archivo = models.CharField(
        max_length=50,
        verbose_name="Tipo de Archivo"
    )
    hash_archivo = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        verbose_name="Hash del Archivo",
        help_text="Hash SHA-256 para verificar integridad"
    )
    
    class Meta:
        db_table = 'auditoria_archivos'
        verbose_name = 'Archivo Auditado'
        verbose_name_plural = 'Archivos Auditados'
        ordering = ['-auditoria_log__timestamp']
    
    def __str__(self):
        return f"{self.nombre_archivo} - {self.auditoria_log.timestamp}"
