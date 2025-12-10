from django.core.management.base import BaseCommand
from apps.empresas.models import Empresa, Empresaproducto, Empresaservicio, EmpresaMixta


class Command(BaseCommand):
    help = 'Verificar la diferencia entre el conteo de empresas'

    def handle(self, *args, **options):
        self.stdout.write("=== ANÁLISIS DE EMPRESAS ===\n")

        total = Empresa.objects.count()
        self.stdout.write(f"Total Empresa.objects.count(): {total}")

        prod = Empresaproducto.objects.count()
        serv = Empresaservicio.objects.count()
        mixta = EmpresaMixta.objects.count()
        suma = prod + serv + mixta

        self.stdout.write(f"Empresaproducto.objects.count(): {prod}")
        self.stdout.write(f"Empresaservicio.objects.count(): {serv}")
        self.stdout.write(f"EmpresaMixta.objects.count(): {mixta}")
        self.stdout.write(f"Suma de proxy models: {suma}")

        self.stdout.write(f"\nDiferencia: {total - suma}")

        # Verificar empresas sin tipo_empresa_valor válido
        empresas_sin_tipo = Empresa.objects.filter(
            tipo_empresa_valor__isnull=True
        ) | Empresa.objects.exclude(
            tipo_empresa_valor__in=['producto', 'servicio', 'mixta']
        )
        self.stdout.write(f"\nEmpresas sin tipo válido: {empresas_sin_tipo.count()}")
        if empresas_sin_tipo.exists():
            for e in empresas_sin_tipo:
                self.stdout.write(f"  - ID {e.id}: {e.razon_social} - tipo: {e.tipo_empresa_valor}")

        # Verificar todas las empresas y sus tipos
        self.stdout.write("\n=== TODAS LAS EMPRESAS ===")
        for e in Empresa.objects.all():
            self.stdout.write(f"ID {e.id}: {e.razon_social} - tipo: {e.tipo_empresa_valor}")

