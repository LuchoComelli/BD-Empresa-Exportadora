from django.urls import path
from . import views

app_name = 'registro'

urlpatterns = [
    # URLs públicas
    path('', views.registro_empresa, name='registro_empresa'),
    path('usuario/', views.registro_usuario, name='registro_usuario'),
    path('confirmacion/<int:solicitud_id>/', views.confirmacion_enviada, name='confirmacion_enviada'),
    path('confirmar/<str:token>/', views.confirmar_email, name='confirmar_email'),
    path('estado/<int:solicitud_id>/', views.estado_solicitud, name='estado_solicitud'),
    path('documento/<int:solicitud_id>/', views.subir_documento, name='subir_documento'),
    
    # URLs privadas (requieren login)
    path('solicitudes/', views.listar_solicitudes, name='listar_solicitudes'),
    path('solicitud/<int:solicitud_id>/', views.detalle_solicitud, name='detalle_solicitud'),
]
