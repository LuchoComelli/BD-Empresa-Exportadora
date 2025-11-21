# Guía de Instalación - BD Empresa Exportadora

Esta guía te ayudará a configurar el proyecto desde cero en tu máquina local.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Docker Desktop** (versión 20.10 o superior)
  - Windows: [Descargar Docker Desktop para Windows](https://www.docker.com/products/docker-desktop)
  - Mac: [Descargar Docker Desktop para Mac](https://www.docker.com/products/docker-desktop)
  - Linux: [Instrucciones de instalación](https://docs.docker.com/engine/install/)

- **Git** (versión 2.30 o superior)
  - [Descargar Git](https://git-scm.com/downloads)

- **Editor de código** (opcional pero recomendado)
  - Visual Studio Code
  - PyCharm
  - Cualquier editor de tu preferencia

## 🚀 Pasos de Instalación

### 1. Clonar el Repositorio

Abre una terminal (PowerShell en Windows, Terminal en Mac/Linux) y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd BD-Empresa-Exportadora
```

### 2. Verificar la Estructura del Proyecto

Asegúrate de que la estructura del proyecto sea la siguiente:

```
BD-Empresa-Exportadora/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── proyectoempresa/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── app/
├── docker-compose.yml
└── SETUP.md
```

### 3. Configurar Variables de Entorno

El proyecto ya incluye un archivo de configuración para Docker en:
```
backend/proyectoempresa/config/docker.env
```

Este archivo contiene las configuraciones necesarias para desarrollo. Si necesitas modificar algo (como contraseñas de base de datos), edita este archivo.

**⚠️ Importante:** No subas archivos `.env` con información sensible al repositorio.

### 4. Construir y Levantar los Contenedores

Desde la raíz del proyecto, ejecuta:

```bash
docker-compose up --build
```

Este comando:
- Construirá las imágenes de Docker para backend y frontend
- Descargará las imágenes de PostgreSQL y Redis
- Instalará todas las dependencias (npm packages y Python packages)
- Levantará todos los servicios

**Nota:** La primera vez puede tardar varios minutos mientras descarga e instala todo.

### 5. Verificar que los Servicios Están Corriendo

Deberías ver en la terminal que los siguientes servicios están activos:

- ✅ **PostgreSQL** (puerto 5433)
- ✅ **Redis** (puerto 6379)
- ✅ **Backend Django** (puerto 8000)
- ✅ **Frontend Next.js** (puerto 3000)

### 6. Ejecutar Migraciones de Base de Datos

En una nueva terminal, ejecuta:

```bash
docker-compose exec backend python manage.py migrate
```

Esto creará todas las tablas necesarias en la base de datos.

### 7. Crear un Superusuario (Administrador)

Para poder acceder al sistema, necesitas crear un usuario administrador:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Te pedirá:
- **Email:** (ingresa un email válido)
- **Nombre:** (tu nombre)
- **Apellido:** (tu apellido)
- **Contraseña:** (elige una contraseña segura)
- **Confirmar contraseña:** (repite la contraseña)

### 8. Cargar Datos de Geografía (Opcional)

Si necesitas los datos geográficos de Argentina (provincias, departamentos, municipios, localidades), ejecuta:

```bash
docker-compose exec backend python manage.py populate_geografia
```

**Nota:** Este comando puede tardar varios minutos ya que carga una gran cantidad de datos.

### 9. Acceder a la Aplicación

Una vez que todo esté corriendo, puedes acceder a:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Admin Django:** http://localhost:8000/admin

## 🔧 Comandos Útiles

### Detener los Servicios

```bash
docker-compose down
```

### Detener y Eliminar Volúmenes (⚠️ Esto borra la base de datos)

```bash
docker-compose down -v
```

### Ver Logs de los Servicios

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Ejecutar Comandos en el Backend

```bash
docker-compose exec backend python manage.py <comando>
```

Ejemplos:
```bash
# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Shell de Django
docker-compose exec backend python manage.py shell

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

### Ejecutar Comandos en el Frontend

```bash
docker-compose exec frontend npm <comando>
```

Ejemplos:
```bash
# Instalar nuevas dependencias
docker-compose exec frontend npm install <paquete>

# Ejecutar linter
docker-compose exec frontend npm run lint
```

### Reconstruir un Servicio Específico

```bash
# Reconstruir solo el backend
docker-compose up --build backend

# Reconstruir solo el frontend
docker-compose up --build frontend
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to Docker daemon"

**Solución:** Asegúrate de que Docker Desktop esté corriendo.

### Error: "Port already in use"

**Solución:** Alguno de los puertos (3000, 8000, 5433, 6379) está siendo usado por otra aplicación. Puedes:
1. Detener la aplicación que está usando el puerto
2. Modificar los puertos en `docker-compose.yml`

### Error: "Module not found" o "Package not found"

**Solución:** Reconstruye los contenedores:
```bash
docker-compose down
docker-compose up --build
```

### Error: "Database connection failed"

**Solución:** 
1. Verifica que el servicio `db` esté corriendo: `docker-compose ps`
2. Espera unos segundos y vuelve a intentar (la base de datos puede estar iniciando)
3. Verifica las credenciales en `backend/proyectoempresa/config/docker.env`

### Error: "npm ERR! code EACCES" o permisos

**Solución (Linux/Mac):**
```bash
sudo chown -R $USER:$USER frontend/node_modules
```

### Los cambios en el código no se reflejan

**Solución:** 
- En desarrollo, los cambios deberían reflejarse automáticamente gracias a los volúmenes de Docker
- Si no se reflejan, reinicia el servicio específico:
```bash
docker-compose restart frontend
# o
docker-compose restart backend
```

### Limpiar Todo y Empezar de Nuevo

Si quieres empezar completamente desde cero:

```bash
# Detener y eliminar contenedores, volúmenes y redes
docker-compose down -v

# Eliminar imágenes (opcional)
docker-compose down --rmi all

# Reconstruir todo
docker-compose up --build
```

## 📦 Dependencias del Proyecto

### Frontend (Node.js/Next.js)
- Todas las dependencias están en `frontend/package.json`
- Se instalan automáticamente al construir el contenedor

### Backend (Python/Django)
- Todas las dependencias están en `backend/requirements.txt`
- Se instalan automáticamente al construir el contenedor

## 🔐 Seguridad

- **Nunca** subas archivos `.env` con información sensible al repositorio
- Cambia las contraseñas por defecto en producción
- Usa variables de entorno para configuraciones sensibles

## 📝 Notas Adicionales

- El proyecto usa **PostgreSQL 18** como base de datos
- El proyecto usa **Redis 7** para caché
- El frontend usa **Next.js 15** con **React 19**
- El backend usa **Django 5.2** con **Django REST Framework**

## 🆘 ¿Necesitas Ayuda?

Si encuentras algún problema que no está cubierto en esta guía:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica que todos los servicios estén corriendo: `docker-compose ps`
3. Consulta la documentación de Docker: https://docs.docker.com/
4. Contacta al equipo de desarrollo

## ✅ Checklist de Verificación

Antes de considerar que la instalación está completa, verifica:

- [ ] Docker Desktop está instalado y corriendo
- [ ] El repositorio fue clonado correctamente
- [ ] `docker-compose up --build` se ejecutó sin errores
- [ ] Todos los servicios están corriendo (`docker-compose ps`)
- [ ] Las migraciones se ejecutaron correctamente
- [ ] Se creó un superusuario
- [ ] Puedo acceder a http://localhost:3000
- [ ] Puedo acceder a http://localhost:8000
- [ ] Puedo iniciar sesión con el superusuario creado

¡Listo! 🎉 Tu entorno de desarrollo está configurado y listo para usar.

