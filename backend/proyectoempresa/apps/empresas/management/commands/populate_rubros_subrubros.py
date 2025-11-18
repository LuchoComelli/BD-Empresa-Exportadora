"""
Comando para poblar rubros y subrubros según la clasificación oficial
"""

from django.core.management.base import BaseCommand
from apps.empresas.models import Rubro, SubRubro

# Datos de PRODUCTOS
PRODUCTOS_DATA = {
    'Agrícola': {
        'subrubros': [
            'Vinos',
            'Aceite de Oliva',
            'Frutas Frescas',
            'Frutas Secas',
            'Hortalizas',
            'Cereales',
            'Legumbres',
            'Aromáticas',
        ],
        'unidad_medida': 'kg',
        'orden': 1,
    },
    'Ganadero': {
        'subrubros': [
            'Caprino',
            'Bovino',
            'Ovino',
            'Porcino',
            'Avícola',
            'Apícola',
        ],
        'unidad_medida': 'kg',
        'orden': 2,
    },
    'Industrial': {
        'subrubros': [
            'Metalúrgica',
            'Química',
            'Plásticos',
            'Maquinaria',
            'Electrónica',
            'Automotriz',
            'Construcción',
        ],
        'unidad_medida': 'u',
        'orden': 3,
    },
    'Textil': {
        'subrubros': [
            'Hilados',
            'Tejidos',
            'Confección',
            'Indumentaria',
            'Calzado',
            'Marroquinería',
        ],
        'unidad_medida': 'u',
        'orden': 4,
    },
    'Alimentos y Bebidas': {
        'subrubros': [
            'Conservas',
            'Lácteos',
            'Panificados',
            'Bebidas',
            'Dulces y Mermeladas',
            'Embutidos',
            'Congelados',
        ],
        'unidad_medida': 'kg',
        'orden': 5,
    },
    'Minería': {
        'subrubros': [
            'Metalíferos',
            'No Metalíferos',
            'Rocas de Aplicación',
            'Piedras Preciosas',
        ],
        'unidad_medida': 'tn',
        'orden': 6,
    },
    'Artesanías': {
        'subrubros': [
            'Textiles',
            'Cerámica',
            'Madera',
            'Cuero',
            'Metal',
        ],
        'unidad_medida': 'u',
        'orden': 7,
    },
    'Otro': {
        'subrubros': [
            'Otro',
        ],
        'unidad_medida': 'u',
        'orden': 8,
    },
}

# Datos de SERVICIOS
SERVICIOS_DATA = {
    'Audiovisual': {
        'subrubros': [
            'Producción audiovisual',
            'Edición y postproducción',
            'Filmación y fotografía profesional',
            'Animación y motion graphics',
            'Producción publicitaria',
            'Gestión cultural / contenidos',
            'Sonido, mezcla y musicalización',
            'Educativo',
        ],
        'unidad_medida': 'na',
        'orden': 1,
    },
    'Capacitación': {
        'subrubros': [
            'Cursos técnicos',
            'Formación profesional',
            'Capacitaciones empresariales',
            'Talleres creativos',
            'Capacitaciones tecnológicas',
            'Formación en oficios',
            'Capacitación docente',
            'Capacitaciones en habilidades blandas',
        ],
        'unidad_medida': 'na',
        'orden': 2,
    },
    'Comercio Exterior': {
        'subrubros': [
            'Asesoría en exportaciones',
            'Asesoría en importaciones',
            'Gestión aduanera',
            'Certificaciones y normativa',
            'Estudios de mercado internacional',
            'Trámites de logística internacional',
        ],
        'unidad_medida': 'na',
        'orden': 3,
    },
    'Comercio Exterior Nacional': {
        'subrubros': [
            'Gestión de envíos nacionales',
            'Distribución y transporte',
            'Servicios de paquetería',
            'Consultoría en comercio interior',
            'Almacenamiento y centros logísticos',
        ],
        'unidad_medida': 'na',
        'orden': 4,
    },
    'Consultoría': {
        'subrubros': [
            'Consultoría empresarial',
            'Consultoría financiera',
            'Consultoría en marketing',
            'Consultoría legal',
            'Consultoría ambiental',
            'Consultoría en RRHH',
            'Consultoría tecnológica',
            'Consultoría en innovación',
        ],
        'unidad_medida': 'na',
        'orden': 5,
    },
    'Desarrollo de Software': {
        'subrubros': [
            'Desarrollo web',
            'Desarrollo móvil',
            'Software a medida',
            'Integración de sistemas',
            'Testing y QA',
            'UX/UI Design',
            'Consultoría en software',
            'Mantenimiento y soporte técnico',
        ],
        'unidad_medida': 'na',
        'orden': 6,
    },
    'Eventos': {
        'subrubros': [
            'Organización de eventos',
            'Producción de eventos culturales',
            'Producción de eventos corporativos',
            'Servicios de sonido e iluminación',
            'Catering',
            'Proveedores de mobiliario',
            'Gestión de espacios',
            'Animación / ambientación / escenografía',
        ],
        'unidad_medida': 'na',
        'orden': 7,
    },
    'Informática': {
        'subrubros': [
            'Reparación y mantenimiento de equipos',
            'Redes y conectividad',
            'Soporte técnico',
            'Armado de PC y servidores',
            'Seguridad informática básica',
            'Instalación de software y hardware',
        ],
        'unidad_medida': 'na',
        'orden': 8,
    },
    'Internet': {
        'subrubros': [
            'Proveedor de internet',
        ],
        'unidad_medida': 'na',
        'orden': 9,
    },
    'Logística': {
        'subrubros': [
            'Logística integral',
            'Transporte internacional',
            'Gestión de cargas',
            'Servicios puerta a puerta',
            'Depósitos y almacenamiento',
            'Courier internacional',
        ],
        'unidad_medida': 'na',
        'orden': 10,
    },
    'Logística Nacional': {
        'subrubros': [
            'Transporte regional',
            'Mensajería y paquetería',
            'Servicios de depósito',
            'Cargas y distribución',
            'Gestión de rutas',
        ],
        'unidad_medida': 'na',
        'orden': 11,
    },
    'Tecnología': {
        'subrubros': [
            'Soluciones tecnológicas empresariales',
            'Instalación de sistemas',
            'Automatización',
            'Domótica',
            'Venta de hardware tecnológico',
            'Integraciones IoT',
        ],
        'unidad_medida': 'na',
        'orden': 12,
    },
    'Innovación Tecnológica': {
        'subrubros': [
            'Investigación y desarrollo (I+D)',
            'Consultoría en innovación',
            'Desarrollo de prototipos',
            'Proyectos con tecnología aplicada',
            'Transformación digital',
            'Inteligencia artificial aplicada',
        ],
        'unidad_medida': 'na',
        'orden': 13,
    },
    'Industrias Creativas': {
        'subrubros': [
            'Artes Visuales (galerías, artistas, ilustradores)',
            'Artes Escénicas (teatro, danza, producción escénica)',
            'Diseño con impacto: Moda',
            'Diseño con impacto: Interiorismo',
            'Editorial',
            'Música (fabricación de instrumentos, representantes musicales, proyectos musicales)',
            'Producción cultural',
            'Diseño gráfico',
            'Diseño industrial',
            'Publicidad y creatividad',
            'Producción multimedia',
        ],
        'unidad_medida': 'na',
        'orden': 14,
    },
    'Otro': {
        'subrubros': [
            'Otro',
        ],
        'unidad_medida': 'na',
        'orden': 15,
    },
}


