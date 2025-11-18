"""
Comando para crear empresas de prueba (2 de cada tipo: producto, servicio, mixta)
para verificar que el flujo de registro funcione correctamente.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from apps.registro.models import SolicitudRegistro
from apps.registro.views import crear_empresa_desde_solicitud
from apps.core.models import RolUsuario, Dpto, Municipio, Localidades
from apps.empresas.models import Rubro, TipoEmpresa
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Crear empresas de prueba (2 de cada tipo: producto, servicio, mixta)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creando empresas de prueba...'))
        
        # Obtener o crear rol de Empresa
        rol_empresa, _ = RolUsuario.objects.get_or_create(nombre='Empresa')
        
        # Obtener o crear departamento
        dpto = Dpto.objects.filter(nomdpto='Capital').first()
        if not dpto:
            # Buscar un código único
            codigos_existentes = set(Dpto.objects.values_list('coddpto', flat=True))
            codigo = 'CAP'
            counter = 1
            while codigo in codigos_existentes:
                codigo = f'CAP{counter}'
                counter += 1
            dpto = Dpto.objects.create(nomdpto='Capital', coddpto=codigo)
        
        # Obtener o crear rubro
        rubro, _ = Rubro.objects.get_or_create(
            nombre='Agrícola',
            defaults={'descripcion': 'Rubro agrícola'}
        )
        
        # Obtener tipo de empresa
        tipo_empresa, _ = TipoEmpresa.objects.get_or_create(
            nombre='Producto',
            defaults={'descripcion': 'Empresa de productos'}
        )
        
        empresas_creadas = []
        
        # Crear 2 empresas de PRODUCTO
        for i in range(1, 3):
            email = f'producto{i}@test.com'
            cuit = f'2012345678{i}'
            
            # Crear usuario
            usuario, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'password': make_password(cuit),
                    'rol': rol_empresa
                }
            )
            if created:
                usuario.rol = rol_empresa
                usuario.save()
            
            # Crear solicitud
            solicitud = SolicitudRegistro.objects.create(
                razon_social=f'Empresa Producto {i} S.A.',
                nombre_fantasia=f'Producto{i}',
                cuit_cuil=cuit,
                tipo_empresa='producto',
                rubro_principal='Agrícola',
                direccion=f'Calle {i} 123',
                departamento='Capital',
                provincia='Jujuy',
                telefono=f'+54 9 11 1234-567{i}',
                correo=email,
                nombre_contacto=f'Contacto Producto {i}',
                cargo_contacto='Gerente',
                telefono_contacto=f'+54 9 11 1234-567{i}',
                email_contacto=email,
                exporta='si',
                destino_exportacion='Brasil, Chile',
                importa='no',
                certificado_pyme='si',
                certificaciones='SENASA, INV',
                material_promocional_idiomas='si',
                idiomas_trabajo='Español, Inglés',
                estado='pendiente',
                productos=[
                    {
                        'nombre': f'Producto {i}',
                        'descripcion': f'Descripción del producto {i}',
                        'capacidad_productiva': '1000',
                        'posicion_arancelaria': '12345678'
                    }
                ],
                servicios_ofrecidos=[],
                actividades_promocion=[],
                contactos_secundarios=[],
            )
            solicitud.usuario_creado = usuario
            solicitud.save()
            
            # Aprobar y crear empresa
            try:
                empresa = crear_empresa_desde_solicitud(solicitud)
                solicitud.estado = 'aprobada'
                # Solo asignar empresa_creada si es Empresaproducto
                from apps.empresas.models import Empresaproducto
                if isinstance(empresa, Empresaproducto):
                    solicitud.empresa_creada = empresa
                solicitud.save()
                empresas_creadas.append(('producto', empresa.id, solicitud.id))
                self.stdout.write(self.style.SUCCESS(f'✓ Empresa Producto {i} creada (ID: {empresa.id})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error al crear Empresa Producto {i}: {str(e)}'))
                logger.error(f'Error al crear Empresa Producto {i}: {str(e)}', exc_info=True)
        
        # Crear 2 empresas de SERVICIO
        tipo_empresa_servicio, _ = TipoEmpresa.objects.get_or_create(
            nombre='Servicio',
            defaults={'descripcion': 'Empresa de servicios'}
        )
        
        for i in range(1, 3):
            email = f'servicio{i}@test.com'
            cuit = f'3012345678{i}'
            
            # Crear usuario
            usuario, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'password': make_password(cuit),
                    'rol': rol_empresa
                }
            )
            if created:
                usuario.rol = rol_empresa
                usuario.save()
            
            # Crear solicitud
            solicitud = SolicitudRegistro.objects.create(
                razon_social=f'Empresa Servicio {i} S.A.',
                nombre_fantasia=f'Servicio{i}',
                cuit_cuil=cuit,
                tipo_empresa='servicio',
                rubro_principal='Servicios',
                direccion=f'Av. {i} 456',
                departamento='Capital',
                provincia='Jujuy',
                telefono=f'+54 9 11 2345-678{i}',
                correo=email,
                nombre_contacto=f'Contacto Servicio {i}',
                cargo_contacto='Director',
                telefono_contacto=f'+54 9 11 2345-678{i}',
                email_contacto=email,
                sitioweb=f'https://servicio{i}.com',
                exporta='si',
                destino_exportacion='Uruguay, Paraguay',
                importa='no',
                certificado_pyme='si',
                certificaciones='ISO 9001',
                material_promocional_idiomas='si',
                idiomas_trabajo='Español, Portugués',
                estado='pendiente',
                productos=[],
                servicios_ofrecidos=[
                    {
                        'nombre': f'Servicio {i}',
                        'descripcion': f'Descripción del servicio {i}',
                        'tipo_servicio': 'consultoria',
                        'sector_atendido': 'pymes',
                        'alcance_geografico': 'Internacional',
                        'paises_destino': 'Brasil, Chile',
                        'exporta_servicios': 'si',
                        'interes_exportar': 'si',
                        'idiomas': 'Español, Inglés',
                        'forma_contratacion': 'Proyecto',
                        'certificaciones_tecnicas': 'ISO 9001',
                        'equipo_tecnico': 'si'
                    }
                ],
                actividades_promocion=[],
                contactos_secundarios=[],
            )
            solicitud.usuario_creado = usuario
            solicitud.save()
            
            # Aprobar y crear empresa
            try:
                empresa = crear_empresa_desde_solicitud(solicitud)
                solicitud.estado = 'aprobada'
                # empresa_creada solo acepta Empresaproducto, no asignar para servicios
                solicitud.save()
                empresas_creadas.append(('servicio', empresa.id, solicitud.id))
                self.stdout.write(self.style.SUCCESS(f'✓ Empresa Servicio {i} creada (ID: {empresa.id})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error al crear Empresa Servicio {i}: {str(e)}'))
                logger.error(f'Error al crear Empresa Servicio {i}: {str(e)}', exc_info=True)
        
        # Crear 2 empresas MIXTAS
        tipo_empresa_mixta, _ = TipoEmpresa.objects.get_or_create(
            nombre='Mixta',
            defaults={'descripcion': 'Empresa mixta'}
        )
        
        for i in range(1, 3):
            email = f'mixta{i}@test.com'
            cuit = f'4012345678{i}'
            
            # Crear usuario
            usuario, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'password': make_password(cuit),
                    'rol': rol_empresa
                }
            )
            if created:
                usuario.rol = rol_empresa
                usuario.save()
            
            # Crear solicitud
            solicitud = SolicitudRegistro.objects.create(
                razon_social=f'Empresa Mixta {i} S.A.',
                nombre_fantasia=f'Mixta{i}',
                cuit_cuil=cuit,
                tipo_empresa='mixta',
                rubro_principal='Agroindustria',
                direccion=f'Ruta {i} km 10',
                departamento='Capital',
                provincia='Jujuy',
                telefono=f'+54 9 11 3456-789{i}',
                correo=email,
                nombre_contacto=f'Contacto Mixta {i}',
                cargo_contacto='CEO',
                telefono_contacto=f'+54 9 11 3456-789{i}',
                email_contacto=email,
                sitioweb=f'https://mixta{i}.com',
                instagram=f'@mixta{i}',
                facebook=f'mixta{i}',
                exporta='si',
                destino_exportacion='Brasil, Chile, Uruguay',
                importa='si',
                certificado_pyme='si',
                certificaciones='SENASA, ISO 9001',
                material_promocional_idiomas='si',
                idiomas_trabajo='Español, Inglés, Portugués',
                estado='pendiente',
                productos=[
                    {
                        'nombre': f'Producto Mixto {i}',
                        'descripcion': f'Descripción del producto mixto {i}',
                        'capacidad_productiva': '2000',
                        'posicion_arancelaria': '87654321'
                    }
                ],
                servicios_ofrecidos=[
                    {
                        'nombre': f'Servicio Mixto {i}',
                        'descripcion': f'Descripción del servicio mixto {i}',
                        'tipo_servicio': 'tecnologias',
                        'sector_atendido': 'agroindustria',
                        'alcance_geografico': 'Nacional e Internacional',
                        'paises_destino': 'Brasil, Chile',
                        'exporta_servicios': 'si',
                        'interes_exportar': 'si',
                        'idiomas': 'Español, Inglés',
                        'forma_contratacion': 'Proyecto, Consultoría',
                        'certificaciones_tecnicas': 'ISO 9001, ISO 14001',
                        'equipo_tecnico': 'si'
                    }
                ],
                actividades_promocion=[],
                contactos_secundarios=[],
            )
            solicitud.usuario_creado = usuario
            solicitud.save()
            
            # Aprobar y crear empresa
            try:
                empresa = crear_empresa_desde_solicitud(solicitud)
                solicitud.estado = 'aprobada'
                # empresa_creada solo acepta Empresaproducto, no asignar para mixta
                solicitud.save()
                empresas_creadas.append(('mixta', empresa.id, solicitud.id))
                self.stdout.write(self.style.SUCCESS(f'✓ Empresa Mixta {i} creada (ID: {empresa.id})'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error al crear Empresa Mixta {i}: {str(e)}'))
                logger.error(f'Error al crear Empresa Mixta {i}: {str(e)}', exc_info=True)
        
        # Resumen
        self.stdout.write(self.style.SUCCESS(f'\n✓ Total de empresas creadas: {len(empresas_creadas)}'))
        self.stdout.write(self.style.SUCCESS('\nEmpresas creadas:'))
        for tipo, empresa_id, solicitud_id in empresas_creadas:
            self.stdout.write(f'  - {tipo.capitalize()}: Empresa ID {empresa_id}, Solicitud ID {solicitud_id}')

