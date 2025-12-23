from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Prueba el envío de emails para verificar la configuración'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email de destino para la prueba',
            default=None
        )

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write(self.style.SUCCESS("📧 PRUEBA DE CONFIGURACIÓN DE EMAIL"))
        self.stdout.write("="*70)
        
        # Mostrar configuración actual
        self.stdout.write("\n📋 Configuración actual:")
        self.stdout.write(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
        self.stdout.write(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"  EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"  EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        self.stdout.write(f"  EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NO CONFIGURADO'}")
        self.stdout.write(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"  SITE_URL: {getattr(settings, 'SITE_URL', 'NO CONFIGURADO')}")
        
        # Verificar si hay credenciales
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            self.stdout.write(self.style.ERROR("\n❌ ERROR: EMAIL_HOST_USER o EMAIL_HOST_PASSWORD no están configurados"))
            self.stdout.write(self.style.WARNING("   Verifica el archivo docker.env"))
            return
        
        # Obtener email de destino
        email_destino = options.get('email')
        if not email_destino:
            email_destino = settings.EMAIL_HOST_USER  # Usar el mismo email configurado
        
        self.stdout.write(f"\n📬 Enviando email de prueba a: {email_destino}")
        
        try:
            # Enviar email de prueba
            resultado = send_mail(
                subject='Prueba de Email - Sistema de Gestión de Empresas Exportadoras',
                message='Este es un email de prueba para verificar la configuración del sistema.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_destino],
                html_message='''
                <html>
                <body>
                    <h2>Email de Prueba</h2>
                    <p>Este es un email de prueba para verificar la configuración del sistema.</p>
                    <p>Si recibes este email, la configuración está funcionando correctamente.</p>
                    <hr>
                    <p><small>Enviado desde: {}</small></p>
                </body>
                </html>
                '''.format(settings.EMAIL_HOST_USER),
                fail_silently=False,  # Lanzar excepciones para ver errores
            )
            
            if resultado:
                self.stdout.write(self.style.SUCCESS("\n✅ Email enviado exitosamente!"))
                self.stdout.write(f"   Revisa la bandeja de entrada de: {email_destino}")
                self.stdout.write(f"   (También revisa la carpeta de spam)")
            else:
                self.stdout.write(self.style.WARNING("\n⚠️  El email no se pudo enviar (send_mail retornó False)"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ ERROR al enviar email: {str(e)}"))
            self.stdout.write("\n💡 Posibles soluciones:")
            self.stdout.write("   1. Verifica que EMAIL_HOST_USER y EMAIL_HOST_PASSWORD sean correctos")
            self.stdout.write("   2. Asegúrate de usar una 'Contraseña de aplicación' de Gmail, no tu contraseña normal")
            self.stdout.write("   3. Verifica que la verificación en 2 pasos esté habilitada en Gmail")
            self.stdout.write("   4. Revisa los logs de Docker: docker-compose logs backend --tail=100")
            logger.exception("Error al enviar email de prueba")
        
        self.stdout.write("\n" + "="*70)

