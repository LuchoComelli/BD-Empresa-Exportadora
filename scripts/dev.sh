#!/bin/bash
# Script para desarrollo con Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  build     - Construir las imágenes de Docker"
    echo "  up        - Levantar los servicios"
    echo "  down      - Detener los servicios"
    echo "  logs      - Ver logs de los servicios"
    echo "  shell     - Abrir shell en el contenedor web"
    echo "  migrate   - Ejecutar migraciones"
    echo "  test      - Ejecutar tests"
    echo "  clean     - Limpiar contenedores y volúmenes"
    echo "  help      - Mostrar esta ayuda"
}

# Función para construir imágenes
build_images() {
    echo -e "${GREEN}Construyendo imágenes de Docker...${NC}"
    docker-compose build
}

# Función para levantar servicios
start_services() {
    echo -e "${GREEN}Levantando servicios...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Servicios iniciados. Accede a http://localhost:8000${NC}"
}

# Función para detener servicios
stop_services() {
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    docker-compose down
}

# Función para ver logs
show_logs() {
    docker-compose logs -f
}

# Función para abrir shell
open_shell() {
    echo -e "${GREEN}Abriendo shell en el contenedor web...${NC}"
    docker-compose exec web bash
}

# Función para ejecutar migraciones
run_migrations() {
    echo -e "${GREEN}Ejecutando migraciones...${NC}"
    docker-compose exec web python manage.py migrate
}

# Función para ejecutar tests
run_tests() {
    echo -e "${GREEN}Ejecutando tests...${NC}"
    docker-compose exec web python manage.py test
}

# Función para limpiar
clean_all() {
    echo -e "${RED}Limpiando contenedores y volúmenes...${NC}"
    docker-compose down -v
    docker system prune -f
}

# Procesar comando
case "${1:-help}" in
    build)
        build_images
        ;;
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    migrate)
        run_migrations
        ;;
    test)
        run_tests
        ;;
    clean)
        clean_all
        ;;
    help|*)
        show_help
        ;;
esac
