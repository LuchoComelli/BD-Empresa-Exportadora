# Generated manually
from django.db import migrations, models


def dividir_nombres_completos(apps, schema_editor):
    """
    Migrar datos existentes: dividir nombres completos en nombre y apellido
    """
    Empresa = apps.get_model('empresas', 'Empresa')
    
    for empresa in Empresa.objects.all():
        # Contacto principal
        if empresa.contacto_principal_nombre:
            nombre_completo = empresa.contacto_principal_nombre.strip()
            partes = nombre_completo.split(maxsplit=1)
            if len(partes) == 2:
                empresa.contacto_principal_nombre = partes[0]
                empresa.contacto_principal_apellido = partes[1]
            elif len(partes) == 1:
                empresa.contacto_principal_nombre = partes[0]
                empresa.contacto_principal_apellido = ''
            empresa.save(update_fields=['contacto_principal_nombre', 'contacto_principal_apellido'])
        
        # Contacto secundario
        if empresa.contacto_secundario_nombre:
            nombre_completo = empresa.contacto_secundario_nombre.strip()
            partes = nombre_completo.split(maxsplit=1)
            if len(partes) == 2:
                empresa.contacto_secundario_nombre = partes[0]
                empresa.contacto_secundario_apellido = partes[1]
            elif len(partes) == 1:
                empresa.contacto_secundario_nombre = partes[0]
                empresa.contacto_secundario_apellido = ''
            empresa.save(update_fields=['contacto_secundario_nombre', 'contacto_secundario_apellido'])
        
        # Contacto terciario
        if empresa.contacto_terciario_nombre:
            nombre_completo = empresa.contacto_terciario_nombre.strip()
            partes = nombre_completo.split(maxsplit=1)
            if len(partes) == 2:
                empresa.contacto_terciario_nombre = partes[0]
                empresa.contacto_terciario_apellido = partes[1]
            elif len(partes) == 1:
                empresa.contacto_terciario_nombre = partes[0]
                empresa.contacto_terciario_apellido = ''
            empresa.save(update_fields=['contacto_terciario_nombre', 'contacto_terciario_apellido'])


def revertir_nombres_completos(apps, schema_editor):
    """
    Revertir migración: combinar nombre y apellido en nombre completo
    """
    Empresa = apps.get_model('empresas', 'Empresa')
    
    for empresa in Empresa.objects.all():
        # Contacto principal
        if empresa.contacto_principal_nombre:
            nombre_completo = empresa.contacto_principal_nombre
            if empresa.contacto_principal_apellido:
                nombre_completo += ' ' + empresa.contacto_principal_apellido
            empresa.contacto_principal_nombre = nombre_completo
            empresa.save(update_fields=['contacto_principal_nombre'])
        
        # Contacto secundario
        if empresa.contacto_secundario_nombre:
            nombre_completo = empresa.contacto_secundario_nombre
            if empresa.contacto_secundario_apellido:
                nombre_completo += ' ' + empresa.contacto_secundario_apellido
            empresa.contacto_secundario_nombre = nombre_completo
            empresa.save(update_fields=['contacto_secundario_nombre'])
        
        # Contacto terciario
        if empresa.contacto_terciario_nombre:
            nombre_completo = empresa.contacto_terciario_nombre
            if empresa.contacto_terciario_apellido:
                nombre_completo += ' ' + empresa.contacto_terciario_apellido
            empresa.contacto_terciario_nombre = nombre_completo
            empresa.save(update_fields=['contacto_terciario_nombre'])


class Migration(migrations.Migration):

    dependencies = [
        ('empresas', '0010_empresa_contacto_terciario_cargo_and_more'),
    ]

    operations = [
        # Cambiar max_length de nombre de 100 a 50
        migrations.AlterField(
            model_name='empresa',
            name='contacto_principal_nombre',
            field=models.CharField(help_text='Nombre del contacto principal de la empresa (OBLIGATORIO)', max_length=50, verbose_name='Nombre del Contacto Principal'),
        ),
        migrations.AlterField(
            model_name='empresa',
            name='contacto_secundario_nombre',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Nombre del Contacto Secundario'),
        ),
        migrations.AlterField(
            model_name='empresa',
            name='contacto_terciario_nombre',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Nombre del Contacto Terciario'),
        ),
        # Agregar campos de apellido
        migrations.AddField(
            model_name='empresa',
            name='contacto_principal_apellido',
            field=models.CharField(blank=True, default='', help_text='Apellido del contacto principal de la empresa (OBLIGATORIO)', max_length=50, verbose_name='Apellido del Contacto Principal'),
        ),
        migrations.AddField(
            model_name='empresa',
            name='contacto_secundario_apellido',
            field=models.CharField(blank=True, default='', max_length=50, null=True, verbose_name='Apellido del Contacto Secundario'),
        ),
        migrations.AddField(
            model_name='empresa',
            name='contacto_terciario_apellido',
            field=models.CharField(blank=True, default='', max_length=50, null=True, verbose_name='Apellido del Contacto Terciario'),
        ),
        # Migrar datos existentes
        migrations.RunPython(dividir_nombres_completos, revertir_nombres_completos),
    ]
