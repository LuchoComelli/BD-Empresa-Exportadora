# Guía de Desarrollo con Docker

## Requisitos Previos

- Docker Desktop instalado y funcionando
- Docker Compose v2.0+
- Git

## Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd BD-Empresa-Exportadora
```

### 2. Configurar variables de entorno
```bash
cp proyectoempresa/config/env.example .env
# Editar .env con tus configuraciones
```

### 3. Construir las imágenes
```bash
# En Linux/Mac
./scripts/dev.sh build

# En Windows
scripts\dev.bat build
```

## Comandos de Desarrollo

### Levantar servicios
```bash
./scripts/dev.sh up
# o
scripts\dev.bat up
```

### Detener servicios
```bash
./scripts/dev.sh down
# o
scripts\dev.bat down
```

### Ver logs
```bash
./scripts/dev.sh logs
# o
scripts\dev.bat logs
```

### Abrir shell en el contenedor
```bash
./scripts/dev.sh shell
# o
scripts\dev.bat shell
```

### Ejecutar migraciones
```bash
./scripts/dev.sh migrate
# o
scripts\dev.bat migrate
```

### Ejecutar tests
```bash
./scripts/dev.sh test
# o
scripts\dev.bat test
```

### Limpiar todo
```bash
./scripts/dev.sh clean
# o
scripts\dev.bat clean
```

## Servicios Disponibles

- **Web**: http://localhost:8000 (Django)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Estructura del Proyecto

```
BD-Empresa-Exportadora/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── scripts/
│   ├── dev.sh (Linux/Mac)
│   └── dev.bat (Windows)
├── proyectoempresa/
│   ├── config/
│   │   └── env.example
│   └── ...
└── ...
```

## Troubleshooting

### Error de permisos en Linux/Mac
```bash
chmod +x scripts/dev.sh
```

### Puerto ya en uso
Cambiar los puertos en `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Cambiar 8000 por 8001
```

### Problemas con la base de datos
```bash
# Limpiar volúmenes y reconstruir
./scripts/dev.sh clean
./scripts/dev.sh build
./scripts/dev.sh up
```

## Desarrollo

### Hot Reload
Los cambios en el código se reflejan automáticamente gracias a los volúmenes montados.

### Base de datos
La base de datos PostgreSQL persiste en un volumen Docker. Para resetear:
```bash
./scripts/dev.sh clean
./scripts/dev.sh up
./scripts/dev.sh migrate
```

### Logs
Los logs de Django se guardan en `proyectoempresa/logs/django.log` dentro del contenedor.

## Producción

Para producción, usar:
- `Dockerfile.prod` (crear si es necesario)
- `docker-compose.prod.yml` (crear si es necesario)
- Variables de entorno de producción
- Servidor web (nginx) como proxy reverso
