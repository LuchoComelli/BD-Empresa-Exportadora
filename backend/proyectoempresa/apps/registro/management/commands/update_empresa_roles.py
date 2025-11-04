from django.core.management.base import BaseCommand
from apps.core.models import RolUsuario
from apps.registro.models import SolicitudRegistro
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Actualiza el rol de usuarios registrados mediante el formulario público a "Empresa"'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales (solo mostrar qué se haría)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar actualización incluso si tienen roles Admin/Consultor/Analista',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options.get('force', False)
        
        # Obtener rol Empresa
        try:
            rol_empresa = RolUsuario.objects.get(nombre='Empresa')
            self.stdout.write(self.style.SUCCESS(f'✓ Rol "Empresa" encontrado (ID: {rol_empresa.id})'))
        except RolUsuario.DoesNotExist:
            self.stdout.write(self.style.ERROR('✗ Error: Rol "Empresa" no existe. Por favor, carga el fixture primero.'))
            return

        # Buscar usuarios que tienen una SolicitudRegistro asociada
        # Estos son usuarios que se registraron mediante el formulario público
        # El campo relacionado en SolicitudRegistro se llama 'usuario_creado'
        # y el related_name es 'solicitud_registro' (con guión bajo)
        usuarios_con_solicitud = User.objects.filter(
            solicitud_registro__isnull=False
        ).distinct()

        self.stdout.write(f'\nUsuarios encontrados con solicitud de registro: {usuarios_con_solicitud.count()}')

        # Mostrar información de cada usuario
        if usuarios_con_solicitud.count() > 0:
            self.stdout.write('\nDetalle de usuarios con solicitud:')
            for usuario in usuarios_con_solicitud:
                rol_actual = usuario.rol.nombre if usuario.rol else 'Sin rol'
                self.stdout.write(f'  - {usuario.email}: rol={rol_actual}')

        # Filtrar usuarios que no tienen el rol "Empresa" o no tienen rol
        usuarios_a_actualizar = usuarios_con_solicitud.filter(
            rol__isnull=True
        ) | usuarios_con_solicitud.exclude(rol__nombre='Empresa')
        
        # Excluir usuarios que tienen roles Admin, Consultor o Analista
        # (estos fueron creados por administradores y no deben cambiarse)
        # A menos que se use --force
        if not force:
            usuarios_a_actualizar = usuarios_a_actualizar.exclude(
                rol__nombre__in=['Administrador', 'Consultor', 'Analista']
            ).distinct()
        else:
            self.stdout.write(self.style.WARNING('\n⚠ Modo FORCE: Actualizará usuarios incluso si tienen roles Admin/Consultor/Analista'))
            usuarios_a_actualizar = usuarios_a_actualizar.distinct()

        self.stdout.write(f'\nUsuarios a actualizar con rol "Empresa": {usuarios_a_actualizar.count()}')

        if usuarios_a_actualizar.count() == 0:
            self.stdout.write(self.style.SUCCESS('\n✓ Todos los usuarios ya tienen el rol correcto.'))
            return

        # Mostrar usuarios que se actualizarán
        self.stdout.write('\nUsuarios que se actualizarán:')
        for usuario in usuarios_a_actualizar:
            rol_actual = usuario.rol.nombre if usuario.rol else 'Sin rol'
            self.stdout.write(f'  - {usuario.email} (rol actual: {rol_actual})')

        if dry_run:
            self.stdout.write(self.style.WARNING('\n⚠ Modo DRY-RUN: No se realizaron cambios.'))
            self.stdout.write('Ejecuta sin --dry-run para aplicar los cambios.')
        else:
            # Confirmar antes de actualizar (solo si no se usa --force)
            if not force:
                confirmacion = input('\n¿Deseas continuar con la actualización? (s/N): ')
                if confirmacion.lower() != 's':
                    self.stdout.write(self.style.WARNING('Operación cancelada.'))
                    return
            else:
                self.stdout.write('\n⚠ Modo FORCE activado: Actualizando automáticamente...')

            # Actualizar usuarios
            actualizados = usuarios_a_actualizar.update(rol=rol_empresa)
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ {actualizados} usuarios actualizados con rol "Empresa".'))

            # Verificar usuarios con rol Empresa
            usuarios_empresa = User.objects.filter(rol__nombre='Empresa')
            self.stdout.write(f'\nTotal de usuarios con rol "Empresa": {usuarios_empresa.count()}')
            
            # Mostrar lista de usuarios actualizados
            if actualizados > 0:
                self.stdout.write('\nUsuarios actualizados:')
                usuarios_actualizados = User.objects.filter(
                    id__in=[u.id for u in usuarios_a_actualizar]
                )
                for usuario in usuarios_actualizados:
                    self.stdout.write(f'  - {usuario.email}')

