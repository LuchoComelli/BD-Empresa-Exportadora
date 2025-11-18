from django.core.cache import cache
from django.conf import settings

class EmpresaCache:
    """Sistema de cache para empresas"""
    
    @staticmethod
    def get_empresas_por_departamento(departamento_id):
        cache_key = f"empresas_departamento_{departamento_id}"
        empresas = cache.get(cache_key)
        
        if not empresas:
            from apps.empresas.models import Empresa
            empresas = Empresa.objects.filter(
                departamento_id=departamento_id
            ).select_related('departamento', 'municipio')
            cache.set(cache_key, empresas, 3600)  # 1 hora
        
        return empresas
