from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db import transaction
from django.db.models import Q


class Command(BaseCommand):
    help = 'Revisa y corrige las relaciones de departamentos, municipios y localidades de Catamarca'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS("🔍 REVISIÓN DE DATOS DE CATAMARCA"))
        self.stdout.write("="*60)
        
        # 1. Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        self.stdout.write(f"\n✅ Provincia encontrada: {catamarca.nombre} (ID: {catamarca.id})")
        
        # 2. Obtener departamentos de Catamarca
        deptos_catamarca = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
        self.stdout.write(f"\n📊 Departamentos de Catamarca: {deptos_catamarca.count()}")
        
        for depto in deptos_catamarca:
            munis = Municipio.objects.filter(departamento=depto)
            locs = Localidad.objects.filter(departamento=depto)
            self.stdout.write(f"  - {depto.nombre} (ID: {depto.id}): {munis.count()} municipios, {locs.count()} localidades")
        
        # 3. Obtener municipios de Catamarca
        munis_catamarca = Municipio.objects.filter(provincia=catamarca).order_by('nombre')
        self.stdout.write(f"\n📊 Municipios de Catamarca: {munis_catamarca.count()}")
        
        # Municipios sin departamento asignado
        munis_sin_depto = munis_catamarca.filter(departamento__isnull=True)
        if munis_sin_depto.exists():
            self.stdout.write(self.style.WARNING(f"\n⚠️  Municipios sin departamento: {munis_sin_depto.count()}"))
            for m in munis_sin_depto[:10]:
                self.stdout.write(f"  - {m.nombre} (ID: {m.id})")
        
        # Municipios con departamento incorrecto (de otra provincia)
        munis_incorrectos = Municipio.objects.filter(
            provincia=catamarca
        ).exclude(
            departamento__provincia=catamarca
        ).exclude(departamento__isnull=True)
        
        if munis_incorrectos.exists():
            self.stdout.write(self.style.WARNING(f"\n⚠️  Municipios con departamento incorrecto: {munis_incorrectos.count()}"))
            for m in munis_incorrectos[:10]:
                depto_actual = m.departamento.nombre if m.departamento else "SIN DEPTO"
                self.stdout.write(f"  - {m.nombre} (ID: {m.id}) -> Depto actual: {depto_actual}")
        
        # 4. Obtener localidades de Catamarca
        locs_catamarca = Localidad.objects.filter(provincia=catamarca).order_by('nombre')
        self.stdout.write(f"\n📊 Localidades de Catamarca: {locs_catamarca.count()}")
        
        # Localidades sin departamento
        locs_sin_depto = locs_catamarca.filter(departamento__isnull=True)
        if locs_sin_depto.exists():
            self.stdout.write(self.style.WARNING(f"\n⚠️  Localidades sin departamento: {locs_sin_depto.count()}"))
        
        # Localidades con departamento incorrecto
        locs_incorrectos = Localidad.objects.filter(
            provincia=catamarca
        ).exclude(
            departamento__provincia=catamarca
        )
        
        if locs_incorrectos.exists():
            self.stdout.write(self.style.WARNING(f"\n⚠️  Localidades con departamento incorrecto: {locs_incorrectos.count()}"))
            for l in locs_incorrectos[:10]:
                depto_actual = l.departamento.nombre if l.departamento else "SIN DEPTO"
                self.stdout.write(f"  - {l.nombre} (ID: {l.id}) -> Depto actual: {depto_actual}")
        
        # 5. Mostrar resumen de otras provincias
        otras_provincias = Provincia.objects.exclude(id=catamarca.id).count()
        otros_deptos = Departamento.objects.exclude(provincia=catamarca).count()
        otros_munis = Municipio.objects.exclude(provincia=catamarca).count()
        otras_locs = Localidad.objects.exclude(provincia=catamarca).count()
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📊 RESUMEN DE OTRAS PROVINCIAS (a eliminar):")
        self.stdout.write("="*60)
        self.stdout.write(f"  - Provincias: {otras_provincias}")
        self.stdout.write(f"  - Departamentos: {otros_deptos}")
        self.stdout.write(f"  - Municipios: {otros_munis}")
        self.stdout.write(f"  - Localidades: {otras_locs}")
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("✅ Revisión completada")
        self.stdout.write("="*60)