class Command(BaseCommand):
    help = 'Poblar rubros y subrubros según la clasificación oficial'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("POBLACIÓN DE RUBROS Y SUBRUBROS"))
        self.stdout.write("=" * 60)
        
        total_rubros = 0
        total_subrubros = 0
        
        # Procesar PRODUCTOS
        self.stdout.write("\n📦 Procesando RUBROS DE PRODUCTOS...")
        for nombre_rubro, datos in PRODUCTOS_DATA.items():
            rubro, created = Rubro.objects.update_or_create(
                nombre=nombre_rubro,
                defaults={
                    'tipo': 'producto',
                    'unidad_medida_estandar': datos['unidad_medida'],
                    'orden': datos['orden'],
                    'activo': True,
                }
            )
            if created:
                total_rubros += 1
                self.stdout.write(f"  ✓ Rubro creado: {nombre_rubro}")
            else:
                self.stdout.write(f"  → Rubro actualizado: {nombre_rubro}")
            
            # Crear subrubros
            for idx, nombre_subrubro in enumerate(datos['subrubros'], 1):
                subrubro, created = SubRubro.objects.update_or_create(
                    nombre=nombre_subrubro,
                    rubro=rubro,
                    defaults={
                        'orden': idx,
                        'activo': True,
                    }
                )
                if created:
                    total_subrubros += 1
        
        # Procesar SERVICIOS
        self.stdout.write("\n🔧 Procesando RUBROS DE SERVICIOS...")
        orden_base_servicios = 100  # Para que aparezcan después de productos
        for nombre_rubro, datos in SERVICIOS_DATA.items():
            rubro, created = Rubro.objects.update_or_create(
                nombre=nombre_rubro,
                defaults={
                    'tipo': 'servicio',
                    'unidad_medida_estandar': datos['unidad_medida'],
                    'orden': orden_base_servicios + datos['orden'],
                    'activo': True,
                }
            )
            if created:
                total_rubros += 1
                self.stdout.write(f"  ✓ Rubro creado: {nombre_rubro}")
            else:
                self.stdout.write(f"  → Rubro actualizado: {nombre_rubro}")
            
            # Crear subrubros
            for idx, nombre_subrubro in enumerate(datos['subrubros'], 1):
                subrubro, created = SubRubro.objects.update_or_create(
                    nombre=nombre_subrubro,
                    rubro=rubro,
                    defaults={
                        'orden': idx,
                        'activo': True,
                    }
                )
                if created:
                    total_subrubros += 1
        
        # Resumen
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✓ POBLACIÓN COMPLETADA"))
        self.stdout.write(f"  Rubros de productos: {len(PRODUCTOS_DATA)}")
        self.stdout.write(f"  Rubros de servicios: {len(SERVICIOS_DATA)}")
        self.stdout.write(f"  Total rubros procesados: {Rubro.objects.filter(activo=True).count()}")
        self.stdout.write(f"  Total subrubros: {SubRubro.objects.filter(activo=True).count()}")
        self.stdout.write(f"  Rubros nuevos: {total_rubros}")
        self.stdout.write(f"  Subrubros nuevos: {total_subrubros}")
        self.stdout.write("=" * 60)

