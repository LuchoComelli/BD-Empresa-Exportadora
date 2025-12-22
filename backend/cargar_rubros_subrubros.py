#!/usr/bin/env python3
"""
Script para cargar rubros y subrubros en la base de datos.

Este script carga todos los rubros y subrubros exactamente como están
en la base de datos original, manteniendo las relaciones y IDs.

Uso:
    python cargar_rubros_subrubros.py

Requisitos:
    - Django configurado correctamente
    - Acceso a la base de datos
    - Modelos Rubro y SubRubro disponibles
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyectoempresa.settings')
django.setup()

from apps.empresas.models import Rubro, SubRubro

# Datos de rubros y subrubros extraídos de la base de datos
RUBROS_DATA = [
    {
        "id": 2,
        "nombre": "Agrícola",
        "descripcion": "Rubro agrícola",
        "subrubros": [
            {"id": 1, "nombre": "Vinos", "descripcion": ""},
            {"id": 2, "nombre": "Aceite de Oliva", "descripcion": ""},
            {"id": 3, "nombre": "Frutas Frescas", "descripcion": ""},
            {"id": 4, "nombre": "Frutas Secas", "descripcion": ""},
            {"id": 5, "nombre": "Hortalizas", "descripcion": ""},
            {"id": 6, "nombre": "Cereales", "descripcion": ""},
            {"id": 7, "nombre": "Legumbres", "descripcion": ""},
            {"id": 8, "nombre": "Aromáticas", "descripcion": ""},
            {"id": 137, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 6,
        "nombre": "Consultoría",
        "descripcion": "Servicios de consultoría",
        "subrubros": [
            {"id": 71, "nombre": "Consultoría empresarial", "descripcion": ""},
            {"id": 72, "nombre": "Consultoría financiera", "descripcion": ""},
            {"id": 73, "nombre": "Consultoría en marketing", "descripcion": ""},
            {"id": 74, "nombre": "Consultoría legal", "descripcion": ""},
            {"id": 75, "nombre": "Consultoría ambiental", "descripcion": ""},
            {"id": 76, "nombre": "Consultoría en RRHH", "descripcion": ""},
            {"id": 77, "nombre": "Consultoría tecnológica", "descripcion": ""},
            {"id": 78, "nombre": "Consultoría en innovación", "descripcion": ""},
            {"id": 148, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 8,
        "nombre": "Ganadero",
        "descripcion": "",
        "subrubros": [
            {"id": 9, "nombre": "Caprino", "descripcion": ""},
            {"id": 10, "nombre": "Bovino", "descripcion": ""},
            {"id": 11, "nombre": "Ovino", "descripcion": ""},
            {"id": 12, "nombre": "Porcino", "descripcion": ""},
            {"id": 13, "nombre": "Avícola", "descripcion": ""},
            {"id": 14, "nombre": "Apícola", "descripcion": ""},
            {"id": 138, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 9,
        "nombre": "Industrial",
        "descripcion": "",
        "subrubros": [
            {"id": 15, "nombre": "Metalúrgica", "descripcion": ""},
            {"id": 16, "nombre": "Química", "descripcion": ""},
            {"id": 17, "nombre": "Plásticos", "descripcion": ""},
            {"id": 18, "nombre": "Maquinaria", "descripcion": ""},
            {"id": 19, "nombre": "Electrónica", "descripcion": ""},
            {"id": 20, "nombre": "Automotriz", "descripcion": ""},
            {"id": 21, "nombre": "Construcción", "descripcion": ""},
            {"id": 139, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 10,
        "nombre": "Textil",
        "descripcion": "",
        "subrubros": [
            {"id": 22, "nombre": "Hilados", "descripcion": ""},
            {"id": 23, "nombre": "Tejidos", "descripcion": ""},
            {"id": 24, "nombre": "Confección", "descripcion": ""},
            {"id": 25, "nombre": "Indumentaria", "descripcion": ""},
            {"id": 26, "nombre": "Calzado", "descripcion": ""},
            {"id": 27, "nombre": "Marroquinería", "descripcion": ""},
            {"id": 140, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 11,
        "nombre": "Alimentos y Bebidas",
        "descripcion": "",
        "subrubros": [
            {"id": 28, "nombre": "Conservas", "descripcion": ""},
            {"id": 29, "nombre": "Lácteos", "descripcion": ""},
            {"id": 30, "nombre": "Panificados", "descripcion": ""},
            {"id": 31, "nombre": "Bebidas", "descripcion": ""},
            {"id": 32, "nombre": "Dulces y Mermeladas", "descripcion": ""},
            {"id": 33, "nombre": "Embutidos", "descripcion": ""},
            {"id": 34, "nombre": "Congelados", "descripcion": ""},
            {"id": 141, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 12,
        "nombre": "Minería",
        "descripcion": "",
        "subrubros": [
            {"id": 35, "nombre": "Metalíferos", "descripcion": ""},
            {"id": 36, "nombre": "No Metalíferos", "descripcion": ""},
            {"id": 37, "nombre": "Rocas de Aplicación", "descripcion": ""},
            {"id": 38, "nombre": "Piedras Preciosas", "descripcion": ""},
            {"id": 142, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 13,
        "nombre": "Artesanías",
        "descripcion": "",
        "subrubros": [
            {"id": 39, "nombre": "Textiles", "descripcion": ""},
            {"id": 40, "nombre": "Cerámica", "descripcion": ""},
            {"id": 41, "nombre": "Madera", "descripcion": ""},
            {"id": 42, "nombre": "Cuero", "descripcion": ""},
            {"id": 43, "nombre": "Metal", "descripcion": ""},
            {"id": 143, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 14,
        "nombre": "Audiovisual",
        "descripcion": "",
        "subrubros": [
            {"id": 44, "nombre": "Producción audiovisual", "descripcion": ""},
            {"id": 45, "nombre": "Edición y postproducción", "descripcion": ""},
            {"id": 46, "nombre": "Filmación y fotografía profesional", "descripcion": ""},
            {"id": 47, "nombre": "Animación y motion graphics", "descripcion": ""},
            {"id": 48, "nombre": "Producción publicitaria", "descripcion": ""},
            {"id": 49, "nombre": "Gestión cultural / contenidos", "descripcion": ""},
            {"id": 50, "nombre": "Sonido, mezcla y musicalización", "descripcion": ""},
            {"id": 51, "nombre": "Educativo", "descripcion": ""},
            {"id": 144, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 15,
        "nombre": "Capacitación",
        "descripcion": "",
        "subrubros": [
            {"id": 52, "nombre": "Cursos técnicos", "descripcion": ""},
            {"id": 53, "nombre": "Formación profesional", "descripcion": ""},
            {"id": 54, "nombre": "Capacitaciones empresariales", "descripcion": ""},
            {"id": 55, "nombre": "Talleres creativos", "descripcion": ""},
            {"id": 56, "nombre": "Capacitaciones tecnológicas", "descripcion": ""},
            {"id": 57, "nombre": "Formación en oficios", "descripcion": ""},
            {"id": 58, "nombre": "Capacitación docente", "descripcion": ""},
            {"id": 59, "nombre": "Capacitaciones en habilidades blandas", "descripcion": ""},
            {"id": 145, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 16,
        "nombre": "Comercio Exterior",
        "descripcion": "",
        "subrubros": [
            {"id": 60, "nombre": "Asesoría en exportaciones", "descripcion": ""},
            {"id": 61, "nombre": "Asesoría en importaciones", "descripcion": ""},
            {"id": 62, "nombre": "Gestión aduanera", "descripcion": ""},
            {"id": 63, "nombre": "Certificaciones y normativa", "descripcion": ""},
            {"id": 64, "nombre": "Estudios de mercado internacional", "descripcion": ""},
            {"id": 65, "nombre": "Trámites de logística internacional", "descripcion": ""},
            {"id": 146, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 17,
        "nombre": "Comercio Exterior Nacional",
        "descripcion": "",
        "subrubros": [
            {"id": 66, "nombre": "Gestión de envíos nacionales", "descripcion": ""},
            {"id": 67, "nombre": "Distribución y transporte", "descripcion": ""},
            {"id": 68, "nombre": "Servicios de paquetería", "descripcion": ""},
            {"id": 69, "nombre": "Consultoría en comercio interior", "descripcion": ""},
            {"id": 70, "nombre": "Almacenamiento y centros logísticos", "descripcion": ""},
            {"id": 147, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 18,
        "nombre": "Desarrollo de Software",
        "descripcion": "",
        "subrubros": [
            {"id": 79, "nombre": "Desarrollo web", "descripcion": ""},
            {"id": 80, "nombre": "Desarrollo móvil", "descripcion": ""},
            {"id": 81, "nombre": "Software a medida", "descripcion": ""},
            {"id": 82, "nombre": "Integración de sistemas", "descripcion": ""},
            {"id": 83, "nombre": "Testing y QA", "descripcion": ""},
            {"id": 84, "nombre": "UX/UI Design", "descripcion": ""},
            {"id": 85, "nombre": "Consultoría en software", "descripcion": ""},
            {"id": 86, "nombre": "Mantenimiento y soporte técnico", "descripcion": ""},
            {"id": 149, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 19,
        "nombre": "Eventos",
        "descripcion": "",
        "subrubros": [
            {"id": 87, "nombre": "Organización de eventos", "descripcion": ""},
            {"id": 88, "nombre": "Producción de eventos culturales", "descripcion": ""},
            {"id": 89, "nombre": "Producción de eventos corporativos", "descripcion": ""},
            {"id": 90, "nombre": "Servicios de sonido e iluminación", "descripcion": ""},
            {"id": 91, "nombre": "Catering", "descripcion": ""},
            {"id": 92, "nombre": "Proveedores de mobiliario", "descripcion": ""},
            {"id": 93, "nombre": "Gestión de espacios", "descripcion": ""},
            {"id": 94, "nombre": "Animación / ambientación / escenografía", "descripcion": ""},
            {"id": 150, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 20,
        "nombre": "Informática",
        "descripcion": "",
        "subrubros": [
            {"id": 95, "nombre": "Reparación y mantenimiento de equipos", "descripcion": ""},
            {"id": 96, "nombre": "Redes y conectividad", "descripcion": ""},
            {"id": 97, "nombre": "Soporte técnico", "descripcion": ""},
            {"id": 98, "nombre": "Armado de PC y servidores", "descripcion": ""},
            {"id": 99, "nombre": "Seguridad informática básica", "descripcion": ""},
            {"id": 100, "nombre": "Instalación de software y hardware", "descripcion": ""},
            {"id": 151, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 21,
        "nombre": "Internet",
        "descripcion": "",
        "subrubros": [
            {"id": 101, "nombre": "Proveedor de internet", "descripcion": ""},
            {"id": 152, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 22,
        "nombre": "Logística",
        "descripcion": "",
        "subrubros": [
            {"id": 102, "nombre": "Logística integral", "descripcion": ""},
            {"id": 103, "nombre": "Transporte internacional", "descripcion": ""},
            {"id": 104, "nombre": "Gestión de cargas", "descripcion": ""},
            {"id": 105, "nombre": "Servicios puerta a puerta", "descripcion": ""},
            {"id": 106, "nombre": "Depósitos y almacenamiento", "descripcion": ""},
            {"id": 107, "nombre": "Courier internacional", "descripcion": ""},
            {"id": 153, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 23,
        "nombre": "Logística Nacional",
        "descripcion": "",
        "subrubros": [
            {"id": 108, "nombre": "Transporte regional", "descripcion": ""},
            {"id": 109, "nombre": "Mensajería y paquetería", "descripcion": ""},
            {"id": 110, "nombre": "Servicios de depósito", "descripcion": ""},
            {"id": 111, "nombre": "Cargas y distribución", "descripcion": ""},
            {"id": 112, "nombre": "Gestión de rutas", "descripcion": ""},
            {"id": 154, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 24,
        "nombre": "Tecnología",
        "descripcion": "",
        "subrubros": [
            {"id": 113, "nombre": "Soluciones tecnológicas empresariales", "descripcion": ""},
            {"id": 114, "nombre": "Instalación de sistemas", "descripcion": ""},
            {"id": 115, "nombre": "Automatización", "descripcion": ""},
            {"id": 116, "nombre": "Domótica", "descripcion": ""},
            {"id": 117, "nombre": "Venta de hardware tecnológico", "descripcion": ""},
            {"id": 118, "nombre": "Integraciones IoT", "descripcion": ""},
            {"id": 155, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 25,
        "nombre": "Innovación Tecnológica",
        "descripcion": "",
        "subrubros": [
            {"id": 119, "nombre": "Investigación y desarrollo (I+D)", "descripcion": ""},
            {"id": 120, "nombre": "Consultoría en innovación", "descripcion": ""},
            {"id": 121, "nombre": "Desarrollo de prototipos", "descripcion": ""},
            {"id": 122, "nombre": "Proyectos con tecnología aplicada", "descripcion": ""},
            {"id": 123, "nombre": "Transformación digital", "descripcion": ""},
            {"id": 124, "nombre": "Inteligencia artificial aplicada", "descripcion": ""},
            {"id": 156, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 26,
        "nombre": "Industrias Creativas",
        "descripcion": "",
        "subrubros": [
            {"id": 125, "nombre": "Artes Visuales (galerías, artistas, ilustradores)", "descripcion": ""},
            {"id": 126, "nombre": "Artes Escénicas (teatro, danza, producción escénica)", "descripcion": ""},
            {"id": 127, "nombre": "Diseño con impacto: Moda", "descripcion": ""},
            {"id": 128, "nombre": "Diseño con impacto: Interiorismo", "descripcion": ""},
            {"id": 129, "nombre": "Editorial", "descripcion": ""},
            {"id": 130, "nombre": "Música (fabricación de instrumentos, representantes musicales, proyectos musicales)", "descripcion": ""},
            {"id": 131, "nombre": "Producción cultural", "descripcion": ""},
            {"id": 132, "nombre": "Diseño gráfico", "descripcion": ""},
            {"id": 133, "nombre": "Diseño industrial", "descripcion": ""},
            {"id": 134, "nombre": "Publicidad y creatividad", "descripcion": ""},
            {"id": 135, "nombre": "Producción multimedia", "descripcion": ""},
            {"id": 157, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 27,
        "nombre": "Otro",
        "descripcion": "",
        "subrubros": [
            {"id": 136, "nombre": "Otro", "descripcion": ""}
        ]
    },
    {
        "id": 28,
        "nombre": "Otro",
        "descripcion": "",
        "subrubros": [
            {"id": 158, "nombre": "Otro", "descripcion": ""}
        ]
    }
]


def cargar_rubros_subrubros():
    """
    Carga todos los rubros y subrubros en la base de datos.
    
    Mantiene los IDs originales y las relaciones exactas.
    """
    print("🚀 Iniciando carga de rubros y subrubros...")
    
    rubros_creados = 0
    subrubros_creados = 0
    rubros_actualizados = 0
    subrubros_actualizados = 0
    
    # Definir qué rubros son de servicio
    RUBROS_SERVICIO = [6, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
    
    try:
        for rubro_data in RUBROS_DATA:
            # Determinar el tipo de rubro
            rubro_id = rubro_data['id']
            tipo_rubro = 'servicio' if rubro_id in RUBROS_SERVICIO else 'producto'
            
            # Crear o actualizar rubro
            rubro, created = Rubro.objects.get_or_create(
                id=rubro_id,
                defaults={
                    'nombre': rubro_data['nombre'],
                    'descripcion': rubro_data['descripcion'],
                    'tipo': tipo_rubro
                }
            )
            
            if created:
                rubros_creados += 1
                print(f"✅ Rubro creado: {rubro.nombre} (ID: {rubro.id}, Tipo: {tipo_rubro})")
            else:
                # Actualizar datos si es necesario
                updated = False
                if rubro.nombre != rubro_data['nombre']:
                    rubro.nombre = rubro_data['nombre']
                    updated = True
                if rubro.descripcion != rubro_data['descripcion']:
                    rubro.descripcion = rubro_data['descripcion']
                    updated = True
                if rubro.tipo != tipo_rubro:
                    rubro.tipo = tipo_rubro
                    updated = True
                
                if updated:
                    rubro.save()
                    rubros_actualizados += 1
                    print(f"🔄 Rubro actualizado: {rubro.nombre} (ID: {rubro.id}, Tipo: {tipo_rubro})")
            
            # Crear o actualizar subrubros
            for subrubro_data in rubro_data['subrubros']:
                subrubro, created = SubRubro.objects.get_or_create(
                    id=subrubro_data['id'],
                    defaults={
                        'nombre': subrubro_data['nombre'],
                        'descripcion': subrubro_data['descripcion'],
                        'rubro': rubro
                    }
                )
                
                if created:
                    subrubros_creados += 1
                    print(f"  ✅ Subrubro creado: {subrubro.nombre} (ID: {subrubro.id})")
                else:
                    # Actualizar datos si es necesario
                    updated = False
                    if subrubro.nombre != subrubro_data['nombre']:
                        subrubro.nombre = subrubro_data['nombre']
                        updated = True
                    if subrubro.descripcion != subrubro_data['descripcion']:
                        subrubro.descripcion = subrubro_data['descripcion']
                        updated = True
                    if subrubro.rubro != rubro:
                        subrubro.rubro = rubro
                        updated = True
                    
                    if updated:
                        subrubro.save()
                        subrubros_actualizados += 1
                        print(f"  🔄 Subrubro actualizado: {subrubro.nombre} (ID: {subrubro.id})")
        
        print("\n" + "="*60)
        print("🎉 CARGA COMPLETADA EXITOSAMENTE")
        print("="*60)
        print(f"📊 Rubros creados: {rubros_creados}")
        print(f"📊 Rubros actualizados: {rubros_actualizados}")
        print(f"📊 Subrubros creados: {subrubros_creados}")
        print(f"📊 Subrubros actualizados: {subrubros_actualizados}")
        print(f"📊 Total rubros en BD: {Rubro.objects.count()}")
        print(f"📊 Total subrubros en BD: {SubRubro.objects.count()}")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error durante la carga: {str(e)}")
        raise


def verificar_integridad():
    """
    Verifica la integridad de los datos cargados.
    """
    print("\n🔍 Verificando integridad de los datos...")
    
    # Verificar que todos los rubros estén presentes
    rubros_esperados = {r['id']: r['nombre'] for r in RUBROS_DATA}
    rubros_bd = {r.id: r.nombre for r in Rubro.objects.all()}
    
    rubros_faltantes = set(rubros_esperados.keys()) - set(rubros_bd.keys())
    if rubros_faltantes:
        print(f"⚠️  Rubros faltantes: {rubros_faltantes}")
    else:
        print("✅ Todos los rubros están presentes")
    
    # Verificar subrubros
    total_subrubros_esperados = sum(len(r['subrubros']) for r in RUBROS_DATA)
    total_subrubros_bd = SubRubro.objects.count()
    
    if total_subrubros_esperados == total_subrubros_bd:
        print("✅ Todos los subrubros están presentes")
    else:
        print(f"⚠️  Subrubros esperados: {total_subrubros_esperados}, en BD: {total_subrubros_bd}")
    
    # Verificar relaciones
    subrubros_sin_rubro = SubRubro.objects.filter(rubro__isnull=True).count()
    if subrubros_sin_rubro == 0:
        print("✅ Todas las relaciones están correctas")
    else:
        print(f"⚠️  Subrubros sin rubro asignado: {subrubros_sin_rubro}")


def mostrar_estadisticas():
    """
    Muestra estadísticas de los datos cargados.
    """
    print("\n📈 ESTADÍSTICAS DE LA BASE DE DATOS")
    print("="*40)
    
    total_rubros = Rubro.objects.count()
    total_subrubros = SubRubro.objects.count()
    
    print(f"Total de rubros: {total_rubros}")
    print(f"Total de subrubros: {total_subrubros}")
    
    # Rubro con más subrubros
    rubro_max_subrubros = Rubro.objects.annotate(
        num_subrubros=models.Count('subrubros')
    ).order_by('-num_subrubros').first()
    
    if rubro_max_subrubros:
        print(f"Rubro con más subrubros: {rubro_max_subrubros.nombre} ({rubro_max_subrubros.num_subrubros} subrubros)")
    
    print("="*40)


if __name__ == '__main__':
    print("🔧 SCRIPT DE CARGA DE RUBROS Y SUBRUBROS")
    print("="*50)
    print("Este script cargará todos los rubros y subrubros")
    print("manteniendo los IDs y relaciones originales.")
    print("="*50)
    
    # Importar models aquí para evitar errores de importación circular
    from django.db import models
    
    try:
        cargar_rubros_subrubros()
        verificar_integridad()
        mostrar_estadisticas()
        
        print("\n🎯 PROCESO COMPLETADO")
        print("Los rubros y subrubros han sido cargados exitosamente.")
        print("Tu compañero puede usar este script para poblar su base de datos.")
        
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {str(e)}")
        sys.exit(1)
