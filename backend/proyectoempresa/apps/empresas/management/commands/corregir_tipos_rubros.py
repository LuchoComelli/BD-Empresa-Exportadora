"""
Comando de Django para corregir los tipos de rubros en la base de datos.
Asigna el tipo 'servicio' a los rubros que corresponden a servicios.
"""
from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro


class Command(BaseCommand):
    help = 'Corrige los tipos de rubros asignando servicio a los rubros correspondientes'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("CORRECCIÓN DE TIPOS DE RUBROS"))
        self.stdout.write("=" * 60)
        
        # Rubros que deben ser de tipo 'servicio'
        RUBROS_SERVICIO = [6, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
        
        rubros_corregidos = 0
        
        # Corregir rubros de servicio
        self.stdout.write("\n🔧 Corrigiendo rubros de servicio...")
        for rubro_id in RUBROS_SERVICIO:
            try:
                rubro = Rubro.objects.get(id=rubro_id)
                if rubro.tipo != 'servicio':
                    tipo_anterior = rubro.tipo
                    rubro.tipo = 'servicio'
                    rubro.save()
                    rubros_corregidos += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✓ {rubro.nombre} (ID: {rubro.id}): {tipo_anterior} → servicio"
                        )
                    )
                else:
                    self.stdout.write(
                        f"  → {rubro.nombre} (ID: {rubro.id}): ya es servicio"
                    )
            except Rubro.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"  ⚠️  Rubro con ID {rubro_id} no encontrado")
                )
        
        # Asegurar que los demás rubros sean productos (si no son mixtos u otros)
        self.stdout.write("\n📦 Verificando rubros de producto...")
        rubros_producto = Rubro.objects.exclude(id__in=RUBROS_SERVICIO).exclude(tipo__in=['mixto', 'otro'])
        for rubro in rubros_producto:
            if rubro.tipo != 'producto':
                tipo_anterior = rubro.tipo
                rubro.tipo = 'producto'
                rubro.save()
                rubros_corregidos += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ {rubro.nombre} (ID: {rubro.id}): {tipo_anterior} → producto"
                    )
                )
        
        # Mostrar estadísticas finales
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ CORRECCIÓN COMPLETADA"))
        self.stdout.write(f"  Rubros corregidos: {rubros_corregidos}")
        self.stdout.write("\n📊 Estadísticas por tipo:")
        from django.db.models import Count
        tipos = Rubro.objects.values('tipo').annotate(count=Count('id')).order_by('tipo')
        for t in tipos:
            self.stdout.write(f"  {t['tipo']}: {t['count']} rubros")
        self.stdout.write("=" * 60)

