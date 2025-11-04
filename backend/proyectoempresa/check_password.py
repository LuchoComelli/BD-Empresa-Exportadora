#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.core.models import Usuario

# Buscar el usuario
email = 'prueba@gmail.com'
password = '23430594419'

try:
    usuario = Usuario.objects.get(email=email)
    print(f"Usuario encontrado: {usuario.email}")
    print(f"Nombre: {usuario.nombre} {usuario.apellido}")
    print(f"Activo: {usuario.is_active}")
    print(f"Rol: {usuario.rol.nombre if usuario.rol else 'Sin rol'}")
    print(f"\nVerificando contraseña '{password}':")
    
    # Verificar contraseña
    if usuario.check_password(password):
        print("✅ La contraseña es CORRECTA")
    else:
        print("❌ La contraseña es INCORRECTA")
        
        # Intentar con diferentes variaciones
        print("\nProbando variaciones:")
        variations = [
            password,
            password.replace('-', ''),
            password.replace(' ', ''),
            password.strip(),
        ]
        for var in variations:
            if usuario.check_password(var):
                print(f"✅ La contraseña '{var}' es CORRECTA")
                break
        
        # Verificar cómo se guardó el CUIT original
        from apps.registro.models import SolicitudRegistro
        solicitud = SolicitudRegistro.objects.filter(usuario_creado=usuario).first()
        if solicitud:
            cuit_original = solicitud.cuit_cuil
            print(f"\nCUIT original en la solicitud: '{cuit_original}'")
            cuit_limpio = cuit_original.replace('-', '').replace(' ', '').strip()
            print(f"CUIT limpio: '{cuit_limpio}'")
            if usuario.check_password(cuit_limpio):
                print(f"✅ La contraseña debería ser: '{cuit_limpio}'")
        
except Usuario.DoesNotExist:
    print(f"❌ Usuario con email '{email}' no encontrado")
except Exception as e:
    print(f"Error: {str(e)}")

