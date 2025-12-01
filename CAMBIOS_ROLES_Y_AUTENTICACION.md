# Cambios en Roles y Sistema de Autenticación

Este documento describe todos los cambios realizados en el sistema de roles y autenticación para implementar permisos por rol y autenticación segura con cookies HTTP-Only.

## 📋 Resumen de Cambios

### Backend
1. **Modelo RolUsuario**: Se agregaron nuevos campos de permisos
2. **Comando de Management**: Script para configurar roles automáticamente
3. **Sistema de Autenticación**: Cambio de tokens en localStorage a cookies HTTP-Only + Secure
4. **Vistas de Autenticación**: Nuevas vistas personalizadas para login/logout con cookies

### Frontend
1. **ApiService**: Actualizado para usar cookies y token en memoria
2. **AuthContext**: Actualizado para trabajar con el nuevo sistema
3. **Sidebar**: Actualizado para mostrar opciones según permisos del rol

---

## 🔧 Cambios en Backend

### 1. Modelo RolUsuario - Nuevos Campos de Permisos

**Archivo**: `backend/proyectoempresa/apps/core/models.py`

Se agregaron los siguientes campos al modelo `RolUsuario`:

```python
puede_ver_usuarios = models.BooleanField(default=False, verbose_name="Puede Ver Usuarios")
puede_ver_configuracion = models.BooleanField(default=False, verbose_name="Puede Ver Configuración")
puede_aprobar_empresas = models.BooleanField(default=False, verbose_name="Puede Aprobar Empresas Pendientes")
puede_ver_empresas_pendientes = models.BooleanField(default=False, verbose_name="Puede Ver Empresas Pendientes")
puede_ver_reportes = models.BooleanField(default=True, verbose_name="Puede Ver Reportes")
puede_ver_mapa = models.BooleanField(default=True, verbose_name="Puede Ver Mapa")
puede_ver_matriz = models.BooleanField(default=True, verbose_name="Puede Ver Matriz de Clasificación")
```

**Acción requerida**: 
- La migración ya fue creada: `0006_rolusuario_puede_aprobar_empresas_and_more.py`
- Solo necesitas aplicarla: `docker-compose exec backend python manage.py migrate core`

### 2. Serializer RolUsuario - Actualizado

**Archivo**: `backend/proyectoempresa/apps/core/serializers.py`

Se actualizó el `RolUsuarioSerializer` para incluir todos los nuevos campos de permisos en la respuesta:

```python
fields = [
    # ... campos existentes ...
    'puede_ver_usuarios', 'puede_ver_configuracion',
    'puede_aprobar_empresas', 'puede_ver_empresas_pendientes',
    'puede_ver_reportes', 'puede_ver_mapa', 'puede_ver_matriz',
]
```

Esto asegura que cuando se obtiene información del usuario, todos los permisos del rol estén disponibles en el frontend.

### 3. Comando de Management para Configurar Roles

**Archivo**: `backend/proyectoempresa/apps/core/management/commands/configurar_roles.py` (NUEVO)

Se creó un nuevo comando de management que configura automáticamente los tres roles del sistema:

- **Administrador**: Acceso completo y control total
- **Analista**: Gestión y consulta de datos
- **Consultor**: Visualización y exportación, sin modificar información

**Acción requerida**: Ejecutar el comando
```bash
docker-compose exec backend python manage.py configurar_roles
```

**Nota**: Este comando es idempotente - puede ejecutarse múltiples veces sin problemas. Actualiza los roles existentes o los crea si no existen.

### 4. Nuevas Vistas de Autenticación con Cookies HTTP-Only

**Archivo**: `backend/proyectoempresa/apps/core/views.py` (NUEVO)

Se crearon nuevas vistas personalizadas para autenticación que reemplazan las vistas estándar de JWT:

- `CustomTokenObtainPairView`: Login que establece cookies HTTP-Only y retorna datos del usuario
- `CustomTokenRefreshView`: Refresh token usando cookies (lee refresh token de cookie automáticamente)
- `CustomTokenVerifyView`: Verificación de token
- `LogoutView`: Logout que elimina cookies

