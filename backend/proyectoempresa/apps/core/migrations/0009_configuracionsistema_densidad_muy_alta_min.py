# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_configuracionsistema_densidad_campos'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracionsistema',
            name='densidad_muy_alta_min',
            field=models.IntegerField(default=41, help_text='Mínimo número de empresas para densidad muy alta (desde este valor en adelante)', verbose_name='Densidad Muy Alta - Mínimo'),
        ),
    ]

