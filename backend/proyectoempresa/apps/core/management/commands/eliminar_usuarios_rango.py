from django.core.management.base import BaseCommand
from apps.core.models import Usuario
from apps.empresas.models import Empresa


class Command(BaseCommand):
    help = 'Eliminar usuarios por rango de IDs y sus empresas relacionadas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ids',
            type=str,
            help='IDs de usuarios a eliminar (ej: "7-42,44" para IDs del 7 al 42 y el 44)',
            default='7-42,44'
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmar eliminación automáticamente sin pedir confirmación',
        )

    def handle(self, *args, **options):
        ids_str = options['ids']
        auto_confirm = options['confirm']
        
        # Parsear IDs
        ids_usuarios = []
        partes = ids_str.split(',')
        for parte in partes:
            parte = parte.strip()
            if '-' in parte:
                # Rango
                inicio, fin = parte.split('-')
                ids_usuarios.extend(range(int(inicio), int(fin) + 1))
            else:
                # ID individual
                ids_usuarios.append(int(parte))
        
        ids_usuarios = sorted(set(ids_usuarios))  # Eliminar duplicados y ordenar
        
        self.stdout.write("=" * 60)
        self.stdout.write("ELIMINACIÓN DE USUARIOS Y EMPRESAS")
        self.stdout.write("=" * 60)
        self.stdout.write(f"\n📋 IDs de usuarios a eliminar: {ids_usuarios}")
        self.stdout.write(f"📊 Total de usuarios: {len(ids_usuarios)}\n")
        
        # Verificar qué usuarios existen
        usuarios_existentes = Usuario.objects.filter(id__in=ids_usuarios)
        usuarios_no_existentes = set(ids_usuarios) - set(usuarios_existentes.values_list('id', flat=True))
        
        if usuarios_no_existentes:
            self.stdout.write(self.style.WARNING(
                f"⚠️  Usuarios no encontrados (serán ignorados): {sorted(usuarios_no_existentes)}\n"
            ))
        
        if not usuarios_existentes.exists():
            self.stdout.write(self.style.ERROR("❌ No se encontraron usuarios para eliminar."))
            return
        
        self.stdout.write(self.style.SUCCESS(f"✅ Usuarios encontrados: {usuarios_existentes.count()}\n"))
        
        # Mostrar información de usuarios y sus empresas
        total_empresas = 0
        self.stdout.write("📋 DETALLE DE USUARIOS Y SUS EMPRESAS:")
        self.stdout.write("-" * 60)
        
        for usuario in usuarios_existentes:
            empresas = Empresa.objects.filter(id_usuario=usuario)
            total_empresas += empresas.count()
            
            self.stdout.write(f"\n👤 Usuario ID {usuario.id}: {usuario.get_full_name()} ({usuario.email})")
            self.stdout.write(f"   📊 Empresas relacionadas: {empresas.count()}")
            
            if empresas.exists():
                for empresa in empresas:
                    self.stdout.write(
                        f"      - ID {empresa.id}: {empresa.razon_social} (CUIT: {empresa.cuit_cuil})"
                    )
        
        self.stdout.write("\n" + "-" * 60)
        self.stdout.write(f"📊 RESUMEN:")
        self.stdout.write(f"   - Usuarios a eliminar: {usuarios_existentes.count()}")
        self.stdout.write(f"   - Empresas a eliminar: {total_empresas}")
        self.stdout.write("-" * 60)
        
        # Confirmar eliminación
        if not auto_confirm:
            respuesta = input("\n⚠️  ¿Estás seguro de que deseas eliminar estos usuarios y empresas? (escribe 'SI' para confirmar): ")
            
            if respuesta != 'SI':
                self.stdout.write(self.style.ERROR("\n❌ Operación cancelada."))
                return
        else:
            self.stdout.write(self.style.WARNING("\n⚠️  Modo automático: se procederá con la eliminación sin confirmación."))
        
        # Eliminar empresas primero (aunque CASCADE lo haría automáticamente)
        self.stdout.write("\n🗑️  Eliminando empresas...")
        empresas_eliminadas = 0
        
        for usuario in usuarios_existentes:
            empresas = Empresa.objects.filter(id_usuario=usuario)
            count = empresas.count()
            empresas.delete()
            empresas_eliminadas += count
            self.stdout.write(self.style.SUCCESS(f"   ✅ Eliminadas {count} empresa(s) del usuario ID {usuario.id}"))
        
        # Eliminar usuarios
        self.stdout.write("\n🗑️  Eliminando usuarios...")
        usuarios_eliminados = usuarios_existentes.count()
        usuarios_existentes.delete()
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ ELIMINACIÓN COMPLETADA"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"   - Usuarios eliminados: {usuarios_eliminados}")
        self.stdout.write(f"   - Empresas eliminadas: {empresas_eliminadas}")
        self.stdout.write("=" * 60)

