from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from .models import AuditoriaLog

@login_required
def list_auditoria(request):
    """
    Lista de registros de auditoría
    """
    if not request.user.rol or not request.user.rol.puede_ver_auditoria:
        return render(request, '403.html')
    
    logs = AuditoriaLog.objects.all()
    
    paginator = Paginator(logs, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
    }
    return render(request, 'auditoria/list_auditoria.html', context)

@login_required
def detail_auditoria(request, pk):
    """
    Detalle de registro de auditoría
    """
    if not request.user.rol or not request.user.rol.puede_ver_auditoria:
        return render(request, '403.html')
    
    log = AuditoriaLog.objects.get(pk=pk)
    
    context = {
        'log': log,
    }
    return render(request, 'auditoria/detail_auditoria.html', context)