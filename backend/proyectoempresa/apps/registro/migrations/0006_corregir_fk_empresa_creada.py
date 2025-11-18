# Generated manually to fix foreign key constraint

from django.db import migrations


def corregir_foreign_key(apps, schema_editor):
    """
    Corregir la foreign key constraint de empresa_creada para que apunte a empresa en lugar de empresaproducto
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Buscar el nombre de la constraint actual
        cursor.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'solicitud_registro'::regclass 
            AND conname LIKE '%empresa_creada%';
        """)
        
        constraints = cursor.fetchall()
        
        # Eliminar todas las constraints relacionadas con empresa_creada
        for constraint in constraints:
            constraint_name = constraint[0]
            cursor.execute(f"ALTER TABLE solicitud_registro DROP CONSTRAINT IF EXISTS {constraint_name};")
        
        # Crear la nueva constraint apuntando a empresa
        cursor.execute("""
            ALTER TABLE solicitud_registro 
            ADD CONSTRAINT solicitud_registro_empresa_creada_id_fk_empresa 
            FOREIGN KEY (empresa_creada_id) 
            REFERENCES empresa(id) 
            ON DELETE SET NULL;
        """)


def reverse_migration(apps, schema_editor):
    """
    Revertir el cambio (no necesario, pero incluido para completitud)
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Eliminar la constraint nueva
        cursor.execute("""
            ALTER TABLE solicitud_registro 
            DROP CONSTRAINT IF EXISTS solicitud_registro_empresa_creada_id_fk_empresa;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('registro', '0005_alter_solicitudregistro_empresa_creada'),
        ('empresas', '0005_empresamixta_empresaproducto_empresaservicio'),
    ]

    operations = [
        migrations.RunPython(corregir_foreign_key, reverse_migration),
    ]

