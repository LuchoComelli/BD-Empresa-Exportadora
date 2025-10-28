from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('perfil/', views.perfil_usuario, name='perfil'),
    path('api/municipios/', views.get_municipios, name='api_municipios'),
    path('api/localidades/', views.get_localidades, name='api_localidades'),
]