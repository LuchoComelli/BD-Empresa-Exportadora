from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir lectura a todos,
    pero solo admins pueden modificar
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CanManageEmpresas(permissions.BasePermission):
    """
    Permiso para gestionar empresas basado en el rol del usuario
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.rol:
            return False
        
        # Lectura permitida para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Crear
        if request.method == 'POST':
            return request.user.rol.puede_crear_empresas
        
        # Actualizar
        if request.method in ['PUT', 'PATCH']:
            return request.user.rol.puede_editar_empresas
        
        # Eliminar
        if request.method == 'DELETE':
            return request.user.rol.puede_eliminar_empresas
        
        return False


class CanViewAuditoria(permissions.BasePermission):
    """
    Permiso para ver auditoría
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.rol:
            return False
        
        return request.user.rol.puede_ver_auditoria


class CanManageUsers(permissions.BasePermission):
    """
    Permiso para gestionar usuarios
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.rol:
            return False
        
        # Lectura permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.rol.puede_gestionar_usuarios


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso para que solo el propietario o admin pueda modificar
    """
    
    def has_object_permission(self, request, view, obj):
        # Lectura permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin puede todo
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # El propietario puede modificar
        if hasattr(obj, 'id_usuario'):
            return obj.id_usuario == request.user
        
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        
        return False


class IsPublicRegistration(permissions.BasePermission):
    """
    Permiso para registro público (POST sin autenticación)
    """
    
    def has_permission(self, request, view):
        # POST (crear) es público
        if request.method == 'POST':
            return True
        
        # Todo lo demás requiere autenticación
        return request.user and request.user.is_authenticated


class CanAccessDashboard(permissions.BasePermission):
    """
    Permiso para acceder al dashboard
    Permite acceso a superusuarios, administradores, analistas y consultores
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuarios siempre tienen acceso
        if request.user.is_superuser:
            return True
        
        # Si no tiene rol, no tiene acceso
        if not request.user.rol:
            return False
        
        # Verificar si el rol permite acceso al dashboard
        rol_nombre = request.user.rol.nombre.lower()
        
        # Roles que pueden acceder al dashboard
        allowed_roles = [
            'administrador',
            'admin',
            'analista',
            'consulta',
            'consultor'
        ]
        
        return any(allowed_role in rol_nombre for allowed_role in allowed_roles)
