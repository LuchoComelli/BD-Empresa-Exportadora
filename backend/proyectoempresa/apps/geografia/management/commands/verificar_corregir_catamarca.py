from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db import transaction
from django.db.models import Q

# Estructura oficial de Catamarca basada en fuentes oficiales
ESTRUCTURA_CATAMARCA = {
    'Ambato': {
        'municipios': ['El Rodeo', 'La Puerta', 'Las Juntas', 'Los Varela'],
        'localidades_principales': ['La Puerta', 'El Rodeo', 'Singuil', 'Los Talas', 'Los Castillos', 'Las Juntas', 'Las Chacritas', 'Chuchucaruana', 'Colpes', 'El Bolsón']
    },
    'Ancasti': {
        'municipios': ['Ancasti'],
        'localidades_principales': ['Ancasti', 'Anquincila']
    },
    'Andalgalá': {
        'municipios': ['Aconquija', 'Andalgalá'],
        'localidades_principales': ['Andalgalá', 'Chaquíago', 'Amanao', 'El Lindero', 'La Aguada', 'Choya']
    },
    'Antofagasta de la Sierra': {
        'municipios': ['Antofagasta de la Sierra'],
        'localidades_principales': ['Antofagasta de la Sierra', 'El Peñón', 'Antofalla']
    },
    'Belén': {
        'municipios': ['Belén', 'Corral Quemado', 'Hualfin', 'Puerta de Corral Quemado', 'Saujil', 'Villa Vil'],
        'localidades_principales': ['Belén', 'Londres', 'Villa Vil', 'Pozo de Piedra', 'Corral Quemado', 'Puerta de San José', 'San Fernando', 'Hualfín', 'La Ciénaga', 'Laguna Blanca', 'Jacipunco']
    },
    'Capayán': {
        'municipios': ['Capayán', 'Huillapima', 'Icaño', 'Recreo'],
        'localidades_principales': ['Chumbicha', 'Huillapima', 'Concepción', 'Colonia del Valle', 'San Martín', 'Miraflores']
    },
    'Capital': {
        'municipios': ['San Fernando del Valle de Catamarca'],
        'localidades_principales': ['San Fernando del Valle de Catamarca']
    },
    'El Alto': {
        'municipios': ['El Alto', 'Tapso'],
        'localidades_principales': ['El Alto', 'Tapso', 'Guayamba', 'Vilismán']
    },
    'Fray Mamerto Esquiú': {
        'municipios': ['Fray Mamerto Esquiú', 'Puerta de San José', 'San José'],
        'localidades_principales': ['San José', 'Villa Las Pirquitas', 'Pomancillo Este', 'Pomancillo Oeste']
    },
    'La Paz': {
        'municipios': ['Los Altos', 'Mutquin'],
        'localidades_principales': ['Recreo', 'Icaño', 'San Antonio', 'Quirós']
    },
    'Paclín': {
        'municipios': ['Paclín'],
        'localidades_principales': ['La Merced', 'Balcozna', 'Amadores', 'Monte Potrero']
    },
    'Pomán': {
        'municipios': ['Londres', 'Pomán', 'Pozo de Piedra'],
        'localidades_principales': ['Saujil', 'Mutquín', 'Pomán', 'Rincón', 'Rosario de Colana']
    },
    'Santa María': {
        'municipios': ['San Fernando', 'Santa María'],
        'localidades_principales': ['Santa María', 'San José', 'Chañarpunco', 'Fuerte Quemado', 'Loro Huasi', 'El Recreo', 'El Cajón', 'La Quebrada']
    },
    'Santa Rosa': {
        'municipios': ['Santa Rosa'],
        'localidades_principales': ['Bañado de Ovanta', 'Alijilán', 'Los Altos', 'Manantiales']
    },
    'Tinogasta': {
        'municipios': ['Fiambalá', 'Tinogasta'],
        'localidades_principales': ['Tinogasta', 'Fiambalá', 'Copacabana', 'El Puesto', 'Anillaco', 'El Salado', 'Medanitos', 'Palo Blanco']
    },
    'Valle Viejo': {
        'municipios': ['Valle Viejo'],
        'localidades_principales': ['San Isidro', 'Villa Dolores', 'Santa Rosa', 'Sumalao', 'Polcos', 'Huaycama', 'Las Tejas', 'Los Puestos', 'Santa Cruz']
    }
}


