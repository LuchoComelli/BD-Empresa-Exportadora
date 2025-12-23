from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro
from django.db import transaction


class Command(BaseCommand):
    help = 'Fusiona rubros duplicados: Textil y Otro'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS("🔧 SCRIPT DE FUSIÓN DE RUBROS DUPLICADOS"))
        self.stdout.write("="*60)
        
        try:
            # 1. Fusionar rubros Textil
            self.fusionar_rubros_textil()
            
            # 2. Eliminar rubro Otro duplicado en productos
            self.eliminar_rubro_otro_duplicado()
            
            # 3. Crear rubro Otro en servicios si no existe
            self.crear_rubro_otro_servicio()
            
            self.stdout.write("\n" + "="*60)
            self.stdout.write(self.style.SUCCESS("🎉 PROCESO COMPLETADO EXITOSAMENTE"))
            self.stdout.write("="*60)
            
            # Mostrar resumen final
            self.mostrar_resumen()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ ERROR: {str(e)}"))
            import traceback
            traceback.print_exc()
            raise

    @transaction.atomic
    def fusionar_rubros_textil(self):
        """
        Fusiona los dos rubros Textil (producto) en uno solo,
        combinando todos los sub-rubros.
        """
        self.stdout.write("🔍 Buscando rubros Textil duplicados...")
        
        rubros_textil = Rubro.objects.filter(nombre='Textil', tipo='producto').order_by('id')
        
        if rubros_textil.count() < 2:
            self.stdout.write(self.style.SUCCESS("✅ No hay rubros Textil duplicados"))
            return
        
        # Mantener el rubro con ID más bajo (ID 10 según el script)
        rubro_principal = rubros_textil.first()
        rubro_duplicado = rubros_textil.last()
        
        self.stdout.write(f"📌 Rubro principal: ID {rubro_principal.id} - {rubro_principal.nombre}")
        self.stdout.write(f"📌 Rubro a fusionar: ID {rubro_duplicado.id} - {rubro_duplicado.nombre}")
        
        # Obtener sub-rubros de ambos
        subrubros_principal = set(sr.nombre for sr in rubro_principal.subrubros.all())
        subrubros_duplicado = rubro_duplicado.subrubros.all()
        
        self.stdout.write(f"\n📋 Sub-rubros del rubro principal ({len(subrubros_principal)}):")
        for sr in rubro_principal.subrubros.all():
            self.stdout.write(f"  - {sr.nombre}")
        
        self.stdout.write(f"\n📋 Sub-rubros del rubro duplicado ({subrubros_duplicado.count()}):")
        for sr in subrubros_duplicado:
            self.stdout.write(f"  - {sr.nombre}")
        
        # Mover sub-rubros que no estén duplicados
        subrubros_movidos = 0
        subrubros_duplicados_eliminados = 0
        
        for subrubro in subrubros_duplicado:
            if subrubro.nombre not in subrubros_principal:
                # Mover el sub-rubro al rubro principal
                subrubro.rubro = rubro_principal
                subrubro.save()
                subrubros_movidos += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ Movido: {subrubro.nombre}"))
            else:
                # Eliminar el sub-rubro duplicado
                self.stdout.write(self.style.WARNING(f"  ⚠️  Duplicado, eliminando: {subrubro.nombre}"))
                subrubro.delete()
                subrubros_duplicados_eliminados += 1
        
        # Eliminar el rubro duplicado
        self.stdout.write(f"\n🗑️  Eliminando rubro duplicado (ID {rubro_duplicado.id})...")
        rubro_duplicado.delete()
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Fusión completada:"))
        self.stdout.write(f"  - Sub-rubros movidos: {subrubros_movidos}")
        self.stdout.write(f"  - Sub-rubros duplicados eliminados: {subrubros_duplicados_eliminados}")
        self.stdout.write(f"  - Total sub-rubros en rubro principal: {rubro_principal.subrubros.count()}")


    @transaction.atomic
    def eliminar_rubro_otro_duplicado(self):
        """
        Elimina el rubro Otro duplicado en productos.
        Mantiene el rubro con ID más bajo.
        """
        self.stdout.write("\n🔍 Buscando rubros Otro duplicados en productos...")
        
        rubros_otro = Rubro.objects.filter(nombre='Otro', tipo='producto').order_by('id')
        
        if rubros_otro.count() < 2:
            self.stdout.write(self.style.SUCCESS("✅ No hay rubros Otro duplicados en productos"))
            return
        
        # Mantener el rubro con ID más bajo (ID 27 según el script)
        rubro_principal = rubros_otro.first()
        rubro_duplicado = rubros_otro.last()
        
        self.stdout.write(f"📌 Rubro principal: ID {rubro_principal.id} - {rubro_principal.nombre}")
        self.stdout.write(f"📌 Rubro a eliminar: ID {rubro_duplicado.id} - {rubro_duplicado.nombre}")
        
        # Verificar si hay empresas usando el rubro duplicado
        from apps.empresas.models import Empresa, Empresaproducto, Empresaservicio, EmpresaMixta
        
        empresas_producto = Empresaproducto.objects.filter(id_rubro=rubro_duplicado).count()
        empresas_mixta = EmpresaMixta.objects.filter(id_rubro=rubro_duplicado).count()
        
        if empresas_producto > 0 or empresas_mixta > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Advertencia: Hay {empresas_producto + empresas_mixta} empresa(s) usando el rubro duplicado"))
            self.stdout.write(f"   Migrando empresas al rubro principal...")
            
            # Migrar empresas al rubro principal
            Empresaproducto.objects.filter(id_rubro=rubro_duplicado).update(id_rubro=rubro_principal)
            EmpresaMixta.objects.filter(id_rubro=rubro_duplicado).update(id_rubro=rubro_principal)
            
            self.stdout.write(self.style.SUCCESS(f"   ✅ Empresas migradas"))
        
        # Eliminar sub-rubros del rubro duplicado
        subrubros_duplicado = rubro_duplicado.subrubros.all()
        for subrubro in subrubros_duplicado:
            # Los sub-rubros no se usan directamente en ProductoEmpresa/ServicioEmpresa
            # Solo se eliminan si no hay referencias (aunque en este caso son iguales, solo eliminamos)
            subrubro.delete()
        
        # Eliminar el rubro duplicado
        self.stdout.write(f"🗑️  Eliminando rubro duplicado (ID {rubro_duplicado.id})...")
        rubro_duplicado.delete()
        
        self.stdout.write(self.style.SUCCESS(f"✅ Rubro Otro duplicado eliminado"))


    @transaction.atomic
    def crear_rubro_otro_servicio(self):
        """
        Crea el rubro Otro en servicios si no existe.
        """
        self.stdout.write("\n🔍 Verificando rubro Otro en servicios...")
        
        rubro_otro_servicio = Rubro.objects.filter(nombre='Otro', tipo='servicio').first()
        
        if rubro_otro_servicio:
            self.stdout.write(self.style.SUCCESS(f"✅ El rubro Otro ya existe en servicios (ID {rubro_otro_servicio.id})"))
            return
        
        # Crear el rubro Otro en servicios
        self.stdout.write("📝 Creando rubro Otro en servicios...")
        # Usar get_or_create para evitar problemas con IDs
        from django.db.models import Max
        max_id = Rubro.objects.aggregate(max_id=Max('id'))['max_id'] or 0
        next_id = max_id + 1
        
        # Verificar que el ID no exista
        while Rubro.objects.filter(id=next_id).exists():
            next_id += 1
        
        rubro_otro_servicio, created = Rubro.objects.get_or_create(
            nombre='Otro',
            tipo='servicio',
            defaults={
                'id': next_id,
                'descripcion': '',
                'activo': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Rubro Otro creado en servicios (ID {rubro_otro_servicio.id})"))
        else:
            self.stdout.write(self.style.SUCCESS(f"✅ El rubro Otro ya existe en servicios (ID {rubro_otro_servicio.id})"))
        
        # Crear el sub-rubro Otro si no existe
        # Encontrar el siguiente ID disponible
        max_subrubro_id = SubRubro.objects.aggregate(max_id=Max('id'))['max_id'] or 0
        next_subrubro_id = max_subrubro_id + 1
        
        # Verificar que el ID no exista
        while SubRubro.objects.filter(id=next_subrubro_id).exists():
            next_subrubro_id += 1
        
        subrubro, subrubro_created = SubRubro.objects.get_or_create(
            nombre='Otro',
            rubro=rubro_otro_servicio,
            defaults={
                'id': next_subrubro_id,
                'descripcion': '',
                'activo': True
            }
        )
        
        if subrubro_created:
            self.stdout.write(self.style.SUCCESS(f"✅ Sub-rubro Otro creado (ID {subrubro.id})"))
        else:
            self.stdout.write(f"✅ Sub-rubro Otro ya existe (ID {subrubro.id})")

    def mostrar_resumen(self):
        """Muestra un resumen final del proceso"""
        self.stdout.write("\n📊 RESUMEN FINAL:")
        rubros_textil = Rubro.objects.filter(nombre='Textil', tipo='producto')
        self.stdout.write(f"  - Rubros Textil (producto): {rubros_textil.count()}")
        if rubros_textil.exists():
            rubro = rubros_textil.first()
            self.stdout.write(f"    ID {rubro.id}: {rubro.subrubros.count()} sub-rubros")
        
        rubros_otro_producto = Rubro.objects.filter(nombre='Otro', tipo='producto')
        self.stdout.write(f"  - Rubros Otro (producto): {rubros_otro_producto.count()}")
        
        rubros_otro_servicio = Rubro.objects.filter(nombre='Otro', tipo='servicio')
        self.stdout.write(f"  - Rubros Otro (servicio): {rubros_otro_servicio.count()}")

