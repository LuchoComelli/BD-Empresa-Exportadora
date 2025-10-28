from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import AuditoriaLogViewSet

router = DefaultRouter()
router.register(r'logs', AuditoriaLogViewSet, basename='log')

urlpatterns = [
    path('', include(router.urls)),
]

