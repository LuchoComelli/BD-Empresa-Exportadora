#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from apps.core.models import Usuario

# Crear superusuario
try:
    if not Usuario.objects.filter(username='admin').exists():
        Usuario.objects.create_superuser(
            username='admin',
            email='admin@empresa.com',
            password='admin123',
            nombre='Administrador',
            apellido='Sistema'
        )
        print("✅ Superusuario creado exitosamente!")
        print("Usuario: admin")
        print("Contraseña: admin123")
    else:
        print("⚠️ El superusuario 'admin' ya existe")
except Exception as e:
    print(f"❌ Error al crear superusuario: {e}")
