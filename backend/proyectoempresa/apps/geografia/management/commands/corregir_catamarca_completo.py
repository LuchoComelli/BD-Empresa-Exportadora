from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
from django.db import transaction
from django.db.models import Q


class Command(BaseCommand):
    help = 'Corrige todas las relaciones de departamentos, municipios y localidades de Catamarca según la estructura oficial'

    def encontrar_municipio(self, nombre, departamento):
        """Busca un municipio por nombre en un departamento"""
        muni = Municipio.objects.filter(
            departamento=departamento,
            nombre__iexact=nombre
        ).first()
        
        if not muni:
            muni = Municipio.objects.filter(
                departamento=departamento,
                nombre__icontains=nombre
            ).first()
        
        return muni

    def encontrar_localidad(self, nombre, departamento):
        """Busca una localidad por nombre en un departamento"""
        loc = Localidad.objects.filter(
            departamento=departamento,
            nombre__iexact=nombre
        ).first()
        
        if not loc:
            loc = Localidad.objects.filter(
                departamento=departamento,
                nombre__icontains=nombre
            ).first()
        
        return loc

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write(self.style.SUCCESS("🔧 CORRECCIÓN COMPLETA DE CATAMARCA"))
        self.stdout.write("="*70)
        
        # Encontrar provincia Catamarca
        catamarca = Provincia.objects.filter(
            Q(nombre__icontains='Catamarca') | Q(nombre_completo__icontains='Catamarca')
        ).first()
        
        if not catamarca:
            self.stdout.write(self.style.ERROR("❌ No se encontró la provincia Catamarca"))
            return
        
        correcciones = []
        
        # 1. Mover municipio Villa Vil de Santa María a Belén
        depto_santa_maria = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Santa María').first()
        depto_belen = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Belén').first()
        
        if depto_santa_maria and depto_belen:
            muni_villa_vil = Municipio.objects.filter(
                departamento=depto_santa_maria,
                nombre__iexact='Villa Vil'
            ).first()
            
            if muni_villa_vil:
                muni_villa_vil.departamento = depto_belen
                muni_villa_vil.save()
                correcciones.append(f"✅ Municipio 'Villa Vil' movido de Santa María a Belén")
                self.stdout.write(self.style.SUCCESS(f"✅ Municipio 'Villa Vil' movido de Santa María a Belén"))
        
        # 2. Corregir localidades de Ancasti
        depto_ancasti = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Ancasti').first()
        if depto_ancasti:
            muni_ancasti = self.encontrar_municipio('Ancasti', depto_ancasti)
            loc_ancastillo = self.encontrar_localidad('Ancastillo', depto_ancasti)
            if loc_ancastillo and muni_ancasti:
                loc_ancastillo.municipio = muni_ancasti
                loc_ancastillo.save()
                correcciones.append(f"✅ Localidad 'Ancastillo' corregida en Ancasti")
        
        # 3. Corregir localidades de Andalgalá
        depto_andalgala = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Andalgalá').first()
        if depto_andalgala:
            muni_andalgala = self.encontrar_municipio('Andalgalá', depto_andalgala)
            for loc_nombre in ['El Ingenio', 'Loma Redonda']:
                loc = self.encontrar_localidad(loc_nombre, depto_andalgala)
                if loc and muni_andalgala:
                    loc.municipio = muni_andalgala
                    loc.save()
                    correcciones.append(f"✅ Localidad '{loc_nombre}' corregida en Andalgalá")
        
        # 4. Corregir localidades de Belén
        if depto_belen:
            muni_belen = self.encontrar_municipio('Belén', depto_belen)
            muni_hualfin = self.encontrar_municipio('Hualfin', depto_belen)
            muni_corral_quemado = self.encontrar_municipio('Corral Quemado', depto_belen)
            muni_puerta_corral = self.encontrar_municipio('Puerta de Corral Quemado', depto_belen)
            muni_saujil = self.encontrar_municipio('Saujil', depto_belen)
            muni_villa_vil_belen = self.encontrar_municipio('Villa Vil', depto_belen)
            
            # Mapeo de localidades a municipios en Belén
            # Todas las localidades de Belén deben tener un municipio del mismo departamento
            localidades_belen = Localidad.objects.filter(departamento=depto_belen)
            
            for loc in localidades_belen:
                # Si la localidad tiene un municipio de otro departamento, corregirlo
                if loc.municipio and loc.municipio.departamento != depto_belen:
                    # Asignar al municipio Belén por defecto si no hay un mapeo específico
                    if muni_belen:
                        loc.municipio = muni_belen
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en Belén (asignada a Belén)")
                # Si la localidad no tiene municipio, asignarle uno
                elif not loc.municipio:
                    if muni_belen:
                        loc.municipio = muni_belen
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en Belén (asignada a Belén)")
        
        # 5. Corregir localidades de Capital
        depto_capital = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Capital').first()
        if depto_capital:
            muni_capital = self.encontrar_municipio('San Fernando del Valle de Catamarca', depto_capital)
            loc_tala = self.encontrar_localidad('El Tala', depto_capital)
            if loc_tala and muni_capital:
                loc_tala.municipio = muni_capital
                loc_tala.save()
                correcciones.append(f"✅ Localidad 'El Tala' corregida en Capital")
        
        # 6. Corregir localidades de La Paz
        depto_la_paz = Departamento.objects.filter(provincia=catamarca, nombre__iexact='La Paz').first()
        if depto_la_paz:
            muni_los_altos = self.encontrar_municipio('Los Altos', depto_la_paz)
            muni_mutquin = self.encontrar_municipio('Mutquin', depto_la_paz)
            
            # Todas las localidades de La Paz deben tener municipio Los Altos o Mutquin
            localidades_la_paz = Localidad.objects.filter(departamento=depto_la_paz)
            for loc in localidades_la_paz:
                if not loc.municipio or loc.municipio.departamento != depto_la_paz:
                    # Asignar a Los Altos por defecto
                    if muni_los_altos:
                        loc.municipio = muni_los_altos
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en La Paz")
        
        # 7. Corregir localidades de Paclín
        depto_paclin = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Paclín').first()
        if depto_paclin:
            muni_paclin = self.encontrar_municipio('Paclín', depto_paclin)
            loc_sumanpa = self.encontrar_localidad('Sumanpa', depto_paclin)
            if loc_sumanpa and muni_paclin:
                loc_sumanpa.municipio = muni_paclin
                loc_sumanpa.save()
                correcciones.append(f"✅ Localidad 'Sumanpa' corregida en Paclín")
        
        # 8. Corregir localidades de Pomán
        depto_poman = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Pomán').first()
        if depto_poman:
            muni_poman = self.encontrar_municipio('Pomán', depto_poman)
            muni_londres = self.encontrar_municipio('Londres', depto_poman)
            muni_pozo_piedra = self.encontrar_municipio('Pozo de Piedra', depto_poman)
            
            # Localidades que deben estar en Pomán
            localidades_poman = Localidad.objects.filter(departamento=depto_poman)
            for loc in localidades_poman:
                if not loc.municipio or loc.municipio.departamento != depto_poman:
                    # Asignar según corresponda
                    if muni_poman:
                        loc.municipio = muni_poman
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en Pomán")
        
        # 9. Corregir localidades de Santa María
        if depto_santa_maria:
            muni_santa_maria = self.encontrar_municipio('Santa María', depto_santa_maria)
            muni_san_fernando_sm = self.encontrar_municipio('San Fernando', depto_santa_maria)
            
            # Localidades que deben estar en Santa María
            localidades_santa_maria = Localidad.objects.filter(departamento=depto_santa_maria)
            for loc in localidades_santa_maria:
                if not loc.municipio or loc.municipio.departamento != depto_santa_maria:
                    # Asignar a Santa María por defecto
                    if muni_santa_maria:
                        loc.municipio = muni_santa_maria
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en Santa María")
        
        # 10. Corregir localidades de Santa Rosa
        depto_santa_rosa = Departamento.objects.filter(provincia=catamarca, nombre__iexact='Santa Rosa').first()
        if depto_santa_rosa:
            muni_santa_rosa = self.encontrar_municipio('Santa Rosa', depto_santa_rosa)
            
            # Localidades que deben estar en Santa Rosa
            localidades_santa_rosa = Localidad.objects.filter(departamento=depto_santa_rosa)
            for loc in localidades_santa_rosa:
                if not loc.municipio or loc.municipio.departamento != depto_santa_rosa:
                    if muni_santa_rosa:
                        loc.municipio = muni_santa_rosa
                        loc.save()
                        correcciones.append(f"✅ Localidad '{loc.nombre}' corregida en Santa Rosa")
        
        # Resumen
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN DE CORRECCIONES"))
        self.stdout.write("="*70)
        self.stdout.write(f"✅ Total de correcciones realizadas: {len(correcciones)}")
        
        if correcciones:
            self.stdout.write("\n✅ Correcciones realizadas:")
            for corr in correcciones[:30]:  # Mostrar las primeras 30
                self.stdout.write(f"  {corr}")
            if len(correcciones) > 30:
                self.stdout.write(f"  ... y {len(correcciones) - 30} más")
        
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("✅ CORRECCIÓN COMPLETADA"))
        self.stdout.write("="*70)

