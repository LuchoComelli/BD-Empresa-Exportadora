from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db.models import Q, Count


class Command(BaseCommand):
    help = 'Verificación final completa de todos los departamentos de Catamarca'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write(self.style.SUCCESS("🔍 VERIFICACIÓN FINAL COMPLETA DE CATAMARCA"))
        self.stdout.write("="*70)
        
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
        
        self.stdout.write(f"\n📋 Total de departamentos: {deptos.count()}\n")
        
        problemas_totales = []
        departamentos_perfectos = []
        
        for idx, depto in enumerate(deptos, 1):
            self.stdout.write(f"\n{'='*70}")
            self.stdout.write(f"[{idx}/{deptos.count()}] 🏛️  {depto.nombre}")
            self.stdout.write(f"{'='*70}")
            
            munis = Municipio.objects.filter(departamento=depto).order_by('nombre')
            locs = Localidad.objects.filter(departamento=depto)
            locs_con_muni = locs.filter(municipio__isnull=False)
            locs_sin_muni = locs.filter(municipio__isnull=True)
            locs_muni_incorrecto = locs.exclude(municipio__departamento=depto).exclude(municipio__isnull=True)
            
            self.stdout.write(f"\n📍 Municipios: {munis.count()}")
            for muni in munis:
                locs_count = Localidad.objects.filter(municipio=muni).count()
                self.stdout.write(f"  • {muni.nombre}: {locs_count} localidades")
            
            self.stdout.write(f"\n🏘️  Localidades: {locs.count()}")
            self.stdout.write(f"  - Con municipio: {locs_con_muni.count()}")
            self.stdout.write(f"  - Sin municipio: {locs_sin_muni.count()}")
            self.stdout.write(f"  - Con municipio incorrecto: {locs_muni_incorrecto.count()}")
            
            if locs_sin_muni.exists():
                self.stdout.write(self.style.WARNING(f"\n  ⚠️  Localidades sin municipio ({locs_sin_muni.count()}):"))
                for loc in locs_sin_muni[:10]:
                    self.stdout.write(f"      - {loc.nombre}")
                if locs_sin_muni.count() > 10:
                    self.stdout.write(f"      ... y {locs_sin_muni.count() - 10} más")
            
            if locs_muni_incorrecto.exists():
                self.stdout.write(self.style.ERROR(f"\n  ❌ Localidades con municipio incorrecto ({locs_muni_incorrecto.count()}):"))
                for loc in locs_muni_incorrecto[:5]:
                    muni_nombre = loc.municipio.nombre if loc.municipio else "SIN MUNICIPIO"
                    depto_muni = loc.municipio.departamento.nombre if loc.municipio and loc.municipio.departamento else "SIN DEPTO"
                    self.stdout.write(f"      - {loc.nombre} -> {muni_nombre} (Depto: {depto_muni})")
                problemas_totales.append(f"{depto.nombre}: {locs_muni_incorrecto.count()} localidades con municipio incorrecto")
            
            # Verificar que todos los municipios tengan el departamento correcto
            munis_incorrectos = munis.exclude(departamento=depto)
            if munis_incorrectos.exists():
                self.stdout.write(self.style.ERROR(f"\n  ❌ Municipios con departamento incorrecto ({munis_incorrectos.count()}):"))
                for muni in munis_incorrectos:
                    self.stdout.write(f"      - {muni.nombre} -> {muni.departamento.nombre if muni.departamento else 'SIN DEPTO'}")
                problemas_totales.append(f"{depto.nombre}: {munis_incorrectos.count()} municipios con departamento incorrecto")
            
            # Determinar si el departamento está perfecto
            if (locs_muni_incorrecto.count() == 0 and 
                munis_incorrectos.count() == 0 and
                locs_sin_muni.count() == 0):
                departamentos_perfectos.append(depto.nombre)
                self.stdout.write(self.style.SUCCESS(f"\n✅ DEPARTAMENTO PERFECTO"))
            elif locs_muni_incorrecto.count() == 0 and munis_incorrectos.count() == 0:
                self.stdout.write(self.style.WARNING(f"\n⚠️  DEPARTAMENTO OK (pero tiene {locs_sin_muni.count()} localidades sin municipio)"))
            else:
                self.stdout.write(self.style.ERROR(f"\n❌ DEPARTAMENTO CON PROBLEMAS"))
        
        # Resumen final
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN FINAL"))
        self.stdout.write("="*70)
        self.stdout.write(f"✅ Departamentos perfectos: {len(departamentos_perfectos)}")
        self.stdout.write(f"⚠️  Departamentos con problemas: {len(problemas_totales)}")
        
        if departamentos_perfectos:
            self.stdout.write(f"\n✅ Departamentos perfectos:")
            for depto in departamentos_perfectos:
                self.stdout.write(f"  - {depto}")
        
        if problemas_totales:
            self.stdout.write(f"\n⚠️  Problemas encontrados:")
            for prob in problemas_totales:
                self.stdout.write(f"  - {prob}")
        
        self.stdout.write("="*70)

