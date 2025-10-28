from django.urls import path
from . import views

app_name = 'empresas'

urlpatterns = [
    # URLs de empresas de productos
    path('producto/', views.list_empresas_producto, name='list_empresas_producto'),
    path('producto/<int:pk>/', views.detail_empresa_producto, name='detail_empresa_producto'),
    
    # URLs de empresas de servicios
    path('servicio/', views.list_empresas_servicio, name='list_empresas_servicio'),
    path('servicio/<int:pk>/', views.detail_empresa_servicio, name='detail_empresa_servicio'),
    
    # URLs de empresas mixtas
    path('mixta/', views.list_empresas_mixta, name='list_empresas_mixta'),
    path('mixta/<int:pk>/', views.detail_empresa_mixta, name='detail_empresa_mixta'),
    
    # URLs de exportación
    path('export/pdf/', views.export_empresas_pdf, name='export_empresas_pdf'),
]