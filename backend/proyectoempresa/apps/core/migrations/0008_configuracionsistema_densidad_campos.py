# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_agregar_debe_cambiar_password'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracionsistema',
            name='densidad_alta_max',
            field=models.IntegerField(default=40, help_text='Máximo número de empresas para densidad alta', verbose_name='Densidad Alta - Máximo'),
        ),
        migrations.AddField(
            model_name='configuracionsistema',
            name='densidad_baja_max',
            field=models.IntegerField(default=5, help_text='Máximo número de empresas para densidad baja (1 hasta este valor)', verbose_name='Densidad Baja - Máximo'),
        ),
        migrations.AddField(
            model_name='configuracionsistema',
            name='densidad_media_max',
            field=models.IntegerField(default=20, help_text='Máximo número de empresas para densidad media', verbose_name='Densidad Media - Máximo'),
        ),
    ]

