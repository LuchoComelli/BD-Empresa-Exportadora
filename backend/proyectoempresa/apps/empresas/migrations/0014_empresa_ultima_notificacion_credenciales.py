# Generated manually on 2025-12-23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empresas', '0013_alter_productoempresa_descripcion_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='empresa',
            name='ultima_notificacion_credenciales',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Última Notificación de Credenciales', help_text='Fecha y hora de la última vez que se envió la notificación de credenciales de acceso a esta empresa'),
        ),
    ]

