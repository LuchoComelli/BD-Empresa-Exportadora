"""
Comando para mostrar resumen completo de Catamarca
"""

from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad


class Command(BaseCommand):
    help = 'Mostrar resumen completo de datos de Catamarca'

    def handle(self, *args, **options):
        try:
            catamarca = Provincia.objects.get(id='10')
            
            deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
            municipios = Municipio.objects.filter(provincia=catamarca)
            localidades = Localidad.objects.filter(provincia=catamarca)
            
            self.stdout.write("=" * 60)
            self.stdout.write(self.style.SUCCESS("RESUMEN COMPLETO DE CATAMARCA"))
            self.stdout.write("=" * 60)
            
            self.stdout.write(f"\n📊 TOTALES:")
            self.stdout.write(f"  Departamentos: {deptos.count()}")
            self.stdout.write(f"  Municipios: {municipios.count()}")
            self.stdout.write(f"  Localidades: {localidades.count()}")
            
            self.stdout.write(f"\n🔗 RELACIONES:")
            self.stdout.write(f"  Municipios con departamento: {municipios.exclude(departamento=None).count()}/{municipios.count()}")
            self.stdout.write(f"  Localidades con departamento: {localidades.exclude(departamento=None).count()}/{localidades.count()}")
            self.stdout.write(f"  Localidades con municipio: {localidades.exclude(municipio=None).count()}/{localidades.count()}")
            self.stdout.write(f"  Localidades sin municipio: {localidades.filter(municipio=None).count()}")
            
            self.stdout.write(f"\n📋 DETALLE POR DEPARTAMENTO:")
            total_mun = 0
            total_loc = 0
            for depto in deptos:
                mun_count = Municipio.objects.filter(departamento=depto).count()
                loc_count = Localidad.objects.filter(departamento=depto).count()
                total_mun += mun_count
                total_loc += loc_count
                self.stdout.write(f"  {depto.nombre}: {mun_count} municipios, {loc_count} localidades")
            
            self.stdout.write(f"\n✅ TOTALES VERIFICADOS:")
            self.stdout.write(f"  {total_mun} municipios")
            self.stdout.write(f"  {total_loc} localidades")
            
            self.stdout.write("\n" + "=" * 60)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
            raise

