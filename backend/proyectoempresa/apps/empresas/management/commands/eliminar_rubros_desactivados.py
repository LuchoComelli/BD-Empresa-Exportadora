"""
Comando para eliminar completamente los rubros desactivados de la base de datos
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro, Empresa


class Command(BaseCommand):
    help = 'Eliminar rubros desactivados que no están en uso'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("ELIMINANDO RUBROS DESACTIVADOS"))
        self.stdout.write("=" * 60)
        
        rubros_desactivados = Rubro.objects.filter(activo=False)
        
        if not rubros_desactivados.exists():
            self.stdout.write("\n✓ No hay rubros desactivados para eliminar")
            return
        
        self.stdout.write(f"\n🔍 Encontrados {rubros_desactivados.count()} rubros desactivados")
        
        eliminados = 0
        en_uso = 0
        
        for rubro in rubros_desactivados:
            # Verificar si está en uso
            empresas_usando = Empresa.objects.filter(id_rubro=rubro).count()
            
            if empresas_usando > 0:
                self.stdout.write(self.style.WARNING(
                    f"  ⚠ {rubro.nombre} (ID: {rubro.id}) está en uso por {empresas_usando} empresa(s) - NO se eliminará"
                ))
                en_uso += 1
            else:
                # Eliminar subrubros primero
                subrubros_count = SubRubro.objects.filter(rubro=rubro).count()
                SubRubro.objects.filter(rubro=rubro).delete()
                
                # Eliminar el rubro
                rubro_nombre = rubro.nombre
                rubro.delete()
                
                self.stdout.write(self.style.SUCCESS(
                    f"  ✓ Eliminado: {rubro_nombre} ({subrubros_count} subrubros eliminados)"
                ))
                eliminados += 1
        
        # Resumen
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ PROCESO COMPLETADO"))
        self.stdout.write(f"  Rubros eliminados: {eliminados}")
        self.stdout.write(f"  Rubros en uso (no eliminados): {en_uso}")
        self.stdout.write(f"  Rubros activos restantes: {Rubro.objects.filter(activo=True).count()}")
        self.stdout.write("=" * 60)

