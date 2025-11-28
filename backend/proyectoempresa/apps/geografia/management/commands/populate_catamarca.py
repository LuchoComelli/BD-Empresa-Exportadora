"""
Comando de Django para poblar la base de datos con datos geográficos de CATAMARCA
usando la API Georef oficial del gobierno argentino.

Este comando solo importa datos de la provincia de Catamarca para optimizar
la carga y mantener la base de datos liviana.

Fuente: https://apis.datos.gob.ar/georef/api/
"""

import requests
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad

# URL base de la API Georef
API_BASE_URL = "https://apis.datos.gob.ar/georef/api"

# ID de Catamarca en la API Georef
CATAMARCA_ID = "10"
CATAMARCA_NOMBRE = "Catamarca"


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos geográficos de CATAMARCA desde la API Georef'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-localidades',
            action='store_true',
            help='Omitir la importación de localidades (más rápido)',
        )
        parser.add_argument(
            '--limpiar',
            action='store_true',
            help='Limpiar todos los datos geográficos antes de importar',
        )

    def fetch_from_api(self, endpoint: str, params: dict = None) -> list:
        """Obtener datos de la API Georef con manejo de errores"""
        if params is None:
            params = {}
        
        # Configurar parámetros por defecto
        params.setdefault('max', 5000)
        params.setdefault('campos', 'completo')
        
        url = f"{API_BASE_URL}/{endpoint}"
        all_data = []
        offset = 0
        
        while True:
            params['inicio'] = offset
            
            try:
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                # Obtener items según el endpoint
                items = data.get(endpoint, [])
                
                if not items:
                    break
                
                all_data.extend(items)
                
                total = data.get('total', 0)
                cantidad = data.get('cantidad', 0)
                
                self.stdout.write(f"  → Obtenidos {len(all_data)}/{total} registros")
                
                # Si ya obtuvimos todos, salir
                if len(all_data) >= total or cantidad < params['max']:
                    break
                
                offset += params['max']
                time.sleep(0.1)  # Pausa para no saturar la API
                
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
                break
        
        return all_data

    def limpiar_datos(self):
        """Limpiar todos los datos geográficos existentes"""
        self.stdout.write("\n🗑️  Limpiando datos existentes...")
        
        try:
            localidades_count = Localidad.objects.all().count()
            municipios_count = Municipio.objects.all().count()
            departamentos_count = Departamento.objects.all().count()
            provincias_count = Provincia.objects.all().count()
            
            Localidad.objects.all().delete()
            Municipio.objects.all().delete()
            Departamento.objects.all().delete()
            Provincia.objects.all().delete()
            
            self.stdout.write(self.style.SUCCESS(
                f"✓ Eliminados: {localidades_count} localidades, {municipios_count} municipios, "
                f"{departamentos_count} departamentos, {provincias_count} provincias"
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error al limpiar: {e}"))
            raise

    def import_provincia_catamarca(self):
        """Importar solo la provincia de Catamarca"""
        self.stdout.write("\n📍 Importando provincia de Catamarca...")
        
        provincias_data = self.fetch_from_api('provincias', {'id': CATAMARCA_ID})
        
        if not provincias_data:
            self.stdout.write(self.style.ERROR("✗ No se pudo obtener Catamarca"))
            raise Exception("No se pudo obtener la provincia de Catamarca")
        
        p = provincias_data[0]
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
        
        action = "creada" if created else "actualizada"
        self.stdout.write(self.style.SUCCESS(f"✓ Provincia de Catamarca {action}"))
        return provincia

    def import_departamentos_catamarca(self):
        """Importar departamentos de Catamarca"""
        self.stdout.write("\n🗺️  Importando departamentos de Catamarca...")
        
        departamentos_data = self.fetch_from_api('departamentos', {'provincia': CATAMARCA_ID})
        
        if not departamentos_data:
            self.stdout.write(self.style.WARNING("⚠ No se obtuvieron departamentos"))
            return
        
        count_created = 0
        count_updated = 0
        
        for d in departamentos_data:
            try:
                provincia = Provincia.objects.get(id=CATAMARCA_ID)
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
                    count_created += 1
                else:
                    count_updated += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠ Error con departamento {d.get('nombre', 'unknown')}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(
            f"✓ {len(departamentos_data)} departamentos procesados "
            f"({count_created} nuevos, {count_updated} actualizados)"
        ))

    def import_municipios_catamarca(self):
        """Importar municipios de Catamarca"""
        self.stdout.write("\n🏛️  Importando municipios de Catamarca...")
        
        municipios_data = self.fetch_from_api('municipios', {'provincia': CATAMARCA_ID})
        
        if not municipios_data:
            self.stdout.write(self.style.WARNING("⚠ No se obtuvieron municipios"))
            return
        
        count_created = 0
        count_updated = 0
        
        for m in municipios_data:
            try:
                provincia = Provincia.objects.get(id=CATAMARCA_ID)
                departamento = None
                
                if 'departamento' in m and m['departamento']:
                    try:
                        departamento = Departamento.objects.get(id=m['departamento']['id'])
                    except Departamento.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f"⚠ Departamento {m['departamento'].get('id')} no encontrado para municipio {m['nombre']}"
                        ))
                
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
                    count_created += 1
                else:
                    count_updated += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠ Error con municipio {m.get('nombre', 'unknown')}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(
            f"✓ {len(municipios_data)} municipios procesados "
            f"({count_created} nuevos, {count_updated} actualizados)"
        ))

    def import_localidades_catamarca(self):
        """Importar localidades de Catamarca"""
        self.stdout.write("\n🏘️  Importando localidades de Catamarca...")
        
        # Usar asentamientos (BAHRA) para obtener localidades
        localidades_data = self.fetch_from_api('asentamientos', {
            'provincia': CATAMARCA_ID,
            'max': 1000  # Tamaño de página más pequeño
        })
        
        if not localidades_data:
            self.stdout.write(self.style.WARNING("⚠ No se obtuvieron localidades"))
            return
        
        count_created = 0
        count_updated = 0
        total = len(localidades_data)
        
        for i, l in enumerate(localidades_data, 1):
            try:
                provincia = Provincia.objects.get(id=CATAMARCA_ID)
                
                # Buscar departamento
                departamento = None
                if 'departamento' in l and l['departamento']:
                    try:
                        departamento = Departamento.objects.get(id=l['departamento']['id'])
                    except Departamento.DoesNotExist:
                        pass
                
                # Buscar municipio
                municipio = None
                if 'municipio' in l and l['municipio']:
                    try:
                        municipio = Municipio.objects.get(id=l['municipio']['id'])
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
                    count_created += 1
                else:
                    count_updated += 1
                
                # Mostrar progreso cada 50 registros
                if i % 50 == 0:
                    self.stdout.write(f"  → Procesadas {i}/{total} localidades...")
                    
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠ Error con localidad {l.get('nombre', 'unknown')}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(
            f"✓ {total} localidades procesadas "
            f"({count_created} nuevas, {count_updated} actualizadas)"
        ))

    def handle(self, *args, **options):
        start_time = datetime.now()
        
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS("IMPORTACIÓN DE DATOS GEOGRÁFICOS DE CATAMARCA"))
        self.stdout.write("Fuente: API Georef - datos.gob.ar")
        self.stdout.write("=" * 70)
        
        try:
            # Limpiar datos si se solicita
            if options['limpiar']:
                self.limpiar_datos()
            
            # Importar en orden jerárquico
            self.import_provincia_catamarca()
            self.import_departamentos_catamarca()
            self.import_municipios_catamarca()
            
            if not options['skip_localidades']:
                self.import_localidades_catamarca()
            else:
                self.stdout.write(self.style.WARNING("\n⚠ Localidades omitidas (--skip-localidades)"))
            
            # Mostrar resumen final
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.stdout.write("\n" + "=" * 70)
            self.stdout.write(self.style.SUCCESS("✓ IMPORTACIÓN COMPLETADA"))
            self.stdout.write(f"\n📊 Resumen de datos cargados:")
            self.stdout.write(f"  • Provincias: {Provincia.objects.count()}")
            self.stdout.write(f"  • Departamentos: {Departamento.objects.count()}")
            self.stdout.write(f"  • Municipios: {Municipio.objects.count()}")
            self.stdout.write(f"  • Localidades: {Localidad.objects.count()}")
            self.stdout.write(f"\n⏱️  Duración: {duration}")
            self.stdout.write(f"  Finalizado: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            self.stdout.write("=" * 70)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ Error durante la importación: {e}"))
            raise