"""
Comando para agregar el subrubro "Otro" a todos los rubros existentes
"""

from django.core.management.base import BaseCommand
from django.db.models import Max
from apps.empresas.models import Rubro, SubRubro


class Command(BaseCommand):
    help = 'Agregar subrubro "Otro" a todos los rubros que no lo tengan'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("AGREGANDO SUBRUBRO 'OTRO' A TODOS LOS RUBROS"))
        self.stdout.write("=" * 60)
        
        rubros = Rubro.objects.filter(activo=True)
        agregados = 0
        
        for rubro in rubros:
            # Verificar si ya tiene el subrubro "Otro"
            tiene_otro = SubRubro.objects.filter(
                rubro=rubro,
                nombre='Otro',
                activo=True
            ).exists()
            
            if not tiene_otro:
                # Obtener el orden máximo de los subrubros existentes
                max_orden = SubRubro.objects.filter(rubro=rubro, activo=True).aggregate(
                    max_orden=Max('orden')
                )['max_orden'] or 0
                
                # Crear el subrubro "Otro"
                SubRubro.objects.create(
                    rubro=rubro,
                    nombre='Otro',
                    activo=True,
                    orden=max_orden + 1
                )
                agregados += 1
                self.stdout.write(f"  ✓ Agregado 'Otro' a {rubro.nombre} ({rubro.get_tipo_display()})")
            else:
                self.stdout.write(f"  → {rubro.nombre} ya tiene el subrubro 'Otro'")
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ PROCESO COMPLETADO"))
        self.stdout.write(f"  Subrubros 'Otro' agregados: {agregados}")
        self.stdout.write(f"  Total rubros procesados: {rubros.count()}")
        self.stdout.write("=" * 60)

