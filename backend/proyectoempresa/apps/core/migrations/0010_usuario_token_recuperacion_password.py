# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_configuracionsistema_densidad_muy_alta_min'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='token_recuperacion_password',
            field=models.CharField(blank=True, help_text='Token único para recuperar contraseña', max_length=100, null=True, verbose_name='Token de Recuperación de Contraseña'),
        ),
        migrations.AddField(
            model_name='usuario',
            name='token_recuperacion_expira',
            field=models.DateTimeField(blank=True, help_text='Fecha y hora de expiración del token de recuperación', null=True, verbose_name='Expiración del Token de Recuperación'),
        ),
    ]

