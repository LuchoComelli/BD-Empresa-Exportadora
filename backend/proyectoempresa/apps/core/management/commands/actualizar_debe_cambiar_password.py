"""
Comando de Django para actualizar el campo debe_cambiar_password
para usuarios empresa que deberían tenerlo en True.
"""
from django.core.management.base import BaseCommand
from apps.core.models import Usuario, RolUsuario


class Command(BaseCommand):
    help = 'Actualiza debe_cambiar_password=True para usuarios empresa que no lo tienen'

    def handle(self, *args, **options):
        try:
            # Obtener el rol de Empresa
            rol_empresa = RolUsuario.objects.filter(nombre='Empresa').first()
            
            if not rol_empresa:
                self.stdout.write(
                    self.style.WARNING('No se encontró el rol "Empresa"')
                )
                return
            
            # Buscar usuarios empresa que no tienen debe_cambiar_password=True
            usuarios_empresa = Usuario.objects.filter(
                rol=rol_empresa,
                debe_cambiar_password=False
            )
            
            count = 0
            for usuario in usuarios_empresa:
                usuario.debe_cambiar_password = True
                usuario.save()
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Actualizado: {usuario.email} (ID: {usuario.id})'
                    )
                )
            
            if count == 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        'No se encontraron usuarios empresa que necesiten actualización'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n✓ Total de usuarios actualizados: {count}'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )

