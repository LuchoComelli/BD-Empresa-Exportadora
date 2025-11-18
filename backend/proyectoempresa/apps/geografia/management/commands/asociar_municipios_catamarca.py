"""
Comando para asociar correctamente los municipios de Catamarca a sus departamentos
"""

from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio

# Mapeo de municipios a departamentos en Catamarca
# Basado en la estructura administrativa oficial
# Formato: (ID del municipio o nombre exacto, nombre del departamento)
MUNICIPIOS_DEPARTAMENTOS = {
    # Capital (10049)
    '100140': 'Capital',  # San Fernando del Valle de Catamarca
    
    # Ambato (10007)
    '100007': 'Ambato',  # El Rodeo
    '100014': 'Ambato',  # La Puerta
    '100021': 'Ambato',  # Las Juntas
    '100028': 'Ambato',  # Los Varela
    
    # Ancasti (10014)
    '100035': 'Ancasti',  # Ancasti
    
    # Andalgalá (10021)
    '100042': 'Andalgalá',  # Aconquija
    '100049': 'Andalgalá',  # Andalgalá
    
    # Antofagasta de la Sierra (10028)
    '100056': 'Antofagasta de la Sierra',  # Antofagasta de la Sierra
    
    # Belén (10035)
    '100063': 'Belén',  # Belén
    '100070': 'Belén',  # Corral Quemado
    '100077': 'Belén',  # Hualfin
    '100098': 'Belén',  # Puerta de Corral Quemado
    '100196': 'Belén',  # Saujil
    
    # Capayán (10042)
    '100126': 'Capayán',  # Capayán
    '100133': 'Capayán',  # Huillapima
    '100168': 'Capayán',  # Icaño
    '100175': 'Capayán',  # Recreo
    
    # El Alto (10056)
    '100147': 'El Alto',  # El Alto
    '100154': 'El Alto',  # Tapso
    
    # Fray Mamerto Esquiú (10063)
    '100161': 'Fray Mamerto Esquiú',  # Fray Mamerto Esquiú
    '100203': 'Fray Mamerto Esquiú',  # San José
    '100105': 'Fray Mamerto Esquiú',  # Puerta de San José
    
    # La Paz (10070)
    '100213': 'La Paz',  # Los Altos
    '100185': 'La Paz',  # Mutquin
    
    # Paclín (10077)
    '100182': 'Paclín',  # Paclín
    
    # Pomán (10084)
    '100084': 'Pomán',  # Londres
    '100189': 'Pomán',  # Pomán
    '100091': 'Pomán',  # Pozo de Piedra
    
    # Santa María (10091)
    '100210': 'Santa María',  # Santa María
    '100112': 'Santa María',  # San Fernando
    '100119': 'Santa María',  # Villa Vil
    
    # Santa Rosa (10098)
    '100217': 'Santa Rosa',  # Santa Rosa
    
    # Tinogasta (10105)
    '100224': 'Tinogasta',  # Fiambalá
    '100231': 'Tinogasta',  # Tinogasta
    
    # Valle Viejo (10112)
    '100238': 'Valle Viejo',  # Valle Viejo
}


class Command(BaseCommand):
    help = 'Asociar municipios de Catamarca a sus departamentos correspondientes'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("ASOCIANDO MUNICIPIOS DE CATAMARCA A DEPARTAMENTOS"))
        self.stdout.write("=" * 60)
        
        try:
            catamarca = Provincia.objects.get(id='10')
            self.stdout.write(f"\n📍 Procesando provincia: {catamarca.nombre}")
            
            count_asociados = 0
            count_no_encontrados = []
            
            for municipio_id_or_name, depto_nombre in MUNICIPIOS_DEPARTAMENTOS.items():
                try:
                    # Buscar municipio por ID o nombre
                    if municipio_id_or_name.isdigit():
                        municipio = Municipio.objects.filter(
                            provincia=catamarca,
                            id=municipio_id_or_name
                        ).first()
                    else:
                        municipio = Municipio.objects.filter(
                            provincia=catamarca,
                            nombre=municipio_id_or_name
                        ).first()
                    
                    if not municipio:
                        count_no_encontrados.append(municipio_id_or_name)
                        continue
                    
                    # Buscar departamento
                    departamento = Departamento.objects.filter(
                        provincia=catamarca,
                        nombre=depto_nombre
                    ).first()
                    
                    if not departamento:
                        self.stdout.write(self.style.WARNING(f"  ⚠ Departamento '{depto_nombre}' no encontrado"))
                        continue
                    
                    # Asociar municipio a departamento
                    municipio.departamento = departamento
                    municipio.save()
                    count_asociados += 1
                    self.stdout.write(f"  ✓ {municipio.nombre} -> {departamento.nombre}")
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  ✗ Error con {municipio_id_or_name}: {e}"))
            
            # Verificar municipios que no se encontraron
            if count_no_encontrados:
                self.stdout.write(self.style.WARNING(f"\n⚠ Municipios no encontrados: {', '.join(count_no_encontrados)}"))
            
            # Mostrar municipios sin asociar
            municipios_sin_depto = Municipio.objects.filter(provincia=catamarca, departamento=None)
            if municipios_sin_depto.exists():
                self.stdout.write(self.style.WARNING(f"\n⚠ Municipios sin departamento ({municipios_sin_depto.count()}):"))
                for m in municipios_sin_depto:
                    self.stdout.write(f"    - {m.nombre}")
            
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS(f"✓ ASOCIACIÓN COMPLETADA"))
            self.stdout.write(f"  Municipios asociados: {count_asociados}")
            self.stdout.write(f"  Municipios con departamento: {Municipio.objects.filter(provincia=catamarca).exclude(departamento=None).count()}")
            self.stdout.write(f"  Municipios sin departamento: {Municipio.objects.filter(provincia=catamarca, departamento=None).count()}")
            self.stdout.write("=" * 60)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ Error: {e}"))
            raise

