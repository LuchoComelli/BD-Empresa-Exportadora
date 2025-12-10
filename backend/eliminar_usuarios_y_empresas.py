#!/usr/bin/env python
"""
Script para eliminar usuarios y sus empresas relacionadas
Ejecutar con: python manage.py shell < eliminar_usuarios_y_empresas.py
O mejor: docker-compose exec backend python manage.py shell
"""
import sys

# IDs de usuarios a eliminar
ids_usuarios = list(range(7, 43)) + [44]  # 7-42 inclusive + 44

from apps.core.models import Usuario
from apps.empresas.models import Empresa

print("=" * 60)
print("ELIMINACIÓN DE USUARIOS Y EMPRESAS")
print("=" * 60)
print(f"\n📋 IDs de usuarios a eliminar: {ids_usuarios}")
print(f"📊 Total de usuarios: {len(ids_usuarios)}\n")

# Verificar qué usuarios existen
usuarios_existentes = Usuario.objects.filter(id__in=ids_usuarios)
usuarios_no_existentes = set(ids_usuarios) - set(usuarios_existentes.values_list('id', flat=True))

if usuarios_no_existentes:
    print(f"⚠️  Usuarios no encontrados (serán ignorados): {sorted(usuarios_no_existentes)}\n")

if not usuarios_existentes.exists():
    print("❌ No se encontraron usuarios para eliminar.")
    sys.exit(0)

print(f"✅ Usuarios encontrados: {usuarios_existentes.count()}\n")

# Mostrar información de usuarios y sus empresas
total_empresas = 0
print("📋 DETALLE DE USUARIOS Y SUS EMPRESAS:")
print("-" * 60)

for usuario in usuarios_existentes:
    empresas = Empresa.objects.filter(id_usuario=usuario)
    total_empresas += empresas.count()
    
    print(f"\n👤 Usuario ID {usuario.id}: {usuario.get_full_name()} ({usuario.email})")
    print(f"   📊 Empresas relacionadas: {empresas.count()}")
    
    if empresas.exists():
        for empresa in empresas:
            print(f"      - ID {empresa.id}: {empresa.razon_social} (CUIT: {empresa.cuit_cuil})")

print("\n" + "-" * 60)
print(f"📊 RESUMEN:")
print(f"   - Usuarios a eliminar: {usuarios_existentes.count()}")
print(f"   - Empresas a eliminar: {total_empresas}")
print("-" * 60)

# Verificar si se pasa --confirm
auto_confirm = '--confirm' in sys.argv if hasattr(sys, 'argv') else False

if not auto_confirm:
    print("\n⚠️  Para confirmar la eliminación, ejecuta este script con --confirm")
    print("   O ejecuta manualmente las siguientes líneas en el shell de Django:")
    print("\n   usuarios = Usuario.objects.filter(id__in={})".format(ids_usuarios))
    print("   empresas_count = Empresa.objects.filter(id_usuario__in=usuarios).count()")
    print("   Empresa.objects.filter(id_usuario__in=usuarios).delete()")
    print("   usuarios.delete()")
    sys.exit(0)

print("\n⚠️  Modo automático: se procederá con la eliminación.")

# Eliminar empresas primero (aunque CASCADE lo haría automáticamente)
print("\n🗑️  Eliminando empresas...")
empresas_eliminadas = 0

for usuario in usuarios_existentes:
    empresas = Empresa.objects.filter(id_usuario=usuario)
    count = empresas.count()
    empresas.delete()
    empresas_eliminadas += count
    print(f"   ✅ Eliminadas {count} empresa(s) del usuario ID {usuario.id}")

# Eliminar usuarios
print("\n🗑️  Eliminando usuarios...")
usuarios_eliminados = usuarios_existentes.count()
usuarios_existentes.delete()

print("\n" + "=" * 60)
print("✅ ELIMINACIÓN COMPLETADA")
print("=" * 60)
print(f"   - Usuarios eliminados: {usuarios_eliminados}")
print(f"   - Empresas eliminadas: {empresas_eliminadas}")
print("=" * 60)
