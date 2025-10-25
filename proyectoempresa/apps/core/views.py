from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import Usuario, Dpto, Municipio, Localidades

@login_required
def dashboard(request):
    """
    Vista principal del dashboard
    """
    context = {
        'usuario': request.user,
        'total_usuarios': Usuario.objects.count(),
        'total_departamentos': Dpto.objects.count(),
        'total_municipios': Municipio.objects.count(),
        'total_localidades': Localidades.objects.count(),
    }
    return render(request, 'core/dashboard.html', context)

@login_required
def perfil_usuario(request):
    """
    Vista para ver y editar perfil del usuario
    """
    if request.method == 'POST':
        # Lógica para actualizar perfil
        pass
    
    context = {
        'usuario': request.user,
    }
    return render(request, 'core/perfil.html', context)

def get_municipios(request):
    """
    Vista AJAX para obtener municipios de un departamento
    """
    dpto_id = request.GET.get('dpto_id')
    municipios = Municipio.objects.filter(dpto_id=dpto_id, activo=True).values('id', 'nommun')
    return JsonResponse(list(municipios), safe=False)

def get_localidades(request):
    """
    Vista AJAX para obtener localidades de un municipio
    """
    municipio_id = request.GET.get('municipio_id')
    localidades = Localidades.objects.filter(municipio_id=municipio_id, activo=True).values('id', 'nomloc')
    return JsonResponse(list(localidades), safe=False)