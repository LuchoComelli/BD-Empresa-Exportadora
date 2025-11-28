"""
Management command para actualizar las ubicaciones de todas las empresas a Catamarca
"""
from django.core.management.base import BaseCommand
from apps.empresas.models import Empresa
from apps.geografia.models import Departamento, Municipio, Localidad
import random

# Coordenadas aproximadas de ciudades principales de Catamarca
COORDENADAS_CATAMARCA = {
    'Capital': (-28.4696, -65.7795),  # San Fernando del Valle de Catamarca
    'Valle Viejo': (-28.5000, -65.7500),
    'Fray Mamerto Esquiú': (-28.4500, -65.7000),
    'Ambato': (-28.2000, -65.9000),
    'Ancasti': (-28.8000, -65.5000),
    'Andalgalá': (-27.6000, -66.3000),
    'Antofagasta de la Sierra': (-26.1000, -67.4000),
    'Belén': (-27.6500, -67.0500),
    'Capayán': (-28.8000, -66.0000),
    'El Alto': (-28.3000, -65.3000),
    'La Paz': (-28.6000, -65.8000),
    'Paclín': (-28.0000, -65.6000),
    'Pomán': (-28.4000, -66.2000),
    'Santa María': (-26.7000, -66.0000),
    'Santa Rosa': (-28.1000, -65.2000),
    'Tinogasta': (-28.0500, -67.5500),
}

# Set para rastrear coordenadas ya usadas
coordenadas_usadas = set()

class Command(BaseCommand):
    help = 'Actualiza las ubicaciones de todas las empresas a Catamarca'

    def handle(self, *args, **options):
        # Obtener todos los departamentos de Catamarca (provincia_id = 10)
        departamentos_catamarca = list(Departamento.objects.filter(provincia_id=10))
        
        if not departamentos_catamarca:
            self.stdout.write(self.style.ERROR('No se encontraron departamentos de Catamarca'))
            return
        
        self.stdout.write(f'Se encontraron {len(departamentos_catamarca)} departamentos de Catamarca')
        
        # Obtener todas las empresas
        empresas = Empresa.objects.all()
        total = empresas.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING('No hay empresas para actualizar'))
            return
        
        self.stdout.write(f'Actualizando {total} empresas...')
        
        actualizadas = 0
        errores = 0
        
        for empresa in empresas:
            try:
                # Seleccionar un departamento aleatorio de Catamarca
                departamento = random.choice(departamentos_catamarca)
                
                # Obtener municipios del departamento seleccionado
                municipios = list(Municipio.objects.filter(departamento=departamento))
                
                # Obtener localidades del departamento seleccionado
                localidades = list(Localidad.objects.filter(departamento=departamento))
                
                # Seleccionar municipio y localidad (pueden ser None)
                municipio = random.choice(municipios) if municipios else None
                localidad = random.choice(localidades) if localidades else None
                
                # Obtener coordenadas basadas en el nombre del departamento
                nombre_depto = departamento.nombre
                if nombre_depto in COORDENADAS_CATAMARCA:
                    base_lat, base_lng = COORDENADAS_CATAMARCA[nombre_depto]
                else:
                    # Si no está en el diccionario, usar coordenadas de Capital
                    base_lat, base_lng = COORDENADAS_CATAMARCA['Capital']
                
                # Generar coordenadas únicas agregando variación basada en municipio y localidad
                # Usar hash del ID de municipio y localidad para generar variación determinística pero única
                hash_municipio = hash(municipio.id if municipio else empresa.id) % 1000 if municipio else empresa.id % 1000
                hash_localidad = hash(localidad.id if localidad else empresa.id * 2) % 1000 if localidad else (empresa.id * 3) % 1000
                
                # Variación pequeña pero única (aproximadamente 100-500 metros)
                variacion_lat = (hash_municipio / 10000.0) + (hash_localidad / 20000.0)  # ~0.01 a 0.15 grados
                variacion_lng = (hash_localidad / 10000.0) + (hash_municipio / 20000.0)  # ~0.01 a 0.15 grados
                
                lat = base_lat + variacion_lat
                lng = base_lng + variacion_lng
                
                # Asegurar que las coordenadas sean únicas (redondear a 6 decimales para evitar duplicados)
                coord_key = (round(lat, 6), round(lng, 6))
                intentos = 0
                while coord_key in coordenadas_usadas and intentos < 100:
                    # Si ya existe, agregar una variación adicional muy pequeña
                    lat += random.uniform(0.0001, 0.001)  # ~10-100 metros
                    lng += random.uniform(0.0001, 0.001)
                    coord_key = (round(lat, 6), round(lng, 6))
                    intentos += 1
                
                coordenadas_usadas.add(coord_key)
                
                # Actualizar la empresa usando update() para evitar problemas de serialización
                Empresa.objects.filter(id=empresa.id).update(
                    departamento=departamento,
                    municipio=municipio,
                    localidad=localidad,
                    geolocalizacion=f"{lat:.6f},{lng:.6f}"
                )
                
                actualizadas += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {empresa.razon_social}: {departamento.nombre} '
                        f'({municipio.nombre if municipio else "Sin municipio"}, '
                        f'{localidad.nombre if localidad else "Sin localidad"})'
                    )
                )
                
            except Exception as e:
                errores += 1
                self.stdout.write(
                    self.style.ERROR(f'✗ Error actualizando {empresa.razon_social}: {str(e)}')
                )
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Proceso completado: {actualizadas} empresas actualizadas, {errores} errores'
        ))