**Características importantes**:
- Cookies HTTP-Only (no accesibles desde JavaScript) para refresh token
- Cookies Secure en producción (cuando `DEBUG=False`)
- SameSite=Lax para protección CSRF
- Access token retornado en el body de la respuesta para uso en memoria del frontend
- La respuesta del login incluye información completa del usuario **con todos los permisos del rol** para evitar peticiones adicionales
- Estructura de respuesta:
  ```json
  {
    "status": "success",
    "message": "Login exitoso",
    "access_token": "...",
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "nombre": "Juan",
      "apellido": "Pérez",
      "is_superuser": false,
      "is_staff": false,
      "rol": {
        "id": 2,
        "nombre": "Analista",
        "nivel_acceso": 2,
        "puede_crear_empresas": true,
        "puede_editar_empresas": true,
        "puede_ver_usuarios": false,
        "puede_ver_configuracion": false,
        // ... todos los demás permisos
      }
    }
  }
  ```

**Archivo**: `backend/proyectoempresa/apps/core/api_urls.py`

Se actualizaron las URLs para usar las nuevas vistas:
```python
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    LogoutView
)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),
    path('auth/logout/', LogoutView.as_view(), name='token_logout'),
    # ...
]
```

### 4. Configuración de CORS y Cookies

**Archivo**: `backend/proyectoempresa/config/settings.py`

Asegúrate de que las siguientes configuraciones estén presentes:

```python
# CORS Configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    # Agregar otros orígenes según sea necesario
]

# Cookie Configuration
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG  # Secure solo en producción
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
```

---

## 🎨 Cambios en Frontend

### 1. ApiService - Cookies y Token en Memoria

**Archivo**: `frontend/lib/api.ts`

**Cambios principales**:

1. **Token en memoria**: Se agregó `private accessTokenMemory: string | null = null`
2. **Método `getCookie()`**: Para leer cookies (aunque HTTP-Only no son accesibles desde JS)
3. **Método `getAccessToken()`**: Ahora busca primero en memoria, luego en cookie
4. **Método `setAccessToken()`**: Guarda token solo en memoria
5. **Login actualizado**: Ahora incluye `credentials: 'include'` para enviar cookies
6. **Refresh token**: Actualizado para usar cookies automáticamente

**Cambios específicos**:

```typescript
// Antes: localStorage
private getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// Ahora: Memoria + Cookie
private getAccessToken(): string | null {
  if (this.accessTokenMemory) {
    return this.accessTokenMemory;
  }
  const token = this.getCookie('access_token');
  if (token) {
    this.accessTokenMemory = token;
    return token;
  }
  return null;
}
```

### 2. AuthContext - Actualizado para Nuevo Sistema

**Archivo**: `frontend/lib/auth-context.tsx`

**Cambios**:
- Ya no lee tokens de localStorage al cargar
- El login ahora guarda el access token en memoria desde la respuesta
- El logout llama al endpoint del backend para eliminar cookies

### 3. Sidebar - Permisos por Rol

**Archivo**: `frontend/components/layout/sidebar.tsx`

**Cambios**:
- Se actualizó la lógica de filtrado de menú para usar permisos específicos del rol
- Cada item del menú ahora tiene un campo `permission` que especifica qué permiso verificar
- Se creó la función `hasPermission()` que verifica permisos del rol

**Estructura de permisos**:
```typescript
const allMenuItems = [
  { title: "Dashboard", href: "/dashboard", permission: null }, // Todos pueden ver
  { title: "Usuarios", href: "/dashboard/usuarios", permission: 'puede_ver_usuarios' },
  { title: "Configuración", href: "/dashboard/configuracion", permission: 'puede_ver_configuracion' },
  { title: "Empresas Pendientes", href: "/dashboard/empresas-pendientes", permission: 'puede_ver_empresas_pendientes' },
  // ... etc
]

const hasPermission = (permission: string | null): boolean => {
  if (!permission) return true // Sin permiso = todos pueden ver
  if (!user?.rol) return false
  if (user.is_superuser) return true // Superusuarios tienen todos los permisos
  return user.rol[permission] === true
}
```

---

## 📝 Permisos por Rol

### Administrador
- ✅ Puede crear empresas
- ✅ Puede editar empresas
- ✅ Puede eliminar empresas
- ✅ Puede ver auditoría
- ✅ Puede exportar datos
- ✅ Puede importar datos
- ✅ Puede gestionar usuarios
- ✅ Puede acceder al admin
- ✅ Puede ver usuarios
- ✅ Puede ver configuración
- ✅ Puede aprobar empresas
- ✅ Puede ver empresas pendientes
- ✅ Puede ver reportes
- ✅ Puede ver mapa
- ✅ Puede ver matriz

