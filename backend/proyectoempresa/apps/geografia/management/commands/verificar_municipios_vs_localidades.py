from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db.models import Q


class Command(BaseCommand):
    help = 'Verifica si hay nombres que son tanto municipios como localidades y corrige las relaciones'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write(self.style.SUCCESS("🔍 VERIFICACIÓN: MUNICIPIOS VS LOCALIDADES"))
        self.stdout.write("="*70)
        
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
        
        problemas_encontrados = []
        
        for depto in deptos:
            self.stdout.write(f"\n{'='*70}")
            self.stdout.write(f"🏛️  {depto.nombre}")
            self.stdout.write(f"{'='*70}")
            
            # Obtener nombres de municipios
            munis = Municipio.objects.filter(departamento=depto)
            nombres_munis = {m.nombre.lower() for m in munis}
            
            # Obtener nombres de localidades
            locs = Localidad.objects.filter(departamento=depto)
            nombres_locs = {l.nombre.lower() for l in locs}
            
            # Verificar si hay nombres que son tanto municipio como localidad
            nombres_comunes = nombres_munis.intersection(nombres_locs)
            
            if nombres_comunes:
                self.stdout.write(f"\n⚠️  Nombres que son municipio Y localidad:")
                for nombre in sorted(nombres_comunes):
                    muni = munis.filter(nombre__iexact=nombre).first()
                    loc = locs.filter(nombre__iexact=nombre).first()
                    
                    if muni and loc:
                        # Verificar si la localidad está asignada al municipio
                        if loc.municipio != muni:
                            self.stdout.write(self.style.WARNING(f"  ⚠️  {nombre}: Localidad NO asignada a su municipio"))
                            problemas_encontrados.append(f"{depto.nombre}: {nombre} - localidad no asignada a municipio")
                        else:
                            self.stdout.write(f"  ✓ {nombre}: OK (localidad asignada a municipio)")
            
            # Verificar localidades que tienen el mismo nombre que un municipio pero no están asignadas
            locs_sin_asignar = locs.filter(municipio__isnull=True)
            for loc in locs_sin_asignar:
                if loc.nombre.lower() in nombres_munis:
                    muni_correspondiente = munis.filter(nombre__iexact=loc.nombre).first()
                    if muni_correspondiente:
                        self.stdout.write(self.style.WARNING(f"  ⚠️  {loc.nombre}: Localidad sin asignar pero existe municipio con mismo nombre"))
                        problemas_encontrados.append(f"{depto.nombre}: {loc.nombre} - localidad sin asignar")
        
        # Resumen
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN"))
        self.stdout.write("="*70)
        self.stdout.write(f"⚠️  Problemas encontrados: {len(problemas_encontrados)}")
        for prob in problemas_encontrados[:20]:
            self.stdout.write(f"  - {prob}")
        if len(problemas_encontrados) > 20:
            self.stdout.write(f"  ... y {len(problemas_encontrados) - 20} más")
        self.stdout.write("="*70)

