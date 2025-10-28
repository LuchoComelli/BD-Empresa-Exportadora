from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Empresaproducto, Empresaservicio, EmpresaMixta, ProductoEmpresa, ServicioEmpresa

@login_required
def list_empresas_producto(request):
    """
    Lista de empresas de productos
    """
    empresas = Empresaproducto.objects.all()
    
    # Filtros básicos
    search = request.GET.get('search')
    if search:
        empresas = empresas.filter(
            Q(razon_social__icontains=search) |
            Q(cuit_cuil__icontains=search) |
            Q(correo__icontains=search)
        )
    
    paginator = Paginator(empresas, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'tipo': 'producto',
    }
    return render(request, 'empresas/list_empresas.html', context)

@login_required
def list_empresas_servicio(request):
    """
    Lista de empresas de servicios
    """
    empresas = Empresaservicio.objects.all()
    
    # Filtros básicos
    search = request.GET.get('search')
    if search:
        empresas = empresas.filter(
            Q(razon_social__icontains=search) |
            Q(cuit_cuil__icontains=search) |
            Q(correo__icontains=search)
        )
    
    paginator = Paginator(empresas, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'tipo': 'servicio',
    }
    return render(request, 'empresas/list_empresas.html', context)

@login_required
def list_empresas_mixta(request):
    """
    Lista de empresas mixtas
    """
    empresas = EmpresaMixta.objects.all()
    
    # Filtros básicos
    search = request.GET.get('search')
    if search:
        empresas = empresas.filter(
            Q(razon_social__icontains=search) |
            Q(cuit_cuil__icontains=search) |
            Q(correo__icontains=search)
        )
    
    paginator = Paginator(empresas, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
        'tipo': 'mixta',
    }
    return render(request, 'empresas/list_empresas.html', context)

@login_required
def detail_empresa_producto(request, pk):
    """
    Detalle de empresa de productos
    """
    empresa = get_object_or_404(Empresaproducto, pk=pk)
    productos = empresa.productos.all()
    
    context = {
        'empresa': empresa,
        'productos': productos,
        'tipo': 'producto',
    }
    return render(request, 'empresas/detail_empresa.html', context)

@login_required
def detail_empresa_servicio(request, pk):
    """
    Detalle de empresa de servicios
    """
    empresa = get_object_or_404(Empresaservicio, pk=pk)
    servicios = empresa.servicios.all()
    
    context = {
        'empresa': empresa,
        'servicios': servicios,
        'tipo': 'servicio',
    }
    return render(request, 'empresas/detail_empresa.html', context)

@login_required
def detail_empresa_mixta(request, pk):
    """
    Detalle de empresa mixta
    """
    empresa = get_object_or_404(EmpresaMixta, pk=pk)
    productos = empresa.productos.all()
    servicios = empresa.servicios.all()
    
    context = {
        'empresa': empresa,
        'productos': productos,
        'servicios': servicios,
        'tipo': 'mixta',
    }
    return render(request, 'empresas/detail_empresa.html', context)

@login_required
def export_empresas_pdf(request):
    """
    Exportar empresas a PDF
    """
    from .utils import generate_empresas_pdf
    
    # Obtener filtros
    tipo = request.GET.get('tipo', 'producto')
    campos = request.GET.getlist('campos', [])
    
    if tipo == 'producto':
        empresas = Empresaproducto.objects.all()
    elif tipo == 'servicio':
        empresas = Empresaservicio.objects.all()
    else:
        empresas = EmpresaMixta.objects.all()
    
    # Generar PDF
    pdf_response = generate_empresas_pdf(empresas, campos, tipo)
    return pdf_response