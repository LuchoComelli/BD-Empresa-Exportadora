"""
Comando de Django para configurar los roles del sistema con sus permisos correspondientes
"""
from django.core.management.base import BaseCommand
from apps.core.models import RolUsuario


class Command(BaseCommand):
    help = 'Configura los roles del sistema (Administrador, Analista, Consultor) con sus permisos correspondientes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Configurando roles del sistema...'))
        
        # ROL: ADMINISTRADOR - Acceso completo y control total
        admin, created = RolUsuario.objects.get_or_create(
            nombre='Administrador',
            defaults={
                'descripcion': 'Acceso completo y control total del sistema',
                'nivel_acceso': 3,
                'puede_crear_empresas': True,
                'puede_editar_empresas': True,
                'puede_eliminar_empresas': True,
                'puede_ver_auditoria': True,
                'puede_exportar_datos': True,
                'puede_importar_datos': True,
                'puede_gestionar_usuarios': True,
                'puede_acceder_admin': True,
                'puede_ver_usuarios': True,
                'puede_ver_configuracion': True,
                'puede_aprobar_empresas': True,
                'puede_ver_empresas_pendientes': True,
                'puede_ver_reportes': True,
                'puede_ver_mapa': True,
                'puede_ver_matriz': True,
                'activo': True,
            }
        )
        if not created:
            # Actualizar permisos existentes
            admin.descripcion = 'Acceso completo y control total del sistema'
            admin.nivel_acceso = 3
            admin.puede_crear_empresas = True
            admin.puede_editar_empresas = True
            admin.puede_eliminar_empresas = True
            admin.puede_ver_auditoria = True
            admin.puede_exportar_datos = True
            admin.puede_importar_datos = True
            admin.puede_gestionar_usuarios = True
            admin.puede_acceder_admin = True
            admin.puede_ver_usuarios = True
            admin.puede_ver_configuracion = True
            admin.puede_aprobar_empresas = True
            admin.puede_ver_empresas_pendientes = True
            admin.puede_ver_reportes = True
            admin.puede_ver_mapa = True
            admin.puede_ver_matriz = True
            admin.activo = True
            admin.save()
            self.stdout.write(self.style.SUCCESS('✓ Rol Administrador actualizado'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Rol Administrador creado'))
        
        # ROL: ANALISTA - Gestión y consulta de datos
        analista, created = RolUsuario.objects.get_or_create(
            nombre='Analista',
            defaults={
                'descripcion': 'Gestión y consulta de datos',
                'nivel_acceso': 2,
                'puede_crear_empresas': True,
                'puede_editar_empresas': True,
                'puede_eliminar_empresas': False,
                'puede_ver_auditoria': True,
                'puede_exportar_datos': True,
                'puede_importar_datos': True,
                'puede_gestionar_usuarios': False,
                'puede_acceder_admin': False,
                'puede_ver_usuarios': False,
                'puede_ver_configuracion': False,
                'puede_aprobar_empresas': True,
                'puede_ver_empresas_pendientes': True,
                'puede_ver_reportes': True,
                'puede_ver_mapa': True,
                'puede_ver_matriz': True,
                'activo': True,
            }
        )
        if not created:
            analista.descripcion = 'Gestión y consulta de datos'
            analista.nivel_acceso = 2
            analista.puede_crear_empresas = True
            analista.puede_editar_empresas = True
            analista.puede_eliminar_empresas = False
            analista.puede_ver_auditoria = True
            analista.puede_exportar_datos = True
            analista.puede_importar_datos = True
            analista.puede_gestionar_usuarios = False
            analista.puede_acceder_admin = False
            analista.puede_ver_usuarios = False
            analista.puede_ver_configuracion = False
            analista.puede_aprobar_empresas = True
            analista.puede_ver_empresas_pendientes = True
            analista.puede_ver_reportes = True
            analista.puede_ver_mapa = True
            analista.puede_ver_matriz = True
            analista.activo = True
            analista.save()
            self.stdout.write(self.style.SUCCESS('✓ Rol Analista actualizado'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Rol Analista creado'))
        
        # ROL: CONSULTOR - Visualización y exportación, sin modificar información
        consultor, created = RolUsuario.objects.get_or_create(
            nombre='Consultor',
            defaults={
                'descripcion': 'Visualización y exportación, sin modificar información',
                'nivel_acceso': 1,
                'puede_crear_empresas': False,
                'puede_editar_empresas': False,
                'puede_eliminar_empresas': False,
                'puede_ver_auditoria': False,
                'puede_exportar_datos': True,
                'puede_importar_datos': False,
                'puede_gestionar_usuarios': False,
                'puede_acceder_admin': False,
                'puede_ver_usuarios': False,
                'puede_ver_configuracion': False,
                'puede_aprobar_empresas': False,
                'puede_ver_empresas_pendientes': False,
                'puede_ver_reportes': True,
                'puede_ver_mapa': True,
                'puede_ver_matriz': True,
                'activo': True,
            }
        )
        if not created:
            consultor.descripcion = 'Visualización y exportación, sin modificar información'
            consultor.nivel_acceso = 1
            consultor.puede_crear_empresas = False
            consultor.puede_editar_empresas = False
            consultor.puede_eliminar_empresas = False
            consultor.puede_ver_auditoria = False
            consultor.puede_exportar_datos = True
            consultor.puede_importar_datos = False
            consultor.puede_gestionar_usuarios = False
            consultor.puede_acceder_admin = False
            consultor.puede_ver_usuarios = False
            consultor.puede_ver_configuracion = False
            consultor.puede_aprobar_empresas = False
            consultor.puede_ver_empresas_pendientes = False
            consultor.puede_ver_reportes = True
            consultor.puede_ver_mapa = True
            consultor.puede_ver_matriz = True
            consultor.activo = True
            consultor.save()
            self.stdout.write(self.style.SUCCESS('✓ Rol Consultor actualizado'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Rol Consultor creado'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ Todos los roles han sido configurados correctamente'))

