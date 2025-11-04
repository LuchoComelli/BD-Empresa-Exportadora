# BD Empresa Exportadora

Sistema de gestión de empresas exportadoras con backend Django REST Framework y frontend React + TypeScript.

## 🏗️ Arquitectura

```
BD-Empresa-Exportadora/
├── backend/                  # Django REST Framework API
│   ├── proyectoempresa/     # Proyecto Django
│   │   ├── apps/            # Aplicaciones Django
│   │   │   ├── core/        # Usuarios, roles, ubicaciones
│   │   │   ├── empresas/    # Gestión de empresas
│   │   │   ├── registro/    # Registro público
│   │   │   └── auditoria/   # Logs de auditoría
│   │   ├── config/          # Configuración Django
│   │   └── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # Next.js + TypeScript
│   ├── app/                  # App Router de Next.js
│   │   ├── (dashboard)/     # Rutas protegidas
│   │   ├── (public)/        # Rutas públicas
│   │   └── layout.tsx
│   ├── components/          # Componentes reutilizables
│   ├── lib/                 # Utilidades y servicios API
│   ├── hooks/               # Custom hooks
│   ├── public/              # Archivos estáticos
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## 🚀 Inicio Rápido con Docker

### Prerrequisitos

- Docker Desktop instalado
- Docker Compose instalado
- Git

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd BD-Empresa-Exportadora
```

### 2. Levantar los servicios

```bash
docker-compose up --build
```

Esto levantará 4 servicios:
- **PostgreSQL**: Base de datos (puerto 5433)
- **Redis**: Cache (puerto 6379)
- **Backend**: API Django (puerto 8000)
- **Frontend**: Next.js (puerto 3000)

### 3. Ejecutar migraciones (primera vez)

En otra terminal:

```bash
docker-compose exec backend python manage.py migrate
```

### 4. Crear superusuario (primera vez)

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **PostgreSQL**: localhost:5433

## 📦 Stack Tecnológico

### Backend
- Python 3.11
- Django 5.2.1
- Django REST Framework 3.16.0
- PostgreSQL 18
- Redis 7
- JWT Authentication (djangorestframework-simplejwt)
- CORS Headers
- drf-spectacular (documentación API)

### Frontend
- Next.js 15.5.6
- React 19
- TypeScript
- TailwindCSS 4
- App Router (Next.js)
- React Hook Form + Zod
- Radix UI (componentes)
- Lucide React (iconos)

## 🔧 Comandos Útiles

### Backend

```bash
# Acceder al shell de Django
docker-compose exec backend python manage.py shell

# Ejecutar tests
docker-compose exec backend python manage.py test

# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Cargar fixtures
docker-compose exec backend python manage.py loaddata apps/core/fixtures/initial_roles.json
```

### Frontend

```bash
# Instalar dependencias
cd frontend
npm install

# Ejecutar en modo desarrollo (sin Docker)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Docker

```bash
# Levantar servicios
docker-compose up

# Levantar en segundo plano
docker-compose up -d

# Rebuild de los contenedores
docker-compose up --build

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend
docker-compose restart frontend
```

## 🔐 Autenticación

La aplicación usa **JWT (JSON Web Tokens)** para autenticación:

### Endpoints de autenticación:

- **POST** `/api/core/auth/login/` - Iniciar sesión
- **POST** `/api/core/auth/refresh/` - Refrescar token
- **POST** `/api/core/auth/verify/` - Verificar token
- **GET** `/api/core/usuarios/me/` - Obtener usuario actual

### Flujo de autenticación:

1. Usuario se autentica en `/login`
2. Backend devuelve `access_token` y `refresh_token`
3. Frontend guarda tokens en `localStorage`
4. Cada petición incluye header: `Authorization: Bearer <access_token>`
5. Si el token expira, se refresca automáticamente

## 📚 Endpoints API Principales

### Core
- `/api/core/usuarios/` - Gestión de usuarios
- `/api/core/roles/` - Roles de usuario
- `/api/core/departamentos/` - Departamentos
- `/api/core/municipios/` - Municipios
- `/api/core/localidades/` - Localidades

### Empresas
- `/api/empresas/empresas-producto/` - Empresas de producto
- `/api/empresas/empresas-servicio/` - Empresas de servicio
- `/api/empresas/empresas-mixta/` - Empresas mixtas
- `/api/empresas/rubros/` - Rubros
- `/api/empresas/tipos-empresa/` - Tipos de empresa

### Registro
- `/api/registro/solicitudes/` - Solicitudes de registro público
- `/api/registro/solicitudes/{id}/aprobar/` - Aprobar solicitud
- `/api/registro/solicitudes/{id}/rechazar/` - Rechazar solicitud

### Auditoría
- `/api/auditoria/logs/` - Logs de auditoría

## 🛠️ Desarrollo

### Agregar nuevas dependencias

**Backend:**
```bash
# Agregar al requirements.txt y rebuild
docker-compose build backend
docker-compose up backend
```

**Frontend:**
```bash
cd frontend
npm install <paquete>
# El contenedor se actualizará automáticamente
```

### Variables de Entorno

**Backend** (`backend/proyectoempresa/config/docker.env`):
```env
DEBUG=1
SECRET_KEY=your-secret-key
DB_NAME=bd_empresa_exportadora
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

**Frontend** (`.env.development`):
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📖 Documentación Adicional

- [Guía de Docker](./docs/GUIA_DOCKER_DESARROLLO.txt)
- [Estructura de Base de Datos](./docs/ESTRUCTURA_BASE_DATOS_DEFINITIVA.txt)
- [Estructura del Proyecto](./docs/ESTRUCTURA_DEFINITIVA_PROYECTO.txt)

## 🤝 Trabajo Colaborativo

Para trabajar en el proyecto con tu equipo:

1. Clonar el repositorio
2. Ejecutar `docker-compose up --build`
3. Acceder a las URLs correspondientes
4. ¡Empezar a desarrollar!

Los cambios en el código se reflejan automáticamente (hot reload habilitado).

## 🐛 Solución de Problemas

### El backend no se conecta a la base de datos
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de la base de datos
docker-compose logs db
```

### El frontend no puede conectarse al backend
- Verificar que el backend esté corriendo en el puerto 8000
- Verificar las variables de entorno en `.env.development`
- Revisar la configuración de CORS en `backend/proyectoempresa/config/settings/base.py`

### Errores de permisos en Docker
```bash
# En Windows con WSL2, puede ser necesario
docker-compose down -v
docker-compose up --build
```

## 📝 Licencia

[Especificar licencia]

## 👥 Contribuidores

[Lista de contribuidores]

---

**Notas:**
- El Django Admin sigue disponible en `/admin/` para gestión interna
- La API REST está completamente documentada en `/api/docs/` (Swagger UI)
- Los templates HTML originales fueron removidos, React es el nuevo frontend

