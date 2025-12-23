from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db.models import Q, Count, F


class Command(BaseCommand):
    help = 'Muestra el detalle de cada departamento de Catamarca con sus municipios y localidades'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS("📋 DETALLE DE DEPARTAMENTOS DE CATAMARCA"))
        self.stdout.write("="*60)
        
        # Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        # Obtener departamentos ordenados
        deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
        
        self.stdout.write(f"\n📊 Total de departamentos: {deptos.count()}\n")
        
        # Revisar cada departamento
        for depto in deptos:
            self.stdout.write("="*60)
            self.stdout.write(self.style.SUCCESS(f"🏛️  {depto.nombre} (ID: {depto.id})"))
            self.stdout.write("="*60)
            
            # Municipios del departamento
            munis = Municipio.objects.filter(departamento=depto).order_by('nombre')
            self.stdout.write(f"\n📍 Municipios ({munis.count()}):")
            
            if munis.exists():
                for muni in munis:
                    locs_muni = Localidad.objects.filter(municipio=muni).count()
                    self.stdout.write(f"  • {muni.nombre} (ID: {muni.id}) - {locs_muni} localidades")
            else:
                self.stdout.write(self.style.WARNING("  ⚠️  Sin municipios asignados"))
            
            # Municipios de Catamarca que deberían estar en este departamento pero no lo están
            # (esto requiere conocimiento manual, pero podemos mostrar municipios sin departamento)
            munis_sin_depto = Municipio.objects.filter(
                provincia=catamarca,
                departamento__isnull=True
            )
            
            if munis_sin_depto.exists():
                self.stdout.write(self.style.WARNING(f"\n⚠️  Municipios sin departamento ({munis_sin_depto.count()}):"))
                for m in munis_sin_depto:
                    self.stdout.write(f"  • {m.nombre} (ID: {m.id})")
            
            # Localidades del departamento
            locs = Localidad.objects.filter(departamento=depto).order_by('nombre')
            self.stdout.write(f"\n🏘️  Localidades ({locs.count()}):")
            
            # Agrupar por municipio
            locs_con_muni = locs.filter(municipio__isnull=False)
            locs_sin_muni = locs.filter(municipio__isnull=True)
            
            if locs_con_muni.exists():
                # Agrupar por municipio
                munis_con_locs = {}
                for loc in locs_con_muni:
                    muni_nombre = loc.municipio.nombre
                    if muni_nombre not in munis_con_locs:
                        munis_con_locs[muni_nombre] = []
                    munis_con_locs[muni_nombre].append(loc)
                
                for muni_nombre, locs_list in sorted(munis_con_locs.items()):
                    self.stdout.write(f"\n  📍 {muni_nombre}:")
                    for loc in sorted(locs_list, key=lambda x: x.nombre):
                        self.stdout.write(f"    • {loc.nombre} (ID: {loc.id})")
            
            if locs_sin_muni.exists():
                self.stdout.write(self.style.WARNING(f"\n  ⚠️  Localidades sin municipio ({locs_sin_muni.count()}):"))
                for loc in locs_sin_muni[:20]:  # Mostrar solo las primeras 20
                    self.stdout.write(f"    • {loc.nombre} (ID: {loc.id})")
                if locs_sin_muni.count() > 20:
                    self.stdout.write(f"    ... y {locs_sin_muni.count() - 20} más")
            
            # Localidades que están en este departamento pero su municipio está en otro
            locs_muni_incorrecto = Localidad.objects.filter(
                departamento=depto
            ).exclude(
                municipio__departamento=depto
            ).exclude(municipio__isnull=True)
            
            if locs_muni_incorrecto.exists():
                self.stdout.write(self.style.ERROR(f"\n❌ Localidades con municipio incorrecto ({locs_muni_incorrecto.count()}):"))
                for loc in locs_muni_incorrecto[:10]:
                    muni_actual = loc.municipio.nombre if loc.municipio else "SIN MUNICIPIO"
                    depto_muni = loc.municipio.departamento.nombre if loc.municipio and loc.municipio.departamento else "SIN DEPTO"
                    self.stdout.write(f"  • {loc.nombre} -> Municipio: {muni_actual} (Depto: {depto_muni})")
                if locs_muni_incorrecto.count() > 10:
                    self.stdout.write(f"  ... y {locs_muni_incorrecto.count() - 10} más")
            
            self.stdout.write("")
        
        # Resumen final
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN FINAL"))
        self.stdout.write("="*60)
        
        total_munis = Municipio.objects.filter(provincia=catamarca).count()
        total_locs = Localidad.objects.filter(provincia=catamarca).count()
        munis_sin_depto = Municipio.objects.filter(provincia=catamarca, departamento__isnull=True).count()
        locs_sin_muni = Localidad.objects.filter(provincia=catamarca, municipio__isnull=True).count()
        locs_muni_incorrecto = Localidad.objects.filter(
            provincia=catamarca
        ).exclude(
            municipio__departamento=F('departamento')
        ).exclude(municipio__isnull=True).count()
        
        self.stdout.write(f"  - Total departamentos: {deptos.count()}")
        self.stdout.write(f"  - Total municipios: {total_munis}")
        self.stdout.write(f"  - Total localidades: {total_locs}")
        self.stdout.write(f"  - Municipios sin departamento: {munis_sin_depto}")
        self.stdout.write(f"  - Localidades sin municipio: {locs_sin_muni}")
        self.stdout.write(f"  - Localidades con municipio incorrecto: {locs_muni_incorrecto}")
        self.stdout.write("="*60)

