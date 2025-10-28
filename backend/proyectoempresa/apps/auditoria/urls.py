from django.urls import path
from . import views

app_name = 'auditoria'

urlpatterns = [
    path('', views.list_auditoria, name='list_auditoria'),
    path('<int:pk>/', views.detail_auditoria, name='detail_auditoria'),
]