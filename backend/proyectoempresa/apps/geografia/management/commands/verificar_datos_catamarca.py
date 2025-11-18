"""
Comando para verificar cuántos municipios y localidades hay disponibles para Catamarca
"""

import requests
from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Municipio, Localidad

API_BASE_URL = "https://apis.datos.gob.ar/georef/api"


class Command(BaseCommand):
    help = 'Verificar datos disponibles de Catamarca en la API'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("VERIFICANDO DATOS DE CATAMARCA"))
        self.stdout.write("=" * 60)
        
        # Verificar en base de datos
        try:
            catamarca = Provincia.objects.get(id='10')
            municipios_bd = Municipio.objects.filter(provincia=catamarca).count()
            localidades_bd = Localidad.objects.filter(provincia=catamarca).count()
            
            self.stdout.write(f"\n📍 Datos en Base de Datos:")
            self.stdout.write(f"  Municipios: {municipios_bd}")
            self.stdout.write(f"  Localidades: {localidades_bd}")
        except Provincia.DoesNotExist:
            self.stdout.write(self.style.ERROR("✗ Provincia Catamarca no encontrada"))
            return
        
        # Verificar municipios en API
        self.stdout.write(f"\n🔍 Verificando municipios en API...")
        try:
            response = requests.get(f"{API_BASE_URL}/municipios", params={
                'provincia': '10',
                'campos': 'completo',
                'max': 5000
            }, timeout=30)
            response.raise_for_status()
            data = response.json()
            total_municipios_api = data.get('total', 0)
            municipios_api = data.get('municipios', [])
            
            self.stdout.write(f"  Total municipios en API: {total_municipios_api}")
            self.stdout.write(f"  Municipios obtenidos: {len(municipios_api)}")
            
            if total_municipios_api > municipios_bd:
                self.stdout.write(self.style.WARNING(f"  ⚠ Faltan {total_municipios_api - municipios_bd} municipios en BD"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error: {e}"))
        
        # Verificar localidades en API
        self.stdout.write(f"\n🔍 Verificando localidades en API...")
        try:
            all_localidades = []
            offset = 0
            
            while True:
                response = requests.get(f"{API_BASE_URL}/asentamientos", params={
                    'provincia': '10',
                    'campos': 'completo',
                    'max': 1000,
                    'inicio': offset
                }, timeout=30)
                
                if response.status_code == 400:
                    break
                
                response.raise_for_status()
                data = response.json()
                localidades = data.get('asentamientos', [])
                
                if not localidades:
                    break
                
                all_localidades.extend(localidades)
                total = data.get('total', 0)
                
                self.stdout.write(f"  Obtenidas {len(all_localidades)}/{total} localidades...")
                
                if len(all_localidades) >= total or len(localidades) < 1000:
                    break
                
                offset += 1000
            
            total_localidades_api = len(set(l['id'] for l in all_localidades))
            self.stdout.write(f"  Total localidades únicas en API: {total_localidades_api}")
            
            if total_localidades_api > localidades_bd:
                self.stdout.write(self.style.WARNING(f"  ⚠ Faltan {total_localidades_api - localidades_bd} localidades en BD"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error: {e}"))
        
        self.stdout.write("\n" + "=" * 60)

