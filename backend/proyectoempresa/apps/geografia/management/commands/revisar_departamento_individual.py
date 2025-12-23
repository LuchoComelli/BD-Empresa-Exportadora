from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db.models import Q


class Command(BaseCommand):
    help = 'Revisa un departamento específico de Catamarca en detalle'

    def add_arguments(self, parser):
        parser.add_argument(
            'departamento',
            type=str,
            help='Nombre del departamento a revisar',
        )

    def handle(self, *args, **options):
        depto_nombre = options['departamento']
        
        self.stdout.write("="*60)
        self.stdout.write(self.style.SUCCESS(f"🔍 REVISIÓN DETALLADA: {depto_nombre}"))
        self.stdout.write("="*60)
        
        # Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        # Buscar departamento
        depto = Departamento.objects.filter(
            provincia=catamarca,
            nombre__iexact=depto_nombre
        ).first()
        
        if not depto:
            # Intentar búsqueda parcial
            depto = Departamento.objects.filter(
                provincia=catamarca,
                nombre__icontains=depto_nombre
            ).first()
        
        if not depto:
            self.stdout.write(self.style.ERROR(f"❌ No se encontró el departamento {depto_nombre}"))
            return
        
        self.stdout.write(f"\n✅ Departamento encontrado: {depto.nombre} (ID: {depto.id})")
        
        # Municipios del departamento
        munis = Municipio.objects.filter(departamento=depto).order_by('nombre')
        self.stdout.write(f"\n📍 MUNICIPIOS ({munis.count()}):")
        self.stdout.write("-" * 60)
        
        for muni in munis:
            locs_muni = Localidad.objects.filter(municipio=muni).count()
            self.stdout.write(f"\n  • {muni.nombre} (ID: {muni.id})")
            self.stdout.write(f"    Localidades: {locs_muni}")
            
            # Mostrar localidades del municipio
            if locs_muni > 0:
                locs = Localidad.objects.filter(municipio=muni).order_by('nombre')
                for loc in locs:
                    self.stdout.write(f"      - {loc.nombre} (ID: {loc.id})")
        
        # Municipios de Catamarca que podrían pertenecer a este departamento pero no están asignados
        munis_sin_depto = Municipio.objects.filter(
            provincia=catamarca,
            departamento__isnull=True
        )
        
        if munis_sin_depto.exists():
            self.stdout.write(f"\n⚠️  MUNICIPIOS SIN DEPARTAMENTO ({munis_sin_depto.count()}):")
            for m in munis_sin_depto:
                self.stdout.write(f"  - {m.nombre} (ID: {m.id})")
        
        # Localidades del departamento
        locs = Localidad.objects.filter(departamento=depto).order_by('nombre')
        self.stdout.write(f"\n🏘️  LOCALIDADES DEL DEPARTAMENTO ({locs.count()}):")
        self.stdout.write("-" * 60)
        
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
            
            for muni_nombre in sorted(munis_con_locs.keys()):
                locs_list = munis_con_locs[muni_nombre]
                self.stdout.write(f"\n  📍 {muni_nombre} ({len(locs_list)} localidades):")
                for loc in sorted(locs_list, key=lambda x: x.nombre):
                    self.stdout.write(f"      • {loc.nombre} (ID: {loc.id})")
        
        if locs_sin_muni.exists():
            self.stdout.write(f"\n  ⚠️  SIN MUNICIPIO ({locs_sin_muni.count()} localidades):")
            for loc in sorted(locs_sin_muni, key=lambda x: x.nombre):
                self.stdout.write(f"      • {loc.nombre} (ID: {loc.id})")
        
        # Localidades que están en este departamento pero su municipio está en otro
        locs_muni_incorrecto = Localidad.objects.filter(
            departamento=depto
        ).exclude(
            municipio__departamento=depto
        ).exclude(municipio__isnull=True)
        
        if locs_muni_incorrecto.exists():
            self.stdout.write(f"\n❌ LOCALIDADES CON MUNICIPIO INCORRECTO ({locs_muni_incorrecto.count()}):")
            for loc in locs_muni_incorrecto:
                muni_actual = loc.municipio.nombre if loc.municipio else "SIN MUNICIPIO"
                depto_muni = loc.municipio.departamento.nombre if loc.municipio and loc.municipio.departamento else "SIN DEPTO"
                self.stdout.write(f"  • {loc.nombre} -> Municipio: {muni_actual} (Depto: {depto_muni})")
        
        # Resumen
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📊 RESUMEN")
        self.stdout.write("="*60)
        self.stdout.write(f"  Municipios: {munis.count()}")
        self.stdout.write(f"  Localidades: {locs.count()}")
        self.stdout.write(f"  Localidades con municipio: {locs_con_muni.count()}")
        self.stdout.write(f"  Localidades sin municipio: {locs_sin_muni.count()}")
        self.stdout.write(f"  Localidades con municipio incorrecto: {locs_muni_incorrecto.count()}")
        self.stdout.write("="*60)

