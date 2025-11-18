"""
Comando para crear/activar el rubro 'Otro' de productos si no existe
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro


class Command(BaseCommand):
    help = 'Crear o activar el rubro Otro de productos'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("CREANDO/ACTIVANDO RUBRO 'OTRO' DE PRODUCTOS"))
        self.stdout.write("=" * 60)
        
        # Buscar si existe (puede estar desactivado o con otro tipo)
        rubro_otro = Rubro.objects.filter(nombre='Otro').first()
        
        if rubro_otro:
            # Si existe pero no es de productos o está desactivado, actualizarlo
            if rubro_otro.tipo != 'producto':
                self.stdout.write(f"  → Rubro 'Otro' existe pero es de tipo '{rubro_otro.tipo}'")
                self.stdout.write("  → Creando nuevo rubro 'Otro' para productos...")
                rubro_otro = None
            elif not rubro_otro.activo:
                self.stdout.write("  → Rubro 'Otro' existe pero está desactivado, activándolo...")
                rubro_otro.activo = True
                rubro_otro.tipo = 'producto'
                rubro_otro.orden = 8
                rubro_otro.unidad_medida_estandar = 'u'
                rubro_otro.save()
                self.stdout.write(self.style.SUCCESS("  ✓ Rubro 'Otro' activado"))
        
        if not rubro_otro:
            # Crear el rubro
            rubro_otro, created = Rubro.objects.get_or_create(
                nombre='Otro',
                tipo='producto',
                defaults={
                    'unidad_medida_estandar': 'u',
                    'orden': 8,
                    'activo': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS("  ✓ Rubro 'Otro' de productos creado"))
            else:
                rubro_otro.activo = True
                rubro_otro.orden = 8
                rubro_otro.unidad_medida_estandar = 'u'
                rubro_otro.save()
                self.stdout.write(self.style.SUCCESS("  ✓ Rubro 'Otro' de productos actualizado"))
        
        # Crear el subrubro "Otro" si no existe
        subrubro_otro, created = SubRubro.objects.get_or_create(
            nombre='Otro',
            rubro=rubro_otro,
            defaults={
                'orden': 1,
                'activo': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("  ✓ Subrubro 'Otro' creado"))
        else:
            if not subrubro_otro.activo:
                subrubro_otro.activo = True
                subrubro_otro.save()
                self.stdout.write(self.style.SUCCESS("  ✓ Subrubro 'Otro' activado"))
            else:
                self.stdout.write("  → Subrubro 'Otro' ya existe")
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ PROCESO COMPLETADO"))
        self.stdout.write("=" * 60)

