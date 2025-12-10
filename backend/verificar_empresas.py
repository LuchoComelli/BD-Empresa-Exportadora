#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyectoempresa.settings')
django.setup()

from apps.empresas.models import Empresa, Empresaproducto, Empresaservicio, EmpresaMixta

print("=== ANÁLISIS DE EMPRESAS ===\n")

total = Empresa.objects.count()
print(f"Total Empresa.objects.count(): {total}")

prod = Empresaproducto.objects.count()
serv = Empresaservicio.objects.count()
mixta = EmpresaMixta.objects.count()
suma = prod + serv + mixta

print(f"Empresaproducto.objects.count(): {prod}")
print(f"Empresaservicio.objects.count(): {serv}")
print(f"EmpresaMixta.objects.count(): {mixta}")
print(f"Suma de proxy models: {suma}")

print(f"\nDiferencia: {total - suma}")

# Verificar empresas sin tipo_empresa_valor válido
empresas_sin_tipo = Empresa.objects.filter(tipo_empresa_valor__isnull=True) | Empresa.objects.exclude(tipo_empresa_valor__in=['producto', 'servicio', 'mixta'])
print(f"\nEmpresas sin tipo válido: {empresas_sin_tipo.count()}")
if empresas_sin_tipo.exists():
    for e in empresas_sin_tipo:
        print(f"  - ID {e.id}: {e.razon_social} - tipo: {e.tipo_empresa_valor}")

# Verificar todas las empresas y sus tipos
print("\n=== TODAS LAS EMPRESAS ===")
for e in Empresa.objects.all():
    print(f"ID {e.id}: {e.razon_social} - tipo: {e.tipo_empresa_valor}")

