"""
Comando para verificar que todos los rubros tengan el subrubro 'Otro'
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro


class Command(BaseCommand):
    help = 'Verificar rubros y subrubros Otro'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("VERIFICACIÓN DE RUBROS Y SUBRUBROS 'OTRO'"))
        self.stdout.write("=" * 60)
        
        # Verificar rubro "Otro" de productos
        otro_prod = Rubro.objects.filter(tipo='producto', nombre='Otro', activo=True).first()
        otro_serv = Rubro.objects.filter(tipo='servicio', nombre='Otro', activo=True).first()
        
        self.stdout.write("\n📦 RUBRO 'OTRO' DE PRODUCTOS:")
        if otro_prod:
            self.stdout.write(self.style.SUCCESS(f"  ✓ Existe: {otro_prod.nombre} (ID: {otro_prod.id})"))
            self.stdout.write(f"     Subrubros: {otro_prod.subrubros.filter(activo=True).count()}")
        else:
            self.stdout.write(self.style.ERROR("  ✗ No encontrado"))
        
        self.stdout.write("\n🔧 RUBRO 'OTRO' DE SERVICIOS:")
        if otro_serv:
            self.stdout.write(self.style.SUCCESS(f"  ✓ Existe: {otro_serv.nombre} (ID: {otro_serv.id})"))
            self.stdout.write(f"     Subrubros: {otro_serv.subrubros.filter(activo=True).count()}")
        else:
            self.stdout.write(self.style.ERROR("  ✗ No encontrado"))
        
        # Verificar subrubros "Otro" en todos los rubros
        self.stdout.write("\n📋 SUBRUBROS 'OTRO' EN RUBROS DE PRODUCTOS:")
        rubros_productos = Rubro.objects.filter(tipo='producto', activo=True).exclude(nombre='Otro')
        con_otro = 0
        sin_otro = []
        for rubro in rubros_productos:
            tiene_otro = SubRubro.objects.filter(rubro=rubro, nombre='Otro', activo=True).exists()
            if tiene_otro:
                con_otro += 1
            else:
                sin_otro.append(rubro.nombre)
        
        self.stdout.write(f"  Rubros con 'Otro': {con_otro}/{rubros_productos.count()}")
        if sin_otro:
            self.stdout.write(self.style.WARNING(f"  ⚠ Rubros sin 'Otro': {', '.join(sin_otro)}"))
        
        self.stdout.write("\n📋 SUBRUBROS 'OTRO' EN RUBROS DE SERVICIOS:")
        rubros_servicios = Rubro.objects.filter(tipo='servicio', activo=True).exclude(nombre='Otro')
        con_otro_serv = 0
        sin_otro_serv = []
        for rubro in rubros_servicios:
            tiene_otro = SubRubro.objects.filter(rubro=rubro, nombre='Otro', activo=True).exists()
            if tiene_otro:
                con_otro_serv += 1
            else:
                sin_otro_serv.append(rubro.nombre)
        
        self.stdout.write(f"  Rubros con 'Otro': {con_otro_serv}/{rubros_servicios.count()}")
        if sin_otro_serv:
            self.stdout.write(self.style.WARNING(f"  ⚠ Rubros sin 'Otro': {', '.join(sin_otro_serv)}"))
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ VERIFICACIÓN COMPLETADA"))
        self.stdout.write("=" * 60)

