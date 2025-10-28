from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    SolicitudRegistroViewSet, DocumentoSolicitudViewSet,
    NotificacionRegistroViewSet
)

router = DefaultRouter()
router.register(r'solicitudes', SolicitudRegistroViewSet, basename='solicitud')
router.register(r'documentos', DocumentoSolicitudViewSet, basename='documento')
router.register(r'notificaciones', NotificacionRegistroViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
]

