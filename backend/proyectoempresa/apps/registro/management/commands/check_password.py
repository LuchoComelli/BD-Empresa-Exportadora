from django.core.management.base import BaseCommand
from apps.core.models import Usuario
from apps.registro.models import SolicitudRegistro


class Command(BaseCommand):
    help = 'Verificar contraseña de un usuario'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email del usuario')
        parser.add_argument('password', type=str, help='Contraseña a verificar')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        
        try:
            usuario = Usuario.objects.get(email=email)
            self.stdout.write(f"Usuario encontrado: {usuario.email}")
            self.stdout.write(f"Nombre: {usuario.nombre} {usuario.apellido}")
            self.stdout.write(f"Activo: {usuario.is_active}")
            self.stdout.write(f"Rol: {usuario.rol.nombre if usuario.rol else 'Sin rol'}")
            self.stdout.write(f"\nVerificando contraseña '{password}':")
            
            # Verificar contraseña
            if usuario.check_password(password):
                self.stdout.write(self.style.SUCCESS("✅ La contraseña es CORRECTA"))
            else:
                self.stdout.write(self.style.ERROR("❌ La contraseña es INCORRECTA"))
                
                # Intentar con diferentes variaciones
                self.stdout.write("\nProbando variaciones:")
                variations = [
                    password,
                    password.replace('-', ''),
                    password.replace(' ', ''),
                    password.strip(),
                ]
                for var in variations:
                    if usuario.check_password(var):
                        self.stdout.write(self.style.SUCCESS(f"✅ La contraseña '{var}' es CORRECTA"))
                        break
                
                # Verificar cómo se guardó el CUIT original
                solicitud = SolicitudRegistro.objects.filter(usuario_creado=usuario).first()
                if solicitud:
                    cuit_original = solicitud.cuit_cuil
                    self.stdout.write(f"\nCUIT original en la solicitud: '{cuit_original}'")
                    cuit_limpio = cuit_original.replace('-', '').replace(' ', '').strip()
                    self.stdout.write(f"CUIT limpio: '{cuit_limpio}'")
                    if usuario.check_password(cuit_limpio):
                        self.stdout.write(self.style.SUCCESS(f"✅ La contraseña debería ser: '{cuit_limpio}'"))
                    else:
                        self.stdout.write(self.style.WARNING(f"⚠️ La contraseña tampoco coincide con '{cuit_limpio}'"))
            
        except Usuario.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ Usuario con email '{email}' no encontrado"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))

