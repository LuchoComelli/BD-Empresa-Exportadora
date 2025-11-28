from django.db import models
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField


class Provincia(models.Model):
    """
    Provincias de Argentina (división político-territorial de primer orden)
    """
    id = models.CharField(max_length=2, primary_key=True, verbose_name="ID")
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre")
    nombre_completo = models.CharField(max_length=150, verbose_name="Nombre Completo")
    iso_id = models.CharField(max_length=5, verbose_name="ISO ID")
    iso_nombre = models.CharField(max_length=100, verbose_name="ISO Nombre")
    categoria = models.CharField(max_length=50, verbose_name="Categoría")
    centroide_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Latitud Centroide")
    centroide_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Longitud Centroide")
    geometria = models.JSONField(null=True, blank=True, verbose_name="Geometría")
    fuente = models.CharField(max_length=100, null=True, blank=True, verbose_name="Fuente")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")
    
    class Meta:
        db_table = 'geografia_ar_provincias'
        managed = True  # Las tablas ya existen en el esquema public
        verbose_name = 'Provincia'
        verbose_name_plural = 'Provincias'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['iso_id']),
            models.Index(fields=['centroide_lat', 'centroide_lon']),
        ]
    
    def __str__(self):
        return self.nombre


class Departamento(models.Model):
    """
    Departamentos y Partidos (división político-administrativa de segundo orden)
    """
    id = models.CharField(max_length=5, primary_key=True, verbose_name="ID")
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    nombre_completo = models.CharField(max_length=150, verbose_name="Nombre Completo")
    categoria = models.CharField(max_length=50, verbose_name="Categoría")
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.CASCADE,
        related_name='departamentos',
        verbose_name="Provincia"
    )
    centroide_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Latitud Centroide")
    centroide_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Longitud Centroide")
    geometria = models.JSONField(null=True, blank=True, verbose_name="Geometría")
    fuente = models.CharField(max_length=100, null=True, blank=True, verbose_name="Fuente")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")
    
    class Meta:
        db_table = 'geografia_ar_departamentos'
        managed = True  # Las tablas ya existen en el esquema public
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['nombre']
        unique_together = [['nombre', 'provincia']]
        indexes = [
            models.Index(fields=['provincia']),
            models.Index(fields=['nombre']),
            models.Index(fields=['centroide_lat', 'centroide_lon']),
        ]
    
    def __str__(self):
        return f"{self.nombre} - {self.provincia.nombre}"


class Municipio(models.Model):
    """
    Municipios (división político-administrativa de tercer orden)
    """
    id = models.CharField(max_length=6, primary_key=True, verbose_name="ID")
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    nombre_completo = models.CharField(max_length=150, verbose_name="Nombre Completo")
    categoria = models.CharField(max_length=50, verbose_name="Categoría")
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.CASCADE,
        related_name='municipios',
        verbose_name="Provincia"
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='municipios',
        verbose_name="Departamento"
    )
    centroide_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Latitud Centroide")
    centroide_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Longitud Centroide")
    geometria = models.JSONField(null=True, blank=True, verbose_name="Geometría")
    fuente = models.CharField(max_length=100, null=True, blank=True, verbose_name="Fuente")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")
    
    class Meta:
        db_table = 'geografia_ar_municipios'
        managed = True  # Las tablas ya existen en el esquema public
        verbose_name = 'Municipio'
        verbose_name_plural = 'Municipios'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['provincia']),
            models.Index(fields=['departamento']),
            models.Index(fields=['nombre']),
            models.Index(fields=['centroide_lat', 'centroide_lon']),
        ]
    
    def __str__(self):
        return f"{self.nombre} - {self.provincia.nombre}"


class Localidad(models.Model):
    """
    Localidades según BAHRA (Base de Asentamientos Humanos)
    """
    id = models.CharField(max_length=20, primary_key=True, verbose_name="ID")
    nombre = models.CharField(max_length=150, verbose_name="Nombre")
    categoria = models.CharField(max_length=100, null=True, blank=True, verbose_name="Categoría")
    tipo_asentamiento = models.CharField(max_length=50, null=True, blank=True, verbose_name="Tipo de Asentamiento")
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.CASCADE,
        related_name='localidades',
        verbose_name="Provincia"
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='localidades',
        verbose_name="Departamento"
    )
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='localidades',
        verbose_name="Municipio"
    )
    centroide_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Latitud Centroide")
    centroide_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name="Longitud Centroide")
    geometria = models.JSONField(null=True, blank=True, verbose_name="Geometría")
    fuente = models.CharField(max_length=100, null=True, blank=True, verbose_name="Fuente")
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")
    
    class Meta:
        db_table = 'geografia_ar_localidades'
        managed = True  # Las tablas ya existen en el esquema public
        verbose_name = 'Localidad'
        verbose_name_plural = 'Localidades'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['provincia']),
            models.Index(fields=['departamento']),
            models.Index(fields=['municipio']),
            models.Index(fields=['nombre']),
            models.Index(fields=['tipo_asentamiento']),
            models.Index(fields=['centroide_lat', 'centroide_lon']),
        ]
    
    def __str__(self):
        return f"{self.nombre} - {self.departamento.nombre}"

