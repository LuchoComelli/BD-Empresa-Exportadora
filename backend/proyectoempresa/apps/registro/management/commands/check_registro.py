from django.core.management.base import BaseCommand
from apps.registro.models import SolicitudRegistro
from apps.core.models import Usuario


class Command(BaseCommand):
    help = 'Verificar registros y usuarios creados en la base de datos'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS("ÚLTIMAS SOLICITUDES DE REGISTRO"))
        self.stdout.write("=" * 70)
        
        solicitudes = SolicitudRegistro.objects.all().order_by('-fecha_creacion')[:5]
        if solicitudes:
            for s in solicitudes:
                self.stdout.write(f"\n📋 SOLICITUD ID: {s.id}")
                self.stdout.write(f"   Razón Social: {s.razon_social}")
                self.stdout.write(f"   CUIT: {s.cuit_cuil}")
                self.stdout.write(f"   Estado: {self.style.WARNING(s.estado)}")
                self.stdout.write(f"   Email Contacto: {s.email_contacto}")
                self.stdout.write(f"   Correo: {s.correo}")
                if s.usuario_creado:
                    self.stdout.write(self.style.SUCCESS(f"   ✅ Usuario Creado: {s.usuario_creado.email}"))
                    self.stdout.write(f"      Usuario ID: {s.usuario_creado.id}, Rol: {s.usuario_creado.rol.nombre if s.usuario_creado.rol else 'Sin rol'}")
                else:
                    self.stdout.write(self.style.ERROR("   ❌ Usuario NO CREADO"))
                self.stdout.write(f"   Fecha: {s.fecha_creacion}")
                self.stdout.write("-" * 70)
        else:
            self.stdout.write(self.style.WARNING("❌ No hay solicitudes de registro en la base de datos"))

        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.SUCCESS("ÚLTIMOS USUARIOS CON ROL EMPRESA"))
        self.stdout.write("=" * 70)
        
        usuarios = Usuario.objects.filter(rol__nombre='Empresa').order_by('-date_joined')[:5]
        if usuarios:
            for u in usuarios:
                self.stdout.write(f"\n👤 USUARIO ID: {u.id}")
                self.stdout.write(f"   Email: {u.email}")
                self.stdout.write(f"   Nombre: {u.nombre} {u.apellido}")
                self.stdout.write(f"   Rol: {u.rol.nombre if u.rol else 'Sin rol'}")
                self.stdout.write(f"   Activo: {'✅ Sí' if u.is_active else '❌ No'}")
                self.stdout.write(f"   Fecha Registro: {u.date_joined}")
                self.stdout.write("-" * 70)
        else:
            self.stdout.write(self.style.WARNING("❌ No hay usuarios con rol Empresa en la base de datos"))