class Command(BaseCommand):
    help = 'Verifica y corrige todas las relaciones de departamentos, municipios y localidades de Catamarca'

    def encontrar_municipio(self, nombre, departamento):
        """Busca un municipio por nombre en un departamento"""
        # Búsqueda exacta
        muni = Municipio.objects.filter(
            departamento=departamento,
            nombre__iexact=nombre
        ).first()
        
        if muni:
            return muni
        
        # Búsqueda parcial
        muni = Municipio.objects.filter(
            departamento=departamento,
            nombre__icontains=nombre
        ).first()
        
        return muni

    def encontrar_localidad(self, nombre, departamento, municipio=None):
        """Busca una localidad por nombre en un departamento"""
        # Búsqueda exacta
        if municipio:
            loc = Localidad.objects.filter(
                departamento=departamento,
                municipio=municipio,
                nombre__iexact=nombre
            ).first()
            if loc:
                return loc
        
        loc = Localidad.objects.filter(
            departamento=departamento,
            nombre__iexact=nombre
        ).first()
        
        if loc:
            return loc
        
        # Búsqueda parcial
        if municipio:
            loc = Localidad.objects.filter(
                departamento=departamento,
                municipio=municipio,
                nombre__icontains=nombre
            ).first()
            if loc:
                return loc
        
        loc = Localidad.objects.filter(
            departamento=departamento,
            nombre__icontains=nombre
        ).first()
        
        return loc

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS("🔍 VERIFICACIÓN Y CORRECCIÓN DE CATAMARCA"))
        self.stdout.write("="*60)
        
        # Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        self.stdout.write(f"\n✅ Provincia Catamarca: {catamarca.nombre} (ID: {catamarca.id})\n")
        
        problemas_encontrados = []
        correcciones_realizadas = []
        
        # Revisar cada departamento
        for depto_nombre, estructura in ESTRUCTURA_CATAMARCA.items():
            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(f"🏛️  Revisando: {depto_nombre}")
            self.stdout.write(f"{'='*60}")
            
            # Buscar departamento
            depto = Departamento.objects.filter(
                provincia=catamarca,
                nombre__iexact=depto_nombre
            ).first()
            
            if not depto:
                self.stdout.write(self.style.WARNING(f"  ⚠️  Departamento {depto_nombre} no encontrado"))
                problemas_encontrados.append(f"Departamento {depto_nombre} no existe")
                continue
            
            # Verificar municipios
            municipios_esperados = estructura['municipios']
            municipios_actuales = Municipio.objects.filter(departamento=depto)
            
            self.stdout.write(f"\n📍 Municipios esperados: {len(municipios_esperados)}")
            self.stdout.write(f"📍 Municipios actuales: {municipios_actuales.count()}")
            
            # Verificar cada municipio esperado
            for muni_nombre in municipios_esperados:
                muni = self.encontrar_municipio(muni_nombre, depto)
                
                if not muni:
                    # Buscar en toda la provincia (solo si no está ya asignado a otro departamento de Catamarca)
                    muni_perdido = Municipio.objects.filter(
                        provincia=catamarca,
                        nombre__iexact=muni_nombre
                    ).exclude(departamento=depto).first()
                    
                    if muni_perdido:
                        # Verificar si ya está en otro departamento de Catamarca
                        if muni_perdido.departamento and muni_perdido.departamento.provincia == catamarca:
                            self.stdout.write(self.style.WARNING(f"  ⚠️  {muni_nombre}: Ya está en {muni_perdido.departamento.nombre}"))
                            problemas_encontrados.append(f"Municipio {muni_nombre} está en {muni_perdido.departamento.nombre} pero debería estar en {depto_nombre}")
                        else:
                            # Mover al departamento correcto
                            muni_perdido.departamento = depto
                            muni_perdido.save()
                            correcciones_realizadas.append(f"Municipio {muni_nombre} movido a {depto_nombre}")
                            self.stdout.write(self.style.SUCCESS(f"  ✅ {muni_nombre}: Movido a {depto_nombre}"))
                    else:
                        # Buscar por nombre parcial
                        muni_perdido = Municipio.objects.filter(
                            provincia=catamarca,
                            nombre__icontains=muni_nombre
                        ).exclude(departamento=depto).first()
                        
                        if muni_perdido:
                            self.stdout.write(self.style.WARNING(f"  ⚠️  {muni_nombre}: Encontrado en {muni_perdido.departamento.nombre if muni_perdido.departamento else 'SIN DEPTO'}"))
                            problemas_encontrados.append(f"Municipio {muni_nombre} está en {muni_perdido.departamento.nombre if muni_perdido.departamento else 'SIN DEPTO'} pero debería estar en {depto_nombre}")
                        else:
                            self.stdout.write(self.style.WARNING(f"  ⚠️  {muni_nombre}: No encontrado"))
                            problemas_encontrados.append(f"Municipio {muni_nombre} no existe en {depto_nombre}")
                else:
                    self.stdout.write(f"  ✓ {muni_nombre}: OK")
            
            # Verificar localidades principales
            localidades_esperadas = estructura['localidades_principales']
            self.stdout.write(f"\n🏘️  Verificando localidades principales ({len(localidades_esperadas)}):")
            
            for loc_nombre in localidades_esperadas:
                # Buscar en el departamento
                loc = Localidad.objects.filter(
                    departamento=depto,
                    nombre__iexact=loc_nombre
                ).first()
                
                if not loc:
                    # Buscar en toda la provincia
                    loc_perdida = Localidad.objects.filter(
                        provincia=catamarca,
                        nombre__iexact=loc_nombre
                    ).first()
                    
                    if loc_perdida and loc_perdida.departamento != depto:
                        self.stdout.write(self.style.WARNING(f"  ⚠️  {loc_nombre}: Está en {loc_perdida.departamento.nombre} pero debería estar en {depto_nombre}"))
                        problemas_encontrados.append(f"Localidad {loc_nombre} está en {loc_perdida.departamento.nombre} pero debería estar en {depto_nombre}")
                    elif not loc_perdida:
                        # Buscar por nombre parcial
                        loc_perdida = Localidad.objects.filter(
                            provincia=catamarca,
                            nombre__icontains=loc_nombre
                        ).exclude(departamento=depto).first()
                        
                        if loc_perdida:
                            self.stdout.write(self.style.WARNING(f"  ⚠️  {loc_nombre}: Similar encontrado en {loc_perdida.departamento.nombre}"))
                        else:
                            self.stdout.write(f"  → {loc_nombre}: No encontrada (puede no existir en BD)")
                else:
                    # Verificar que el municipio sea correcto si tiene uno
                    if loc.municipio and loc.municipio.departamento != depto:
                        self.stdout.write(self.style.WARNING(f"  ⚠️  {loc_nombre}: Municipio incorrecto ({loc.municipio.nombre})"))
                        problemas_encontrados.append(f"Localidad {loc_nombre} tiene municipio incorrecto")
                    else:
                        self.stdout.write(f"  ✓ {loc_nombre}: OK")
        
        # Resumen
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN"))
        self.stdout.write("="*60)
        self.stdout.write(f"✅ Correcciones realizadas: {len(correcciones_realizadas)}")
        self.stdout.write(f"⚠️  Problemas encontrados: {len(problemas_encontrados)}")
        
        if correcciones_realizadas:
            self.stdout.write("\n✅ Correcciones:")
            for corr in correcciones_realizadas:
                self.stdout.write(f"  - {corr}")
        
        if problemas_encontrados:
            self.stdout.write("\n⚠️  Problemas:")
            for prob in problemas_encontrados[:20]:  # Mostrar solo los primeros 20
                self.stdout.write(f"  - {prob}")
            if len(problemas_encontrados) > 20:
                self.stdout.write(f"  ... y {len(problemas_encontrados) - 20} más")
        
        self.stdout.write("="*60)

