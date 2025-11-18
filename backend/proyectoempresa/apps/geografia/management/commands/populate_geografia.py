"""
Comando de Django para poblar la base de datos con datos geográficos de Argentina
usando la API Georef oficial del gobierno argentino.

Fuente: https://apis.datos.gob.ar/georef/api/
"""

import requests
import json
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad

# URL base de la API Georef
API_BASE_URL = "https://apis.datos.gob.ar/georef/api"
MAX_RESULTS = 5000  # Máximo permitido por la API


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos geográficos de Argentina desde la API Georef'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-localidades',
            action='store_true',
            help='Omitir la importación de localidades (más rápido)',
        )

    def fetch_from_api(self, endpoint: str, params: dict = None, max_results: int = None) -> list:
        """Obtener datos de la API Georef con paginación"""
        all_data = []
        offset = 0
        
        if params is None:
            params = {}
        
        # Usar max_results personalizado o el default
        page_size = max_results if max_results else MAX_RESULTS
        params['max'] = page_size
        
        while True:
            params['inicio'] = offset
            url = f"{API_BASE_URL}/{endpoint}"
            
            try:
                response = requests.get(url, params=params, timeout=30)
                
                # Si hay error 400, intentar con página más pequeña
                if response.status_code == 400 and page_size > 1000:
                    self.stdout.write(self.style.WARNING(f"⚠ Error 400, reduciendo tamaño de página a 1000..."))
                    page_size = 1000
                    params['max'] = page_size
                    continue
                
                response.raise_for_status()
                data = response.json()
                
                # Obtener la clave correcta según el endpoint
                key = endpoint
                items = data.get(key, [])
                
                if not items:
                    break
                
                all_data.extend(items)
                
                total = data.get('total', 0)
                cantidad = data.get('cantidad', 0)
                
                self.stdout.write(f"  → Obtenidos {len(all_data)}/{total} registros de {endpoint}")
                
                # Si ya obtuvimos todos, salir
                if len(all_data) >= total or cantidad < page_size:
                    break
                
                offset += page_size
                time.sleep(0.1)  # Pequeña pausa para no saturar la API
                
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"✗ Error obteniendo datos de {endpoint}: {e}"))
                # Si ya tenemos datos, retornar lo que tenemos
                if all_data:
                    self.stdout.write(self.style.WARNING(f"⚠ Retornando {len(all_data)} registros obtenidos hasta ahora"))
                    break
                else:
                    break
        
        return all_data

    def import_provincias(self):
        """Importar provincias"""
        self.stdout.write("\n📍 Importando provincias...")
        
        provincias_data = self.fetch_from_api('provincias', {'campos': 'completo'})
        
        if not provincias_data:
            self.stdout.write(self.style.ERROR("✗ No se obtuvieron provincias"))
            return
        
        count = 0
        for p in provincias_data:
            provincia, created = Provincia.objects.update_or_create(
                id=p['id'],
                defaults={
                    'nombre': p['nombre'],
                    'nombre_completo': p.get('nombre_completo', p['nombre']),
                    'iso_id': p.get('iso_id', ''),
                    'iso_nombre': p.get('iso_nombre', p['nombre']),
                    'categoria': p.get('categoria', 'Provincia'),
                    'centroide_lat': p.get('centroide', {}).get('lat'),
                    'centroide_lon': p.get('centroide', {}).get('lon'),
                    'geometria': p.get('geometria'),
                    'fuente': p.get('fuente', 'API Georef'),
                }
            )
            if created:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f"✓ {len(provincias_data)} provincias procesadas ({count} nuevas)"))

    def import_departamentos(self):
        """Importar departamentos"""
        self.stdout.write("\n🗺️  Importando departamentos...")
        
        departamentos_data = self.fetch_from_api('departamentos', {'campos': 'completo'})
        
        if not departamentos_data:
            self.stdout.write(self.style.ERROR("✗ No se obtuvieron departamentos"))
            return
        
        count = 0
        for d in departamentos_data:
            try:
                provincia = Provincia.objects.get(id=d['provincia']['id'])
                departamento, created = Departamento.objects.update_or_create(
                    id=d['id'],
                    defaults={
                        'nombre': d['nombre'],
                        'nombre_completo': d.get('nombre_completo', d['nombre']),
                        'categoria': d.get('categoria', 'Departamento'),
                        'provincia': provincia,
                        'centroide_lat': d.get('centroide', {}).get('lat'),
                        'centroide_lon': d.get('centroide', {}).get('lon'),
                        'geometria': d.get('geometria'),
                        'fuente': d.get('fuente', 'API Georef'),
                    }
                )
                if created:
                    count += 1
            except Provincia.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⚠ Provincia {d['provincia']['id']} no encontrada para departamento {d['id']}"))
        
        self.stdout.write(self.style.SUCCESS(f"✓ {len(departamentos_data)} departamentos procesados ({count} nuevos)"))

    def import_municipios(self):
        """Importar municipios"""
        self.stdout.write("\n🏛️  Importando municipios...")
        
        municipios_data = self.fetch_from_api('municipios', {'campos': 'completo'})
        
        if not municipios_data:
            self.stdout.write(self.style.ERROR("✗ No se obtuvieron municipios"))
            return
        
        count = 0
        for m in municipios_data:
            try:
                provincia = Provincia.objects.get(id=m['provincia']['id'])
                departamento = None
                if 'departamento' in m and m['departamento']:
                    try:
                        departamento = Departamento.objects.get(id=m['departamento'].get('id'))
                    except Departamento.DoesNotExist:
                        pass
                
                municipio, created = Municipio.objects.update_or_create(
                    id=m['id'],
                    defaults={
                        'nombre': m['nombre'],
                        'nombre_completo': m.get('nombre_completo', m['nombre']),
                        'categoria': m.get('categoria', 'Municipio'),
                        'provincia': provincia,
                        'departamento': departamento,
                        'centroide_lat': m.get('centroide', {}).get('lat'),
                        'centroide_lon': m.get('centroide', {}).get('lon'),
                        'geometria': m.get('geometria'),
                        'fuente': m.get('fuente', 'API Georef'),
                    }
                )
                if created:
                    count += 1
            except Provincia.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⚠ Provincia {m['provincia']['id']} no encontrada para municipio {m['id']}"))
        
        self.stdout.write(self.style.SUCCESS(f"✓ {len(municipios_data)} municipios procesados ({count} nuevos)"))

    def import_localidades(self):
        """Importar localidades (BAHRA)"""
        self.stdout.write("\n🏘️  Importando localidades BAHRA...")
        
        # Usar tamaño de página más pequeño para evitar errores 400
        localidades_data = self.fetch_from_api('asentamientos', {'campos': 'completo'}, max_results=1000)
        
        if not localidades_data:
            self.stdout.write(self.style.ERROR("✗ No se obtuvieron localidades"))
            return
        
        count = 0
        total = len(localidades_data)
        for i, l in enumerate(localidades_data, 1):
            try:
                provincia = Provincia.objects.get(id=l['provincia']['id'])
                departamento = Departamento.objects.get(id=l['departamento']['id'])
                municipio = None
                if 'municipio' in l and l['municipio']:
                    try:
                        municipio = Municipio.objects.get(id=l['municipio'].get('id'))
                    except Municipio.DoesNotExist:
                        pass
                
                localidad, created = Localidad.objects.update_or_create(
                    id=l['id'],
                    defaults={
                        'nombre': l['nombre'],
                        'categoria': l.get('categoria', ''),
                        'tipo_asentamiento': l.get('tipo', ''),
                        'provincia': provincia,
                        'departamento': departamento,
                        'municipio': municipio,
                        'centroide_lat': l.get('centroide', {}).get('lat'),
                        'centroide_lon': l.get('centroide', {}).get('lon'),
                        'geometria': l.get('geometria'),
                        'fuente': l.get('fuente', 'BAHRA'),
                    }
                )
                if created:
                    count += 1
                
                # Mostrar progreso cada 1000 registros
                if i % 1000 == 0:
                    self.stdout.write(f"  → Procesados {i}/{total} localidades...")
                    
            except (Provincia.DoesNotExist, Departamento.DoesNotExist) as e:
                self.stdout.write(self.style.WARNING(f"⚠ Error con localidad {l.get('id', 'unknown')}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(f"✓ {total} localidades procesadas ({count} nuevas)"))

    def handle(self, *args, **options):
        start_time = datetime.now()
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("IMPORTACIÓN DE DATOS GEOGRÁFICOS DE ARGENTINA"))
        self.stdout.write("Fuente: API Georef - datos.gob.ar")
        self.stdout.write("=" * 60)
        
        try:
            # Importar en orden jerárquico
            self.import_provincias()
            self.import_departamentos()
            self.import_municipios()
            
            if not options['skip_localidades']:
                self.import_localidades()
            else:
                self.stdout.write(self.style.WARNING("\n⚠ Localidades omitidas (--skip-localidades)"))
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS(f"✓ IMPORTACIÓN COMPLETADA"))
            self.stdout.write(f"  Duración: {duration}")
            self.stdout.write(f"  Finalizado: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            self.stdout.write("=" * 60)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ Error durante la importación: {e}"))
            raise

