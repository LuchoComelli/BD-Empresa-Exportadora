"""
Comando para generar un archivo Markdown con todos los departamentos,
municipios y localidades de Catamarca
"""

from django.core.management.base import BaseCommand
from apps.geografia.models import Provincia, Departamento, Municipio, Localidad
import os


class Command(BaseCommand):
    help = 'Generar archivo Markdown con datos completos de Catamarca'

    def handle(self, *args, **options):
        try:
            catamarca = Provincia.objects.get(id='10')
            
            deptos = Departamento.objects.filter(provincia=catamarca).order_by('nombre')
            
            # Generar contenido Markdown
            md_content = f"# Catamarca - Datos Geográficos Completos\n\n"
            md_content += f"**Provincia:** {catamarca.nombre}\n\n"
            md_content += f"**Total Departamentos:** {deptos.count()}\n"
            md_content += f"**Total Municipios:** {Municipio.objects.filter(provincia=catamarca).count()}\n"
            md_content += f"**Total Localidades:** {Localidad.objects.filter(provincia=catamarca).count()}\n\n"
            md_content += "---\n\n"
            
            # Por cada departamento
            for depto in deptos:
                municipios = Municipio.objects.filter(departamento=depto).order_by('nombre')
                localidades = Localidad.objects.filter(departamento=depto).order_by('nombre')
                
                md_content += f"## {depto.nombre}\n\n"
                md_content += f"**ID:** {depto.id}\n\n"
                md_content += f"**Municipios:** {municipios.count()}\n"
                md_content += f"**Localidades:** {localidades.count()}\n\n"
                
                # Municipios del departamento
                if municipios.exists():
                    md_content += "### Municipios\n\n"
                    for municipio in municipios:
                        localidades_municipio = Localidad.objects.filter(municipio=municipio).order_by('nombre')
                        md_content += f"#### {municipio.nombre}\n\n"
                        md_content += f"- **ID:** {municipio.id}\n"
                        md_content += f"- **Localidades:** {localidades_municipio.count()}\n\n"
                        
                        # Localidades del municipio
                        if localidades_municipio.exists():
                            md_content += "**Localidades:**\n\n"
                            for localidad in localidades_municipio:
                                md_content += f"- {localidad.nombre} (ID: {localidad.id})\n"
                            md_content += "\n"
                
                # Localidades del departamento (por si hay alguna sin municipio)
                localidades_sin_municipio = localidades.filter(municipio=None)
                if localidades_sin_municipio.exists():
                    md_content += "### Localidades sin Municipio\n\n"
                    for localidad in localidades_sin_municipio:
                        md_content += f"- {localidad.nombre} (ID: {localidad.id})\n"
                    md_content += "\n"
                
                md_content += "---\n\n"
            
            # Guardar archivo
            output_file = "CATAMARCA_DATOS_GEOGRAFICOS.md"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(md_content)
            
            self.stdout.write(self.style.SUCCESS(f"\n✓ Archivo generado: {output_file}"))
            self.stdout.write(f"  Ubicación: {os.path.abspath(output_file)}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error: {e}"))
            raise

