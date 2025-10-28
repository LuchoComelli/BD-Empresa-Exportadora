from django.utils.deprecation import MiddlewareMixin
from .models import AuditoriaLog

class AuditoriaMiddleware(MiddlewareMixin):
    """
    Middleware para registrar automáticamente las acciones del usuario
    """
    
    def process_request(self, request):
        """
        Registrar información de la solicitud
        """
        if request.user.is_authenticated:
            # Registrar acceso a páginas
            if request.path.startswith('/empresas/'):
                AuditoriaLog.objects.create(
                    usuario=request.user,
                    accion='READ',
                    modelo_afectado='Empresa',
                    descripcion=f"Acceso a {request.path}",
                    url=request.path,
                    metodo_http=request.method,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    session_key=request.session.session_key,
                    categoria='COMPANY_MANAGEMENT',
                    nivel_criticidad='INFO'
                )
    
    def process_response(self, request, response):
        """
        Registrar respuesta
        """
        if request.user.is_authenticated and response.status_code >= 400:
            AuditoriaLog.objects.create(
                usuario=request.user,
                accion='ERROR',
                modelo_afectado='Sistema',
                descripcion=f"Error {response.status_code} en {request.path}",
                url=request.path,
                metodo_http=request.method,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                session_key=request.session.session_key,
                categoria='ERROR',
                nivel_criticidad='ERROR',
                exito=False,
                mensaje_error=f"HTTP {response.status_code}"
            )
        
        return response
