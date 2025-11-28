import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyectoempresa.settings')
django.setup()
from django.db.models import Count
from apps.empresas.models import Rubro

def main():
    print('Rubros por tipo:')
    for r in Rubro.objects.values('tipo').annotate(count=Count('id')):
        print(r)

if __name__ == '__main__':
    main()
