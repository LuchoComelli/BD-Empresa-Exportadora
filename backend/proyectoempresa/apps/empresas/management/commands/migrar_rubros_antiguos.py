"""
Comando para migrar empresas que usan rubros desactivados a rubros correctos
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, Empresa
from django.db import transaction


class Command(BaseCommand):
    help = 'Migrar empresas de rubros desactivados a rubros correctos'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("MIGRANDO EMPRESAS A RUBROS CORRECTOS"))
        self.stdout.write("=" * 60)
        
        # Mapeo de rubros antiguos a nuevos
        MIGRACIONES = {
            # Rubro "Alimentos" -> "Alimentos y Bebidas"
            5: 'Alimentos y Bebidas',
            # Rubro "Servicios" (tipo producto) -> buscar el rubro de servicios más común o dejarlo
            3: None,  # Este es problemático, es "Servicios" pero tipo producto
        }
        
        migradas = 0
        
        with transaction.atomic():
            # Migrar "Alimentos" a "Alimentos y Bebidas"
            try:
                rubro_antiguo = Rubro.objects.get(id=5, activo=False)
                rubro_nuevo = Rubro.objects.get(nombre='Alimentos y Bebidas', tipo='producto', activo=True)
                
                empresas = Empresa.objects.filter(id_rubro=rubro_antiguo)
                count = empresas.count()
                
                if count > 0:
                    empresas.update(id_rubro=rubro_nuevo)
                    self.stdout.write(self.style.SUCCESS(
                        f"  ✓ Migradas {count} empresas de 'Alimentos' a 'Alimentos y Bebidas'"
                    ))
                    migradas += count
                    
                    # Ahora eliminar el rubro antiguo
                    SubRubro.objects.filter(rubro=rubro_antiguo).delete()
                    rubro_antiguo.delete()
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Eliminado rubro 'Alimentos' (ID: 5)"))
            except Rubro.DoesNotExist:
                self.stdout.write("  → Rubro 'Alimentos' ya no existe")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error migrando 'Alimentos': {e}"))
            
            # Para "Servicios" (tipo producto), es más complejo
            # Podríamos migrarlo a un rubro de servicios, pero primero verificar
            try:
                rubro_servicios = Rubro.objects.get(id=3, activo=False)
                empresas_servicios = Empresa.objects.filter(id_rubro=rubro_servicios)
                count_servicios = empresas_servicios.count()
                
                if count_servicios > 0:
                    # Intentar migrar a "Consultoría" como default de servicios
                    try:
                        rubro_consultoria = Rubro.objects.get(nombre='Consultoría', tipo='servicio', activo=True)
                        empresas_servicios.update(id_rubro=rubro_consultoria)
                        self.stdout.write(self.style.SUCCESS(
                            f"  ✓ Migradas {count_servicios} empresas de 'Servicios' (producto) a 'Consultoría' (servicio)"
                        ))
                        migradas += count_servicios
                        
                        # Eliminar el rubro antiguo
                        SubRubro.objects.filter(rubro=rubro_servicios).delete()
                        rubro_servicios.delete()
                        self.stdout.write(self.style.SUCCESS(f"  ✓ Eliminado rubro 'Servicios' (ID: 3)"))
                    except Rubro.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f"  ⚠ No se pudo migrar {count_servicios} empresas: rubro 'Consultoría' no encontrado"
                        ))
            except Rubro.DoesNotExist:
                self.stdout.write("  → Rubro 'Servicios' ya no existe")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error migrando 'Servicios': {e}"))
        
        # Resumen
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ MIGRACIÓN COMPLETADA"))
        self.stdout.write(f"  Empresas migradas: {migradas}")
        self.stdout.write(f"  Rubros desactivados restantes: {Rubro.objects.filter(activo=False).count()}")
        self.stdout.write("=" * 60)