### Analista
- ✅ Puede crear empresas
- ✅ Puede editar empresas
- ❌ Puede eliminar empresas
- ✅ Puede ver auditoría
- ✅ Puede exportar datos
- ✅ Puede importar datos
- ❌ Puede gestionar usuarios
- ❌ Puede acceder al admin
- ❌ Puede ver usuarios
- ❌ Puede ver configuración
- ✅ Puede aprobar empresas
- ✅ Puede ver empresas pendientes
- ✅ Puede ver reportes
- ✅ Puede ver mapa
- ✅ Puede ver matriz

### Consultor
- ❌ Puede crear empresas
- ❌ Puede editar empresas
- ❌ Puede eliminar empresas
- ❌ Puede ver auditoría
- ✅ Puede exportar datos
- ❌ Puede importar datos
- ❌ Puede gestionar usuarios
- ❌ Puede acceder al admin
- ❌ Puede ver usuarios
- ❌ Puede ver configuración
- ❌ Puede aprobar empresas
- ❌ Puede ver empresas pendientes
- ✅ Puede ver reportes
- ✅ Puede ver mapa
- ✅ Puede ver matriz

---

## 🚀 Pasos para Aplicar los Cambios

### 1. Backend

```bash
# 1. Aplicar migraciones
docker-compose exec backend python manage.py makemigrations core
docker-compose exec backend python manage.py migrate core

# 2. Configurar roles
docker-compose exec backend python manage.py configurar_roles

# 3. Reiniciar backend
docker-compose restart backend
```

### 2. Frontend

```bash
# 1. Reiniciar frontend
docker-compose restart frontend
```

### 3. Verificar Configuración

Asegúrate de que en `backend/proyectoempresa/config/settings.py` estén configuradas:

```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

---

## 🔒 Seguridad y Configuración de Tokens

### Tiempos de Expiración de Tokens

**Configuración en `backend/proyectoempresa/config/settings/base.py`**:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=10),  # Access token: 10 minutos
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # Refresh token: 1 día
    # ...
}
```

**Configuración de Cookies en `backend/proyectoempresa/apps/core/views.py`**:
- **Refresh token cookie**: 1 día (86400 segundos)
- **Access token cookie**: 10 minutos (600 segundos)

### Cookies HTTP-Only
- **Refresh token**: Almacenado en cookie HTTP-Only (no accesible desde JavaScript)
- **Access token**: También en cookie HTTP-Only, pero también retornado en el body para uso en memoria
- **Secure**: Activado en producción (cuando `DEBUG=False`)
- **SameSite**: Configurado como `Lax` para protección CSRF

### Token en Memoria
- El access token se guarda en una variable privada en memoria
- No se persiste en localStorage
- **NO se elimina al cerrar la pestaña**: La cookie de refresh token persiste y permite renovar el access token al volver

### Gestión de Sesión

