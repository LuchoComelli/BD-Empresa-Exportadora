from django.core.management.base import BaseCommand
from apps.empresas.models import Empresa, SubRubro
from apps.registro.models import SolicitudRegistro
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrar subrubros desde SolicitudRegistro a Empresa'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando migración de subrubros...'))
        
        empresas_actualizadas = 0
        empresas_sin_subrubro = 0
        errores = 0
        
        # Obtener todas las empresas
        empresas = Empresa.objects.all()
        
        for empresa in empresas:
            try:
                # Buscar solicitud relacionada por CUIT
                cuit_empresa = str(empresa.cuit_cuil).replace('-', '').replace(' ', '').strip()
                
                solicitud = None
                solicitudes = SolicitudRegistro.objects.filter(estado='aprobada')
                for sol in solicitudes:
                    cuit_sol = str(sol.cuit_cuil).replace('-', '').replace(' ', '').strip()
                    if cuit_sol == cuit_empresa:
                        solicitud = sol
                        break
                
                if not solicitud:
                    empresas_sin_subrubro += 1
                    continue
                
                # Buscar y asignar subrubros
                actualizado = False
                
                if empresa.tipo_empresa_valor == 'mixta':
                    # Empresas mixtas
                    if solicitud.sub_rubro_producto and not empresa.id_subrubro_producto:
                        subrubro_prod = SubRubro.objects.filter(
                            rubro=empresa.id_rubro,
                            nombre__iexact=solicitud.sub_rubro_producto,
                            activo=True
                        ).first()
                        if subrubro_prod:
                            empresa.id_subrubro_producto = subrubro_prod
                            actualizado = True
                    
                    if solicitud.sub_rubro_servicio and not empresa.id_subrubro_servicio:
                        # Buscar rubro de servicios si existe
                        # (requiere lógica adicional si hay rubros separados)
                        subrubro_serv = SubRubro.objects.filter(
                            nombre__iexact=solicitud.sub_rubro_servicio,
                            activo=True
                        ).first()
                        if subrubro_serv:
                            empresa.id_subrubro_servicio = subrubro_serv
                            actualizado = True
                else:
                    # Empresas simples
                    if solicitud.sub_rubro and not empresa.id_subrubro:
                        subrubro = SubRubro.objects.filter(
                            rubro=empresa.id_rubro,
                            nombre__iexact=solicitud.sub_rubro,
                            activo=True
                        ).first()
                        if subrubro:
                            empresa.id_subrubro = subrubro
                            actualizado = True
                
                if actualizado:
                    empresa.save()
                    empresas_actualizadas += 1
                    self.stdout.write(f'  ✓ Empresa {empresa.razon_social} actualizada')
                else:
                    empresas_sin_subrubro += 1
                    
            except Exception as e:
                errores += 1
                logger.error(f"Error procesando empresa {empresa.id}: {str(e)}")
                self.stdout.write(self.style.ERROR(f'  ✗ Error en empresa {empresa.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nMigración completada:'))
        self.stdout.write(f'  Empresas actualizadas: {empresas_actualizadas}')
        self.stdout.write(f'  Empresas sin subrubro: {empresas_sin_subrubro}')
        self.stdout.write(f'  Errores: {errores}')