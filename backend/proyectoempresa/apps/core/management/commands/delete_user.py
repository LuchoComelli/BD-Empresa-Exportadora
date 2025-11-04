from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Eliminar un usuario por email'

    def add_arguments(self, parser):
        parser.add_argument(
            'email',
            type=str,
            help='Email del usuario a eliminar',
        )

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            usuario = User.objects.get(email=email)
            email_usuario = usuario.email
            usuario.delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Usuario {email_usuario} eliminado exitosamente'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'✗ Usuario {email} no encontrado'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error al eliminar usuario: {str(e)}'))

