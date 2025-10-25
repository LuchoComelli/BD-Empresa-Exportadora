from django.db.models import Count, Q, Avg, Sum
from django.db.models.functions import Extract
from .models import Empresaproducto, Empresaservicio, EmpresaMixta

class MetricasEmpresas:
    """
    Clase para generar métricas y estadísticas de empresas
    """
    
    @staticmethod
    def get_metricas_generales():
        """Métricas generales del sistema"""
        return {
            'total_empresas': Empresaproducto.objects.count() + Empresaservicio.objects.count() + EmpresaMixta.objects.count(),
            'empresas_exportadoras': Empresaproducto.objects.filter(exporta='Sí').count() + 
                                   Empresaservicio.objects.filter(exporta='Sí').count() + 
                                   EmpresaMixta.objects.filter(exporta='Sí').count(),
            'empresas_con_certificaciones': Empresaproducto.objects.filter(certificacionesbool=True).count() + 
                                          Empresaservicio.objects.filter(certificacionesbool=True).count() + 
                                          EmpresaMixta.objects.filter(certificacionesbool=True).count(),
            'empresas_por_departamento': Empresaproducto.objects.values('departamento__nomdpto').annotate(
                total=Count('id')
            ).order_by('-total'),
            'capacidad_productiva_promedio': Empresaproducto.objects.aggregate(
                promedio=Avg('capacidadproductiva')
            )['promedio'],
        }
    
    @staticmethod
    def get_metricas_por_rubro():
        """Métricas agrupadas por rubro"""
        return Empresaproducto.objects.values('id_rubro__nombre').annotate(
            total=Count('id'),
            exportadoras=Count('id', filter=Q(exporta='Sí')),
            con_certificaciones=Count('id', filter=Q(certificacionesbool=True)),
            capacidad_promedio=Avg('capacidadproductiva')
        ).order_by('-total')
    
    @staticmethod
    def get_metricas_geograficas():
        """Métricas geográficas"""
        return {
            'por_departamento': Empresaproducto.objects.values('departamento__nomdpto').annotate(
                total=Count('id'),
                exportadoras=Count('id', filter=Q(exporta='Sí'))
            ).order_by('-total'),
            'por_municipio': Empresaproducto.objects.values('municipio__nommun').annotate(
                total=Count('id')
            ).order_by('-total')[:10],
        }
    
    @staticmethod
    def get_metricas_exportacion():
        """Métricas específicas de exportación"""
        return {
            'tipos_exportacion': Empresaproducto.objects.values('tipoexporta').annotate(
                total=Count('id')
            ).exclude(tipoexporta__isnull=True),
            'destinos_principales': Empresaproducto.objects.values('destinoexporta').annotate(
                total=Count('id')
            ).exclude(destinoexporta__isnull=True).order_by('-total')[:10],
            'empresas_interesadas_exportar': Empresaproducto.objects.filter(interes_exportar=True).count(),
        }
