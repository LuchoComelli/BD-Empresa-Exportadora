"""
Comando para asociar municipios a sus departamentos correspondientes usando la API Georef
"""

import requests
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad


class Command(BaseCommand):
    help = 'Asociar municipios a sus departamentos usando la API Georef'

    def add_arguments(self, parser):
        parser.add_argument(
            '--provincia',
            type=str,
            help='ID de provincia específica (opcional, si no se especifica procesa todas)',
        )
        parser.add_argument(
            '--max',
            type=int,
            default=None,
            help='Número máximo de municipios a procesar (para pruebas)',
        )

    def fetch_from_api(self, endpoint, params=None, max_results=5000):
        """Obtener datos de la API Georef con paginación"""
        base_url = "https://apis.datos.gob.ar/georef/api"
        url = f"{base_url}/{endpoint}"
        
        if params is None:
            params = {}
        
        params['max'] = max_results
        params['formato'] = 'json'
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Error en API: {e}"))
            if hasattr(e.response, 'status_code') and e.response.status_code == 400:
                # Si falla con max_results, intentar con menos
                if max_results > 100:
                    return self.fetch_from_api(endpoint, params, max_results // 2)
            return None

    def handle(self, *args, **options):
        provincia_id = options.get('provincia')
        max_municipios = options.get('max')
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("ASOCIANDO MUNICIPIOS A DEPARTAMENTOS"))
        self.stdout.write("=" * 60)
        
        # Obtener provincias a procesar
        if provincia_id:
            provincias = Provincia.objects.filter(id=provincia_id)
        else:
            provincias = Provincia.objects.all().order_by('nombre')
        
        total_asociados = 0
        total_sin_departamento = 0
        total_errores = 0
        
        for provincia in provincias:
            self.stdout.write(f"\n📍 Procesando {provincia.nombre}...")
            
            # Obtener municipios sin departamento de esta provincia
            municipios_sin_depto = Municipio.objects.filter(
                provincia=provincia,
                departamento__isnull=True
            )
            
            if not municipios_sin_depto.exists():
                self.stdout.write(f"  → Todos los municipios ya tienen departamento asignado")
                continue
            
            count = municipios_sin_depto.count()
            self.stdout.write(f"  📊 Municipios sin departamento: {count}")
            
            # Estrategia: usar localidades para inferir la relación municipio-departamento
            # Las localidades tienen tanto municipio como departamento
            self.stdout.write(f"  🔍 Buscando relaciones a través de localidades...")
            
            # Obtener localidades de la provincia que tienen municipio y departamento
            localidades_con_relacion = Localidad.objects.filter(
                provincia=provincia,
                municipio__isnull=False,
                departamento__isnull=False
            ).select_related('municipio', 'departamento')
            
            # Crear un diccionario: municipio_id -> departamento_id
            municipio_depto_map = {}
            for localidad in localidades_con_relacion:
                if localidad.municipio and localidad.departamento:
                    municipio_depto_map[localidad.municipio.id] = localidad.departamento.id
            
            self.stdout.write(f"  📊 Relaciones encontradas desde localidades: {len(municipio_depto_map)}")
            
            # Si no hay suficientes relaciones, intentar obtener más desde la API
            if len(municipio_depto_map) < count * 0.5:
                self.stdout.write(f"  🔄 Obteniendo más relaciones desde API...")
                # Obtener algunas localidades desde la API para inferir relaciones
                params = {'provincia': provincia.id, 'max': 1000}
                data = self.fetch_from_api('asentamientos', params, max_results=1000)
                
                if data and 'asentamientos' in data:
                    for asentamiento in data['asentamientos']:
                        if 'municipio' in asentamiento and 'departamento' in asentamiento:
                            municipio_id = asentamiento['municipio'].get('id')
                            depto_id = asentamiento['departamento'].get('id')
                            if municipio_id and depto_id:
                                municipio_depto_map[municipio_id] = depto_id
            
            # Procesar municipios
            procesados = 0
            asociados = 0
            
            for municipio in municipios_sin_depto[:max_municipios] if max_municipios else municipios_sin_depto:
                procesados += 1
                
                # Buscar el departamento en el mapa
                depto_id = municipio_depto_map.get(municipio.id)
                
                if depto_id:
                    try:
                        departamento = Departamento.objects.get(id=depto_id, provincia=provincia)
                        municipio.departamento = departamento
                        municipio.save()
                        asociados += 1
                        
                        if asociados % 50 == 0:
                            self.stdout.write(f"    ✓ {asociados} municipios asociados...")
                    except Departamento.DoesNotExist:
                        total_errores += 1
                        if total_errores <= 5:
                            self.stdout.write(self.style.WARNING(
                                f"    ⚠ Departamento {depto_id} no encontrado para municipio {municipio.nombre}"
                            ))
                else:
                    # Si no se encuentra en el mapa, intentar múltiples estrategias
                    # Estrategia 1: Buscar por nombre del municipio en localidades relacionadas
                    localidad_relacionada = Localidad.objects.filter(
                        provincia=provincia,
                        municipio__nombre__icontains=municipio.nombre.split()[0] if municipio.nombre else '',
                        municipio__isnull=False,
                        departamento__isnull=False
                    ).select_related('municipio', 'departamento').first()
                    
                    if localidad_relacionada and localidad_relacionada.municipio:
                        # Verificar que el nombre del municipio coincida
                        if localidad_relacionada.municipio.nombre.lower() == municipio.nombre.lower():
                            municipio.departamento = localidad_relacionada.departamento
                            municipio.save()
                            asociados += 1
                            continue
                    
                    # Estrategia 2: Buscar municipios con nombre similar en la misma provincia
                    # y usar el departamento más común de sus localidades
                    municipios_similares = Municipio.objects.filter(
                        provincia=provincia,
                        nombre__icontains=municipio.nombre.split()[0] if municipio.nombre else '',
                        departamento__isnull=False
                    )
                    
                    if municipios_similares.exists():
                        # Obtener el departamento más común
                        from django.db.models import Count
                        depto_mas_comun = municipios_similares.values('departamento').annotate(
                            count=Count('id')
                        ).order_by('-count').first()
                        
                        if depto_mas_comun:
                            try:
                                departamento = Departamento.objects.get(
                                    id=depto_mas_comun['departamento'],
                                    provincia=provincia
                                )
                                municipio.departamento = departamento
                                municipio.save()
                                asociados += 1
                                continue
                            except Departamento.DoesNotExist:
                                pass
                    
                    # Estrategia 3: Si el municipio tiene localidades, usar el departamento más común
                    localidades_municipio = Localidad.objects.filter(
                        provincia=provincia,
                        municipio=municipio,
                        departamento__isnull=False
                    )
                    
                    if localidades_municipio.exists():
                        from django.db.models import Count
                        depto_mas_comun = localidades_municipio.values('departamento').annotate(
                            count=Count('id')
                        ).order_by('-count').first()
                        
                        if depto_mas_comun:
                            try:
                                departamento = Departamento.objects.get(
                                    id=depto_mas_comun['departamento'],
                                    provincia=provincia
                                )
                                municipio.departamento = departamento
                                municipio.save()
                                asociados += 1
                            except Departamento.DoesNotExist:
                                pass
                
                if procesados % 100 == 0:
                    self.stdout.write(f"    Procesados: {procesados}/{count}")
            
            total_asociados += asociados
            total_sin_departamento += (count - asociados)
            
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {asociados} municipios asociados en {provincia.nombre}"
            ))
            
            # Pequeña pausa para no sobrecargar la API
            time.sleep(0.5)
        
        # Resumen final
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ PROCESO COMPLETADO"))
        self.stdout.write(f"  Municipios asociados: {total_asociados}")
        self.stdout.write(f"  Municipios sin departamento restantes: {total_sin_departamento}")
        self.stdout.write(f"  Errores: {total_errores}")
        
        # Estadísticas finales
        municipios_sin_depto_final = Municipio.objects.filter(departamento__isnull=True).count()
        self.stdout.write(f"\n  📊 Estado final:")
        self.stdout.write(f"     Municipios sin departamento: {municipios_sin_depto_final}")
        self.stdout.write("=" * 60)
