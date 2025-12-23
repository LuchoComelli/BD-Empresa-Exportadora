from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db.models import Q


class Command(BaseCommand):
    help = 'Revisa todos los departamentos de Catamarca uno por uno'

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write(self.style.SUCCESS("🔍 REVISIÓN COMPLETA DE TODOS LOS DEPARTAMENTOS"))
        self.stdout.write("="*70)
        
        # Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        # Obtener todos los departamentos ordenados
        deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
        
        self.stdout.write(f"\n📋 Total de departamentos a revisar: {deptos.count()}\n")
        
        problemas_totales = []
        departamentos_ok = []
        departamentos_con_problemas = []
        
        for idx, depto in enumerate(deptos, 1):
            self.stdout.write("\n" + "="*70)
            self.stdout.write(self.style.SUCCESS(f"[{idx}/{deptos.count()}] 🏛️  {depto.nombre}"))
            self.stdout.write("="*70)
            
            problemas_depto = []
            
            # Municipios del departamento
            munis = Municipio.objects.filter(departamento=depto).order_by('nombre')
            self.stdout.write(f"\n📍 Municipios: {munis.count()}")
            
            # Verificar que todos los municipios tengan el departamento correcto
            for muni in munis:
                if muni.departamento != depto:
                    problemas_depto.append(f"Municipio {muni.nombre} tiene departamento incorrecto")
                    self.stdout.write(self.style.ERROR(f"  ❌ {muni.nombre}: Departamento incorrecto"))
                else:
                    locs_count = Localidad.objects.filter(municipio=muni).count()
                    self.stdout.write(f"  ✓ {muni.nombre} ({locs_count} localidades)")
            
            # Localidades del departamento
            locs = Localidad.objects.filter(departamento=depto).order_by('nombre')
            self.stdout.write(f"\n🏘️  Localidades: {locs.count()}")
            
            # Verificar localidades
            locs_con_muni = locs.filter(municipio__isnull=False)
            locs_sin_muni = locs.filter(municipio__isnull=True)
            locs_muni_incorrecto = locs.exclude(municipio__departamento=depto).exclude(municipio__isnull=True)
            
            if locs_sin_muni.exists():
                self.stdout.write(self.style.WARNING(f"  ⚠️  Sin municipio: {locs_sin_muni.count()}"))
                # Mostrar algunas
                for loc in locs_sin_muni[:5]:
                    self.stdout.write(f"      - {loc.nombre}")
                if locs_sin_muni.count() > 5:
                    self.stdout.write(f"      ... y {locs_sin_muni.count() - 5} más")
            
            if locs_muni_incorrecto.exists():
                self.stdout.write(self.style.ERROR(f"  ❌ Con municipio incorrecto: {locs_muni_incorrecto.count()}"))
                problemas_depto.append(f"{locs_muni_incorrecto.count()} localidades con municipio incorrecto")
                for loc in locs_muni_incorrecto[:5]:
                    muni_nombre = loc.municipio.nombre if loc.municipio else "SIN MUNICIPIO"
                    depto_muni = loc.municipio.departamento.nombre if loc.municipio and loc.municipio.departamento else "SIN DEPTO"
                    self.stdout.write(f"      - {loc.nombre} -> {muni_nombre} (Depto: {depto_muni})")
                if locs_muni_incorrecto.count() > 5:
                    self.stdout.write(f"      ... y {locs_muni_incorrecto.count() - 5} más")
            
            # Verificar localidades que están en otros departamentos pero deberían estar aquí
            # (esto requiere conocimiento específico, por ahora solo reportamos)
            
            # Resumen del departamento
            if problemas_depto:
                departamentos_con_problemas.append(depto.nombre)
                problemas_totales.extend([f"{depto.nombre}: {p}" for p in problemas_depto])
                self.stdout.write(self.style.ERROR(f"\n❌ PROBLEMAS ENCONTRADOS: {len(problemas_depto)}"))
            else:
                departamentos_ok.append(depto.nombre)
                self.stdout.write(self.style.SUCCESS(f"\n✅ DEPARTAMENTO OK"))
        
        # Resumen final
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN FINAL"))
        self.stdout.write("="*70)
        self.stdout.write(f"\n✅ Departamentos sin problemas: {len(departamentos_ok)}")
        self.stdout.write(f"⚠️  Departamentos con problemas: {len(departamentos_con_problemas)}")
        self.stdout.write(f"📋 Total de problemas encontrados: {len(problemas_totales)}")
        
        if departamentos_ok:
            self.stdout.write(f"\n✅ Departamentos OK:")
            for depto in departamentos_ok:
                self.stdout.write(f"  - {depto}")
        
        if departamentos_con_problemas:
            self.stdout.write(f"\n⚠️  Departamentos con problemas:")
            for depto in departamentos_con_problemas:
                self.stdout.write(f"  - {depto}")
        
        if problemas_totales:
            self.stdout.write(f"\n📋 Detalle de problemas:")
            for prob in problemas_totales[:20]:
                self.stdout.write(f"  - {prob}")
            if len(problemas_totales) > 20:
                self.stdout.write(f"  ... y {len(problemas_totales) - 20} más")
        
        self.stdout.write("="*70)
        self.stdout.write("\n💡 Siguiente paso: Revisar cada departamento con problemas usando:")
        self.stdout.write("   python manage.py revisar_departamento_individual <nombre_departamento>")
        self.stdout.write("="*70)

