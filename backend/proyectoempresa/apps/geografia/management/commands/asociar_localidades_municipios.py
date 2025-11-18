"""
Comando para asociar localidades a sus municipios correspondientes usando la API Georef
"""

import requests
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad


class Command(BaseCommand):
    help = 'Asociar localidades a sus municipios usando la API Georef'

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
            help='Número máximo de localidades a procesar por departamento (para pruebas)',
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
        max_localidades = options.get('max')
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("ASOCIANDO LOCALIDADES A MUNICIPIOS"))
        self.stdout.write("=" * 60)
        
        # Obtener provincias a procesar
        if provincia_id:
            provincias = Provincia.objects.filter(id=provincia_id)
        else:
            provincias = Provincia.objects.all().order_by('nombre')
        
        total_asociadas = 0
        total_sin_municipio = 0
        total_errores = 0
        
        for provincia in provincias:
            self.stdout.write(f"\n📍 Procesando {provincia.nombre}...")
            
            # Obtener departamentos de la provincia
            departamentos = Departamento.objects.filter(provincia=provincia).order_by('nombre')
            
            for departamento in departamentos:
                # Obtener localidades sin municipio de este departamento
                localidades_sin_municipio = Localidad.objects.filter(
                    provincia=provincia,
                    departamento=departamento,
                    municipio__isnull=True
                )
                
                if not localidades_sin_municipio.exists():
                    continue
                
                count = localidades_sin_municipio.count()
                
                # Obtener localidades del departamento desde la API
                params = {
                    'departamento': departamento.id,
                    'provincia': provincia.id
                }
                data = self.fetch_from_api('asentamientos', params, max_results=1000)
                
                if not data or 'asentamientos' not in data:
                    # Si no hay datos de la API, intentar asociar por proximidad
                    # Buscar municipios del departamento
                    municipios_depto = Municipio.objects.filter(
                        provincia=provincia,
                        departamento=departamento
                    )
                    
                    if municipios_depto.count() == 1:
                        # Si hay un solo municipio, asociar todas las localidades
                        municipio = municipios_depto.first()
                        asociadas = localidades_sin_municipio.update(municipio=municipio)
                        total_asociadas += asociadas
                        if asociadas > 0:
                            self.stdout.write(f"  ✓ {asociadas} localidades asociadas a único municipio en {departamento.nombre}")
                    continue
                
                localidades_api = data['asentamientos']
                
                if len(localidades_api) == 0:
                    continue
                
                # Crear un diccionario de localidades API por ID
                localidades_api_dict = {l['id']: l for l in localidades_api}
                
                # Procesar localidades
                procesadas = 0
                asociadas = 0
                
                for localidad in localidades_sin_municipio[:max_localidades] if max_localidades else localidades_sin_municipio:
                    procesadas += 1
                    
                    # Buscar la localidad en los datos de la API
                    localidad_api = localidades_api_dict.get(localidad.id)
                    
                    if not localidad_api:
                        # Intentar buscar por nombre si no se encuentra por ID
                        nombre_normalizado = localidad.nombre.lower().strip()
                        localidad_api = next(
                            (l for l in localidades_api if l['nombre'].lower().strip() == nombre_normalizado),
                            None
                        )
                    
                    if localidad_api:
                        # Intentar asociar por municipio de la API
                        municipio_id = None
                        nombre_municipio = None
                        
                        if 'municipio' in localidad_api and localidad_api['municipio']:
                            municipio_id = localidad_api['municipio'].get('id')
                            nombre_municipio = localidad_api['municipio'].get('nombre')
                        
                        if municipio_id:
                            try:
                                municipio = Municipio.objects.get(id=municipio_id, provincia=provincia)
                                localidad.municipio = municipio
                                localidad.save()
                                asociadas += 1
                            except Municipio.DoesNotExist:
                                # Intentar buscar municipio por nombre
                                if nombre_municipio:
                                    municipio = Municipio.objects.filter(
                                        provincia=provincia,
                                        nombre__icontains=nombre_municipio.split()[0] if nombre_municipio else None
                                    ).first()
                                    
                                    if municipio:
                                        localidad.municipio = municipio
                                        localidad.save()
                                        asociadas += 1
                        
                        # Si no hay municipio en la API, intentar asociar por proximidad
                        if not localidad.municipio:
                            # Buscar municipios en el mismo departamento
                            municipios_depto = Municipio.objects.filter(
                                provincia=provincia,
                                departamento=departamento
                            )
                            
                            if municipios_depto.count() == 1:
                                # Si hay un solo municipio en el departamento, asociarlo
                                localidad.municipio = municipios_depto.first()
                                localidad.save()
                                asociadas += 1
                            elif municipios_depto.count() > 1:
                                # Si hay múltiples municipios, intentar encontrar el correcto por nombre
                                nombre_localidad = localidad.nombre.lower()
                                municipio_encontrado = None
                                
                                # Buscar por coincidencia de nombre (más estricto)
                                for m in municipios_depto:
                                    nombre_municipio = m.nombre.lower()
                                    # Coincidencia exacta o parcial
                                    if nombre_localidad == nombre_municipio:
                                        municipio_encontrado = m
                                        break
                                    elif nombre_localidad in nombre_municipio or nombre_municipio in nombre_localidad:
                                        # Verificar que la coincidencia sea significativa (más de 3 caracteres)
                                        if len(nombre_localidad) > 3 or len(nombre_municipio) > 3:
                                            municipio_encontrado = m
                                            break
                                
                                if municipio_encontrado:
                                    localidad.municipio = municipio_encontrado
                                    localidad.save()
                                    asociadas += 1
                                else:
                                    # Si no hay coincidencia, buscar por localidades relacionadas
                                    # Obtener localidades del mismo departamento que ya tienen municipio
                                    localidades_relacionadas = Localidad.objects.filter(
                                        provincia=provincia,
                                        departamento=departamento,
                                        municipio__isnull=False
                                    ).select_related('municipio')
                                    
                                    # Buscar el municipio más común en localidades similares
                                    from django.db.models import Count
                                    municipio_mas_comun = localidades_relacionadas.values('municipio').annotate(
                                        count=Count('id')
                                    ).order_by('-count').first()
                                    
                                    if municipio_mas_comun:
                                        try:
                                            municipio = Municipio.objects.get(
                                                id=municipio_mas_comun['municipio'],
                                                provincia=provincia,
                                                departamento=departamento
                                            )
                                            localidad.municipio = municipio
                                            localidad.save()
                                            asociadas += 1
                                        except Municipio.DoesNotExist:
                                            pass
                            elif municipios_depto.count() == 0:
                                # Si no hay municipios en el departamento, buscar en la provincia
                                # y usar el municipio más cercano por nombre
                                nombre_localidad = localidad.nombre.lower()
                                municipios_provincia = Municipio.objects.filter(
                                    provincia=provincia
                                )
                                
                                # Buscar por coincidencia de nombre en toda la provincia
                                for m in municipios_provincia:
                                    nombre_municipio = m.nombre.lower()
                                    if nombre_localidad in nombre_municipio or nombre_municipio in nombre_localidad:
                                        if len(nombre_localidad) > 3 or len(nombre_municipio) > 3:
                                            localidad.municipio = m
                                            localidad.save()
                                            asociadas += 1
                                            break
                    
                    if procesadas % 100 == 0 and procesadas > 0:
                        self.stdout.write(f"    Procesadas: {procesadas}/{count} en {departamento.nombre}")
                
                total_asociadas += asociadas
                total_sin_municipio += (count - asociadas)
                
                if asociadas > 0:
                    self.stdout.write(f"  ✓ {asociadas} localidades asociadas en {departamento.nombre}")
                
                # Pequeña pausa para no sobrecargar la API
                time.sleep(0.3)
            
            self.stdout.write(self.style.SUCCESS(
                f"  ✓ {provincia.nombre} completada"
            ))
        
        # Resumen final
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ PROCESO COMPLETADO"))
        self.stdout.write(f"  Localidades asociadas: {total_asociadas}")
        self.stdout.write(f"  Localidades sin municipio restantes: {total_sin_municipio}")
        self.stdout.write(f"  Errores: {total_errores}")
        
        # Estadísticas finales
        localidades_sin_municipio_final = Localidad.objects.filter(municipio__isnull=True).count()
        self.stdout.write(f"\n  📊 Estado final:")
        self.stdout.write(f"     Localidades sin municipio: {localidades_sin_municipio_final}")
        self.stdout.write("=" * 60)
