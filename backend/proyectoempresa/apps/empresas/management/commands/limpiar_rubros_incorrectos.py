"""
Comando para desactivar rubros incorrectos o duplicados
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro

# Lista de rubros correctos según la clasificación oficial
RUBROS_PRODUCTOS_CORRECTOS = [
    'Agrícola',
    'Ganadero',
    'Industrial',
    'Textil',
    'Alimentos y Bebidas',
    'Minería',
    'Artesanías',
]

RUBROS_SERVICIOS_CORRECTOS = [
    'Audiovisual',
    'Capacitación',
    'Comercio Exterior',
    'Comercio Exterior Nacional',
    'Consultoría',
    'Desarrollo de Software',
    'Eventos',
    'Informática',
    'Internet',
    'Logística',
    'Logística Nacional',
    'Tecnología',
    'Innovación Tecnológica',
    'Industrias Creativas',
]


class Command(BaseCommand):
    help = 'Desactivar rubros incorrectos o duplicados'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("LIMPIANDO RUBROS INCORRECTOS"))
        self.stdout.write("=" * 60)
        
        # Desactivar rubros de productos incorrectos
        self.stdout.write("\n📦 Procesando rubros de PRODUCTOS...")
        rubros_productos = Rubro.objects.filter(tipo='producto', activo=True)
        incorrectos_productos = rubros_productos.exclude(nombre__in=RUBROS_PRODUCTOS_CORRECTOS)
        
        if incorrectos_productos.exists():
            self.stdout.write(f"  Encontrados {incorrectos_productos.count()} rubros incorrectos:")
            for rubro in incorrectos_productos:
                self.stdout.write(f"    - {rubro.nombre} (ID: {rubro.id})")
                rubro.activo = False
                rubro.save()
                # También desactivar sus subrubros
                SubRubro.objects.filter(rubro=rubro, activo=True).update(activo=False)
            self.stdout.write(self.style.SUCCESS(f"  ✓ {incorrectos_productos.count()} rubros desactivados"))
        else:
            self.stdout.write("  ✓ No hay rubros incorrectos")
        
        # Desactivar rubros de servicios incorrectos
        self.stdout.write("\n🔧 Procesando rubros de SERVICIOS...")
        rubros_servicios = Rubro.objects.filter(tipo='servicio', activo=True)
        incorrectos_servicios = rubros_servicios.exclude(nombre__in=RUBROS_SERVICIOS_CORRECTOS)
        
        if incorrectos_servicios.exists():
            self.stdout.write(f"  Encontrados {incorrectos_servicios.count()} rubros incorrectos:")
            for rubro in incorrectos_servicios:
                self.stdout.write(f"    - {rubro.nombre} (ID: {rubro.id})")
                rubro.activo = False
                rubro.save()
                # También desactivar sus subrubros
                SubRubro.objects.filter(rubro=rubro, activo=True).update(activo=False)
            self.stdout.write(self.style.SUCCESS(f"  ✓ {incorrectos_servicios.count()} rubros desactivados"))
        else:
            self.stdout.write("  ✓ No hay rubros incorrectos")
        
        # Resumen final
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ LIMPIEZA COMPLETADA"))
        self.stdout.write(f"\n📦 Rubros de productos activos: {Rubro.objects.filter(tipo='producto', activo=True).count()}")
        self.stdout.write(f"🔧 Rubros de servicios activos: {Rubro.objects.filter(tipo='servicio', activo=True).count()}")
        self.stdout.write("\nRubros de productos activos:")
        for rubro in Rubro.objects.filter(tipo='producto', activo=True).order_by('orden', 'nombre'):
            subrubros_count = SubRubro.objects.filter(rubro=rubro, activo=True).count()
            self.stdout.write(f"  - {rubro.nombre} ({subrubros_count} subrubros)")
        self.stdout.write("\nRubros de servicios activos:")
        for rubro in Rubro.objects.filter(tipo='servicio', activo=True).order_by('orden', 'nombre'):
            subrubros_count = SubRubro.objects.filter(rubro=rubro, activo=True).count()
            self.stdout.write(f"  - {rubro.nombre} ({subrubros_count} subrubros)")
        self.stdout.write("=" * 60)

