#!/usr/bin/env python3
"""
Script para agregar el rubro "Economía del Conocimiento" y sus subrubros.

Este script añade únicamente el nuevo rubro de servicios "Economía del Conocimiento"
con sus subrubros correspondientes, sin afectar los rubros existentes.

Uso:
    python agregar_economia_conocimiento.py

Requisitos:
    - Django configurado correctamente
    - Acceso a la base de datos
    - Modelos Rubro y SubRubro disponibles
"""

import os
import sys
import django

# Agregar el directorio backend al path si es necesario
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyectoempresa.settings')
django.setup()

from apps.empresas.models import Rubro, SubRubro

# Datos del nuevo rubro "Economía del Conocimiento"
ECONOMIA_CONOCIMIENTO_DATA = {
    "id": 41,
    "nombre": "Economía del Conocimiento",
    "descripcion": "Servicios basados en conocimiento, tecnología e innovación",
    "tipo": "servicio",
    "unidad_medida_estandar": "na",  # No aplica para servicios
    "orden": 0,  # Se ordenará automáticamente
    "subrubros": [
        {"id": 216, "nombre": "Servicios de consultoría tecnológica", "descripcion": ""},
        {"id": 217, "nombre": "Desarrollo de software y aplicaciones", "descripcion": ""},
        {"id": 218, "nombre": "Servicios de datos y analytics", "descripcion": ""},
        {"id": 219, "nombre": "Inteligencia artificial y machine learning", "descripcion": ""},
        {"id": 220, "nombre": "Blockchain y servicios de cadena de bloques", "descripcion": ""},
        {"id": 221, "nombre": "Servicios de cloud computing", "descripcion": ""},
        {"id": 222, "nombre": "Servicios de ciberseguridad", "descripcion": ""},
        {"id": 223, "nombre": "Investigación y desarrollo (I+D)", "descripcion": ""},
        {"id": 224, "nombre": "Servicios de outsourcing tecnológico", "descripcion": ""},
        {"id": 225, "nombre": "Servicios de transformación digital", "descripcion": ""},
        {"id": 226, "nombre": "Servicios de automatización y robótica", "descripcion": ""},
        {"id": 227, "nombre": "Servicios de IoT (Internet de las Cosas)", "descripcion": ""},
        {"id": 228, "nombre": "Otro", "descripcion": ""}
    ]
}


