# Generated manually
from django.db import migrations, models


def dividir_nombres_completos_solicitud(apps, schema_editor):
    """
    Migrar datos existentes: dividir nombres completos en nombre y apellido
    """
    SolicitudRegistro = apps.get_model('registro', 'SolicitudRegistro')
    
    for solicitud in SolicitudRegistro.objects.all():
        if solicitud.nombre_contacto:
            nombre_completo = solicitud.nombre_contacto.strip()
            partes = nombre_completo.split(maxsplit=1)
            if len(partes) == 2:
                solicitud.nombre_contacto = partes[0]
                solicitud.apellido_contacto = partes[1]
            elif len(partes) == 1:
                solicitud.nombre_contacto = partes[0]
                solicitud.apellido_contacto = ''
            solicitud.save(update_fields=['nombre_contacto', 'apellido_contacto'])
        
        # Actualizar contactos secundarios en JSONField
        if solicitud.contactos_secundarios and isinstance(solicitud.contactos_secundarios, list):
            contactos_actualizados = []
            for contacto in solicitud.contactos_secundarios:
                if isinstance(contacto, dict) and 'nombre' in contacto:
                    nombre_completo = contacto.get('nombre', '').strip()
                    partes = nombre_completo.split(maxsplit=1)
                    if len(partes) == 2:
                        contacto['nombre'] = partes[0]
                        contacto['apellido'] = partes[1]
                    elif len(partes) == 1:
                        contacto['nombre'] = partes[0]
                        contacto['apellido'] = ''
                contactos_actualizados.append(contacto)
            solicitud.contactos_secundarios = contactos_actualizados
            solicitud.save(update_fields=['contactos_secundarios'])


def revertir_nombres_completos_solicitud(apps, schema_editor):
    """
    Revertir migración: combinar nombre y apellido en nombre completo
    """
    SolicitudRegistro = apps.get_model('registro', 'SolicitudRegistro')
    
    for solicitud in SolicitudRegistro.objects.all():
        if solicitud.nombre_contacto:
            nombre_completo = solicitud.nombre_contacto
            if solicitud.apellido_contacto:
                nombre_completo += ' ' + solicitud.apellido_contacto
            solicitud.nombre_contacto = nombre_completo
            solicitud.save(update_fields=['nombre_contacto'])
        
        # Revertir contactos secundarios en JSONField
        if solicitud.contactos_secundarios and isinstance(solicitud.contactos_secundarios, list):
            contactos_actualizados = []
            for contacto in solicitud.contactos_secundarios:
                if isinstance(contacto, dict) and 'nombre' in contacto:
                    nombre_completo = contacto.get('nombre', '')
                    if contacto.get('apellido'):
                        nombre_completo += ' ' + contacto['apellido']
                    contacto['nombre'] = nombre_completo
                    if 'apellido' in contacto:
                        del contacto['apellido']
                contactos_actualizados.append(contacto)
            solicitud.contactos_secundarios = contactos_actualizados
            solicitud.save(update_fields=['contactos_secundarios'])


class Migration(migrations.Migration):

    dependencies = [
        ('registro', '0004_solicitudregistro_interes_exportar'),
    ]

    operations = [
        # Cambiar max_length de nombre_contacto de 100 a 50
        migrations.AlterField(
            model_name='solicitudregistro',
            name='nombre_contacto',
            field=models.CharField(max_length=50, verbose_name='Nombre del Contacto'),
        ),
        # Agregar campo apellido_contacto
        migrations.AddField(
            model_name='solicitudregistro',
            name='apellido_contacto',
            field=models.CharField(blank=True, default='', max_length=50, verbose_name='Apellido del Contacto'),
        ),
        # Migrar datos existentes
        migrations.RunPython(dividir_nombres_completos_solicitud, revertir_nombres_completos_solicitud),
    ]
