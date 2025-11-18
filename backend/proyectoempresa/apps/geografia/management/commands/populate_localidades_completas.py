"""
Comando para importar todas las localidades faltantes, filtrando por provincia
para evitar el límite de 10,000 registros de la API.
"""

import requests
import time
from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad

API_BASE_URL = "https://apis.datos.gob.ar/georef/api"
MAX_RESULTS = 1000


class Command(BaseCommand):
    help = 'Importar todas las localidades faltantes, filtrando por provincia'

    def fetch_localidades_by_provincia(self, provincia_id: str) -> list:
        """Obtener todas las localidades de una provincia"""
        all_data = []
        offset = 0
        
        while True:
            params = {
                'provincia': provincia_id,
                'campos': 'completo',
                'max': MAX_RESULTS,
                'inicio': offset
            }
            
            url = f"{API_BASE_URL}/asentamientos"
            
            try:
                response = requests.get(url, params=params, timeout=30)
                
                if response.status_code == 400:
                    break
                
                response.raise_for_status()
                data = response.json()
                
                items = data.get('asentamientos', [])
                
                if not items:
                    break
                
                all_data.extend(items)
                
                total = data.get('total', 0)
                cantidad = data.get('cantidad', 0)
                
                self.stdout.write(f"  → Provincia {provincia_id}: {len(all_data)}/{total} localidades")
                
                if len(all_data) >= total or cantidad < MAX_RESULTS:
                    break
                
                offset += MAX_RESULTS
                time.sleep(0.2)
                
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
                break
        
        return all_data

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("IMPORTACIÓN COMPLETA DE LOCALIDADES POR PROVINCIA"))
        self.stdout.write("=" * 60)
        
        provincias = Provincia.objects.all().order_by('nombre')
        total_importadas = 0
        
        for provincia in provincias:
            self.stdout.write(f"\n📍 Procesando {provincia.nombre} (ID: {provincia.id})...")
            
            localidades_data = self.fetch_localidades_by_provincia(provincia.id)
            
            if not localidades_data:
                self.stdout.write(self.style.WARNING(f"  ⚠ No se obtuvieron localidades para {provincia.nombre}"))
                continue
            
            count_nuevas = 0
            count_actualizadas = 0
            
            for l in localidades_data:
                try:
                    departamento = Departamento.objects.get(id=l['departamento']['id'])
                    municipio = None
                    if 'municipio' in l and l['municipio']:
                        try:
                            municipio = Municipio.objects.get(id=l['municipio'].get('id'))
                        except Municipio.DoesNotExist:
                            pass
                    
                    # Si no hay municipio en la API, intentar asociarlo automáticamente
                    if not municipio:
                        # Buscar municipios en el mismo departamento
                        municipios_depto = Municipio.objects.filter(
                            provincia=provincia,
                            departamento=departamento
                        )
                        
                        if municipios_depto.count() == 1:
                            # Si hay un solo municipio en el departamento, asociarlo
                            municipio = municipios_depto.first()
                        elif municipios_depto.count() > 1:
                            # Si hay múltiples municipios, intentar encontrar el correcto por nombre
                            nombre_localidad = l['nombre'].lower()
                            municipio_encontrado = None
                            
                            # Buscar por coincidencia de nombre
                            for m in municipios_depto:
                                nombre_municipio = m.nombre.lower()
                                if nombre_localidad in nombre_municipio or nombre_municipio in nombre_localidad:
                                    municipio_encontrado = m
                                    break
                            
                            # Si no se encuentra por nombre, usar el municipio principal del departamento
                            if not municipio_encontrado:
                                municipio_principal = municipios_depto.filter(
                                    nombre__icontains=departamento.nombre.split()[0]
                                ).first()
                                
                                if municipio_principal:
                                    municipio_encontrado = municipio_principal
                                else:
                                    # Si no hay coincidencia, usar el primer municipio del departamento
                                    municipio_encontrado = municipios_depto.first()
                            
                            municipio = municipio_encontrado
                    
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
                        count_nuevas += 1
                    else:
                        count_actualizadas += 1
                        
                except Departamento.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Departamento {l.get('departamento', {}).get('id', 'unknown')} no encontrado para localidad {l.get('id', 'unknown')}"))
            
            total_importadas += len(localidades_data)
            self.stdout.write(self.style.SUCCESS(f"  ✓ {len(localidades_data)} localidades procesadas ({count_nuevas} nuevas, {count_actualizadas} actualizadas)"))
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"✓ IMPORTACIÓN COMPLETADA"))
        self.stdout.write(f"  Total localidades procesadas: {total_importadas}")
        self.stdout.write("=" * 60)