def agregar_economia_conocimiento():
    """
    Agrega el rubro "Economía del Conocimiento" y sus subrubros.
    """
    print("🚀 Iniciando carga del rubro 'Economía del Conocimiento'...")
    
    rubro_creado = False
    rubro_actualizado = False
    subrubros_creados = 0
    subrubros_actualizados = 0
    
    try:
        # Verificar si el rubro ya existe
        rubro_existente = Rubro.objects.filter(id=ECONOMIA_CONOCIMIENTO_DATA['id']).first()
        
        if rubro_existente:
            print(f"⚠️  El rubro con ID {ECONOMIA_CONOCIMIENTO_DATA['id']} ya existe: {rubro_existente.nombre}")
            respuesta = input("¿Deseas actualizarlo? (s/n): ").strip().lower()
            
            if respuesta == 's':
                rubro_existente.nombre = ECONOMIA_CONOCIMIENTO_DATA['nombre']
                rubro_existente.descripcion = ECONOMIA_CONOCIMIENTO_DATA['descripcion']
                rubro_existente.tipo = ECONOMIA_CONOCIMIENTO_DATA['tipo']
                rubro_existente.unidad_medida_estandar = ECONOMIA_CONOCIMIENTO_DATA['unidad_medida_estandar']
                rubro_existente.orden = ECONOMIA_CONOCIMIENTO_DATA['orden']
                rubro_existente.activo = True
                rubro_existente.save()
                rubro_actualizado = True
                rubro = rubro_existente
                print(f"🔄 Rubro actualizado: {rubro.nombre} (ID: {rubro.id})")
            else:
                print("❌ Operación cancelada.")
                return
        else:
            # Crear el rubro
            rubro = Rubro.objects.create(
                id=ECONOMIA_CONOCIMIENTO_DATA['id'],
                nombre=ECONOMIA_CONOCIMIENTO_DATA['nombre'],
                descripcion=ECONOMIA_CONOCIMIENTO_DATA['descripcion'],
                tipo=ECONOMIA_CONOCIMIENTO_DATA['tipo'],
                unidad_medida_estandar=ECONOMIA_CONOCIMIENTO_DATA['unidad_medida_estandar'],
                orden=ECONOMIA_CONOCIMIENTO_DATA['orden'],
                activo=True
            )
            rubro_creado = True
            print(f"✅ Rubro creado: {rubro.nombre} (ID: {rubro.id})")
        
        # Crear o actualizar subrubros
        for subrubro_data in ECONOMIA_CONOCIMIENTO_DATA['subrubros']:
            subrubro_existente = SubRubro.objects.filter(id=subrubro_data['id']).first()
            
            if subrubro_existente:
                # Verificar si pertenece al rubro correcto
                if subrubro_existente.rubro != rubro:
                    print(f"⚠️  El subrubro con ID {subrubro_data['id']} existe pero pertenece a otro rubro: {subrubro_existente.rubro.nombre}")
                    respuesta = input(f"¿Deseas moverlo al rubro '{rubro.nombre}'? (s/n): ").strip().lower()
                    
                    if respuesta == 's':
                        subrubro_existente.rubro = rubro
                        subrubro_existente.nombre = subrubro_data['nombre']
                        subrubro_existente.descripcion = subrubro_data['descripcion']
                        subrubro_existente.activo = True
                        subrubro_existente.save()
                        subrubros_actualizados += 1
                        print(f"  🔄 Subrubro actualizado: {subrubro_existente.nombre} (ID: {subrubro_existente.id})")
                    else:
                        print(f"  ⏭️  Subrubro omitido: {subrubro_existente.nombre}")
                else:
                    # Actualizar datos del subrubro existente
                    updated = False
                    if subrubro_existente.nombre != subrubro_data['nombre']:
                        subrubro_existente.nombre = subrubro_data['nombre']
                        updated = True
                    if subrubro_existente.descripcion != subrubro_data['descripcion']:
                        subrubro_existente.descripcion = subrubro_data['descripcion']
                        updated = True
                    
                    if updated:
                        subrubro_existente.activo = True
                        subrubro_existente.save()
                        subrubros_actualizados += 1
                        print(f"  🔄 Subrubro actualizado: {subrubro_existente.nombre} (ID: {subrubro_existente.id})")
                    else:
                        print(f"  ✓ Subrubro ya existe: {subrubro_existente.nombre} (ID: {subrubro_existente.id})")
            else:
                # Crear nuevo subrubro
                subrubro = SubRubro.objects.create(
                    id=subrubro_data['id'],
                    nombre=subrubro_data['nombre'],
                    descripcion=subrubro_data['descripcion'],
                    rubro=rubro,
                    activo=True
                )
                subrubros_creados += 1
                print(f"  ✅ Subrubro creado: {subrubro.nombre} (ID: {subrubro.id})")
        
        print("\n" + "="*60)
        print("🎉 CARGA COMPLETADA EXITOSAMENTE")
        print("="*60)
        if rubro_creado:
            print(f"📊 Rubro creado: {ECONOMIA_CONOCIMIENTO_DATA['nombre']}")
        if rubro_actualizado:
            print(f"📊 Rubro actualizado: {ECONOMIA_CONOCIMIENTO_DATA['nombre']}")
        print(f"📊 Subrubros creados: {subrubros_creados}")
        print(f"📊 Subrubros actualizados: {subrubros_actualizados}")
        print(f"📊 Total subrubros del rubro: {rubro.subrubros.count()}")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error durante la carga: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def verificar_carga():
    """
    Verifica que el rubro y sus subrubros se hayan cargado correctamente.
    """
    print("\n🔍 Verificando carga del rubro 'Economía del Conocimiento'...")
    
    try:
        rubro = Rubro.objects.get(id=ECONOMIA_CONOCIMIENTO_DATA['id'])
        print(f"✅ Rubro encontrado: {rubro.nombre}")
        print(f"   Tipo: {rubro.get_tipo_display()}")
        print(f"   Descripción: {rubro.descripcion}")
        
        subrubros = rubro.subrubros.all()
        print(f"✅ Subrubros encontrados: {subrubros.count()}")
        
        if subrubros.count() == len(ECONOMIA_CONOCIMIENTO_DATA['subrubros']):
            print("✅ Todos los subrubros están presentes")
            for subrubro in subrubros.order_by('id'):
                print(f"   - {subrubro.nombre} (ID: {subrubro.id})")
        else:
            print(f"⚠️  Se esperaban {len(ECONOMIA_CONOCIMIENTO_DATA['subrubros'])} subrubros, se encontraron {subrubros.count()}")
            
    except Rubro.DoesNotExist:
        print("❌ El rubro 'Economía del Conocimiento' no fue encontrado")
    except Exception as e:
        print(f"❌ Error durante la verificación: {str(e)}")


if __name__ == '__main__':
    print("🔧 SCRIPT PARA AGREGAR RUBRO 'ECONOMÍA DEL CONOCIMIENTO'")
    print("="*60)
    print("Este script agregará el rubro 'Economía del Conocimiento'")
    print("con sus subrubros correspondientes.")
    print("="*60)
    
    try:
        agregar_economia_conocimiento()
        verificar_carga()
        
        print("\n🎯 PROCESO COMPLETADO")
        print("El rubro 'Economía del Conocimiento' ha sido agregado exitosamente.")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