**Cierre de sesión automático por inactividad**:
- Tiempo de inactividad: **3 horas** (configurable entre 2-4 horas)
- Se detecta actividad mediante eventos: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`
- Verificación cada minuto
- Al detectar inactividad, se cierra la sesión automáticamente

**Renovación automática de access token**:
- Al volver al sitio (evento `visibilitychange`): Se renueva el access token si el refresh token es válido
- Al volver a la pestaña (evento `focus`): Se renueva el access token si el refresh token es válido
- Al cargar la aplicación: Se intenta renovar el access token antes de obtener el usuario

**Comportamiento al cerrar pestaña**:
- **NO se fuerza logout**: El refresh token en cookie HTTP-Only persiste
- Al volver al sitio, se renueva automáticamente el access token si el refresh token aún es válido
- Solo se cierra sesión si el refresh token expiró (1 día) o por inactividad (3 horas)

---

## ⚠️ Notas Importantes

1. **Cookies HTTP-Only**: El refresh token en cookie HTTP-Only no puede ser leído desde JavaScript por seguridad. El backend lo lee automáticamente.

2. **Access Token**: Se retorna en el body de la respuesta del login para que el frontend lo guarde en memoria y lo use en las peticiones. Expira en 10 minutos.

3. **Refresh Token**: El frontend no necesita manejar el refresh token manualmente, el backend lo lee de la cookie automáticamente. Expira en 1 día.

4. **Logout**: Debe llamar al endpoint `/api/core/auth/logout/` para que el backend elimine las cookies.

5. **CORS**: Es crítico que `CORS_ALLOW_CREDENTIALS = True` esté configurado para que las cookies funcionen correctamente.

6. **Cierre de Pestaña**: Al cerrar la pestaña, NO se fuerza logout. El refresh token persiste en la cookie y permite renovar el access token al volver.

7. **Inactividad**: Si el usuario está inactivo por 3 horas, se cierra la sesión automáticamente.

8. **Renovación Automática**: Al volver al sitio o cambiar de pestaña, se renueva automáticamente el access token si el refresh token aún es válido.

---

## 🧪 Pruebas

Después de aplicar los cambios, verifica:

1. ✅ Login funciona correctamente
2. ✅ Las cookies se establecen (verificar en DevTools > Application > Cookies)
3. ✅ El sidebar muestra solo las opciones permitidas según el rol
4. ✅ Las peticiones API funcionan con el token en memoria
5. ✅ El logout elimina las cookies correctamente
6. ✅ Los roles tienen los permisos correctos

---

## 📞 Soporte

Si hay algún problema al aplicar estos cambios:

1. Verificar que las migraciones se aplicaron correctamente
2. Verificar que los roles se configuraron con `configurar_roles`
3. Verificar la configuración de CORS en settings.py
4. Revisar los logs del backend para errores
5. Verificar que las cookies se están estableciendo en el navegador

---

## 📁 Archivos Modificados/Creados

### Backend
- ✅ `backend/proyectoempresa/apps/core/models.py` - Agregados 7 nuevos campos de permisos al modelo RolUsuario
- ✅ `backend/proyectoempresa/apps/core/serializers.py` - Actualizado RolUsuarioSerializer para incluir nuevos permisos
- ✅ `backend/proyectoempresa/apps/core/views.py` - **NUEVO ARCHIVO** - Vistas de autenticación con cookies HTTP-Only
- ✅ `backend/proyectoempresa/apps/core/api_urls.py` - Actualizado para importar y usar las nuevas vistas
- ✅ `backend/proyectoempresa/apps/core/management/commands/configurar_roles.py` - **NUEVO ARCHIVO** - Comando para configurar roles
- ✅ `backend/proyectoempresa/apps/core/migrations/0006_rolusuario_puede_aprobar_empresas_and_more.py` - **NUEVA MIGRACIÓN** - Agrega los 7 nuevos campos
- ✅ `backend/proyectoempresa/config/settings/base.py` - Actualizado tiempos de expiración de tokens (access: 10min, refresh: 1 día)

### Frontend
- ✅ `frontend/lib/api.ts` - Actualizado para usar cookies y token en memoria (eliminado localStorage)
- ✅ `frontend/lib/auth-context.tsx` - Actualizado para nuevo sistema de autenticación con:
  - Detección de inactividad (3 horas)
  - Renovación automática de access token al volver al sitio
  - No forzar logout al cerrar pestaña
- ✅ `frontend/components/layout/sidebar.tsx` - Actualizado para usar permisos específicos del rol

---

## ✅ Checklist de Aplicación

Antes de finalizar, verifica que:

- [ ] Migración aplicada: `docker-compose exec backend python manage.py migrate core`
- [ ] Roles configurados: `docker-compose exec backend python manage.py configurar_roles`
- [ ] Archivo `views.py` existe en `backend/proyectoempresa/apps/core/`
- [ ] Archivo `configurar_roles.py` existe en `backend/proyectoempresa/apps/core/management/commands/`
- [ ] CORS configurado con `CORS_ALLOW_CREDENTIALS = True`
- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Probar login con cada rol y verificar que el sidebar muestra las opciones correctas

---

---

## 📊 Resumen de Tiempos de Expiración

| Token/Cookie | Tiempo de Expiración | Descripción |
|--------------|---------------------|-------------|
| Access Token | 10 minutos | Token usado para autenticar peticiones API |
| Refresh Token | 1 día | Token usado para renovar el access token |
| Inactividad | 3 horas | Tiempo sin actividad antes de cerrar sesión automáticamente |
| Cookie Refresh | 1 día | Cookie HTTP-Only que almacena el refresh token |
| Cookie Access | 10 minutos | Cookie HTTP-Only que almacena el access token (backup) |

---

**Fecha de creación**: 2024-12-01  
**Última actualización**: 2024-12-01  
**Versión**: 1.1  
**Autor**: Sistema de Cambios Automatizados

